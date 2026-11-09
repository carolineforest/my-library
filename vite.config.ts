/// <reference types="vitest/config" />
// Build settings for the app. `base` must match the GitHub repository name
// because GitHub Pages serves the site at https://<user>.github.io/my-library/.
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

const REPO_NAME = 'my-library';

export default defineConfig({
  // Shown in Settings → About, so you can tell which version is running.
  define: { __APP_VERSION__: JSON.stringify(new Date().toISOString().slice(0, 16).replace('T', ' ')) },
  base: `/${REPO_NAME}/`,
  plugins: [
    react(),
    VitePWA({
      // "prompt" = never reload by itself; we show "Update available" instead.
      registerType: 'prompt',
      includeAssets: ['apple-touch-icon.png', 'favicon.svg'],
      manifest: {
        name: 'My Library',
        short_name: 'Library',
        description: 'Track the physical books I own, read, lend and want to buy.',
        theme_color: '#f6f0e6',
        background_color: '#f6f0e6',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '.',
        scope: '.',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        runtimeCaching: [
          {
            // Book covers: keep a copy on the phone so they load fast and offline.
            urlPattern: ({ url }) =>
              url.hostname === 'covers.openlibrary.org' ||
              url.hostname.endsWith('archive.org') ||
              url.hostname === 'books.google.com' ||
              url.hostname.endsWith('googleusercontent.com'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'book-covers',
              expiration: { maxEntries: 3000, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Google Fonts (headings + body text).
            urlPattern: ({ url }) =>
              url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com',
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'fonts', cacheableResponse: { statuses: [0, 200] } },
          },
        ],
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    setupFiles: ['src/test/setup.ts'],
  },
});
