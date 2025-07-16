import fs from 'fs';
import path from 'path';

function readJsonFile(filename: string) {
  const filePath = path.resolve(process.cwd(), filename);
  if (fs.existsSync(filePath)) {
    try {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch (e) {
      console.error(`Failed to parse ${filename}:`, e);
      return [];
    }
  }
  return [];
}

let dockerHostsCache: any[] | null = null;
export function getDockerHosts() {
  if (!dockerHostsCache) dockerHostsCache = readJsonFile('docker-hosts.json');
  return dockerHostsCache;
}

let githubTokensCache: any[] | null = null;
export function getGitHubTokens() {
  if (!githubTokensCache) githubTokensCache = readJsonFile('github-tokens.json');
  return githubTokensCache;
}

let serversCache: any[] | null = null;
export function getServers() {
  if (!serversCache) serversCache = readJsonFile('servers.json');
  return serversCache;
}

export function clearConfigCache() {
  dockerHostsCache = null;
  githubTokensCache = null;
  serversCache = null;
} 