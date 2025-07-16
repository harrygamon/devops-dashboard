import type { NextApiRequest, NextApiResponse } from 'next';
import basicAuth from 'basic-auth';
import { exec } from 'child_process';
import { getServers } from '@/utils/config';

function runSSHHealth(server: any, retries = 1): Promise<any> {
  return new Promise((resolve) => {
    const sshUser = server.ssh_user;
    const sshHost = server.host;
    const sshKey = server.ssh_key_path || process.env.SSH_KEY_PATH;
    const keyArg = sshKey ? `-i ${sshKey}` : '';
    const cmd = `ssh ${keyArg} -o StrictHostKeyChecking=no ${sshUser}@${sshHost} "uptime && free -m && df -h --output=source,size,used,avail,pcent,target -x tmpfs -x devtmpfs | tail -n +2"`;
    exec(cmd, (err, stdout, stderr) => {
      if (err) {
        if (retries > 0) {
          setTimeout(() => {
            runSSHHealth(server, retries - 1).then(resolve);
          }, 1000);
        } else {
          console.error('Server health error:', server.name, err, stderr);
          return resolve({ name: server.name, error: true });
        }
        return;
      }
      const lines = stdout.split('\n').filter(Boolean);
      // Parse uptime
      const uptimeLine = lines[0] || '';
      const loadMatch = uptimeLine.match(/load average: ([0-9.]+), ([0-9.]+), ([0-9.]+)/);
      const load = loadMatch ? loadMatch.slice(1, 4).map(Number) : [];
      // Parse memory
      const memLine = lines.find(l => l.startsWith('Mem:'));
      let mem = { total: 0, used: 0, free: 0 };
      if (memLine) {
        const parts = memLine.split(/\s+/);
        mem = { total: +parts[1], used: +parts[2], free: +parts[3] };
      }
      // Parse disk
      const disk = lines.slice(lines.findIndex(l => l.startsWith('/'))).map(l => {
        const [source, size, used, avail, pcent, target] = l.split(/\s+/);
        return { source, size, used, avail, pcent, target };
      });
      resolve({ name: server.name, load, mem, disk });
    });
  });
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = basicAuth(req);
  if (!user || user.name !== process.env.AUTH_USERNAME || user.pass !== process.env.AUTH_PASSWORD) {
    res.setHeader('WWW-Authenticate', 'Basic realm="DevOps Dashboard"');
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const servers = getServers() || [];
  const selected = req.query.server as string | undefined;
  const serversToQuery = selected ? servers.filter((s: any) => s.name === selected) : servers;
  if (!serversToQuery.length) {
    return res.status(400).json({ error: 'No servers configured or found' });
  }
  Promise.all(serversToQuery.map(async server => {
    const result = await runSSHHealth(server, 2);
    // Insert metrics if successful
    if (!result.error && result.load && result.mem && result.disk && result.disk.length > 0) {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/metrics/insert`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': req.headers['authorization'] || '' },
          body: JSON.stringify({
            server: result.name,
            cpu_load: result.load[0],
            mem_used: result.mem.used,
            mem_total: result.mem.total,
            disk_used: parseInt(result.disk[0].used, 10),
            disk_total: parseInt(result.disk[0].size, 10)
          })
        });
      } catch (e) {
        // Ignore insert errors
      }
    }
    return result;
  })).then(results => {
    res.status(200).json({ status: 'ok', servers: results });
  });
} 