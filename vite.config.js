import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
  ],
  server: {
    host: "0.0.0.0",
    port: 3000,
    proxy: {
      '/api': {
        target: 'https://vrpfuugumlym.sealoshzh.site',
        changeOrigin: true,
      },
      '/media': {
        target: 'https://vrpfuugumlym.sealoshzh.site',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/media/, '/media'),
        headers: {
          'Referer': 'https://vrpfuugumlym.sealoshzh.site'
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})
