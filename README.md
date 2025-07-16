# DevOps Dashboard

A personal DevOps Dashboard built with Next.js, Tailwind CSS, and Node.js API routes. Monitor CI/CD, Docker, server health, and logs, plus an AI assistant powered by local Ollama (Qwen3).

## Features
- Responsive dashboard UI (Vercel-hosted)
- Secure Basic Auth (from `.env.local`)
- GitHub Actions CI/CD status for selected repos
- Docker container health (via Docker API or SSH)
- Server health checks (CPU, memory, disk via SSH)
- Real-time log viewer (tail logs over SSH)
- AI assistant (Ollama + Qwen3) for log analysis, CI/CD help, and troubleshooting
- Clean UI with Tailwind, cards, indicators, icons
- All config via `.env.local`
- Auto-deploy with GitHub Actions → Vercel
- Local `docker-compose.yml` for Ollama, Qwen, and logging agent

## Getting Started

1. **Clone the repo**
2. **Install dependencies**
   ```bash
   cd devops-dashboard
   npm install
   ```
3. **Copy and edit `.env.local`**
   ```bash
   cp .env.local.example .env.local
   # Edit with your secrets and config
   ```
4. **Run locally**
   ```bash
   npm run dev
   ```
5. **Start Ollama + Qwen (AI assistant)**
   ```bash
   docker-compose up -d
   ```

## Environment Variables (`.env.local`)

- `BASIC_AUTH_USER`, `BASIC_AUTH_PASS`: Dashboard login
- `GITHUB_TOKEN`: GitHub API token
- `GITHUB_REPOS`: Comma-separated list of repos (e.g. `owner1/repo1,owner2/repo2`)
- `DOCKER_HOST`, `DOCKER_API_URL`: Docker connection info
- `SSH_HOST`, `SSH_USER`, `SSH_KEY_PATH`: SSH for server health/logs
- `LOG_PATHS`: Comma-separated log file paths
- `OLLAMA_URL`: Ollama API endpoint

## Deployment
- Push to `main` branch auto-deploys to Vercel via GitHub Actions
- Set `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` as GitHub secrets

## License
MIT
