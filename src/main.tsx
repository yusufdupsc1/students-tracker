import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './contexts/AuthContext'
import './index.css'
import './print.css'
import { seedDatabase } from './db/seed'
import { requestPersistentStorage, checkIndexedDBHealth } from './lib/persistence'
import { allyFactoryResetIfNeeded } from './lib/factoryReset'

// Ally factory reset check — runs before init, non-blocking
// We start it immediately but don't use top-level await (not supported in es2020)
let factoryResetDone = false
const factoryResetPromise = allyFactoryResetIfNeeded()
  .then((done) => {
    factoryResetDone = done
    if (done) console.log('[Main] Factory reset ally done — waiting for reload...')
    return done
  })
  .catch(() => false)

// --- Persistent storage & DB initialization ---
async function initializeApp() {
  // Wait for factory reset check to complete (up to 1s)
  await Promise.race([factoryResetPromise, new Promise((r) => setTimeout(r, 1000))])
  if (factoryResetDone) {
    // Reset triggered — don't seed, page will reload
    return
  }

  try {
    const health = await checkIndexedDBHealth()
    if (!health.available) {
      console.error('[Init] IndexedDB not available:', health.error)
    }

    const persistPromise = requestPersistentStorage()
    const timeout = new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 3000))
    await Promise.race([persistPromise, timeout])

    const seeded = await seedDatabase()
    if (seeded) {
      console.log('[Init] Database seeded with default data ✓')
    } else {
      console.log('[Init] Database already exists — using persistent data ✓')
    }

    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const est = await navigator.storage.estimate()
      console.log(`[Init] Storage: ${((est.usage ?? 0) / 1024 / 1024).toFixed(2)} MB used / ${((est.quota ?? 0) / 1024 / 1024).toFixed(0)} MB quota`)
    }
  } catch (e) {
    console.error('[Init] Failed to initialize app:', e)
  }
}

const initPromise = initializeApp()

const root = document.getElementById('root')
if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <BrowserRouter>
        <AuthProvider>
          <App initPromise={initPromise} />
        </AuthProvider>
      </BrowserRouter>
    </React.StrictMode>
  )
} else {
  console.error('Root element not found')
}

window.addEventListener('error', (event) => {
  console.error('Global error:', event.error)
})

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason)
})

if ('serviceWorker' in navigator) {
  import('virtual:pwa-register')
    .then(({ registerSW }) => registerSW({ immediate: true }))
    .catch(() => {})
}
