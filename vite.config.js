import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // Göreceli base: assetler index.html'e göre çözülür. Böylece hem
  // GitHub Pages (/akkimsayim/) hem Firebase (root) tek build ile çalışır.
  // Uygulama URL tabanlı yönlendirme kullanmıyor (state-based onNavigate),
  // bu yüzden göreceli yollar güvenli.
  base: './',
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
