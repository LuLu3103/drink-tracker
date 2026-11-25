import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

/**
 * 单文件离线构建：
 * - 输出一个经典 IIFE 脚本（file:// 下 ES module 会被 CORS 拦截）
 * - 数据层换成 localStorage 实现（file:// 下 IndexedDB 不可靠）
 */
export default defineConfig({
  base: './',
  plugins: [react()],
  resolve: {
    alias: [
      { find: /^@\/db$/, replacement: fileURLToPath(new URL('./src/db/offline.ts', import.meta.url)) },
      { find: /^dexie$/, replacement: fileURLToPath(new URL('./src/db/dexie-stub.ts', import.meta.url)) },
      { find: '@', replacement: fileURLToPath(new URL('./src', import.meta.url)) },
    ],
  },
  build: {
    outDir: 'dist-offline',
    emptyOutDir: true,
    target: 'es2019',
    cssCodeSplit: false,
    assetsInlineLimit: 100000000,
    modulePreload: false,
    rollupOptions: {
      input: fileURLToPath(new URL('./src/main-offline.tsx', import.meta.url)),
      output: {
        format: 'iife',
        inlineDynamicImports: true,
        name: 'DrinkDiary',
        entryFileNames: 'app.js',
        assetFileNames: 'app.[ext]',
      },
    },
  },
})
