import { useState, useEffect, useMemo, useRef } from 'react'
import { signOut } from 'firebase/auth'
import { auth } from '../../firebase/index'
import useStore from '../../store/useStore'

// ── Atanan satırları sıralama seçenekleri ──────────────────────────────────
const SIRA_SECENEK = [
  { id: 'adres', label: 'Raf Sırası', icon: 'shelves' },
  { id: 'ad',    label: 'Ürün Adı',   icon: 'sort_by_alpha' },
  { id: 'kod',   label: 'Ürün Kodu',  icon: 'tag' },
]

function siralaRows(rows, sira) {
  const arr = [...rows]
  if (sira === 'adres') arr.sort((a, b) => (a.adres || '').localeCompare(b.adres || '', 'tr'))
  if (sira === 'ad')    arr.sort((a, b) => (a.ad || '').localeCompare(b.ad || '', 'tr'))
  if (sira === 'kod')   arr.sort((a, b) => (a.kod || '').localeCompare(b.kod || '', 'tr'))
  return arr
}

function siralamaMembran(rows) {
  return [...rows].sort((a, b) => {
    const pa = (a.partiEk || '').localeCompare(b.partiEk || '', 'tr', { numeric: true })
    if (pa !== 0) return pa
    return (a.adres || '').localeCompare(b.adres || '', 'tr')
  })
}

// ═══════════════════════════════════════════════════════════════════════════
// Swipe kart — sağa kaydır = onayla, sola kaydır = eksik/fazla gir
// ═══════════════════════════════════════════════════════════════════════════
function SwipeCard({ row, sayilanMiktar, onConfirm, onEdit, isMembran }) {
  const [dx, setDx] = useState(0)
  const startX = useRef(null)
  const TH = 90

  function onStart(clientX) { startX.current = clientX }
  function onMove(clientX) {
    if (startX.current == null) return
    setDx(clientX - startX.current)
  }
  function onEnd() {
    if (startX.current == null) return
    if (dx > TH)  onConfirm()
    else if (dx < -TH) onEdit()
    setDx(0)
    startX.current = null
  }

  const bg = dx > 40 ? 'rgba(16,185,129,0.18)' : dx < -40 ? 'rgba(245,158,11,0.18)' : 'rgba(255,255,255,0.05)'

  return (
    <div className="relative w-full max-w-md select-none" style={{ touchAction: 'pan-y' }}>
      <div className="absolute inset-0 flex items-center justify-between px-6 pointer-events-none">
        <span className="ms text-amber-400" style={{ fontSize: 40, opacity: dx < -40 ? 1 : 0.25 }}>edit_note</span>
        <span className="ms text-emerald-400" style={{ fontSize: 40, opacity: dx > 40 ? 1 : 0.25 }}>check_circle</span>
      </div>

      <div
        onTouchStart={e => onStart(e.touches[0].clientX)}
        onTouchMove={e => onMove(e.touches[0].clientX)}
        onTouchEnd={onEnd}
        onMouseDown={e => onStart(e.clientX)}
        onMouseMove={e => startX.current != null && onMove(e.clientX)}
        onMouseUp={onEnd}
        onMouseLeave={() => { if (startX.current != null) onEnd() }}
        className="relative rounded-3xl border border-white/15 p-7 shadow-2xl cursor-grab active:cursor-grabbing"
        style={{
          transform: `translateX(${dx}px) rotate(${dx * 0.03}deg)`,
          transition: startX.current == null ? 'transform 0.25s ease' : 'none',
          background: bg,
          backdropFilter: 'blur(8px)',
        }}
      >
        {/* Palet rozeti — sadece membran */}
        {isMembran && row.partiEk && (
          <div className="flex items-center gap-2 mb-3">
            <span className="ms text-purple-300" style={{ fontSize: 18 }}>layers</span>
            <span className="text-purple-200 font-semibold text-sm mono">{row.partiEk}</span>
          </div>
        )}

        {/* Raf / Adres */}
        <div className="flex items-center gap-2 mb-5">
          <span className="ms text-blue-300" style={{ fontSize: 26 }}>shelves</span>
          <span className="text-blue-200 font-bold tracking-tight mono" style={{ fontSize: 30 }}>
            {row.adres || '—'}
          </span>
        </div>

        {/* Ürün adı */}
        <p className="text-white font-extrabold leading-tight mb-3" style={{ fontSize: 30 }}>
          {row.ad || '—'}
        </p>

        {/* Kod + parti + durum */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-6">
          <span className="text-slate-300 mono" style={{ fontSize: 18 }}>{row.kod}</span>
          {row.parti && <span className="text-slate-400 mono text-sm">Parti: {row.parti}</span>}
          {row.durum && <span className="text-slate-400 text-sm">{row.durum}</span>}
        </div>

        {/* Sistem miktarı + sayılan */}
        <div className="flex items-end justify-between bg-black/20 rounded-2xl px-5 py-4">
          <div>
            <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Sistem Miktarı</p>
            <p className="text-white font-bold" style={{ fontSize: 34 }}>
              {row.sayim ?? '—'} <span className="text-slate-400 text-lg font-normal">{row.birim}</span>
            </p>
          </div>
          {sayilanMiktar !== undefined && sayilanMiktar !== '' && (
            <div className="text-right">
              <p className="text-emerald-300 text-xs uppercase tracking-wide mb-1">Sayılan</p>
              <p className="text-emerald-200 font-bold" style={{ fontSize: 28 }}>{sayilanMiktar}</p>
            </div>
          )}
        </div>
      </div>

      {/* Butonlar */}
      <div className="flex gap-3 mt-5">
        <button
          onClick={onEdit}
          className="flex-1 py-4 rounded-2xl bg-amber-500/90 hover:bg-amber-500 text-white font-bold text-lg flex items-center justify-center gap-2"
        >
          <span className="ms" style={{ fontSize: 24 }}>edit_note</span> Eksik / Fazla
        </button>
        <button
          onClick={onConfirm}
          className="flex-1 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-lg flex items-center justify-center gap-2"
        >
          <span className="ms" style={{ fontSize: 24 }}>check</span> Onayla
        </button>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
export default function SayimciEkran({ mode = 'self' }) {
  const {
    currentUser, userProfile, userRole,
    gorevler, gorevlerLoading, loadMyGorevler, loadSessionGorevler, updateGorevDurum, deleteGorev,
    activeSessionId, rows, rowsLoading, results, updateResult,
    manualRows, addManualRow, korManualRows, addKorManualRow,
  } = useStore()

  const setActiveSession = useStore(s => s.setActiveSession)

  const [view, setView]       = useState('gorevler')  // gorevler | liste | sayim | ozet
  const [gorev, setGorev]     = useState(null)
  const [sira, setSira]       = useState('adres')
  const [deletingId, setDeletingId] = useState(null)
  const [idx, _setIdx]        = useState(0)
  const idxRef                = useRef(0)
  const confirmingRef         = useRef(false)
  const [editing, setEditing] = useState(false)
  const [editVal, setEditVal] = useState('')
  const [editNote, setEditNote] = useState('')
  const [manuelOpen, setManuelOpen] = useState(false)

  function setIdx(n) { idxRef.current = n; _setIdx(n) }

  // Görevleri yükle
  useEffect(() => {
    if (mode === 'preview') loadSessionGorevler(activeSessionId)
    else if (currentUser?.uid) loadMyGorevler(currentUser.uid)
  }, [mode, currentUser?.uid, activeSessionId])

  const isMembran = gorev?.sayimTipi === 'membran'
  const isKor     = gorev?.sayimTipi === 'kor'

  // Atanan satırları sırala
  const atanan = useMemo(() => {
    if (!gorev) return []
    const ids = gorev.atananRows || []
    const base = ids.length > 0 ? rows.filter(r => ids.includes(r.id)) : rows
    if (isMembran) return siralamaMembran(base)
    return siralaRows(base, sira)
  }, [gorev, rows, sira, isMembran])

  const sayilanAdet = useMemo(() =>
    atanan.filter(r => { const m = results[r.id]?.miktar; return m !== undefined && m !== '' }).length,
    [atanan, results]
  )

  // Membran: palet grupları (for liste view)
  const membranGruplar = useMemo(() => {
    if (!isMembran) return []
    const map = new Map()
    atanan.forEach(r => {
      const key = r.partiEk?.trim() || '(Palet Yok)'
      if (!map.has(key)) map.set(key, [])
      map.get(key).push(r)
    })
    return [...map.entries()]
  }, [atanan, isMembran])

  async function openGorev(g) {
    setGorev(g)
    setIdx(0)
    if (mode === 'self' && g.sessionId !== activeSessionId) {
      await setActiveSession(g.sessionId)
    }
    setView('liste')
  }

  function basla() {
    const firstUncounted = atanan.findIndex(r => {
      const m = results[r.id]?.miktar
      return m === undefined || m === ''
    })
    // Hepsi sayıldıysa özete git
    if (firstUncounted === -1) { setView('ozet'); return }
    setIdx(firstUncounted)
    setView('sayim')
  }

  const current = atanan[idxRef.current]

  function ilerle() {
    setEditing(false)
    // idxRef kullan (stale closure olmaz)
    let nextIdx = -1
    for (let i = idxRef.current + 1; i < atanan.length; i++) {
      const m = results[atanan[i].id]?.miktar
      if (m === undefined || m === '') { nextIdx = i; break }
    }
    if (nextIdx === -1) {
      setView('ozet')
      if (mode === 'self' && gorev) updateGorevDurum(gorev.sessionId, gorev.id, 'tamamlandi')
    } else {
      setIdx(nextIdx)
    }
    setTimeout(() => { confirmingRef.current = false }, 80)
  }

  function onayla() {
    if (!current || confirmingRef.current) return
    confirmingRef.current = true
    updateResult(current.id, {
      miktar: current.sayim,
      status: 'Sayıldı',
      notlar: results[current.id]?.notlar || '',
    })
    ilerle()
  }

  function editAc() {
    if (!current) return
    setEditVal(results[current.id]?.miktar ?? '')
    setEditNote(results[current.id]?.notlar ?? '')
    setEditing(true)
  }

  function editKaydet() {
    if (!current || confirmingRef.current) return
    confirmingRef.current = true
    updateResult(current.id, {
      miktar: editVal === '' ? '' : Number(editVal),
      status: 'Sayıldı',
      notlar: editNote,
    })
    ilerle()
  }

  // Manuel modal için doğru store fonksiyonu
  const manuelAddFn  = isKor ? addKorManualRow : addManualRow
  const manuelRows   = isKor ? korManualRows    : manualRows

  // ─── GÖREV LİSTESİ ───────────────────────────────────────────────────────
  if (view === 'gorevler') {
    return (
      <Shell mode={mode} title="Sayım Görevlerim" subtitle={userProfile?.displayName || currentUser?.email}>
        {gorevlerLoading ? (
          <Loading />
        ) : (mode === 'self' ? gorevler.filter(g => g.durum !== 'tamamlandi') : gorevler).length === 0 ? (
          <Empty
            icon="assignment_late"
            title="Henüz görev yok"
            text={mode === 'preview'
              ? 'Bu oturumda sayımcıya atanmış görev bulunmuyor.'
              : 'Size atanmış bir sayım görevi bulunmuyor. Yöneticiniz görev atadığında burada görünür.'}
          />
        ) : (
          <div className="flex flex-col gap-3 w-full max-w-md">
            {(mode === 'self' ? gorevler.filter(g => g.durum !== 'tamamlandi') : gorevler).map(g => {
              const ids = g.atananRows || []
              const counted = g.sessionId === activeSessionId
                ? ids.filter(id => { const m = results[id]?.miktar; return m !== undefined && m !== '' }).length
                : null
              const isDeleting = deletingId === g.id

              return (
                <div key={g.id} className="rounded-2xl border border-white/15 bg-white/5 p-5">
                  {/* Silme onayı */}
                  {isDeleting ? (
                    <div className="flex items-center justify-between">
                      <p className="text-white text-sm font-semibold">Bu görevi silmek istediğinizden emin misiniz?</p>
                      <div className="flex items-center gap-2 ml-3 shrink-0">
                        <button
                          onClick={async () => { await deleteGorev(g.sessionId, g.id); setDeletingId(null) }}
                          className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold rounded-lg"
                        >
                          Sil
                        </button>
                        <button
                          onClick={() => setDeletingId(null)}
                          className="px-3 py-1 text-slate-300 hover:text-white text-xs rounded-lg border border-white/20"
                        >
                          İptal
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-1">
                        <button className="flex-1 text-left" onClick={() => openGorev(g)}>
                          <span className="text-white font-bold text-lg">{g.depoAdi || g.sessionType || 'Sayım'}</span>
                        </button>
                        <div className="flex items-center gap-2 shrink-0">
                          <DurumRozet durum={g.durum} />
                          {userRole === 'yonetici' && (
                            <button
                              onClick={() => setDeletingId(g.id)}
                              className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                              title="Görevi Sil"
                            >
                              <span className="ms" style={{ fontSize: 17 }}>delete</span>
                            </button>
                          )}
                        </div>
                      </div>
                      <button className="w-full text-left" onClick={() => openGorev(g)}>
                        <p className="text-slate-300 text-sm mb-2">{g.sessionType}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-slate-400 text-sm">
                            <span className="ms" style={{ fontSize: 18 }}>inventory_2</span>
                            {ids.length} kalem
                            {g.sayimTipi === 'membran' && (
                              <span className="ms text-purple-300 ml-1" style={{ fontSize: 16 }}>layers</span>
                            )}
                            {g.sayimTipi === 'kor' && (
                              <span className="ms text-amber-300 ml-1" style={{ fontSize: 16 }}>visibility_off</span>
                            )}
                          </div>
                          {counted !== null && (
                            <span className={
                              'text-sm font-semibold ' +
                              (counted === ids.length ? 'text-emerald-300' : 'text-blue-300')
                            }>
                              {counted}/{ids.length} sayıldı
                            </span>
                          )}
                        </div>
                        {counted !== null && ids.length > 0 && (
                          <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className="h-1.5 bg-emerald-400 transition-all"
                              style={{ width: `${(counted / ids.length) * 100}%` }}
                            />
                          </div>
                        )}
                      </button>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </Shell>
    )
  }

  // ─── ATANAN LİSTE + SIRALAMA + SAYIMA BAŞLA ───────────────────────────────
  if (view === 'liste') {
    return (
      <Shell
        mode={mode}
        title={gorev?.depoAdi || 'Sayım Listesi'}
        subtitle={`${atanan.length} kalem · ${sayilanAdet} sayıldı`}
        onBack={() => { setView('gorevler'); setGorev(null) }}
      >
        {rowsLoading ? <Loading /> : (
          <div className="w-full max-w-md flex flex-col">
            {/* Sıralama — membran'da gizle (partiEk+adres sırasına kilitli) */}
            {!isMembran && (
              <div className="flex items-center gap-2 mb-3">
                <span className="text-slate-400 text-sm shrink-0">Sırala:</span>
                {SIRA_SECENEK.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setSira(s.id)}
                    className={
                      'flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-all ' +
                      (sira === s.id ? 'bg-blue-600 text-white font-semibold' : 'bg-white/5 text-slate-300 hover:bg-white/10')
                    }
                  >
                    <span className="ms" style={{ fontSize: 16 }}>{s.icon}</span> {s.label}
                  </button>
                ))}
              </div>
            )}

            {/* Ürün listesi — membran'da partiEk gösterilir */}
            <div className="rounded-2xl border border-white/10 overflow-hidden divide-y divide-white/5 mb-4 max-h-[55vh] overflow-y-auto">
              {atanan.map((r, i) => <SatirItem key={r.id} r={r} i={i} results={results} showPartiEk={isMembran} />)}
            </div>

            <button
              onClick={basla}
              disabled={atanan.length === 0}
              className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-bold text-lg flex items-center justify-center gap-2"
            >
              <span className="ms" style={{ fontSize: 24 }}>
                {sayilanAdet > 0 && sayilanAdet < atanan.length ? 'play_arrow' : sayilanAdet === atanan.length ? 'task_alt' : 'play_arrow'}
              </span>
              {sayilanAdet > 0 && sayilanAdet < atanan.length ? 'Kaldığı Yerden Devam Et' : sayilanAdet === atanan.length ? 'Özeti Gör' : 'Sayıma Başla'}
            </button>
            <button
              onClick={() => setManuelOpen(true)}
              className="w-full py-3 mt-2 rounded-2xl border border-white/15 text-slate-200 hover:bg-white/5 font-semibold flex items-center justify-center gap-2"
            >
              <span className="ms" style={{ fontSize: 20 }}>add_box</span> Manuel Fazla Stok Girişi
            </button>
          </div>
        )}
        {manuelOpen && (
          <ManuelModal
            onClose={() => setManuelOpen(false)}
            addManualRow={manuelAddFn}
            manualRows={manuelRows}
            isKor={isKor}
          />
        )}
      </Shell>
    )
  }

  // ─── SAYIM KARTI ──────────────────────────────────────────────────────────
  if (view === 'sayim') {
    return (
      <Shell
        mode={mode}
        title={gorev?.depoAdi || 'Sayım'}
        subtitle={`${sayilanAdet} / ${atanan.length} sayıldı`}
        onBack={() => setView('liste')}
      >
        {/* İlerleme çubuğu */}
        <div className="w-full max-w-md mb-6">
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-2 bg-blue-400 transition-all"
              style={{ width: `${atanan.length > 0 ? (sayilanAdet / atanan.length) * 100 : 0}%` }}
            />
          </div>
        </div>

        {current && !editing && (
          <SwipeCard
            row={current}
            sayilanMiktar={results[current.id]?.miktar}
            onConfirm={onayla}
            onEdit={editAc}
            isMembran={isMembran}
          />
        )}

        {/* Eksik/Fazla + Not alanı */}
        {current && editing && (
          <div className="w-full max-w-md rounded-3xl border border-amber-400/30 bg-amber-500/10 p-7" style={{ backdropFilter: 'blur(8px)' }}>
            <p className="text-amber-200 font-bold text-lg mb-1">{current.ad}</p>
            <p className="text-slate-400 text-sm mono mb-5">{current.adres} · {current.kod}</p>

            <label className="block text-slate-300 text-sm mb-2">Sayılan Gerçek Miktar ({current.birim})</label>
            <input
              autoFocus type="number" inputMode="decimal" value={editVal}
              onChange={e => setEditVal(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && editKaydet()}
              placeholder={`Sistem: ${current.sayim ?? '—'}`}
              className="w-full bg-black/30 border border-white/20 rounded-2xl px-5 py-4 text-white text-3xl font-bold mono text-center focus:outline-none focus:border-amber-400 mb-4"
            />

            <label className="block text-slate-300 text-sm mb-2">Not (opsiyonel)</label>
            <textarea
              value={editNote}
              onChange={e => setEditNote(e.target.value)}
              placeholder="Açıklama, fark nedeni..."
              rows={2}
              className="w-full bg-black/30 border border-white/20 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-amber-400 resize-none"
            />

            <div className="flex gap-3 mt-5">
              <button onClick={() => setEditing(false)} className="flex-1 py-4 rounded-2xl border border-white/15 text-slate-200 font-bold">
                Vazgeç
              </button>
              <button onClick={editKaydet} className="flex-1 py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-white font-bold flex items-center justify-center gap-2">
                <span className="ms" style={{ fontSize: 22 }}>save</span> Kaydet
              </button>
            </div>
          </div>
        )}

        <button
          onClick={() => setManuelOpen(true)}
          className="mt-6 text-slate-300 hover:text-white text-sm flex items-center gap-1.5"
        >
          <span className="ms" style={{ fontSize: 18 }}>add_box</span> Manuel fazla stok ekle
        </button>
        {manuelOpen && (
          <ManuelModal
            onClose={() => setManuelOpen(false)}
            addManualRow={manuelAddFn}
            manualRows={manuelRows}
            isKor={isKor}
          />
        )}
      </Shell>
    )
  }

  // ─── ÖZET ─────────────────────────────────────────────────────────────────
  return (
    <Shell mode={mode} title="Sayım Tamamlandı" subtitle={gorev?.depoAdi}>
      <div className="flex flex-col items-center text-center w-full max-w-md">
        <span className="ms text-emerald-400 mb-4" style={{ fontSize: 72 }}>task_alt</span>
        <p className="text-white font-bold text-2xl mb-2">Tebrikler!</p>
        <p className="text-slate-300 mb-1">{atanan.length} kalem sayıldı.</p>
        {manuelRows.length > 0 && (
          <p className="text-amber-300 text-sm mb-6">+ {manuelRows.length} manuel fazla stok girişi</p>
        )}
        <button
          onClick={() => { setView('gorevler'); setGorev(null) }}
          className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-lg mt-4"
        >
          Görevlere Dön
        </button>
      </div>
    </Shell>
  )
}

// ── Satır item (liste görünümü) ────────────────────────────────────────────
function SatirItem({ r, i, results, showPartiEk = false }) {
  const m = results[r.id]?.miktar
  const sayildi = m !== undefined && m !== ''
  const farkli  = sayildi && String(m) !== String(r.sayim)
  const hasNote = Boolean(results[r.id]?.notlar)

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-white/[0.03]">
      <span className="text-slate-500 mono text-xs w-6 shrink-0">{i + 1}</span>
      <div className="min-w-0 flex-1">
        {showPartiEk && r.partiEk && (
          <p className="text-purple-300 text-[10px] mono mb-0.5">{r.partiEk}</p>
        )}
        <p className="text-white text-sm font-semibold truncate">{r.ad}</p>
        <p className="text-slate-400 text-xs mono truncate">{r.adres} · {r.kod}</p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {hasNote && (
          <span className="ms text-amber-400" style={{ fontSize: 14 }}>sticky_note_2</span>
        )}
        {sayildi && farkli  && <span className="ms text-red-400"    style={{ fontSize: 20 }}>close</span>}
        {sayildi && !farkli && <span className="ms text-emerald-400" style={{ fontSize: 20 }}>check_circle</span>}
      </div>
    </div>
  )
}

// ── Yardımcı bileşenler ────────────────────────────────────────────────────
function Shell({ children, title, subtitle, onBack, mode }) {
  return (
    <div
      className={mode === 'preview' ? 'flex-1 flex flex-col overflow-hidden' : 'h-screen flex flex-col overflow-hidden'}
      style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #0f172a 100%)' }}
    >
      <header className="flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          {onBack && (
            <button onClick={onBack} className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-300 hover:bg-white/10 shrink-0">
              <span className="ms" style={{ fontSize: 22 }}>arrow_back</span>
            </button>
          )}
          <div className="min-w-0">
            <p className="text-white font-bold text-base truncate">{title}</p>
            {subtitle && <p className="text-slate-400 text-xs truncate">{subtitle}</p>}
          </div>
        </div>
        {mode === 'self' && (
          <button onClick={() => signOut(auth)} className="flex items-center gap-1.5 text-slate-300 hover:text-white text-sm shrink-0">
            <span className="ms" style={{ fontSize: 18 }}>logout</span>
          </button>
        )}
        {mode === 'preview' && (
          <span className="px-2 py-1 rounded-md bg-white/10 text-slate-300 text-xs shrink-0">Önizleme</span>
        )}
      </header>
      <div className="flex-1 overflow-y-auto flex flex-col items-center px-5 py-6">
        {children}
      </div>
    </div>
  )
}

function Loading() {
  return (
    <div className="flex items-center gap-2 text-slate-300 mt-10">
      <span className="ms animate-spin" style={{ fontSize: 22 }}>progress_activity</span> Yükleniyor…
    </div>
  )
}

function Empty({ icon, title, text }) {
  return (
    <div className="flex flex-col items-center text-center mt-12 max-w-sm">
      <span className="ms text-slate-500 mb-3" style={{ fontSize: 56 }}>{icon}</span>
      <p className="text-white font-bold text-lg mb-1">{title}</p>
      <p className="text-slate-400 text-sm">{text}</p>
    </div>
  )
}

function DurumRozet({ durum }) {
  const map = {
    bekliyor:   { cls: 'bg-slate-500/20 text-slate-300',   label: 'Bekliyor' },
    devam:      { cls: 'bg-blue-500/20 text-blue-300',     label: 'Devam' },
    tamamlandi: { cls: 'bg-emerald-500/20 text-emerald-300', label: 'Tamamlandı' },
  }
  const d = map[durum] || map.bekliyor
  return <span className={'px-2 py-0.5 rounded-full text-xs font-medium ' + d.cls}>{d.label}</span>
}

const MANUEL_BOS = { kod: '', ad: '', adres: '', miktar: '', birim: '' }

function ManuelModal({ onClose, addManualRow, manualRows, isKor }) {
  const [form, setForm] = useState(MANUEL_BOS)
  const [saving, setSaving] = useState(false)

  async function kaydet(e) {
    e.preventDefault()
    if (!form.kod.trim() || form.miktar === '') return
    setSaving(true)
    await addManualRow({
      kod:    form.kod.trim().toUpperCase(),
      ad:     form.ad.trim(),
      adres:  form.adres.trim(),
      parti:  '',
      durum:  '',
      miktar: Number(form.miktar),
      birim:  form.birim.trim(),
      not:    'Sayımcı tarafından eklendi',
    })
    setForm(MANUEL_BOS)
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="w-full max-w-md bg-slate-900 border border-white/15 rounded-3xl p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-bold text-lg flex items-center gap-2">
            <span className="ms text-amber-400" style={{ fontSize: 22 }}>add_box</span>
            Manuel Fazla Stok
            {isKor && <span className="text-xs font-normal text-amber-300 ml-1">(Kör Sayım)</span>}
          </h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-white/10">
            <span className="ms" style={{ fontSize: 20 }}>close</span>
          </button>
        </div>
        <p className="text-slate-400 text-xs mb-4">
          Sistemde bulunmayan ürün.
          {isKor ? ' Kör sayım raporu' : ' Stok sayım raporu'}'ndaki manuel listeye eklenir.
        </p>
        <form onSubmit={kaydet} className="flex flex-col gap-3">
          <input value={form.kod} onChange={e => setForm(f => ({ ...f, kod: e.target.value }))}
            placeholder="Ürün Kodu *" className="bg-black/30 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-400" />
          <input value={form.ad} onChange={e => setForm(f => ({ ...f, ad: e.target.value }))}
            placeholder="Ürün Adı" className="bg-black/30 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-400" />
          <input value={form.adres} onChange={e => setForm(f => ({ ...f, adres: e.target.value }))}
            placeholder="Raf / Adres" className="bg-black/30 border border-white/20 rounded-xl px-4 py-3 text-white mono placeholder-slate-500 focus:outline-none focus:border-blue-400" />
          <div className="flex gap-3">
            <input value={form.miktar} onChange={e => setForm(f => ({ ...f, miktar: e.target.value }))}
              type="number" inputMode="decimal" placeholder="Miktar *" className="flex-1 bg-black/30 border border-white/20 rounded-xl px-4 py-3 text-white mono placeholder-slate-500 focus:outline-none focus:border-blue-400" />
            <input value={form.birim} onChange={e => setForm(f => ({ ...f, birim: e.target.value }))}
              placeholder="Birim" className="w-28 bg-black/30 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-400" />
          </div>
          <button type="submit" disabled={saving || !form.kod.trim() || form.miktar === ''}
            className="py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-white font-bold flex items-center justify-center gap-2 mt-1">
            <span className={'ms ' + (saving ? 'animate-spin' : '')} style={{ fontSize: 20 }}>{saving ? 'progress_activity' : 'add'}</span>
            Ekle
          </button>
        </form>
        {manualRows.length > 0 && (
          <p className="text-slate-500 text-xs text-center mt-3">{manualRows.length} manuel kayıt eklendi</p>
        )}
      </div>
    </div>
  )
}
