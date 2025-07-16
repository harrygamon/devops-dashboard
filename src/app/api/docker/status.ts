import type { NextApiRequest, NextApiResponse } from 'next';
import basicAuth from 'basic-auth';
import { exec } from 'child_process';
import { getDockerHosts } from '@/utils/config';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = basicAuth(req);
  if (!user || user.name !== process.env.AUTH_USERNAME || user.pass !== process.env.AUTH_PASSWORD) {
    res.setHeader('WWW-Authenticate', 'Basic realm="DevOps Dashboard"');
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const hosts = getDockerHosts() || [];
  const selected = req.query.host as string | undefined;
  const hostsToQuery = selected ? hosts.filter((h: any) => h.name === selected) : hosts;
  if (!hostsToQuery.length) {
    return res.status(400).json({ error: 'No Docker hosts configured or found' });
  }
  Promise.all(hostsToQuery.map((host: any) => new Promise(resolve => {
    const sshUser = host.ssh_user;
    const sshHost = host.host;
    const sshKey = host.custom_ssh_key_path || process.env.SSH_KEY_PATH;
    const keyArg = sshKey ? `-i ${sshKey}` : '';
    const cmd = `ssh ${keyArg} -o StrictHostKeyChecking=no ${sshUser}@${sshHost} "docker ps --format '{{json .}}'"`;
    exec(cmd, (err, stdout, stderr) => {
      if (err) {
        console.error('Docker status error:', host.name, err, stderr);
        return resolve({ host: host.name, containers: [], error: true });
      }
      const containers = stdout.trim().split('\n').filter(Boolean).map(line => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      }).filter(Boolean);
      resolve({ host: host.name, containers });
    });
  }))).then(results => {
    res.status(200).json({ status: 'ok', hosts: results });
  });
} 