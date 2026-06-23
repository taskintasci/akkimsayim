import { create } from 'zustand'
import {
  collection, collectionGroup, doc, addDoc, getDoc, getDocs, updateDoc, setDoc, deleteDoc,
  onSnapshot, orderBy, query, where, serverTimestamp, writeBatch, limit,
} from 'firebase/firestore'
import { createUserWithEmailAndPassword, signOut as secondarySignOut } from 'firebase/auth'
import { db, getSecondaryAuth } from '../firebase/index'
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

  // ── Kullanıcı profili & rol ───────────────────────────────────────────────
  userProfile: null,          // /users/{uid} dokümanı
  userRole: null,             // 'yonetici' | 'kontrolcu' | 'sayimci'
  profileLoading: false,

  // Giriş yapan kullanıcının profilini yükle (yoksa varsayılan sayımcı oluştur)
  loadUserProfile: async (user) => {
    if (!user) { set({ userProfile: null, userRole: null, profileLoading: false }); return }
    set({ profileLoading: true })
    try {
      const ref  = doc(db, 'users', user.uid)
      const snap = await getDoc(ref)
      if (snap.exists()) {
        const data = snap.data()
        set({ userProfile: { uid: user.uid, ...data }, userRole: data.rol || 'sayimci' })
      } else {
        // Bootstrap: profili olmayan kullanıcı varsayılan olarak sayımcı olur.
        // İlk yönetici, Firebase Console'da rol alanı 'yonetici' yapılarak terfi ettirilir.
        const profile = {
          email:       user.email,
          displayName: user.displayName || (user.email || '').split('@')[0],
          rol:         'sayimci',
          createdAt:   serverTimestamp(),
          createdBy:   user.uid,
        }
        await setDoc(ref, profile)
        set({ userProfile: { uid: user.uid, ...profile }, userRole: 'sayimci' })
      }
    } catch (err) {
      console.error('Profil yüklenemedi:', err)
      set({ userProfile: null, userRole: null })
    } finally {
      set({ profileLoading: false })
    }
  },

  // ── Kullanıcı yönetimi (yalnızca yönetici) ────────────────────────────────
  users: [],
  usersLoading: false,

  loadUsers: async () => {
    set({ usersLoading: true })
    try {
      const snap = await getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc')))
      set({ users: snap.docs.map(d => ({ uid: d.id, ...d.data() })) })
    } catch (err) {
      console.error('Kullanıcılar yüklenemedi:', err)
    } finally {
      set({ usersLoading: false })
    }
  },

  // Yeni kullanıcı: secondary auth ile oluştur (yöneticinin oturumu bozulmaz)
  createUserAccount: async ({ email, password, displayName, rol }) => {
    const { currentUser } = get()
    const secAuth = getSecondaryAuth()
    const cred = await createUserWithEmailAndPassword(secAuth, email, password)
    const uid  = cred.user.uid
    const profile = {
      email,
      displayName: displayName || email.split('@')[0],
      rol:         rol || 'sayimci',
      createdAt:   serverTimestamp(),
      createdBy:   currentUser?.uid || null,
    }
    await setDoc(doc(db, 'users', uid), profile)
    await secondarySignOut(secAuth)
    set(state => ({ users: [{ uid, ...profile, createdAt: new Date() }, ...state.users] }))
    return uid
  },

  updateUserRole: async (uid, rol) => {
    await updateDoc(doc(db, 'users', uid), { rol })
    set(state => ({ users: state.users.map(u => u.uid === uid ? { ...u, rol } : u) }))
  },

  // Not: Firebase Auth hesabı client'tan silinemez; yalnızca profili sileriz
  // (kullanıcı uygulamaya giremez çünkü rol/profil bulunmaz → erişim engellenir).
  deleteUserDoc: async (uid) => {
    await deleteDoc(doc(db, 'users', uid))
    set(state => ({ users: state.users.filter(u => u.uid !== uid) }))
  },

  // ── Sayımcı görevleri ─────────────────────────────────────────────────────
  gorevler: [],               // aktif kullanıcıya atanan görevler
  gorevlerLoading: false,

  // Yönetici: aktif session'daki seçili satırları bir sayımcıya ata
  assignGorev: async ({ sayimci, atananRows, sayimTipi = 'stok' }) => {
    const { activeSessionId, session, currentUser } = get()
    if (!activeSessionId) throw new Error('Aktif oturum yok')
    const data = {
      sayimciUid:   sayimci.uid,
      sayimciEmail: sayimci.email,
      sayimciAd:    sayimci.displayName || sayimci.email,
      sessionId:    activeSessionId,
      sessionType:  session.type || '',
      depoAdi:      session.depoAdi || '',
      atananRows,                       // array<rowId>
      sayimTipi:    sayimTipi || 'stok', // 'stok' | 'kor' | 'hareketlilik' | 'membran'
      durum:        'bekliyor',
      createdAt:    serverTimestamp(),
      createdBy:    currentUser?.uid || null,
    }
    const ref = await addDoc(collection(db, 'sessions', activeSessionId, 'sayimciGorevler'), data)
    return ref.id
  },

  // Sayımcı: kendisine atanan tüm görevleri (tüm oturumlardan) yükle
  loadMyGorevler: async (uid) => {
    if (!uid) return
    set({ gorevlerLoading: true })
    try {
      const snap = await getDocs(
        query(collectionGroup(db, 'sayimciGorevler'), where('sayimciUid', '==', uid))
      )
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
      set({ gorevler: list })
    } catch (err) {
      console.error('Görevler yüklenemedi:', err)
    } finally {
      set({ gorevlerLoading: false })
    }
  },

  // Yönetici/Kontrolcü önizleme: aktif oturumdaki tüm görevleri yükle
  loadSessionGorevler: async (sessionId) => {
    if (!sessionId) return
    set({ gorevlerLoading: true })
    try {
      const snap = await getDocs(
        query(collection(db, 'sessions', sessionId, 'sayimciGorevler'), orderBy('createdAt', 'desc'))
      )
      set({ gorevler: snap.docs.map(d => ({ id: d.id, ...d.data() })) })
    } catch (err) {
      console.error('Oturum görevleri yüklenemedi:', err)
    } finally {
      set({ gorevlerLoading: false })
    }
  },

  updateGorevDurum: async (sessionId, gorevId, durum) => {
    await updateDoc(doc(db, 'sessions', sessionId, 'sayimciGorevler', gorevId), { durum })
    set(state => ({ gorevler: state.gorevler.map(g => g.id === gorevId ? { ...g, durum } : g) }))
  },

  deleteGorev: async (sessionId, gorevId) => {
    await deleteDoc(doc(db, 'sessions', sessionId, 'sayimciGorevler', gorevId))
    set(state => ({ gorevler: state.gorevler.filter(g => g.id !== gorevId) }))
  },

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
  resultsLoading: false,

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

  // ── Manuel eklenen kalemler (sistemde olmayan) ────────────────────────────
  manualRows: [],
  korManualRows: [],

  // ── Navigation filter ──────────────────────────────────────────────────────
  pendingKodFilter: null,
  setPendingKodFilter: (kod) => set({ pendingKodFilter: kod }),
  clearPendingKodFilter: () => set({ pendingKodFilter: null }),

  // ── Son İşlemler event logu (in-memory) ───────────────────────────────────
  events: [],
  addEvent: (event) => set(state => ({
    events: [{ ...event, time: new Date() }, ...state.events].slice(0, 20),
  })),

  // =========================================================================
  // ACTIONS
  // =========================================================================

  setActiveSession: async (id) => {
    if (resultsUnsub) { resultsUnsub(); resultsUnsub = null }

    set({ activeSessionId: id, rows: [], results: {}, korCodes: [], korMatched: [], manualRows: [], korManualRows: [], rowsLoading: true, resultsLoading: true })

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
        const manualRows    = sessionData.manualRows    || []
        const korManualRows = sessionData.korManualRows || []
        set({ rows, korCodes, korMatched, manualRows, korManualRows })
        get().addEvent({
          icon: 'inventory_2',
          text: `Oturum açıldı: ${sessionData.type || 'Sayım'}`,
          sub: `${rows.length} kalem yüklendi`,
          badge: 'Oturum',
          badgeCls: 'bg-blue-50 text-blue-600',
          iconBg: 'bg-blue-50',
          iconColor: 'text-blue-500',
        })
      }
    }

    set({ rowsLoading: false })

    // Real-time results listener
    let firstSnapshot = true
    resultsUnsub = onSnapshot(
      collection(db, 'sessions', id, 'results'),
      (snap) => {
        const results = {}
        snap.forEach(d => { results[d.id] = d.data() })
        if (firstSnapshot) {
          firstSnapshot = false
          set({ results, resultsLoading: false })
        } else {
          set({ results })
        }
      },
      (err) => {
        console.error('Results listener hatası:', err)
        set({ resultsLoading: false })
      }
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
      manualRows:    [],
      korManualRows: [],
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

      get().addEvent({
        icon: 'upload_file',
        text: `Excel dosyası yüklendi`,
        sub: `${rows.length} kalem · ${format || ''}`,
        badge: 'Tamamlandı',
        badgeCls: 'bg-emerald-50 text-emerald-700',
        iconBg: 'bg-blue-50',
        iconColor: 'text-blue-500',
      })

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

  approveSession: async () => {
    const { activeSessionId, rows, results, currentUser } = get()
    if (!activeSessionId) return

    const countedRows = rows.filter(r => results[r.id]?.miktar !== undefined && results[r.id]?.miktar !== '')
    if (countedRows.length === 0) return

    const batch = writeBatch(db)
    countedRows.forEach(r => {
      batch.set(
        doc(db, 'sessions', activeSessionId, 'results', r.id),
        { ...results[r.id], status: 'Onaylandı', updatedBy: currentUser?.uid || null, updatedAt: serverTimestamp() },
        { merge: true }
      )
    })
    await batch.commit()

    await updateDoc(doc(db, 'sessions', activeSessionId), {
      durum: 'Tamamlandı',
      tamamlanan: countedRows.length,
      updatedAt: serverTimestamp(),
    })

    set(state => {
      const next = { ...state.results }
      countedRows.forEach(r => { next[r.id] = { ...next[r.id], status: 'Onaylandı' } })
      return {
        results: next,
        sessions: state.sessions.map(s =>
          s.id === activeSessionId ? { ...s, durum: 'Tamamlandı', tamamlanan: countedRows.length } : s
        ),
      }
    })

    get().addEvent({
      icon: 'check_circle',
      text: 'Sayım onaylandı',
      sub: `${countedRows.length} kalem onaylandı`,
      badge: 'Onaylandı',
      badgeCls: 'bg-emerald-50 text-emerald-700',
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-500',
    })
  },

  addManualRow: async (row) => {
    const { activeSessionId, manualRows } = get()
    const newRow = { ...row, id: 'manual_' + Date.now() }
    const updated = [...manualRows, newRow]
    set({ manualRows: updated })
    if (activeSessionId) {
      await updateDoc(doc(db, 'sessions', activeSessionId), {
        manualRows: updated,
        updatedAt: serverTimestamp(),
      })
    }
  },

  removeManualRow: async (id) => {
    const { activeSessionId, manualRows } = get()
    const updated = manualRows.filter(r => r.id !== id)
    set({ manualRows: updated })
    if (activeSessionId) {
      await updateDoc(doc(db, 'sessions', activeSessionId), {
        manualRows: updated,
        updatedAt: serverTimestamp(),
      })
    }
  },

  addKorManualRow: async (row) => {
    const { activeSessionId, korManualRows } = get()
    const newRow  = { ...row, id: 'kormanual_' + Date.now() }
    const updated = [...korManualRows, newRow]
    set({ korManualRows: updated })
    if (activeSessionId) {
      await updateDoc(doc(db, 'sessions', activeSessionId), {
        korManualRows: updated,
        updatedAt: serverTimestamp(),
      })
    }
  },

  removeKorManualRow: async (id) => {
    const { activeSessionId, korManualRows } = get()
    const updated = korManualRows.filter(r => r.id !== id)
    set({ korManualRows: updated })
    if (activeSessionId) {
      await updateDoc(doc(db, 'sessions', activeSessionId), {
        korManualRows: updated,
        updatedAt: serverTimestamp(),
      })
    }
  },

  deleteSession: async (id) => {
    await deleteDoc(doc(db, 'sessions', id))
    set(state => ({
      sessions: state.sessions.filter(s => s.id !== id),
    }))
  },

  clearRows: async () => {
    const { activeSessionId } = get()
    set({ rows: [], results: {}, importFormat: null })
    if (activeSessionId) {
      await updateDoc(doc(db, 'sessions', activeSessionId), {
        rowsUploaded: false,
        kalemSayisi: 0,
        updatedAt: serverTimestamp(),
      })
      set(state => ({
        sessions: state.sessions.map(s =>
          s.id === activeSessionId ? { ...s, rowsUploaded: false, kalemSayisi: 0 } : s
        ),
      }))
    }
  },

  reset: () => {
    if (resultsUnsub) { resultsUnsub(); resultsUnsub = null }
    set({ rows: [], results: {}, korCodes: [], korMatched: [] })
  },
}))

export const ROLE_LABELS = {
  yonetici:  'Yönetici',
  kontrolcu: 'Kontrolcü',
  sayimci:   'Sayımcı',
}

export default useStore
