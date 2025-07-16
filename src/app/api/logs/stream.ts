import type { NextApiRequest, NextApiResponse } from 'next';
import basicAuth from 'basic-auth';
import { spawn } from 'child_process';
import { getServers } from '@/utils/config';

export const config = {
  api: {
    bodyParser: false,
    responseLimit: false,
  },
};

function streamLog(server: any, logPath: string, res: NextApiResponse, retries = 1) {
  const sshUser = server.ssh_user;
  const sshHost = server.host;
  const sshKey = server.ssh_key_path || process.env.SSH_KEY_PATH;
  const keyArg = sshKey ? ['-i', sshKey] : [];
  const sshArgs = [
    ...keyArg,
    '-o', 'StrictHostKeyChecking=no',
    `${sshUser}@${sshHost}`,
    `tail -n 100 -f ${logPath}`
  ];
  const ssh = spawn('ssh', sshArgs);
  ssh.stdout.on('data', (data) => {
    res.write(`data: ${data.toString().replace(/\r?\n/g, '\ndata: ')}\n\n`);
  });
  ssh.stderr.on('data', (data) => {
    res.write(`event: error\ndata: ${JSON.stringify({ error: data.toString() })}\n\n`);
  });
  ssh.on('close', (code) => {
    if (retries > 0) {
      setTimeout(() => streamLog(server, logPath, res, retries - 1), 1000);
    } else {
      res.end();
    }
  });
  return ssh;
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = basicAuth(req);
  if (!user || user.name !== process.env.AUTH_USERNAME || user.pass !== process.env.AUTH_PASSWORD) {
    res.setHeader('WWW-Authenticate', 'Basic realm="DevOps Dashboard"');
    return res.status(401).end('Unauthorized');
  }
  if (req.method !== 'GET') return res.status(405).end('Method Not Allowed');

  const servers = getServers() || [];
  const selected = req.query.server as string | undefined;
  const server = selected ? servers.find((s: any) => s.name === selected) : servers[0];
  if (!server) {
    return res.status(400).end('No server found');
  }

  const logPath = (req.query.log as string) || server.log_path || (server.log_paths && server.log_paths[0]);
  if (!logPath) {
    return res.status(400).end('No log file specified');
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });

  let ssh = streamLog(server, logPath, res, 2);

  req.on('close', () => {
    if (ssh) ssh.kill();
    res.end();
  });
} 