# Local Lite Database — No External DB

This app now uses **100% in-browser lite database** — no Supabase, no external server required.

## How it works

When you open the site in a browser for the first time:

1. **IndexedDB `bejkhonda-school` is created automatically** via Dexie (https://dexie.org)
   - Tables: `school`, `users`, `gradingScale`, `classes`, `students`, `mtrRecords`, `snapshots`
   - Versioned migrations (v1→v4) handle upgrades
2. **`seedDatabase()`** runs in `src/main.tsx` — if `classes` is empty, it loads `src/data/seed.json` (106 students from the real spreadsheet) + default grading scale
3. **Auth is local**: `src/lib/localAuth.ts` stores users in Dexie table `users`:
   - Passwords hashed with SHA-256 (Web Crypto)
   - Session in `localStorage` key `bejkhonda-session`
   - Profile loaded via `loadProfileLocal()` — includes `school`
4. **Persistence**: `navigator.storage.persist()` is requested on first load so the browser won’t evict IndexedDB under storage pressure
5. **All CRUD is local**: `ClassRoster`, `ReportCard`, `MTR`, `Settings`, `Import/Export` all read/write Dexie — zero network calls

## Verify

- Open DevTools → Application → IndexedDB → `bejkhonda-school` → see tables
- Application → Local Storage → `bejkhonda-session` → `{id, email}`
- Network tab → no Supabase calls when `VITE_USE_SUPABASE` not set

## No .env needed

```bash
npm ci
npm run dev
# open http://localhost:5173
# → Sign Up (creates local user + school in IndexedDB) → /app
# → All data stays on device, works offline after first load (PWA)
```

## Fallbacks

- If IndexedDB is blocked (private mode), users fallback to `localStorage` keys `bejkhonda-users-fallback`, `bejkhonda-school-fallback`
- If you set `VITE_USE_SUPABASE=true` + `VITE_SUPABASE_URL/_ANON_KEY`, Supabase can be re-enabled (legacy)

## Data portability

- **Export**: Settings → Backup JSON (local) or Encrypted Backup
- **Import**: Settings → Import JSON restores Dexie
- **Remote Sync (optional)**: if `VITE_ADMIN_TOKEN` + Vercel Blob configured, `src/lib/remoteSync.ts` can push/pull `db.json` to Blob

## Clearing data

- Browser: DevTools → Application → Clear Storage → Clear site data
- Or via UI: Import → Reset, or manually `localStorage.clear()` + `indexedDB.deleteDatabase('bejkhonda-school')`

## Deploy

No env vars required. Just `npm run build` → `dist/` → deploy to Vercel/Netlify/Nginx. CI now passes without Supabase secrets (see `.github/workflows/ci.yml`).

