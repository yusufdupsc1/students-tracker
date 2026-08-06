/**
 * Factory Reset — Ally for Vercel Deploy
 * 
 * When the app is updated on GitHub and deployed to Vercel, every browser that
 * opens the new version will have old IndexedDB + localStorage that may not match
 * the new code (old schema, old classes 1-5, old school data).
 * 
 * This ally ensures 100% flawless transition:
 * - On first load after a new deploy (version bump in package.json), it wipes
 *   ALL local persistent storage (IndexedDB + localStorage) and reloads.
 * - User then sees a clean app, can Sign Up fresh with new email/password,
 *   no email verification, with new 1-12 classes and FLN theme.
 * 
 * It is versioned and runs only once per deploy, not on every open.
 */

import { db } from '../db/schema'

const APP_VERSION_KEY = 'bejkhonda-app-version'
const CURRENT_VERSION = '1.2.0' // bump this on every breaking deploy to force reset

export async function allyFactoryResetIfNeeded(): Promise<boolean> {
  try {
    const savedVersion = localStorage.getItem(APP_VERSION_KEY)
    
    // First install — just save version, don't reset
    if (!savedVersion) {
      localStorage.setItem(APP_VERSION_KEY, CURRENT_VERSION)
      console.log(`[FactoryReset] First install v${CURRENT_VERSION} — no reset needed`)
      return false
    }

    // Same version — no reset
    if (savedVersion === CURRENT_VERSION) {
      return false
    }

    // Version mismatch — do ally factory reset
    console.log(`[FactoryReset] Version mismatch: ${savedVersion} → ${CURRENT_VERSION}. Wiping all local storage...`)

    // 1. Clear all Bejkhonda localStorage keys
    const keysToRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && (key.startsWith('bejkhonda') || key.startsWith('theme') || key.startsWith('sb-') || key.includes('supabase'))) {
        keysToRemove.push(key)
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k))

    // Also clear session and other app keys
    localStorage.removeItem('bejkhonda-session')
    localStorage.removeItem('bejkhonda-users-fallback')
    localStorage.removeItem('bejkhonda-school-fallback')
    localStorage.removeItem('bejkhonda-recent-searches')
    localStorage.removeItem('theme')

    // 2. Delete IndexedDB
    try {
      await db.delete()
      console.log('[FactoryReset] IndexedDB deleted ✓')
    } catch (e) {
      console.warn('[FactoryReset] db.delete() failed, trying indexedDB.deleteDatabase', e)
      try {
        indexedDB.deleteDatabase('bejkhonda-school')
      } catch {}
    }

    // 3. Clear Cache Storage (PWA)
    if ('caches' in window) {
      try {
        const names = await caches.keys()
        await Promise.all(names.map(n => caches.delete(n)))
        console.log('[FactoryReset] CacheStorage cleared ✓')
      } catch {}
    }

    // 4. Unregister service workers (they will re-register with new code)
    if ('serviceWorker' in navigator) {
      try {
        const regs = await navigator.serviceWorker.getRegistrations()
        await Promise.all(regs.map(r => r.unregister()))
        console.log('[FactoryReset] ServiceWorkers unregistered ✓')
      } catch {}
    }

    // 5. Save new version
    localStorage.setItem(APP_VERSION_KEY, CURRENT_VERSION)

    console.log(`[FactoryReset] ✅ All local persistent storage wiped for v${CURRENT_VERSION}. Reloading...`)
    
    // Reload to get fresh state
    setTimeout(() => {
      window.location.reload()
    }, 500)

    return true
  } catch (e) {
    console.error('[FactoryReset] Failed', e)
    // Even on error, save version to avoid loop
    try {
      localStorage.setItem(APP_VERSION_KEY, CURRENT_VERSION)
    } catch {}
    return false
  }
}

// Manual trigger for Settings → Factory Reset button (also ally)
export async function manualFactoryReset(): Promise<void> {
  localStorage.setItem(APP_VERSION_KEY, CURRENT_VERSION)
  await allyFactoryResetIfNeeded()
  // Force even if version matches
  localStorage.clear()
  try {
    await db.delete()
    indexedDB.deleteDatabase('bejkhonda-school')
  } catch {}
  if ('caches' in window) {
    const names = await caches.keys()
    await Promise.all(names.map(n => caches.delete(n)))
  }
  location.href = '/signup'
}
