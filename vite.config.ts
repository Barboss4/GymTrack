import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  // Caminhos relativos permitem publicar em qualquer subpasta do GitHub Pages.
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      // Mantém somente o service worker/cache. O site não solicita instalação.
      manifest: false,
      workbox: { navigateFallback: 'index.html' }
    })
  ],
  test: { environment: 'jsdom', setupFiles: ['./src/test/setup.ts'] }
})
