import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The backend base URL. In production, axios uses VITE_API_URL from .env directly
// (via import.meta.env) and never goes through this proxy. The proxy only applies
// during local `vite dev` and only if you make requests to a relative /api path.
//
// FIX 4: process.env.VITE_API_URL is undefined at vite config execution time.
// Vite env vars (VITE_*) are only injected into the browser bundle via
// import.meta.env — they are NOT available on process.env in vite.config.js.
// The proxy target was always falling back to localhost:5000.
//
// FIX 5: Added a rewrite rule. The backend mounts routes at / (not /api):
// /business, /dashboard, /admin. Without the rewrite, a request to /api/business
// would proxy to backend /api/business which 404s.
const BACKEND_URL = 'https://web-production-32cc.up.railway.app'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: BACKEND_URL,
        changeOrigin: true,
        // Strip the /api prefix so /api/business/:id → /business/:id on the backend
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
