import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // '/api'로 시작하는 모든 요청을 아래의 target 주소로 전달합니다.
      '/api': {
        target: 'http://localhost:4000', // 백엔드 서버 주소
        changeOrigin: true, // CORS 에러 방지를 위해 필요합니다.
      },
    },
  },
})