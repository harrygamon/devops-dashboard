import type { NextApiRequest, NextApiResponse } from 'next';
import basicAuth from 'basic-auth';
import { exec } from 'child_process';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = basicAuth(req);
  if (!user || user.name !== process.env.AUTH_USERNAME || user.pass !== process.env.AUTH_PASSWORD) {
    res.setHeader('WWW-Authenticate', 'Basic realm="DevOps Dashboard"');
    return res.status(401).json({ error: 'Unauthorized' });
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { name } = req.body;
  const sshHost = process.env.DOCKER_HOST;
  if (!sshHost || !name) {
    return res.status(400).json({ error: 'Missing DOCKER_HOST or container name' });
  }
  const cmd = `ssh -o StrictHostKeyChecking=no ${sshHost.replace('ssh://', '')} "docker restart ${name}"`;
  exec(cmd, (err, stdout, stderr) => {
    if (err) {
      console.error('Docker restart error:', err, stderr);
      return res.status(500).json({ error: 'Failed to restart container' });
    }
    res.status(200).json({ status: 'ok', message: stdout.trim() });
  });
} 