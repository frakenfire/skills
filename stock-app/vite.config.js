import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    // 개발 중 /api 호출을 백엔드 프록시(server/index.js)로 전달
    proxy: { '/api': 'http://localhost:8787' },
  },
  preview: {
    port: 4173,
    proxy: { '/api': 'http://localhost:8787' },
  },
  test: {
    environment: 'jsdom',
    globals: true,
  },
})
