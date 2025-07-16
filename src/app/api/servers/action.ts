import type { NextApiRequest, NextApiResponse } from 'next';
import basicAuth from 'basic-auth';
import { exec } from 'child_process';
import { getServers } from '@/utils/config';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = basicAuth(req);
  if (!user || user.name !== process.env.AUTH_USERNAME || user.pass !== process.env.AUTH_PASSWORD) {
    res.setHeader('WWW-Authenticate', 'Basic realm="DevOps Dashboard"');
    return res.status(401).json({ error: 'Unauthorized' });
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  let body = '';
  req.on('data', chunk => { body += chunk; });
  req.on('end', () => {
    let parsed;
    try {
      parsed = JSON.parse(body);
    } catch {
      return res.status(400).json({ error: 'Invalid request body' });
    }
    const { server: serverName, action, script } = parsed;
    const servers = getServers() || [];
    const server = servers.find((s: any) => s.name === serverName);
    if (!server) return res.status(400).json({ error: 'Server not found' });
    const sshUser = server.ssh_user;
    const sshHost = server.host;
    const sshKey = server.ssh_key_path || process.env.SSH_KEY_PATH;
    const keyArg = sshKey ? `-i ${sshKey}` : '';
    let remoteCmd = '';
    if (action === 'restart') {
      remoteCmd = 'sudo reboot';
    } else if (action === 'script' && script) {
      remoteCmd = script;
    } else {
      return res.status(400).json({ error: 'Invalid action or missing script' });
    }
    const cmd = `ssh ${keyArg} -o StrictHostKeyChecking=no ${sshUser}@${sshHost} "${remoteCmd}"`;
    exec(cmd, (err, stdout, stderr) => {
      if (err) {
        console.error('Server action error:', serverName, err, stderr);
        return res.status(500).json({ error: 'Failed to execute action', details: stderr });
      }
      res.status(200).json({ status: 'ok', output: stdout.trim() });
    });
  });
} 