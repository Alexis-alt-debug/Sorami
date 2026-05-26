import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Sorami',
        short_name: 'Sorami',
        description: 'Your personal travel memory & journal app',
        theme_color: '#f0e8d8',
        background_color: '#f0e8d8',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          {
            src: 'favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Allow logo.png (>2 MB) through the precache size limit
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        // Cache all static assets and the app shell
        globPatterns: ['**/*.{js,css,html,ico,svg,png,woff2}'],
        // Network-first for API calls, cache-first for static assets
        runtimeCaching: [
          {
            // REST Countries API — cache for 24 h
            urlPattern: /^https:\/\/restcountries\.com\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'rest-countries',
              expiration: { maxEntries: 300, maxAgeSeconds: 86400 },
            },
          },
          {
            // Firestore / Firebase — always network
            urlPattern: /^https:\/\/firestore\.googleapis\.com\//,
            handler: 'NetworkOnly',
          },
        ],
      },
    }),
  ],
})
