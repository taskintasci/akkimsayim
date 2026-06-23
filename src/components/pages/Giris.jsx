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
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
        Devam
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500">
      Tamamlandı
    </span>
  )
}

export default function Giris({ onNavigate }) {
  const { sessions, sessionsLoading, loadSessions, setActiveSession, createSession, deleteSession, currentUser, userRole } = useStore()
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
    <div className="h-screen flex flex-col bg-slate-100">
      {/* Logo bar */}
      <div className="flex items-center justify-between px-10 pt-7 pb-5 bg-white border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
            <span className="ms text-white" style={{ fontSize: 20 }}>warehouse</span>
          </div>
          <span className="text-slate-900 font-bold text-sm leading-tight tracking-tight"><span className="hidden sm:inline">Akkim Depolama Merkezi </span>Sayım Sistemi</span>
        </div>
        <div className="flex items-center gap-3">
          {currentUser && <span className="text-slate-400 text-xs mono">{currentUser.email}</span>}
          <button
            onClick={() => signOut(auth)}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-slate-500 hover:text-slate-700 hover:border-slate-300 text-xs transition-colors"
          >
            <span className="ms" style={{ fontSize: 15 }}>logout</span> Çıkış
          </button>
        </div>
      </div>

      {/* Two-panel body */}
      <div className="flex flex-1 overflow-hidden">

        {/* Sol panel: Geçmiş Sayımlar */}
        <div className={`${userRole === 'yonetici' ? 'w-[420px] shrink-0 border-r border-slate-200' : 'flex-1 max-w-lg mx-auto'} flex flex-col px-8 py-6 overflow-y-auto`}>
          <h2 className="text-slate-700 font-semibold text-sm flex items-center gap-2 mb-4">
            <span className="ms text-blue-500" style={{ fontSize: 18 }}>history</span>
            Geçmiş Sayımlar
          </h2>

          {sessionsLoading ? (
            <div className="flex flex-col gap-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="rounded-xl p-4 border border-slate-200 bg-white">
                  <div className="h-4 bg-slate-100 rounded-md w-40 mb-2 animate-pulse" />
                  <div className="h-3 bg-slate-100 rounded-md w-28 mb-3 animate-pulse" />
                  <div className="h-1.5 bg-slate-100 rounded-full w-full animate-pulse" />
                </div>
              ))}
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-slate-300 rounded-xl bg-white">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto mb-3">
                <span className="ms text-slate-300" style={{ fontSize: 24 }}>folder_open</span>
              </div>
              <p className="text-slate-500 text-sm font-medium">Kayıtlı sayım yok</p>
              <p className="text-slate-400 text-xs mt-1">
                {userRole === 'yonetici' ? 'Sağ panelden yeni sayım oluşturun' : 'Yönetici sayım oluşturduğunda buraya eklenir'}
              </p>
            </div>
          ) : null}

          {!sessionsLoading && sessions.length > 0 && (
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
                        ? 'bg-blue-50 border-blue-400 ring-1 ring-blue-400'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm')
                    }
                  >
                    <div className="flex items-start justify-between mb-1">
                      <button className="flex-1 text-left" onClick={() => { setSelectedId(s.id); setDeletingId(null) }}>
                        <div className="text-slate-800 font-semibold text-sm">{s.type}</div>
                      </button>
                      <div className="flex items-center gap-2 ml-2 shrink-0">
                        <StatusBadge durum={s.durum} />
                        {userRole === 'yonetici' && (!isDeleting ? (
                          <button
                            onClick={e => { e.stopPropagation(); setDeletingId(s.id) }}
                            className="w-6 h-6 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
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
                              className="px-2 py-0.5 text-slate-400 hover:text-slate-600 text-[11px] rounded-md transition-colors"
                            >
                              İptal
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                    <button className="w-full text-left" onClick={() => { setSelectedId(s.id); setDeletingId(null) }}>
                      <div className="text-slate-500 text-xs mb-1.5 font-medium">{s.depoAdi}</div>
                      <div className="flex items-center gap-2.5 text-xs text-slate-400 mono mb-2">
                        <span>{s.tarih}</span>
                        <span>·</span>
                        <span>{s.kalemSayisi} kalem</span>
                        {s.fark > 0 && (
                          <>
                            <span>·</span>
                            <span className="text-amber-600">{s.fark} fark</span>
                          </>
                        )}
                      </div>
                      {s.kalemSayisi > 0 && (
                        <div className="w-full bg-slate-100 rounded-full h-1">
                          <div
                            className="h-1 rounded-full bg-blue-500 transition-all"
                            style={{ width: pct + '%' }}
                          />
                        </div>
                      )}
                    </button>
                  </div>
                )
              })}
            </div>
          )}

          <div className="py-5 mt-auto">
            <button
              onClick={handleDevamEt}
              disabled={!selectedId}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-sm transition-all flex items-center justify-center gap-2"
            >
              <span className="ms">play_arrow</span>
              Devam Et
            </button>
          </div>
        </div>

        {/* Sağ panel: Yeni Sayım — yalnızca yönetici */}
        {userRole === 'yonetici' && (
          <div className="flex-1 flex flex-col justify-center items-center px-12 py-8">
            <div className="w-full max-w-sm">
              <h2 className="text-slate-700 font-semibold text-sm flex items-center gap-2 mb-5">
                <span className="ms text-blue-500" style={{ fontSize: 18 }}>add_circle</span>
                Yeni Sayım Oluştur
              </h2>

              {/* Type selector */}
              <div className="mb-4">
                <div className="text-slate-500 text-xs font-medium mb-2">Sayım Türü</div>
                <div className="flex flex-col gap-2">
                  {SESSION_TYPES.map(t => (
                    <button
                      key={t.id}
                      onClick={() => setNewType(t.id)}
                      className={
                        'flex items-center gap-3 p-3 rounded-xl border text-left transition-all ' +
                        (newType === t.id
                          ? 'bg-blue-50 border-blue-400 ring-1 ring-blue-400'
                          : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm')
                      }
                    >
                      <div className={
                        'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ' +
                        (newType === t.id ? 'bg-blue-600' : 'bg-slate-100')
                      }>
                        <span className={`ms ${newType === t.id ? 'text-white' : 'text-slate-500'}`} style={{ fontSize: 16 }}>{t.icon}</span>
                      </div>
                      <div className="flex-1">
                        <div className="text-slate-800 text-sm font-medium">{t.id}</div>
                        <div className="text-slate-400 text-xs">{t.desc}</div>
                      </div>
                      {newType === t.id && (
                        <span className="ms text-blue-500" style={{ fontSize: 18 }}>check_circle</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Depo ve tarih */}
              <div className="flex flex-col gap-3 mb-5">
                <div>
                  <label className="block text-slate-500 text-xs font-medium mb-1.5">Depo Adı</label>
                  <input
                    type="text"
                    value={depoAdi}
                    onChange={e => setDepoAdi(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleCreate()}
                    placeholder="Örn: 901 ALİŞAN DEPO"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 text-xs font-medium mb-1.5">Sayım Tarihi</label>
                  <input
                    type="date"
                    value={tarih}
                    onChange={e => setTarih(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-slate-900 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <button
                onClick={handleCreate}
                disabled={!depoAdi.trim() || creating}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-sm transition-all flex items-center justify-center gap-2"
              >
                <span className={'ms ' + (creating ? 'animate-spin' : '')}>{creating ? 'progress_activity' : 'rocket_launch'}</span>
                {creating ? 'Oluşturuluyor…' : 'Yeni Sayım Oluştur'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
