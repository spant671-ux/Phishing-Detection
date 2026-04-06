import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000,
  },
  build: {
    outDir: '../Extension/popup-dist',
    rollupOptions: {
      input: 'index.html',
      output: {
        entryFileNames: 'popup-bundle.js',
        chunkFileNames: 'popup-[name].js',
        assetFileNames: 'popup-[name].[ext]'
      }
    }
  }
})