import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// When VITE_API_URL is unset, /api is proxied here. Prefer frontend/.env.development (VITE_API_URL=http://localhost:5000)
// to call the API directly and avoid rare POST/proxy issues. See Properties/launchSettings.json for ports.
const apiProxyTarget = process.env.VITE_API_PROXY_TARGET ?? 'http://localhost:5000'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: false,
    proxy: {
      '/api': {
        target: apiProxyTarget,
        changeOrigin: true,
      },
      '/hubs': {
        target: apiProxyTarget,
        changeOrigin: true,
        ws: true,
      },
    },
  },
})
