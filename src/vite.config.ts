import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
      '@/components': path.resolve(__dirname, './components'),
      '@/utils': path.resolve(__dirname, './utils'),
      '@/assets': path.resolve(__dirname, './assets'),
      '@/styles': path.resolve(__dirname, './styles'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
})