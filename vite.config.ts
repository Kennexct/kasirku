import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.png', 'favicon.svg'],
      manifest: {
        name: 'KasirKu — Kasir UMKM',
        short_name: 'KasirKu',
        description: 'Kasir cepat untuk UMKM dan pedagang kaki lima',
        lang: 'id',
        start_url: '/',
        display: 'standalone',
        orientation: 'any',
        background_color: '#f7f9f8',
        theme_color: '#0b7a5a',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        navigateFallback: '/index.html',
        globPatterns: ['**/*.{js,css,html,svg,png,webp,woff2}'],
        runtimeCaching: [
          {
            // Product photos + QRIS image from Supabase Storage: available offline.
            urlPattern: ({ url }) => url.pathname.startsWith('/storage/v1/object/public/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'store-images',
              expiration: { maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
    }),
  ],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
