import { useState } from 'react'
import useStore from '../../store/useStore'

export default function Ayarlar() {
  const { session, setSession } = useStore()
  const [saved, setSaved] = useState(false)

  function handleSave() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-slate-800 mb-1">Ayarlar</h1>
      <p className="text-sm text-slate-500 mb-6">Aktif sayım oturumu bilgilerini düzenleyin.</p>

      <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
            Depo Adı
          </label>
          <input
            type="text"
            value={session.depoAdi || ''}
            onChange={e => setSession({ depoAdi: e.target.value })}
            placeholder="Örn: 901 ALİŞAN DEPO"
            className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
            Sayım Başlığı
          </label>
          <input
            type="text"
            value={session.sayimBasligi || ''}
            onChange={e => setSession({ sayimBasligi: e.target.value })}
            placeholder="Örn: YIL SONU SAYIM"
            className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
            Sayım Turu
          </label>
          <input
            type="number"
            min={1}
            max={10}
            value={session.tur || 1}
            onChange={e => setSession({ tur: Number(e.target.value) })}
            className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-800 mono focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
            Sorumlu Kişi
          </label>
          <input
            type="text"
            value={session.sorumlu || ''}
            onChange={e => setSession({ sorumlu: e.target.value })}
            placeholder="Ad Soyad"
            className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
            Sayım Tarihi
          </label>
          <input
            type="date"
            value={session.tarih || ''}
            onChange={e => setSession({ tarih: e.target.value })}
            className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-800 mono focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-colors"
          />
        </div>

        <button
          onClick={handleSave}
          className={
            'w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ' +
            (saved
              ? 'bg-green-600 text-white'
              : 'bg-blue-600 hover:bg-blue-700 text-white')
          }
        >
          <span className="ms" style={{ fontSize: 18 }}>{saved ? 'check_circle' : 'save'}</span>
          {saved ? 'Kaydedildi!' : 'Kaydet'}
        </button>
      </div>
    </div>
  )
}
