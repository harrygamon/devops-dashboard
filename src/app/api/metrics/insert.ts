import type { NextApiRequest, NextApiResponse } from 'next';
import basicAuth from 'basic-auth';
import { neon } from '@neondatabase/serverless';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = basicAuth(req);
  if (!user || user.name !== process.env.AUTH_USERNAME || user.pass !== process.env.AUTH_PASSWORD) {
    res.setHeader('WWW-Authenticate', 'Basic realm="DevOps Dashboard"');
    return res.status(401).json({ error: 'Unauthorized' });
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  let body = '';
  await new Promise(resolve => {
    req.on('data', chunk => { body += chunk; });
    req.on('end', resolve);
  });
  let parsed;
  try {
    parsed = JSON.parse(body);
  } catch {
    return res.status(400).json({ error: 'Invalid request body' });
  }
  const { server, cpu_load, mem_used, mem_total, disk_used, disk_total } = parsed;
  if (!server) return res.status(400).json({ error: 'Missing server name' });
  const sql = neon(process.env.DATABASE_URL!);
  try {
    await sql`
      INSERT INTO server_metrics (server_name, cpu_load, mem_used, mem_total, disk_used, disk_total)
      VALUES (${server}, ${cpu_load}, ${mem_used}, ${mem_total}, ${disk_used}, ${disk_total})
    `;
    res.status(200).json({ status: 'ok' });
  } catch (e) {
    res.status(500).json({ error: 'Failed to insert metrics' });
  }
} 