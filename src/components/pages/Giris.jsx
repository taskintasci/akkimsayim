import { useState, useEffect } from 'react'
import { signOut } from 'firebase/auth'
import { auth } from '../../firebase/index'
import useStore from '../../store/useStore'

const SESSION_TYPES = [
  { id: 'Yıl Sonu Sayımı', icon: 'event_available', desc: 'Yıl sonu kapanış envanteri' },
  { id: 'Ara Sayım', icon: 'find_in_page', desc: 'Dönem içi kontrol sayımı' },
  { id: 'Ön Sayım', icon: 'preview', desc: 'Hazırlık ve sınırlı alan sayımı' },
]

function StatusBadge({ durum }) {
  if (durum === 'Devam') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-300">
        <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block"></span>
        Devam
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-white/10 text-slate-300">
      Tamamlandı
    </span>
  )
}

export default function Giris({ onNavigate }) {
  const { sessions, sessionsLoading, loadSessions, setActiveSession, createSession, deleteSession, currentUser } = useStore()
  const [selectedId, setSelectedId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [creating, setCreating] = useState(false)

  useEffect(() => { loadSessions() }, [])
  const [newType, setNewType] = useState('Yıl Sonu Sayımı')
  const [depoAdi, setDepoAdi] = useState('')
  const [tarih, setTarih] = useState(new Date().toISOString().slice(0, 10))

  function handleDevamEt() {
    if (!selectedId) return
    setActiveSession(selectedId)
    onNavigate('panel')
  }

  async function handleCreate() {
    if (!depoAdi.trim() || creating) return
    setCreating(true)
    try {
      await createSession({ type: newType, depoAdi: depoAdi.trim(), tarih })
      onNavigate('panel')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div
      className="h-screen flex flex-col"
      style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #0f172a 100%)' }}
    >
      {/* Logo bar */}
      <div className="flex items-center justify-between px-10 pt-8 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
            <span className="ms text-white" style={{ fontSize: 22 }}>warehouse</span>
          </div>
          <div>
            <div className="text-white font-bold text-lg tracking-tight">Akkim Sayım</div>
            <div className="text-slate-400 text-xs mono">ChemStack Pro — Depo Yönetim Sistemi</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {currentUser && <span className="text-slate-400 text-xs mono">{currentUser.email}</span>}
          <button
            onClick={() => signOut(auth)}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-white/20 rounded-lg text-slate-300 hover:text-white hover:border-white/40 text-xs transition-colors"
          >
            <span className="ms" style={{ fontSize: 15 }}>logout</span> Çıkış
          </button>
        </div>
      </div>

      {/* Two-panel body */}
      <div className="flex flex-1 overflow-hidden">

        {/* Sol panel: Geçmiş Sayımlar */}
        <div className="w-[420px] shrink-0 flex flex-col px-10 border-r border-white/10 overflow-y-auto">
          <h2 className="text-white font-semibold text-sm flex items-center gap-2 mb-4">
            <span className="ms text-blue-400" style={{ fontSize: 18 }}>history</span>
            Geçmiş Sayımlar
          </h2>

          {sessionsLoading && (
            <div className="text-slate-400 text-sm p-6 text-center border border-white/10 rounded-xl flex items-center justify-center gap-2">
              <span className="ms animate-spin" style={{ fontSize: 18 }}>progress_activity</span> Yükleniyor…
            </div>
          )}
          {!sessionsLoading && sessions.length === 0 && (
            <div className="text-slate-400 text-sm p-6 text-center border border-white/10 rounded-xl">
              Henüz kayıtlı sayım yok.
            </div>
          )}

          <div className="flex flex-col gap-2">
            {sessions.map(s => {
              const pct = s.kalemSayisi > 0 ? Math.round((s.tamamlanan / s.kalemSayisi) * 100) : 0
              const isDeleting = deletingId === s.id
              return (
                <div
                  key={s.id}
                  className={
                    'w-full text-left rounded-xl p-4 border transition-all ' +
                    (selectedId === s.id
                      ? 'bg-blue-600/20 border-blue-500 ring-1 ring-blue-500'
                      : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20')
                  }
                >
                  <div className="flex items-start justify-between mb-1">
                    <button className="flex-1 text-left" onClick={() => { setSelectedId(s.id); setDeletingId(null) }}>
                      <div className="text-white font-semibold text-sm">{s.type}</div>
                    </button>
                    <div className="flex items-center gap-2 ml-2 shrink-0">
                      <StatusBadge durum={s.durum} />
                      {!isDeleting ? (
                        <button
                          onClick={e => { e.stopPropagation(); setDeletingId(s.id) }}
                          className="w-6 h-6 flex items-center justify-center rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                          title="Sayımı Sil"
                        >
                          <span className="ms" style={{ fontSize: 15 }}>delete</span>
                        </button>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={async e => { e.stopPropagation(); await deleteSession(s.id); setDeletingId(null); if (selectedId === s.id) setSelectedId(null) }}
                            className="px-2 py-0.5 bg-red-500 hover:bg-red-600 text-white text-[11px] font-semibold rounded-md transition-colors"
                          >
                            Sil
                          </button>
                          <button
                            onClick={e => { e.stopPropagation(); setDeletingId(null) }}
                            className="px-2 py-0.5 text-slate-400 hover:text-white text-[11px] rounded-md transition-colors"
                          >
                            İptal
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <button className="w-full text-left" onClick={() => { setSelectedId(s.id); setDeletingId(null) }}>
                    <div className="text-slate-300 text-xs mb-1.5 font-medium">{s.depoAdi}</div>
                    <div className="flex items-center gap-2.5 text-xs text-slate-400 mono mb-2">
                      <span>{s.tarih}</span>
                      <span>·</span>
                      <span>{s.kalemSayisi} kalem</span>
                      {s.fark > 0 && (
                        <>
                          <span>·</span>
                          <span className="text-amber-400">{s.fark} fark</span>
                        </>
                      )}
                    </div>
                    {s.kalemSayisi > 0 && (
                      <div className="w-full bg-white/10 rounded-full h-1">
                        <div
                          className="h-1 rounded-full bg-blue-400 transition-all"
                          style={{ width: pct + '%' }}
                        />
                      </div>
                    )}
                  </button>
                </div>
              )
            })}
          </div>

          <div className="py-5 mt-auto">
            <button
              onClick={handleDevamEt}
              disabled={!selectedId}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
            >
              <span className="ms">play_arrow</span>
              Devam Et
            </button>
          </div>
        </div>

        {/* Sağ panel: Yeni Sayım */}
        <div className="flex-1 flex flex-col justify-center items-center px-12 py-8">
          <div className="w-full max-w-sm">
            <h2 className="text-white font-semibold text-sm flex items-center gap-2 mb-5">
              <span className="ms text-blue-400" style={{ fontSize: 18 }}>add_circle</span>
              Yeni Sayım Oluştur
            </h2>

            {/* Type selector */}
            <div className="mb-4">
              <div className="text-slate-400 text-xs mb-2">Sayım Türü</div>
              <div className="flex flex-col gap-2">
                {SESSION_TYPES.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setNewType(t.id)}
                    className={
                      'flex items-center gap-3 p-3 rounded-xl border text-left transition-all ' +
                      (newType === t.id
                        ? 'bg-blue-600/20 border-blue-500 ring-1 ring-blue-500'
                        : 'bg-white/5 border-white/10 hover:bg-white/10')
                    }
                  >
                    <div className={
                      'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ' +
                      (newType === t.id ? 'bg-blue-600' : 'bg-white/10')
                    }>
                      <span className="ms text-white" style={{ fontSize: 16 }}>{t.icon}</span>
                    </div>
                    <div className="flex-1">
                      <div className="text-white text-sm font-medium">{t.id}</div>
                      <div className="text-slate-400 text-xs">{t.desc}</div>
                    </div>
                    {newType === t.id && (
                      <span className="ms text-blue-400" style={{ fontSize: 18 }}>check_circle</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Depo ve tarih */}
            <div className="flex flex-col gap-3 mb-5">
              <div>
                <label className="block text-slate-400 text-xs mb-1.5">Depo Adı</label>
                <input
                  type="text"
                  value={depoAdi}
                  onChange={e => setDepoAdi(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCreate()}
                  placeholder="Örn: 901 ALİŞAN DEPO"
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-xs mb-1.5">Sayım Tarihi</label>
                <input
                  type="date"
                  value={tarih}
                  onChange={e => setTarih(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <button
              onClick={handleCreate}
              disabled={!depoAdi.trim() || creating}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
            >
              <span className={'ms ' + (creating ? 'animate-spin' : '')}>{creating ? 'progress_activity' : 'rocket_launch'}</span>
              {creating ? 'Oluşturuluyor…' : 'Yeni Sayım Oluştur'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
