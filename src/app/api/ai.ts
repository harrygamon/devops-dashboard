import type { NextApiRequest, NextApiResponse } from 'next';
import basicAuth from 'basic-auth';

export const config = {
  api: {
    bodyParser: false,
    responseLimit: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = basicAuth(req);
  if (!user || user.name !== process.env.AUTH_USERNAME || user.pass !== process.env.AUTH_PASSWORD) {
    res.setHeader('WWW-Authenticate', 'Basic realm="DevOps Dashboard"');
    return res.status(401).json({ error: 'Unauthorized' });
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  let body = '';
  req.on('data', chunk => { body += chunk; });
  await new Promise(resolve => req.on('end', resolve));
  let prompt = '';
  try {
    const parsed = JSON.parse(body);
    prompt = parsed.prompt;
  } catch {
    return res.status(400).json({ error: 'Invalid request body' });
  }
  const ollamaUrl = process.env.OLLAMA_API || 'http://localhost:11434';
  try {
    const ollamaRes = await fetch(`${ollamaUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'qwen:latest', messages: [{ role: 'user', content: prompt }] }),
    });
    if (ollamaRes.body) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      const reader = ollamaRes.body.getReader();
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += new TextDecoder().decode(value);
        // Try to parse JSON lines (Ollama streams JSON per line)
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const json = JSON.parse(line);
            if (json.message?.content) {
              res.write(`data: ${JSON.stringify({ content: json.message.content })}\n\n`);
            }
          } catch {}
        }
      }
      res.end();
      return;
    } else {
      const data = await ollamaRes.json();
      return res.status(200).json({ answer: data.message?.content || '' });
    }
  } catch (e) {
    return res.status(500).json({ error: 'Failed to connect to Ollama' });
  }
}
