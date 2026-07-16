import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './contexts/AuthContext'
import './index.css'
import './print.css'
import { seedDatabase } from './db/seed'
import { requestPersistentStorage } from './lib/persistence'

// Seed the database on first load (only seeds when empty).
seedDatabase().catch(console.error)

// Best-effort: ask the browser to keep our IndexedDB under storage pressure.
requestPersistentStorage().catch(console.error)

const root = document.getElementById('root')
if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <BrowserRouter>
        <AuthProvider>
          <App />
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
