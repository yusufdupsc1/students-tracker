# Bejkhonda School — Result & Tracking PWA

Offline-first Progressive Web App for বেজখণ্ড সঃ প্রাঃ বিদ্যালয় (Bejkhonda Government
Primary School). Built with Vite + React + TypeScript, Tailwind CSS, Dexie
(IndexedDB), and `vite-plugin-pwa`.

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — type-check-free production build (service worker + manifest)
- `npm run preview` — preview the production build
- `npm run typecheck` — run `tsc --noEmit`
- `npm run test` — run unit tests (Vitest)

## PWA icons are PLACEHOLDERS

> The icons in `public/icons/` (`icon-192.png`, `icon-512.png`,
> `icon-512-maskable.png`) are generated solid-color placeholders.
> **Replace them** with real branded artwork before shipping. The manifest
> references them in `vite.config.ts`.

## Notes

- The Bengali UI font (Noto Sans Bengali) is bundled locally under
  `src/assets/fonts` and declared in `src/index.css` — it works fully offline
  (no Google Fonts CDN).
- Mobile-first: navigation is a bottom tab bar on narrow screens and a sidebar
  on wider screens.
