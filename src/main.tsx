import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './contexts/AuthContext'
import './index.css'
import './print.css'
import { seedDatabase } from './db/seed'
import { requestPersistentStorage, checkIndexedDBHealth } from './lib/persistence'

// --- Persistent storage & DB initialization ---
// We initialize before rendering to ensure DB is ready and storage is persistent.
// This makes the app consistent: every open creates/loads the local DB reliably.

async function initializeApp() {
  try {
    // 1. Check IndexedDB health first
    const health = await checkIndexedDBHealth()
    if (!health.available) {
      console.error('[Init] IndexedDB not available:', health.error)
      // Show a user-visible error later via UI, but don't block render
    }

    // 2. Request persistent storage (best-effort, non-blocking)
    // Don't await indefinitely — 3s timeout
    const persistPromise = requestPersistentStorage()
    const timeout = new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 3000))
    await Promise.race([persistPromise, timeout])

    // 3. Seed database if empty (creates school, classes 1-12, grading scale, 106 students)
    // This is idempotent — only runs when DB is empty
    const seeded = await seedDatabase()
    if (seeded) {
      console.log('[Init] Database seeded with default data ✓')
    } else {
      console.log('[Init] Database already exists — using persistent data ✓')
    }

    // 4. Log storage status for debugging
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const est = await navigator.storage.estimate()
      console.log(`[Init] Storage: ${((est.usage ?? 0) / 1024 / 1024).toFixed(2)} MB used / ${((est.quota ?? 0) / 1024 / 1024).toFixed(0)} MB quota`)
    }
  } catch (e) {
    console.error('[Init] Failed to initialize app:', e)
    // Don't throw — let the app render and show error boundary
  }
}

// Start initialization but don't block rendering for more than 1.5s
// App will show loading state until DB is ready
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
