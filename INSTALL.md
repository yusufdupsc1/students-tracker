# Installation Guide

This guide covers setting up the Bejkhonda School Result & Tracking PWA for development, production, and deployment.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Local Development](#local-development)
- [Production Build](#production-build)
- [Docker Deployment](#docker-deployment)
- [Vercel Deployment](#vercel-deployment)
- [Environment Variables](#environment-variables)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | ≥ 18 | JavaScript runtime |
| npm | ≥ 9 | Package manager |
| Git | ≥ 2.30 | Version control |
| Docker | ≥ 24 (optional) | Containerized deployment |
| Vercel CLI | ≥ 32 (optional) | Local Vercel testing |

Verify your versions:

```bash
node --version  # v18.x or higher
npm --version   # v9.x or higher
git --version   # v2.30.x or higher
```

---

## Local Development

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/students-tracker.git
cd students-tracker
```

### 2. Install Dependencies

```bash
npm ci
```

> **Why `npm ci` instead of `npm install`?**
> `npm ci` uses the exact versions in `package-lock.json`, ensuring reproducible installs. It's also faster and cleaner for CI/CD.

### 3. Start Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

### 4. Seed the Database

The database seeds automatically on first load via `predev` and `prebuild` hooks. To manually seed:

```bash
npm run seed
```

This reads `Result_Card_Bejkhonda_v3_3_FINAL.xlsx` and writes `src/data/seed.json`.

---

## Production Build

### Build the Application

```bash
npm run build
```

This runs:
1. `tsc --noEmit` — TypeScript type checking
2. `vite build` — Production bundle with code splitting

Output goes to `dist/`.

### Preview Production Build

```bash
npm run preview
```

Serves the `dist/` folder locally at `http://localhost:4173`.

### Verify Everything Works

```bash
npm run verify
```

Runs typecheck → tests → build in sequence. Use this as a pre-commit check.

---

## Docker Deployment

### Build the Image

```bash
docker build -t students-tracker .
```

### Run the Container

```bash
docker run -p 3000:80 students-tracker
```

Open `http://localhost:3000`.

### Using Docker Compose

```bash
docker compose up -d
docker compose logs -f
```

The container includes:
- Multi-stage build (Node builder → Nginx runner)
- Gzip compression
- Security headers (X-Frame-Options, X-Content-Type-Options, etc.)
- Immutable caching for static assets
- SPA routing fallback

---

## Vercel Deployment

### Method 1: Git Integration (Recommended)

1. Push to GitHub
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import your repository
4. Vercel auto-detects Vite and deploys

No additional configuration needed — `vercel.json` handles SPA routing.

### Method 2: Vercel CLI

```bash
npm i -g vercel
vercel login
vercel --prod
```

### Required Secrets (for CI/CD)

If using the GitHub Actions deployment workflow, add these secrets to your repository:

| Secret | Description |
|--------|-------------|
| `VERCEL_TOKEN` | Vercel API token (Settings → Tokens) |
| `VERCEL_ORG_ID` | Your Vercel organization ID |
| `VERCEL_PROJECT_ID` | Project ID from Vercel dashboard |

---

## Environment Variables

Copy `.env.example` to `.env.local` for local development:

```bash
cp .env.example .env.local
```

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | No | `development` | Environment mode |
| `APP_NAME` | No | `Bejkhonda School Tracker` | Application name |

> **Note:** This app is fully client-side. No backend environment variables are required.

---

## Troubleshooting

### Port Already in Use

If port 5173 is busy, Vite will automatically try the next available port. To specify a port:

```bash
npm run dev -- --port 3000
```

### TypeScript Errors

Ensure you're using Node.js ≥ 18. Run:

```bash
npm run typecheck
```

### Build Fails

Clear the cache and reinstall:

```bash
rm -rf node_modules dist .vite
npm ci
npm run build
```

### Docker Build Fails

Ensure Docker has enough memory (≥ 2 GB recommended). The multi-stage build needs:
- Stage 1: ~1 GB during `npm ci` + build
- Stage 2: ~20 MB final image

### PWA Not Installing

- Ensure you're serving over HTTPS (or `localhost` for testing)
- Check that the service worker is registered (DevTools → Application)
- Ensure `manifest.webmanifest` is served with correct MIME type

---

## Next Steps

- Read [README.md](README.md) for feature overview
- Check [PROGRESS.md](PROGRESS.md) for development roadmap
- See `src/` for source code structure
