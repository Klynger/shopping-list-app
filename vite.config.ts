import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // The empty prefix loads every variable, not only VITE_ ones. API_URL is read
  // here by the dev server and never reaches the browser bundle.
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    server: {
      // The API sets a session cookie and sends no CORS headers, so the dev server
      // proxies it to keep every request same-origin.
      proxy: {
        '/v1': {
          target: env.API_URL,
          changeOrigin: true,
        },
      },
    },
  }
})
