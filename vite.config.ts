import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false,
      manifest: {
        name: '饮品记账本',
        short_name: '饮品记账',
        description: '个人咖啡 / 奶茶咖啡因与营养追踪工具',
        theme_color: '#8B6914',
        background_color: '#FFF8E7',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: './',
        start_url: './',
        lang: 'zh-CN',
        icons: [
          { src: 'icons/icon-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-384x384.png', sizes: '384x384', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icons/maskable-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: 'icons/maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          echarts: ['echarts/core', 'echarts/charts', 'echarts/components', 'echarts/renderers'],
          data: ['dexie', 'zustand'],
        },
      },
    },
  },
  server: {
    port: 5173,
    host: true,
    watch: {
      ignored: ['**/.tmp/**', '**/dist/**'],
    },
  },
})