# Architecture Documentation

## Overview

Bejkhonda School Tracker is an offline-first Progressive Web App (PWA) built with React, TypeScript, and Dexie.js. It requires no backend server — all data persists in the browser's IndexedDB.

## Design Principles

1. **Offline-first** — Works without internet after first load
2. **Privacy-first** — No data leaves the device; no tracking, no cookies
3. **Mobile-first** — Responsive design optimized for smartphones
4. **Bengali-first** — Native Bengali UI with proper font rendering
5. **Zero-config** — No database setup, no environment variables, no build steps

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Browser (Client)                      │
│                                                          │
│  ┌─────────────┐    ┌──────────────┐    ┌─────────────┐ │
│  │   React     │────▶│   Dexie.js   │────▶│  IndexedDB  │ │
│  │ Components  │    │  (ORM Layer) │    │  (Browser)  │ │
│  └─────────────┘    └──────────────┘    └─────────────┘ │
│         │                    │                         │
│         │                    ▼                         │
│         │           ┌──────────────┐                   │
│         │           │  Snapshot    │                   │
│         │           │  System      │                   │
│         │           └──────────────┘                   │
│         │                    │                         │
│         ▼                    ▼                         │
│  ┌─────────────┐    ┌──────────────┐                   │
│  │   Service   │    │   Import/    │                   │
│  │   Worker    │    │   Export     │                   │
│  │  (PWA)      │    │  (XLSX/JSON) │                   │
│  └─────────────┘    └──────────────┘                   │
└─────────────────────────────────────────────────────────┘
```

## Data Layer

### Database Schema

```typescript
// src/db/schema.ts

school: Table<School, string>          // Single row, keyed by 'school'
gradingScale: Table<GradingScaleRow, number>  // minPercent as primary key
classes: Table<ClassConfig, number>     // One per class (id 1..5)
students: Table<Student, string>        // id = `${classId}_${roll}`
mtrRecords: Table<MTRRecord, string>    // One per student per term
snapshots: Table<Snapshot, number>      // Auto-backup points (keep last 5)
```

### Data Flow

1. **Initial Load:** `seedDatabase()` checks if DB is empty → loads `src/data/seed.json` (generated from spreadsheet)
2. **User Import:** User selects `.xlsx` → `importXlsxFile()` parses → preview → `applyImport()` writes to IndexedDB
3. **Auto-save:** Settings changes trigger immediate `db.school.put()` / `db.gradingScale.bulkPut()`
4. **Snapshot:** Before destructive operations, `captureSnapshot()` saves current state (keeps last 5)
5. **Restore:** `restoreSnapshot()` rolls back to a previous snapshot

### Offline Strategy

- **No backend** — All state is client-side
- **Service Worker** — Precaches all assets (JS, CSS, fonts, icons) on first load
- **Cache-first** — Subsequent loads hit the service worker cache instantly
- **Background sync** — Not implemented (data never needs to sync to server)

## Frontend Architecture

### Routing

```typescript
// src/App.tsx
<Routes>
  <Route path="/" element={<Layout />}>
    <Route index element={<Dashboard />} />
    <Route path="roster" element={<ClassRoster />} />
    <Route path="report-card" element={<ReportCard />} />
    <Route path="mtr" element={<MtrTracking />} />
    <Route path="search" element={<StudentSearch />} />
    <Route path="import" element={<Import />} />
    <Route path="settings" element={<Settings />} />
  </Route>
</Routes>
```

### State Management

- **Local state:** `useState` / `useReducer` for component-level state
- **Server state:** `useLiveQuery` from `dexie-react-hooks` for reactive DB queries
- **URL state:** `useSearchParams` for filters and deep-linking
- **No global state manager** — Dexie is the single source of truth

### Component Hierarchy

```
Layout
├── Desktop Sidebar (md:flex)
│   ├── Logo
│   ├── Primary Nav
│   └── Secondary Nav
├── Mobile Topbar (md:hidden)
├── Skip Link (a11y)
├── Main Content Area
│   └── <Outlet /> (route pages)
└── Mobile Bottom Nav (md:hidden)
    └── Bottom Sheet ("আরও" menu)
```

### Code Splitting

```typescript
// src/App.tsx
const ClassRoster = React.lazy(() => import('./pages/ClassRoster'))
const ReportCard = React.lazy(() => import('./pages/ReportCard'))
const MtrTracking = React.lazy(() => import('./pages/MtrTracking'))
const StudentSearch = React.lazy(() => import('./pages/StudentSearch'))
const Import = React.lazy(() => import('./pages/Import'))
const Settings = React.lazy(() => import('./pages/Settings'))
```

Manual chunks in `vite.config.ts`:
- `vendor` — React, ReactDOM, React Router
- `dexie` — Dexie.js + hooks
- `recharts` — Charting library
- `xlsx` — SheetJS spreadsheet parser

## Styling Architecture

### Design System

- **Framework:** Tailwind CSS 3.4
- **Design:** Glassmorphism (translucent cards, backdrop blur)
- **Colors:** Bangladeshi flag palette (red `#811B22`, green `#006a4e`)
- **Typography:** Hind Siliguri (primary) + Noto Sans Bengali (fallback)

### Key Classes

| Class | Purpose |
|-------|---------|
| `glass-card` | Desktop-only glassmorphism card |
| `glass-card-subtle` | Subtle glass effect for secondary content |
| `glass-input` | Styled input with focus states |
| `app-sidebar` | Desktop sidebar layout |
| `app-bottomnav` | Mobile bottom tab bar |
| `app-topbar` | Mobile sticky header |
| `no-print` | Hidden in print mode |

### Responsive Breakpoints

- Mobile: `< 768px` — bottom nav, stacked layout
- Desktop: `≥ 768px` — sidebar, horizontal layout

## Import/Export Pipeline

### Spreadsheet Import Flow

```
User selects .xlsx
        │
        ▼
parseWorkbook()          // SheetJS reads workbook
        │
        ▼
validateImport()         // Check required sheets, warn on issues
        │
        ▼
Preview UI               // Show school, students, classes, scale
        │
        ▼
captureSnapshot()        // Save current DB state (undo safety)
        │
        ▼
applyImport()            // Clear + bulk insert into IndexedDB
```

### Backup Format

```json
{
  "school": { "id": "school", "name": "...", ... },
  "gradingScale": [{ "minPercent": 80, "gpa": 5.0, "grade": "A+" }],
  "classes": [{ "id": 1, "name": "প্রথম", "subjects": [...] }],
  "students": [{ "id": "1_1", "classId": 1, "roll": 1, ... }]
}
```

## PWA Configuration

### Service Worker

- **Plugin:** `vite-plugin-pwa`
- **Strategy:** Precaching (all assets cached on install)
- **Manifest:** `manifest.webmanifest` with app metadata
- **Icons:** 192px, 512px, 512px maskable

### Offline Behavior

1. First load: app + SW install, all assets precached
2. Subsequent loads: instant from cache
3. No network requests after first load
4. IndexedDB persists across sessions

## Performance

### Bundle Size

| Chunk | Size (gzipped) |
|-------|---------------|
| `index` (app shell) | ~5 KB |
| `vendor` (React + Router) | ~80 KB |
| `dexie` | ~33 KB |
| `recharts` | ~77 KB |
| `xlsx` | ~143 KB |
| **Total** | **~338 KB** |

### Optimizations

- Route-level code splitting (`React.lazy`)
- Font subsetting with `unicode-range`
- `font-display: swap` for instant text
- Image/video: none (text-only app)
- Service worker precache for offline

## Security Considerations

- **No external API calls** — zero attack surface for data exfiltration
- **Content Security Policy:** Not explicitly set (relies on Vercel defaults)
- **XSS:** React's JSX escaping + no `dangerouslySetInnerHTML`
- **IndexedDB:** Origin-scoped, no cross-origin access
- **Service Worker:** Serves only local assets

## Future Architecture Considerations

| Feature | Architecture Impact |
|---------|---------------------|
| Multi-school support | Add `schoolId` to all tables, change PK strategy |
| Cloud backup | Add sync layer with conflict resolution |
| Authentication | Add service worker + token-based auth (out of scope for current PWA) |
| Real-time collaboration | WebSocket or WebRTC (not needed for single-user offline app) |
| QR code IDs | Client-side generation with `qrcode` lib (already in package.json) |
