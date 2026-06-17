import { create } from 'zustand'
import { parseExcelFile } from '../utils/excelImport'

const useStore = create((set, get) => ({
  // Yüklenen Excel satırları
  rows: [],

  // Sayım sonuçları: { [rowId]: { miktar, notlar, status } }
  results: {},

  // Sayım oturumu bilgileri
  session: {
    depoAdi: '901 ALİŞAN DEPO',
    sayimBasligi: 'YIL SONU SAYIM',
    tarih: new Date().toISOString().slice(0, 10),
    sorumlu: '',
    tur: 1,
  },

  // Excel import
  importRows: async (file) => {
    if (!file) {
      set({ rows: [], results: {} })
      return
    }
    try {
      const rows = await parseExcelFile(file)
      set({ rows, results: {} })
    } catch (err) {
      console.error('Excel import hatası:', err)
      alert('Excel dosyası okunamadı. Lütfen Sku_Sayım_Listesi.xlsx formatında bir dosya seçin.')
    }
  },

  // Tek satır sonucu güncelle
  updateResult: (id, partial) =>
    set(state => ({
      results: {
        ...state.results,
        [id]: { ...state.results[id], ...partial },
      },
    })),

  // Session güncelle
  setSession: (partial) =>
    set(state => ({ session: { ...state.session, ...partial } })),

  // Toplu durum güncelle
  bulkSetStatus: (ids, status) =>
    set(state => {
      const next = { ...state.results }
      ids.forEach(id => { next[id] = { ...next[id], status } })
      return { results: next }
    }),

  // Reset
  reset: () => set({ rows: [], results: {} }),
}))

export default useStore
