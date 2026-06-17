import useStore from '../../store/useStore'

export default function Ayarlar() {
  const { session, setSession } = useStore()

  return (
    <div className="max-w-xl">
      <h2 className="text-3xl font-bold text-on-background tracking-tight mb-6">Ayarlar</h2>
      <div className="bg-surface border border-outline-variant rounded p-6 space-y-4">
        {[
          { key: 'depoAdi', label: 'Depo Adı' },
          { key: 'sayimBasligi', label: 'Sayım Başlığı' },
          { key: 'sorumlu', label: 'Sorumlu Kişi' },
          { key: 'tarih', label: 'Sayım Tarihi', type: 'date' },
        ].map(({ key, label, type = 'text' }) => (
          <div key={key}>
            <label className="block text-xs font-medium text-on-surface-variant mb-1 uppercase tracking-wide" style={{fontFamily: '"JetBrains Mono", monospace'}}>{label}</label>
            <input
              type={type}
              value={session[key] || ''}
              onChange={e => setSession({ [key]: e.target.value })}
              className="w-full border border-outline-variant rounded px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary"
            />
          </div>
        ))}
        <button className="w-full bg-primary text-on-primary py-3 rounded font-bold text-sm hover:bg-on-primary-fixed-variant transition-colors mt-4">
          Kaydet
        </button>
      </div>
    </div>
  )
}
