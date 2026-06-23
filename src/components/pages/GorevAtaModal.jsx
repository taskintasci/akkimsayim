import { useState, useEffect, useMemo } from 'react'
import useStore from '../../store/useStore'

// Yöneticinin seçili satırları bir sayımcıya görev olarak atadığı modal.
// `rows` = atanacak satırlar (filtrelenmiş liste). onClose = kapat.
export default function GorevAtaModal({ rows, onClose, sayimTipi = 'stok' }) {
  const { users, usersLoading, loadUsers, assignGorev } = useStore()
  const [selected, setSelected] = useState(null)
  const [saving, setSaving]     = useState(false)
  const [done, setDone]         = useState(false)

  useEffect(() => { loadUsers() }, [])

  const sayimcilar = useMemo(() => users.filter(u => u.rol === 'sayimci'), [users])

  async function ata() {
    if (!selected || rows.length === 0) return
    setSaving(true)
    try {
      await assignGorev({ sayimci: selected, atananRows: rows.map(r => r.id), sayimTipi })
      setDone(true)
      setTimeout(onClose, 1400)
    } catch (err) {
      alert('Görev atanamadı: ' + (err?.message || ''))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-slate-800 font-bold text-lg flex items-center gap-2">
            <span className="ms text-blue-500" style={{ fontSize: 22 }}>assignment_ind</span>
            Sayımcıya Gönder
          </h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100">
            <span className="ms" style={{ fontSize: 20 }}>close</span>
          </button>
        </div>
        <p className="text-slate-500 text-sm mb-5">
          <span className="font-semibold text-slate-700">{rows.length}</span> kalem seçili sayımcıya görev olarak gönderilecek.
        </p>

        {done ? (
          <div className="flex flex-col items-center text-center py-6">
            <span className="ms text-emerald-500 mb-2" style={{ fontSize: 48 }}>check_circle</span>
            <p className="text-slate-700 font-semibold">Görev atandı!</p>
          </div>
        ) : (
          <>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Sayımcı Seç</label>
            {usersLoading ? (
              <div className="text-slate-400 text-sm py-4 flex items-center gap-2">
                <span className="ms animate-spin" style={{ fontSize: 18 }}>progress_activity</span> Yükleniyor…
              </div>
            ) : sayimcilar.length === 0 ? (
              <div className="text-slate-400 text-sm py-4 text-center border border-dashed border-slate-200 rounded-xl">
                Sayımcı rolünde kullanıcı yok. Önce Kullanıcı Yönetimi'nden ekleyin.
              </div>
            ) : (
              <div className="flex flex-col gap-2 max-h-60 overflow-y-auto mb-5">
                {sayimcilar.map(u => (
                  <button
                    key={u.uid}
                    onClick={() => setSelected(u)}
                    className={
                      'flex items-center gap-3 p-3 rounded-xl border text-left transition-all ' +
                      (selected?.uid === u.uid
                        ? 'bg-blue-50 border-blue-400 ring-1 ring-blue-300'
                        : 'bg-white border-slate-200 hover:bg-slate-50')
                    }
                  >
                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 shrink-0">
                      {(u.displayName || u.email).slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-800 truncate">{u.displayName || u.email}</p>
                      <p className="text-xs text-slate-400 mono truncate">{u.email}</p>
                    </div>
                    {selected?.uid === u.uid && <span className="ms text-blue-500" style={{ fontSize: 20 }}>check_circle</span>}
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={ata}
              disabled={!selected || saving || rows.length === 0}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-semibold rounded-xl flex items-center justify-center gap-2"
            >
              <span className={'ms ' + (saving ? 'animate-spin' : '')} style={{ fontSize: 18 }}>{saving ? 'progress_activity' : 'send'}</span>
              {saving ? 'Gönderiliyor…' : 'Görevi Gönder'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
