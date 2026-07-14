# Bejkhonda School — Result & Tracking PWA

[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61dafb)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646cff)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8)](https://tailwindcss.com/)
[![Dexie](https://img.shields.io/badge/Dexie-4.0-ff6b6b)](https://dexie.org/)
[![PWA](https://img.shields.io/badge/PWA-Ready-5a0fc8)](https://web.dev/progressive-web-apps/)

Offline-first Progressive Web App for **বেজখণ্ড সঃ প্রাঃ বিদ্যালয়** (Bejkhonda Government Primary School). Built with modern web technologies for managing student results, MTR tracking, and school administration — fully functional without an internet connection.

![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)

---

## ✨ Features

- 📊 **Dashboard** — Class-wise performance overview with charts and statistics
- 👥 **Class Roster** — Manage students with roll numbers, marks, attendance, and grades
- 📝 **Result Cards** — Generate and print individual/batch report cards
- 📈 **Progress Tracking (MTR)** — Monitor student competency development
- 🔍 **Smart Search** — Find students by name, roll, guardian, or village
- 📥 **Import/Export** — Spreadsheet-based data import and JSON backup
- ⚙️ **Settings** — Configure school info, grading scale, and subjects
- 📱 **PWA** — Install on any device, works fully offline
- 🔒 **Privacy-first** — All data stored locally in IndexedDB

## 🛠 Tech Stack

| Category | Technology |
|----------|-----------|
| **Frontend** | React 18, TypeScript 5, Vite 5 |
| **Styling** | Tailwind CSS 3.4 with Glassmorphism |
| **Database** | Dexie.js (IndexedDB wrapper) — zero-config, offline-first |
| **Charts** | Recharts |
| **Spreadsheets** | SheetJS (xlsx) |
| **PWA** | vite-plugin-pwa + Workbox |
| **Testing** | Vitest |
| **Deployment** | Vercel / Docker |

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

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Production build (typecheck + Vite build) |
| `npm run preview` | Preview production build locally |
| `npm run typecheck` | TypeScript type checking |
| `npm run test` | Run unit tests (Vitest) |
| `npm run verify` | Run typecheck + test + build (CI gate) |
| `npm run seed` | Seed database from spreadsheet |

## 🏗 Architecture

### Data Flow

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

### Project Structure

```
src/
├── components/       # Reusable UI components
│   ├── Layout.tsx    # Shell with sidebar + bottom nav
│   ├── ErrorBoundary.tsx
│   └── PageLoader.tsx
├── pages/            # Route-level pages
│   ├── Dashboard.tsx
│   ├── ClassRoster.tsx
│   ├── ReportCard.tsx
│   ├── MtrTracking.tsx
│   ├── StudentSearch.tsx
│   ├── Import.tsx
│   └── Settings.tsx
├── lib/              # Business logic
│   ├── calculations.ts
│   ├── importXlsx.ts
│   ├── backup.ts
│   └── persistence.ts
├── db/               # Database layer
│   ├── schema.ts     # Dexie schema & tables
│   ├── seed.ts       # Dev seed data
│   └── seedReal.ts   # Production seed
├── types/            # TypeScript interfaces
├── hooks/            # Custom React hooks
├── index.css         # Global styles + @font-face
├── print.css         # Print-specific styles
└── main.tsx          # App entry point
```

## 🚢 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import repo in [Vercel](https://vercel.com)
3. Deploy — zero config needed (Vercel auto-detects Vite)

The app is configured as an SPA with `vercel.json`. All client-side routes fall back to `index.html`.

### Docker

```bash
# Build
docker build -t students-tracker .

# Run
docker run -p 3000:80 students-tracker
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

Current coverage includes calculation logic (averages, GPA lookup, merit ranking).

## 📊 Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- iOS Safari 14+
- Android Chrome 90+

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT — feel free to use this project for your own school or as a template.

## 🙏 Acknowledgments

- [Hind Siliguri](https://fonts.google.com/specimen/Hind+Siliguri) font by Indian Type Foundry
- [Noto Sans Bengali](https://fonts.google.com/noto/specimen/Noto+Sans+Bengali) by Google
- Built with [Vite](https://vitejs.dev/), [React](https://react.dev/), and [Tailwind CSS](https://tailwindcss.com/)
