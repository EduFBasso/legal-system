import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',   // aceita conexões da rede local (Mac, celular, etc)
    port: 5173,
    allowedHosts: ['desktop-irvt17p', 'localhost', '127.0.0.1'],
  },
  preview: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: ['desktop-irvt17p', 'localhost', '127.0.0.1'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
