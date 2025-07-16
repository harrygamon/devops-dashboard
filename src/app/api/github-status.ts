import type { NextApiRequest, NextApiResponse } from 'next';
import basicAuth from 'basic-auth';
import axios from 'axios';
import { getGitHubTokens } from '@/utils/config';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = basicAuth(req);
  if (!user || user.name !== process.env.AUTH_USERNAME || user.pass !== process.env.AUTH_PASSWORD) {
    res.setHeader('WWW-Authenticate', 'Basic realm="DevOps Dashboard"');
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const accounts = getGitHubTokens() || [];
  const selected = req.query.account as string | undefined;
  const accountsToQuery = selected ? accounts.filter((a: any) => a.label === selected) : accounts;
  if (!accountsToQuery.length) {
    return res.status(400).json({ error: 'No GitHub tokens configured or found' });
  }
  try {
    const results = await Promise.all(accountsToQuery.map(async (account: any) => {
      const { label, token, repos } = account;
      const repoResults = await Promise.all(repos.map(async (repo: string) => {
        try {
          const resp = await axios.get(`https://api.github.com/repos/${repo}/actions/runs?per_page=1`, {
            headers: { Authorization: `Bearer ${token}`, 'Accept': 'application/vnd.github+json' },
          });
          const run = resp.data.workflow_runs?.[0];
          return {
            repo,
            status: run?.conclusion || run?.status || 'unknown',
            html_url: run?.html_url || '',
            name: run?.name || '',
            commit: run?.head_sha || '',
            time: run?.created_at || '',
          };
        } catch (e) {
          return { repo, status: 'error', html_url: '', name: '', commit: '', time: '', error: true };
        }
      }));
      return { label, repos: repoResults };
    }));
    res.status(200).json({ status: 'ok', accounts: results });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch GitHub Actions status' });
  }
}
