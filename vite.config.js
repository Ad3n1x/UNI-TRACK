import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://lv3node.onrender.com',
        changeOrigin: true,
        secure: true,
      },
      '/health': {
        target: 'https://lv3node.onrender.com',
        changeOrigin: true,
        secure: true,
      },
    },
  },
})
