import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*', 'fonts/*', 'favicon.ico'],
      manifest: {
        name: 'Bejkhonda School',
        short_name: 'বেজখণ্ড',
        description: 'Offline student result, MTR and QR tracking for Bejkhonda School',
        theme_color: '#811B22',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '.',
        scope: '.',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,woff2,woff,ttf,png,svg,ico}'],
        navigateFallback: 'index.html'
      },
      devOptions: {
        enabled: false
      }
    })
  ],
  test: {
    environment: 'node',
    include: ['src/**/*.test.{js,ts}']
  }
})
