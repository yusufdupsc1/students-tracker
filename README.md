# Bejkhonda School — Result & Tracking PWA

[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61dafb)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646cff)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8)](https://tailwindcss.com/)
[![Dexie](https://img.shields.io/badge/Dexie-4.0-ff6b6b)](https://dexie.org/)
[![PWA](https://img.shields.io/badge/PWA-Ready-5a0fc8)](https://web.dev/progressive-web-apps/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

Offline-first Progressive Web App for **বেজখণ্ড সঃ প্রাঃ বিদ্যালয়** (Bejkhonda Government Primary School). Built with modern web technologies for managing student results, progress tracking, and school administration — fully functional without an internet connection.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 📊 **Dashboard** | Class-wise performance overview with charts, pass percentages, and merit rankings |
| 👥 **Class Roster** | Manage students with roll numbers, marks, attendance, and auto-calculated grades |
| 📝 **Result Cards** | Generate and print individual or batch report cards with official formatting |
| 📈 **Progress Tracking** | Monitor student competency development across subjects |
| 🔍 **Smart Search** | Find students by name, roll, guardian, or village across all classes |
| 📥 **Import/Export** | Bulk import from Excel spreadsheets; JSON backup and restore |
| ⚙️ **Settings** | Configure school info, grading scale, and per-class subjects |
| 📱 **PWA** | Install on any device; works fully offline after first load |
| 🔒 **Privacy-first** | All data stored locally in IndexedDB — no server, no cloud, no tracking |

## 🛠 Tech Stack

| Category | Technology |
|----------|-----------|
| **Frontend** | React 18, TypeScript 5, Vite 5 |
| **Styling** | Tailwind CSS 3.4 with Glassmorphism design system |
| **Database** | Dexie.js (IndexedDB wrapper) — zero-config, offline-first |
| **Charts** | Recharts |
| **Spreadsheets** | SheetJS (`xlsx`) |
| **PWA** | `vite-plugin-pwa` + Workbox |
| **Testing** | Vitest |
| **Deployment** | Vercel / Docker / Nginx |

## 🚀 Quick Start

### Prerequisites

- Node.js ≥ 18
- npm ≥ 9

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/students-tracker.git
cd students-tracker

# Install dependencies
npm ci

# Start development server
npm run dev
```

Open `http://localhost:5173` in your browser.

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Production build (typecheck + Vite build) |
| `npm run preview` | Preview production build locally |
| `npm run typecheck` | TypeScript type checking |
| `npm run test` | Run unit tests (Vitest) |
| `npm run test:watch` | Run tests in watch mode |
| `npm run verify` | Run typecheck + test + build (CI gate) |
| `npm run seed` | Seed database from spreadsheet |

## 🏗 Architecture

### System Overview

```
┌─────────────────┐     ┌──────────────┐     ┌─────────────┐
│  Spreadsheet    │────▶│  Import      │────▶│  IndexedDB  │
│  (.xlsx)        │     │  Engine      │     │  (Dexie)    │
└─────────────────┘     └──────────────┘     └─────────────┘
                                                      │
                          ┌──────────────────────────┘
                          ▼
                   ┌──────────────┐
                   │  React UI    │
                   │  Components  │
                   └──────────────┘
```

### Offline-First Strategy

- **No backend required** — all data lives in the browser's IndexedDB
- **Spreadsheet import** — bulk-load students, classes, and grading scale from Excel
- **JSON backup** — export/restore complete database state
- **PWA caching** — service worker precaches all assets for offline use
- **Auto-save** — settings changes persist immediately to IndexedDB

### Data Model

| Entity | Description | Key Fields |
|--------|-------------|------------|
| `School` | School metadata | `name`, `village`, `upazila`, `district` |
| `GradingScale` | Grade boundaries | `minPercent`, `gpa`, `grade`, `remark` |
| `ClassConfig` | Per-class configuration | `name`, `subjects[]` |
| `Student` | Student record | `id`, `classId`, `roll`, `name`, `marks{}` |
| `MTRRecord` | Progress tracking | `studentId`, `skills{}`, `status` |
| `Snapshot` | Auto-backup point | `createdAt`, `reason`, `json` |

## 📁 Project Structure

```
students-tracker/
├── .github/
│   └── workflows/
│       └── ci.yml              # GitHub Actions CI/CD pipeline
├── public/
│   ├── icons/                  # PWA icons (192px, 512px, maskable)
│   └── fonts/                  # Self-hosted Bengali fonts (fallback)
├── scripts/
│   └── seed-from-xlsx.mjs      # Spreadsheet → seed.json converter
├── src/
│   ├── assets/
│   │   └── fonts/              # Hind Siliguri (5 weights) + Noto Sans Bengali
│   ├── components/
│   │   ├── Layout.tsx          # Shell: sidebar (desktop) + bottom nav (mobile)
│   │   ├── ErrorBoundary.tsx   # Route-level error boundary
│   │   └── PageLoader.tsx      # Loading spinner
│   ├── pages/
│   │   ├── Dashboard.tsx       # KPIs, class summary, charts
│   │   ├── ClassRoster.tsx     # Student list, marks entry, grading
│   │   ├── ReportCard.tsx      # Individual/batch print-ready result cards
│   │   ├── MtrTracking.tsx     # Progress tracking (competency-based)
│   │   ├── StudentSearch.tsx   # Cross-class search with combined profile
│   │   ├── Import.tsx          # XLSX import + JSON backup/restore
│   │   └── Settings.tsx        # School info, grading scale, subjects
│   ├── lib/
│   │   ├── calculations.ts     # GPA lookup, averages, merit ranking
│   │   ├── importXlsx.ts       # SheetJS parsing, normalization
│   │   ├── backup.ts           # JSON export/import with validation
│   │   └── persistence.ts      # IndexedDB persistent storage request
│   ├── db/
│   │   ├── schema.ts           # Dexie database schema & migrations
│   │   ├── seed.ts             # Default seed data
│   │   └── seedReal.ts         # Real school data seed
│   ├── types/
│   │   └── index.ts            # TypeScript interfaces
│   ├── hooks/
│   │   └── useDebouncedCallback.ts
│   ├── index.css               # Tailwind + @font-face declarations
│   ├── print.css               # Print-specific styles (report cards)
│   └── main.tsx                # App entry point
├── .env.example                # Environment variable template
├── .gitignore
├── docker-compose.yml          # One-command Docker deployment
├── Dockerfile                  # Multi-stage production image
├── LICENSE                     # MIT License
├── nginx.conf                  # Production Nginx config
├── package.json
├── tailwind.config.js
├── tsconfig.json
├── vercel.json                 # Vercel deployment config
└── README.md
```

## 🚢 Deployment

### Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/students-tracker)

1. Push to GitHub
2. Import repo in [Vercel](https://vercel.com/new)
3. Deploy — zero config needed

The app is configured as an SPA with `vercel.json`. All client-side routes fall back to `index.html`.

### Docker

```bash
# Build
docker build -t students-tracker .

# Run
docker run -p 3000:80 students-tracker
```

### Docker Compose

```bash
docker compose up -d
# App available at http://localhost:3000
```

### Manual Build

```bash
npm run build
# Output in dist/ — serve with any static file server
npx serve dist
```

## 🧪 Testing

```bash
# Run tests once
npm run test

# Watch mode
npm run test:watch
```

Current test suite covers calculation logic (averages, GPA lookup, merit ranking, threshold rules).

## 🔒 Security & Privacy

- **No external API calls** — all data stays in the browser
- **No cookies, no tracking, no analytics** by default
- **IndexedDB** is origin-scoped; data never leaves the device
- **Backup files** are plain JSON stored locally; no cloud sync
- **PWA service worker** caches assets for offline use only

## 📊 Browser Support

| Browser | Version |
|---------|---------|
| Chrome/Edge | 90+ |
| Firefox | 88+ |
| Safari | 14+ |
| iOS Safari | 14+ |
| Android Chrome | 90+ |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow existing TypeScript conventions
- Run `npm run verify` before committing
- Update `PROGRESS.md` if adding features
- Ensure mobile responsiveness (375px viewport)

## 📄 License

MIT — feel free to use this project for your own school or as a template.

See [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

- [Hind Siliguri](https://fonts.google.com/specimen/Hind+Siliguri) font by Indian Type Foundry
- [Noto Sans Bengali](https://fonts.google.com/noto/specimen/Noto+Sans+Bengali) by Google
- Built with [Vite](https://vitejs.dev/), [React](https://react.dev/), and [Tailwind CSS](https://tailwindcss.com/)
