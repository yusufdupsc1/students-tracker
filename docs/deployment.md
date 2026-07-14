# Deployment Guide

## Overview

This guide covers deploying Bejkhonda School Tracker to various hosting platforms. The app is a static SPA that can be deployed anywhere that serves static files.

## Prerequisites

- Built `dist/` folder (`npm run build`)
- Domain name (optional, but recommended for PWA)

---

## Vercel (Recommended)

### One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/students-tracker)

### Manual Setup

1. **Push to GitHub**
2. **Import in Vercel:**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Select your repository
   - Vercel auto-detects Vite
3. **Deploy:**
   - Build command: `npm run build`
   - Output directory: `dist`
   - No environment variables needed

### Configuration

`vercel.json` is included in the repo:
- SPA routing rewrite (`/(.*) → /index.html`)
- Security headers (X-Frame-Options, X-Content-Type-Options, X-XSS-Protection)
- Cache headers for static assets

### CI/CD with GitHub Actions

The included `.github/workflows/ci.yml` auto-deploys to Vercel on push to `main`. Configure these secrets:

| Secret | How to get |
|--------|-----------|
| `VERCEL_TOKEN` | Vercel → Settings → Tokens |
| `VERCEL_ORG_ID` | Vercel → Settings → General |
| `VERCEL_PROJECT_ID` | Vercel → Project Settings → General |

---

## Docker

### Build Image

```bash
docker build -t students-tracker .
```

### Run Container

```bash
docker run -p 3000:80 students-tracker
```

Open `http://localhost:3000`.

### Docker Compose

```bash
docker compose up -d
docker compose logs -f
```

### Image Details

- **Base:** `node:20-alpine` (builder) → `nginx:alpine` (runner)
- **Size:** ~20 MB
- **Port:** 80
- **Healthcheck:** `curl -f http://localhost:80`

---

## Netlify

### Build Settings

| Setting | Value |
|---------|-------|
| Build command | `npm run build` |
| Publish directory | `dist` |
| Node version | 18 |

### Redirects

Create `public/_redirects`:
```
/*    /index.html   200
```

Or use `netlify.toml`:
```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

---

## GitHub Pages

### Workflow

Add `.github/workflows/gh-pages.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

### Vite Config

Update `vite.config.ts`:
```typescript
export default defineConfig({
  base: '/students-tracker/',  // Match repo name
  // ...
})
```

---

## AWS S3 + CloudFront

### Upload to S3

```bash
aws s3 sync dist/ s3://your-bucket-name/ --delete
```

### CloudFront

1. Create CloudFront distribution with S3 origin
2. Set default root object to `index.html`
3. Add custom error responses:
   - 403 → `/index.html` (200)
   - 404 → `/index.html` (200)

---

## Environment Variables

This app is fully client-side. No backend environment variables are required.

For production deployments, you may set:
- `NODE_ENV=production` (automatic on most platforms)

---

## Post-Deployment Checklist

- [ ] App loads at root URL
- [ ] All routes work (Dashboard, Roster, Report Card, MTR, Search, Import, Settings)
- [ ] Service worker registers (check DevTools → Application)
- [ ] PWA install prompt appears (mobile)
- [ ] Offline mode works (disconnect network, reload)
- [ ] Spreadsheet import works
- [ ] JSON backup/restore works
- [ ] Print styles work (Report Card)

---

## Troubleshooting Deployment

### SPA Routing Not Working

Ensure your server rewrites all routes to `index.html`. See `vercel.json` for Vercel, `_redirects` for Netlify, or Nginx config for Docker.

### PWA Not Installing

- Must be served over HTTPS (except localhost)
- Check `manifest.webmanifest` is accessible
- Verify service worker is registered in DevTools

### Assets Not Loading

- Check `base` path in `vite.config.ts` matches deployment URL
- Ensure `dist/` is uploaded completely
- Verify CDN/CloudFront invalidation if using caching

---

## Monitoring

### Recommended Tools

| Tool | Purpose | Cost |
|------|---------|------|
| Vercel Analytics | Built-in performance monitoring | Free |
| Sentry | Error tracking | Free tier |
| Lighthouse CI | Automated performance/a11y checks | Free |

### Health Checks

For Docker deployments, the included `docker-compose.yml` has a healthcheck:
```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:80"]
  interval: 30s
  timeout: 3s
  retries: 3
```
