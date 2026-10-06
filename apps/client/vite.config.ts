import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react()],
  server: {
    port: 8484,
    strictPort: true,
    proxy: {
      '/aws-events': {
        target: 'https://api.awsevents.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/aws-events/, ''),
      },
    },
  },
  test: {
    globals: true,
    include: ["src/**/*.test.{ts,tsx}"],
    exclude: ["**/node_modules/**", "**/dist/**"],
  },
})
