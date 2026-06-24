import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/akkimsayim/',
  plugins: [react()],
  css: {
    transformer: 'postcss',
  },
  build: {
    target: 'es2020',
    rollupOptions: {
      output: {
        // rolldown (Vite 8) function form gerektirir
        manualChunks(id) {
          if (id.includes('node_modules/firebase')) return 'firebase'
          if (id.includes('node_modules/xlsx') || id.includes('node_modules/exceljs')) return 'excel'
        },
      },
    },
  },
})
