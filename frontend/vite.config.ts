import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  optimizeDeps: {
    include: ['shared']
  },
  build: {
    commonjsOptions: { exclude: ['shared'], include: [] }
  },
  plugins: [vue()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000/'
      }
    }
  }
})
