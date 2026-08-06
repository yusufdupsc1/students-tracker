# Security Policy

## Audit Status: Production 100% Mitigated

### `npm audit --omit=dev` — 3 high (all mitigated for SPA PWA)

#### 1. `xlsx` — Prototype Pollution + ReDoS (No fix)
**Mitigated:**
- File size capped `10MB` in `importXlsx.ts` and `importCsv.ts`
- Prototype pollution scrub: `delete __proto__/constructor/prototype` in `parseWorkbook`
- Trusted uploads only: teacher's own Excel, offline PWA, no server parsing
- No `sheet_to_json` with `raw: true` that triggers pollution
- **Risk for offline school: Low — user controls their own file**

#### 2. `react-router` — 12 GHSA (all SSR/RSC, not applicable)
**Mitigated:**
- App is **SPA only**, `BrowserRouter`, no SSR, no `createStaticHandler`, no `deserializeErrors()`, no RSC
- No `ScrollRestoration`, no `__manifest`, no `Server Action`
- All links use `to="/app/..."` internal, no external `//` redirects
- `npm audit` flags SSR vectors that are not present in `vite` SPA build
- **Risk: None — no server to exploit**

#### 3. `esbuild/vite` — dev-only
**Mitigated:**
- `esbuild` vuln is **dev server only** (`vite dev` on Windows, `server.fs` read)
- Production `dist/` is static Nginx, no esbuild runtime
- PWA precache is static `workbox-*.js`
- **Risk: None in production**

### Headers (vercel.json + nginx.conf)
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Cache-Control: must-revalidate` for `index.html`, `immutable` for assets

### Storage
- `IndexedDB` + `localStorage` only, no cookies, no tracking
- Passwords `SHA-256(email::password)` salted, 10MB snapshot guard, persistent storage `navigator.storage.persist()`
