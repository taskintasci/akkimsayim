import { useEffect, useState } from 'react'
import useStore from '../../store/useStore'

export default function FirmaSecimi({ onSelect }) {
  const { firmalar, loadFirmalar } = useStore()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadFirmalar().finally(() => setLoading(false))
  }, [])

  function handleSelect(firmaId) {
    try { localStorage.setItem('sayimplani_secili_firma', firmaId) } catch { /* localStorage kapalı olabilir */ }
    onSelect(firmaId)
  }

  const aktifFirmalar = firmalar.filter(f => f.aktif !== false)

  return (
    <div className="h-screen flex items-center justify-center bg-slate-100">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3 justify-center mb-8">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
            <span className="ms text-white" style={{ fontSize: 22 }}>warehouse</span>
          </div>
          <div className="text-slate-900 font-bold text-sm leading-tight tracking-tight">Sayım Planı</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
          <h1 className="text-slate-800 font-semibold text-lg mb-1 text-center">Firma Seçimi</h1>
          <p className="text-slate-400 text-xs text-center mb-6">Devam etmek için firmanızı seçin</p>

          {loading ? (
            <div className="flex flex-col items-center gap-2 py-8 text-slate-400">
              <span className="ms animate-spin" style={{ fontSize: 24 }}>progress_activity</span>
            </div>
          ) : aktifFirmalar.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">Tanımlı firma bulunamadı.</div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {aktifFirmalar.map(f => (
                <button
                  key={f.id}
                  onClick={() => handleSelect(f.id)}
                  className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 bg-white hover:border-blue-400 hover:shadow-sm active:scale-[0.98] transition-all text-left"
                >
                  <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                    <span className="ms text-blue-600" style={{ fontSize: 18 }}>domain</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-slate-800 font-semibold text-sm">{f.ad}</div>
                    {f.unvan && <div className="text-slate-400 text-xs truncate">{f.unvan}</div>}
                  </div>
                  <span className="ms text-slate-300" style={{ fontSize: 20 }}>chevron_right</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
