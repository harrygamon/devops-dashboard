import type { NextApiRequest, NextApiResponse } from 'next';
import basicAuth from 'basic-auth';
import { neon } from '@neondatabase/serverless';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = basicAuth(req);
  if (!user || user.name !== process.env.AUTH_USERNAME || user.pass !== process.env.AUTH_PASSWORD) {
    res.setHeader('WWW-Authenticate', 'Basic realm="DevOps Dashboard"');
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const server = req.query.server as string;
  if (!server) return res.status(400).json({ error: 'Missing server name' });
  const sql = neon(process.env.DATABASE_URL!);
  try {
    const rows = await sql`
      SELECT * FROM server_metrics
      WHERE server_name = ${server}
      ORDER BY timestamp DESC
      LIMIT 100
    `;
    res.status(200).json({ status: 'ok', metrics: rows });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
} 