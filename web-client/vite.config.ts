import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: Number(process.env.PORT) || 4302,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:4301',
        changeOrigin: true,
        secure: false
      }
    },
    cors: true,
    hmr: {
      host: 'localhost',
      port: Number(process.env.PORT) || 4302
    }
  }
})
