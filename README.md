# Bejkhonda School — Offline-First Result & Tracking PWA

[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61dafb?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646cff?logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![Dexie](https://img.shields.io/badge/Dexie-4.0-ff6b6b?logo=sqlite)](https://dexie.org/)
[![PWA](https://img.shields.io/badge/PWA-Ready-5a0fc8)](https://web.dev/progressive-web-apps/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

> **Offline-first Progressive Web App for student result management, progress tracking, and school administration. Zero backend. Zero cloud dependency. Full privacy.**

**Bejkhonda Government Primary School** needed a modern replacement for their Excel-based result tracking system. This PWA delivers a complete school management solution that works fully offline, persists data in the browser, and can be deployed anywhere — no server required.

---

## 🎯 Why This Project Matters

| Problem | Solution |
|---------|----------|
| Schools in low-connectivity areas need digital tools | **Offline-first PWA** — works without internet after first load |
| Student data privacy concerns | **Client-side only** — all data in IndexedDB, never leaves the device |
| Excel sheets are error-prone and hard to maintain | **Bulk import from .xlsx** with validation, preview, and undo |
| No budget for servers or hosting | **Zero infrastructure cost** — deploy to Vercel/Netlify for free |
| Teachers need print-ready report cards | **Professional print layout** with batch printing support |

---

## ✨ Key Features

### Core Functionality
- 📊 **Dashboard** — Real-time class performance analytics with Recharts visualizations
- 👥 **Class Roster** — Full CRUD for students with roll numbers, marks, attendance, auto-grading
- 📝 **Result Cards** — Print-ready individual/batch report cards with official formatting
- 📈 **Progress Tracking (MTR)** — Competency-based monitoring across subjects
- 🔍 **Smart Search** — Cross-class search by name, roll, guardian, or village
- 📥 **Import/Export** — Bulk Excel import + JSON backup/restore with validation
- ⚙️ **Settings** — Configure school info, grading scale, per-class subjects
- 📱 **PWA** — Install on any device, works fully offline
- 🔒 **Privacy-first** — No tracking, no cookies, no external API calls

### Technical Excellence
- **Type-safe** — Full TypeScript coverage with strict mode
- **Tested** — Unit tests for business logic (calculations, grading, merit ranking)
- **CI/CD** — GitHub Actions pipeline with typecheck → test → build → deploy
- **Dockerized** — Multi-stage Docker build, ~20 MB production image
- **Accessible** — WCAG 2.1 AA compliant (skip links, ARIA labels, touch targets)
- **Performant** — Code splitting, lazy loading, optimized bundle size
- **Resilient** — Error boundaries, snapshot-based undo system, persistent storage

---

## 🛠 Tech Stack & Architecture Decisions

### Frontend Stack

| Technology | Version | Why |
|------------|---------|-----|
| **React** | 18.3 | Component architecture, hooks, Suspense for code splitting |
| **TypeScript** | 5.5 | Type safety, IDE support, fewer runtime errors |
| **Vite** | 5.4 | Lightning-fast HMR, optimized production builds |
| **Tailwind CSS** | 3.4 | Utility-first styling, glassmorphism design system |
| **Recharts** | 2.12 | Declarative charting, responsive by default |
| **SheetJS** | 0.18 | Excel parsing with validation and normalization |

### Data Layer

| Technology | Purpose |
|------------|---------|
| **Dexie.js** | IndexedDB wrapper with reactive queries (`useLiveQuery`) |
| **IndexedDB** | Browser-native, origin-scoped, persists across sessions |
| **Workbox** | Service worker precaching for offline-first PWA |

### DevOps & Deployment

| Tool | Purpose |
|------|---------|
| **GitHub Actions** | CI/CD pipeline (typecheck → test → build → deploy) |
| **Vercel** | Serverless deployment with edge caching |
| **Docker** | Multi-stage containerization for self-hosting |
| **Nginx** | Production web server with security headers |

### Architecture Highlights

```
┌──────────────────────────────────────────────────────────┐
│                    Browser (Client-Side)                  │
│                                                           │
│  ┌─────────────┐    ┌──────────────┐    ┌─────────────┐  │
│  │   React     │────▶│   Dexie.js   │────▶│  IndexedDB  │  │
│  │ Components  │    │  (ORM Layer) │    │  (Browser)  │  │
│  └─────────────┘    └──────────────┘    └─────────────┘  │
│         │                    │                         │   │
│         │                    ▼                         │   │
│         │           ┌──────────────┐                   │   │
│         │           │  Snapshot    │                   │   │
│         │           │  System      │                   │   │
│         │           │  (Auto-Backup)│                   │   │
│         │           └──────────────┘                   │   │
│         ▼                    ▼                         │   │
│  ┌─────────────┐    ┌──────────────┐                   │   │
│  │   Service   │    │   Import/    │                   │   │
│  │   Worker    │    │   Export     │                   │   │
│  │  (PWA)      │    │  (XLSX/JSON) │                   │   │
│  └─────────────┘    └──────────────┘                   │   │
└──────────────────────────────────────────────────────────┘
```

**Key architectural decisions:**

1. **No backend** — All state lives in IndexedDB. Zero server costs, zero latency, zero privacy concerns.
2. **Spreadsheet as canonical data source** — Excel files are the single source of truth; import replaces all data with full validation.
3. **Snapshot-based safety** — Before destructive operations, auto-snapshots capture DB state (keep last 5) for instant undo.
4. **Code splitting** — Route-level lazy loading + manual vendor chunks (React, Dexie, Recharts, XLSX) keep initial bundle under 5 KB.
5. **Offline-first PWA** — Service worker precaches all assets; works without network after first load.

---

## 📊 Performance & Quality Metrics

### Bundle Size (Production)

| Chunk | Size | Gzipped |
|-------|------|---------|
| App shell (`index`) | ~14 KB | ~5 KB |
| Vendor (React + Router) | ~152 KB | ~49 KB |
| Dexie (IndexedDB) | ~98 KB | ~33 KB |
| Recharts | ~299 KB | ~77 KB |
| XLSX (SheetJS) | ~429 KB | ~143 KB |
| **Total** | **~2.8 MB** | **~307 KB** |

### Build Performance

| Metric | Value |
|--------|-------|
| TypeScript check | < 2s |
| Unit tests | 13 tests in < 1s |
| Production build | ~12s |
| PWA precache | 39 assets, ~2.8 MB |

### Quality Gates

- ✅ **TypeScript** — Strict mode, zero `any` types in business logic
- ✅ **Tests** — 13 unit tests covering calculations, grading, merit ranking
- ✅ **Lint** — No lint errors (configured in CI)
- ✅ **CI/CD** — GitHub Actions runs on every push/PR
- ✅ **Accessibility** — WCAG 2.1 AA (skip links, ARIA labels, 44px touch targets)

---

## 🚀 Quick Start

### Prerequisites

- Node.js ≥ 18
- npm ≥ 9

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/students-tracker.git
cd students-tracker

# Install dependencies (uses exact versions from lockfile)
npm ci

# Start development server
npm run dev
# → http://localhost:5173
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with HMR |
| `npm run build` | Production build (typecheck + Vite) |
| `npm run preview` | Preview production build locally |
| `npm run typecheck` | TypeScript strict type checking |
| `npm run test` | Run unit tests (Vitest) |
| `npm run test:watch` | Watch mode for development |
| `npm run verify` | **CI gate**: typecheck → test → build |
| `npm run seed` | Seed database from Excel spreadsheet |

### Verification

```bash
# Run the full verification suite (CI gate)
npm run verify

# Run tests with coverage
npm run test -- --coverage
```

---

## 🏗 Project Structure

```
students-tracker/
├── .github/
│   └── workflows/
│       └── ci.yml              # GitHub Actions CI/CD (quality, Docker, Vercel deploy)
├── public/
│   ├── icons/                  # PWA icons (192px, 512px, maskable)
│   └── fonts/                  # Self-hosted Bengali font fallbacks
├── scripts/
│   └── seed-from-xlsx.mjs      # Spreadsheet → seed.json converter
├── src/
│   ├── assets/
│   │   └── fonts/              # Hind Siliguri (5 weights) + Noto Sans Bengali
│   ├── components/
│   │   ├── Layout.tsx          # Shell: sidebar (desktop) + bottom nav (mobile)
│   │   ├── ErrorBoundary.tsx   # Route-level error boundary with retry UI
│   │   └── PageLoader.tsx      # Loading spinner with Bengali text
│   ├── pages/
│   │   ├── Dashboard.tsx       # KPIs, class summary, Recharts visualizations
│   │   ├── ClassRoster.tsx     # Student list, marks entry, auto-grading
│   │   ├── ReportCard.tsx      # Print-ready individual/batch result cards
│   │   ├── MtrTracking.tsx     # Progress tracking (competency-based)
│   │   ├── StudentSearch.tsx   # Cross-class search with combined profile
│   │   ├── Import.tsx          # XLSX import + JSON backup/restore
│   │   └── Settings.tsx        # School info, grading scale, subjects
│   ├── lib/
│   │   ├── calculations.ts     # GPA lookup, averages, merit ranking, threshold
│   │   ├── importXlsx.ts       # SheetJS parsing, normalization, validation
│   │   ├── backup.ts           # JSON export/import with structure validation
│   │   └── persistence.ts      # IndexedDB persistent storage request
│   ├── db/
│   │   ├── schema.ts           # Dexie schema, migrations, reactive queries
│   │   ├── seed.ts             # Default seed data
│   │   └── seedReal.ts         # Real school data seed (106 students)
│   ├── types/
│   │   └── index.ts            # TypeScript interfaces for all domain models
│   ├── hooks/
│   │   └── useDebouncedCallback.ts
│   ├── index.css               # Tailwind + @font-face + glassmorphism utilities
│   ├── print.css               # Print-specific styles (report cards)
│   └── main.tsx                # App entry point with PWA registration
├── docs/
│   ├── architecture.md          # System design, data flow, performance
│   ├── api.md                   # Import/export formats, schema, validation
│   └── deployment.md            # Vercel, Docker, Netlify, GitHub Pages
├── .env.example                 # Environment variable template
├── .gitignore
├── docker-compose.yml           # One-command Docker deployment
├── Dockerfile                   # Multi-stage production image (Node → Nginx)
├── LICENSE                      # MIT License
├── nginx.conf                   # Production Nginx with security headers
├── package.json
├── tailwind.config.js
├── tsconfig.json
├── vercel.json                  # Vercel SPA routing + security headers
└── README.md
```

---

## 🚢 Deployment

### Vercel (Recommended — Zero Config)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/students-tracker)

1. Push to GitHub
2. Import repo in [Vercel](https://vercel.com/new)
3. Deploy — auto-detects Vite, zero configuration needed

**CI/CD:** Push to `main` branch triggers automatic deployment via GitHub Actions.

### Docker

```bash
# Build (~20 MB production image)
docker build -t students-tracker .

# Run
docker run -p 3000:80 students-tracker
# → http://localhost:3000
```

### Docker Compose

```bash
docker compose up -d
docker compose logs -f
```

Includes healthcheck, restart policy, and Nginx with security headers.

### Other Platforms

- **Netlify** — Build command: `npm run build`, Publish: `dist`
- **GitHub Pages** — Add `base: '/students-tracker/'` to Vite config
- **AWS S3 + CloudFront** — Upload `dist/`, configure SPA fallback
- **Any static host** — `npm run build`, serve `dist/` with any web server

See [docs/deployment.md](docs/deployment.md) for detailed guides.

---

## 🧪 Testing Strategy

### Unit Tests

```bash
npm run test
```

**Current coverage:**
- Calculation logic (averages, GPA lookup, merit ranking)
- Threshold rules (pass/fail/incomplete)
- Edge cases (empty scale, blank marks, ties)

### Quality Gates (CI/CD)

Every push/PR runs:
1. `npm run typecheck` — TypeScript strict mode
2. `npm run test` — Unit tests
3. `npm run build` — Production build verification
4. Docker build (on push)
5. Vercel deploy (on push to `main`)

### E2E Testing (Planned)

Playwright tests for critical user flows:
- Dashboard loads with seeded data
- Student search returns correct results
- Import flow validates and previews data
- Report card prints correctly

---

## 🔒 Security & Privacy

| Concern | Mitigation |
|---------|------------|
| Data exfiltration | **No external API calls** — zero network requests after first load |
| Tracking | **No cookies, no analytics, no telemetry** |
| XSS | React JSX escaping + no `dangerouslySetInnerHTML` |
| IndexedDB security | Origin-scoped, no cross-origin access |
| Service worker | Serves only local assets, no remote code execution |
| Backup files | Plain JSON, user-controlled, no cloud sync |

---

## 📊 Browser Support

| Browser | Minimum Version |
|---------|----------------|
| Chrome / Edge | 90+ |
| Firefox | 88+ |
| Safari | 14+ |
| iOS Safari | 14+ |
| Android Chrome | 90+ |

**PWA Requirements:**
- HTTPS required for service worker (except `localhost`)
- IndexedDB support (all modern browsers)
- `font-display: swap` for instant text rendering

---

## 🤝 Contributing

We follow [Conventional Commits](https://www.conventionalcommits.org/) for clear history and automated changelogs.

```bash
# 1. Fork and clone
git clone https://github.com/yourusername/students-tracker.git
cd students-tracker

# 2. Create a feature branch
git checkout -b feat/amazing-feature

# 3. Install and verify
npm ci
npm run verify

# 4. Commit with conventional format
git commit -m "feat(roster): add bulk marks entry for class roster"

# 5. Push and open PR
git push origin feat/amazing-feature
```

### Commit Convention

| Type | Description | Example |
|------|-------------|---------|
| `feat` | New feature | `feat(search): add cross-class student search` |
| `fix` | Bug fix | `fix(import): prevent MTR data loss during xlsx import` |
| `docs` | Documentation | `docs(readme): add deployment guide for Vercel` |
| `refactor` | Code change | `refactor(calculations): extract merit ranking logic` |
| `test` | Tests | `test(calculations): add edge case for empty scale` |
| `chore` | Maintenance | `chore(deps): upgrade Vite to 5.4` |

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

---

## 📄 License

MIT — free to use for schools, projects, or as a template.

See [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgments

- [Hind Siliguri](https://fonts.google.com/specimen/Hind+Siliguri) — Bengali/Latin typeface by Indian Type Foundry
- [Noto Sans Bengali](https://fonts.google.com/noto/specimen/Noto+Sans+Bengali) — Bengali fallback by Google
- Built with [Vite](https://vitejs.dev/), [React](https://react.dev/), [Tailwind CSS](https://tailwindcss.com/), and [Dexie](https://dexie.org/)

---

## 📞 Contact

**Bejkhonda Government Primary School**  
বেজখণ্ড সঃ প্রাঃ vidyaloy — বেজখণ্ড, বাংলাদেশ

For questions about this project, open an issue on GitHub.
