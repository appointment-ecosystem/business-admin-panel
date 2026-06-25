import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // manifest.json zaten public/ klasöründe, biz yönetiyoruz
      manifest: false,
      // Service Worker: sadece installable PWA, offline-first değil
      workbox: {
        // Uygulama kabuğunu (App Shell) önbelleğe al
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // API isteklerini önbelleğe ALMA — her zaman ağdan çek
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api/],
        runtimeCaching: [
          {
            // Statik assetler: önce önbellek, yoksa ağ
            urlPattern: /\.(js|css|png|svg|woff2|ico)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'static-assets-v1',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 7 * 24 * 60 * 60, // 7 gün
              },
            },
          },
        ],
      },
      devOptions: {
        // Geliştirme ortamında PWA'yı etkinleştir (test için)
        enabled: false,
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
