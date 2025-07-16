import type { NextApiRequest, NextApiResponse } from 'next';
import basicAuth from 'basic-auth';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = basicAuth(req);
  if (!user || user.name !== process.env.AUTH_USERNAME || user.pass !== process.env.AUTH_PASSWORD) {
    res.setHeader('WWW-Authenticate', 'Basic realm="DevOps Dashboard"');
    return res.status(401).json({ error: 'Unauthorized' });
  }
  // TODO: Fetch Docker health via API or SSH
  res.status(200).json({ status: 'ok', data: [] });
}
