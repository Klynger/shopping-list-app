import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // The API sets a session cookie and sends no CORS headers, so the dev server
    // proxies it to keep every request same-origin.
    proxy: {
      '/v1': {
        target: process.env.API_URL ?? 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
