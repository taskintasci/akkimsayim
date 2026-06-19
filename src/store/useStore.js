import { create } from 'zustand'
import {
  collection, doc, addDoc, getDocs, updateDoc, setDoc,
  onSnapshot, orderBy, query, serverTimestamp, writeBatch, limit,
} from 'firebase/firestore'
import { db } from '../firebase/index'
import { parseExcelFile } from '../utils/excelImport'
import { uploadRows, downloadRows } from '../firebase/rowStorage'

// ─── Debounce map: keystroke → Firestore write ────────────────────────────
const writeTimers = new Map()

// ─── Real-time results unsubscribe handle ─────────────────────────────────
let resultsUnsub = null

const useStore = create((set, get) => ({
  // ── Auth ──────────────────────────────────────────────────────────────────
  currentUser: null,
  setCurrentUser: (user) => set({ currentUser: user }),

  // ── Sessions ──────────────────────────────────────────────────────────────
  sessions: [],
  activeSessionId: null,
  sessionsLoading: false,

  loadSessions: async () => {
    set({ sessionsLoading: true })
    try {
      const snap = await getDocs(
        query(collection(db, 'sessions'), orderBy('createdAt', 'desc'), limit(30))
      )
      set({ sessions: snap.docs.map(d => ({ id: d.id, ...d.data() })) })
    } catch (err) {
      console.error('Sessions yüklenemedi:', err)
    } finally {
      set({ sessionsLoading: false })
    }
  },

  // ── Excel rows (yerel bellek + Storage) ───────────────────────────────────
  rows: [],
  importFormat: null,
  rowsLoading: false,

  // ── Sayım sonuçları ───────────────────────────────────────────────────────
  results: {},

  // ── Aktif session bilgisi ─────────────────────────────────────────────────
  session: {
    type: 'Yıl Sonu Sayımı',
    depoAdi: '',
    sayimBasligi: 'YIL SONU SAYIM',
    tarih: new Date().toISOString().slice(0, 10),
    sorumlu: '',
    tur: 1,
  },

  // ── Kör Sayım listesi ─────────────────────────────────────────────────────
  korCodes: [],
  korMatched: [],

  // ── Navigation filter ──────────────────────────────────────────────────────
  pendingKodFilter: null,
  setPendingKodFilter: (kod) => set({ pendingKodFilter: kod }),
  clearPendingKodFilter: () => set({ pendingKodFilter: null }),

  // =========================================================================
  // ACTIONS
  // =========================================================================

  setActiveSession: async (id) => {
    if (resultsUnsub) { resultsUnsub(); resultsUnsub = null }

    set({ activeSessionId: id, rows: [], results: {}, korCodes: [], korMatched: [], rowsLoading: true })

    const sessionData = get().sessions.find(s => s.id === id)
    if (sessionData) {
      set({
        session: {
          type:         sessionData.type || 'Yıl Sonu Sayımı',
          depoAdi:      sessionData.depoAdi || '',
          sayimBasligi: sessionData.sayimBasligi || sessionData.type || 'YIL SONU SAYIM',
          tarih:        sessionData.tarih || new Date().toISOString().slice(0, 10),
          sorumlu:      '',
          tur:          sessionData.tur || 1,
        },
      })

      if (sessionData.rowsUploaded) {
        const rows = await downloadRows(id)
        const korCodes = sessionData.korCodes || []
        const korMatched = korCodes.length > 0 ? rows.filter(r => korCodes.includes(r.kod)) : []
        set({ rows, korCodes, korMatched })
      }
    }

    set({ rowsLoading: false })

    // Real-time results listener
    resultsUnsub = onSnapshot(
      collection(db, 'sessions', id, 'results'),
      (snap) => {
        const results = {}
        snap.forEach(d => { results[d.id] = d.data() })
        set({ results })
      },
      (err) => console.error('Results listener hatası:', err)
    )
  },

  createSession: async (partial) => {
    const { currentUser } = get()
    const data = {
      type:         partial.type || 'Yıl Sonu Sayımı',
      depoAdi:      partial.depoAdi || '',
      sayimBasligi: partial.type || 'YIL SONU SAYIM',
      tarih:        partial.tarih || new Date().toISOString().slice(0, 10),
      durum:        'Devam',
      kalemSayisi:  0,
      tamamlanan:   0,
      fark:         0,
      tur:          1,
      rowsUploaded: false,
      createdBy:    currentUser?.uid || null,
      createdAt:    serverTimestamp(),
    }

    const docRef = await addDoc(collection(db, 'sessions'), data)

    const newSession = { id: docRef.id, ...data, createdAt: new Date() }
    set(state => ({
      sessions:      [newSession, ...state.sessions],
      activeSessionId: docRef.id,
      rows:          [],
      results:       {},
      korCodes:      [],
      korMatched:    [],
      session: {
        type:         data.type,
        depoAdi:      data.depoAdi,
        sayimBasligi: data.sayimBasligi,
        tarih:        data.tarih,
        sorumlu:      '',
        tur:          1,
      },
    }))

    return docRef.id
  },

  // ── Excel import → parse + Storage upload ─────────────────────────────────
  importRows: async (file) => {
    if (!file) {
      set({ rows: [], results: {}, importFormat: null })
      return
    }
    try {
      const { rows, format } = await parseExcelFile(file)
      set({ rows, results: {}, importFormat: format })

      const { activeSessionId } = get()
      if (activeSessionId) {
        await uploadRows(activeSessionId, rows)
        await updateDoc(doc(db, 'sessions', activeSessionId), {
          rowsUploaded: true,
          kalemSayisi:  rows.length,
          importFormat: format,
          updatedAt:    serverTimestamp(),
        })
        set(state => ({
          sessions: state.sessions.map(s =>
            s.id === activeSessionId
              ? { ...s, rowsUploaded: true, kalemSayisi: rows.length }
              : s
          ),
        }))
      }
    } catch (err) {
      console.error('Excel import hatası:', err)
      alert('Excel dosyası okunamadı.\nDesteklenen formatlar: RAPOR5.xls veya Sku_Sayım_Listesi.xlsx')
    }
  },

  // ── Tek satır güncelle (debounced Firestore write) ────────────────────────
  updateResult: (id, partial) => {
    set(state => ({
      results: { ...state.results, [id]: { ...state.results[id], ...partial } },
    }))

    const { activeSessionId, currentUser } = get()
    if (!activeSessionId) return

    if (writeTimers.has(id)) clearTimeout(writeTimers.get(id))
    writeTimers.set(id, setTimeout(async () => {
      const result = get().results[id] || {}
      await setDoc(
        doc(db, 'sessions', activeSessionId, 'results', id),
        { ...result, updatedBy: currentUser?.uid || null, updatedAt: serverTimestamp() },
        { merge: true }
      )
      writeTimers.delete(id)
    }, 600))
  },

  // ── Sistem miktarından toplu doldur ───────────────────────────────────────
  fillFromSistem: async (targetRows) => {
    const { activeSessionId, currentUser } = get()

    set(state => {
      const next = { ...state.results }
      targetRows.forEach(r => { next[r.id] = { ...next[r.id], miktar: r.sayim } })
      return { results: next }
    })

    if (activeSessionId && targetRows.length > 0) {
      const batch = writeBatch(db)
      targetRows.forEach(r => {
        batch.set(
          doc(db, 'sessions', activeSessionId, 'results', r.id),
          { miktar: r.sayim, updatedBy: currentUser?.uid || null, updatedAt: serverTimestamp() },
          { merge: true }
        )
      })
      await batch.commit()
    }
  },

  setSession: (partial) =>
    set(state => ({ session: { ...state.session, ...partial } })),

  bulkSetStatus: (ids, status) =>
    set(state => {
      const next = { ...state.results }
      ids.forEach(id => { next[id] = { ...next[id], status } })
      return { results: next }
    }),

  addKorCodes: (newCodes) => {
    const state   = get()
    const merged  = [...new Set([...state.korCodes, ...newCodes.map(c => c.trim()).filter(Boolean)])]
    const matched = state.rows.filter(r => merged.includes(r.kod))
    set({ korCodes: merged, korMatched: matched })
    if (state.activeSessionId)
      updateDoc(doc(db, 'sessions', state.activeSessionId), { korCodes: merged }).catch(console.error)
  },
  removeKorCode: (code) => {
    const state   = get()
    const updated = state.korCodes.filter(c => c !== code)
    const matched = state.rows.filter(r => updated.includes(r.kod))
    set({ korCodes: updated, korMatched: matched })
    if (state.activeSessionId)
      updateDoc(doc(db, 'sessions', state.activeSessionId), { korCodes: updated }).catch(console.error)
  },
  setKorMatched: (rows) => set({ korMatched: rows }),
  clearKor: () => {
    const { activeSessionId } = get()
    set({ korCodes: [], korMatched: [] })
    if (activeSessionId)
      updateDoc(doc(db, 'sessions', activeSessionId), { korCodes: [] }).catch(console.error)
  },

  reset: () => {
    if (resultsUnsub) { resultsUnsub(); resultsUnsub = null }
    set({ rows: [], results: {}, korCodes: [], korMatched: [] })
  },
}))

export default useStore
