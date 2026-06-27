import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  // GitHub Pages 등 하위 경로 배포 시 VITE_BASE=/skills/ 로 빌드
  base: process.env.VITE_BASE || '/',
  define: {
    // 백엔드 프록시 사용 여부. dev는 기본 on, 정적 빌드(Pages)는 off → 콘솔 깨끗.
    // 백엔드와 함께 셀프호스팅하려면 VITE_API=1 로 빌드.
    'import.meta.env.VITE_API': JSON.stringify(
      process.env.VITE_API ?? (command === 'serve' ? '1' : ''),
    ),
  },
  server: {
    host: true,
    port: 5173,
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
}))
