import useStore from '../../store/useStore'

export default function Raporlar() {
  const { rows, results } = useStore()

  const counted = rows.filter(r => results[r.id]?.miktar !== undefined && results[r.id]?.miktar !== '')
  const discrepancies = rows.filter(r => {
    const m = results[r.id]?.miktar
    return m !== undefined && m !== '' && String(m) !== String(r.sayim)
  }).map(r => ({
    ...r,
    sayilan: results[r.id]?.miktar,
    fark: Number(results[r.id]?.miktar) - Number(r.sayim),
  }))

  return (
    <div className="max-w-[1200px] mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold text-on-background tracking-tight">Mutabakat Raporu</h2>
          <p className="text-sm text-on-surface-variant mt-1">Nihai onaydan önce envanter farklarını gözden geçirin.</p>
        </div>
        <div className="flex space-x-3">
          <button className="flex items-center space-x-2 bg-surface border border-outline-variant text-on-surface px-4 py-2 rounded text-sm font-semibold hover:bg-surface-container transition-colors">
            <span className="material-symbols-outlined text-[20px]">picture_as_pdf</span>
            <span>PDF Dışa Aktar</span>
          </button>
          <button className="flex items-center space-x-2 bg-primary text-on-primary px-4 py-2 rounded text-sm font-bold hover:bg-on-primary-fixed-variant transition-colors">
            <span className="material-symbols-outlined text-[20px]">check_circle</span>
            <span>Onayla</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-surface border border-outline-variant rounded p-4">
          <p className="text-xs text-on-surface-variant uppercase tracking-wider mb-2" style={{fontFamily: '"JetBrains Mono", monospace'}}>Sayılan Toplam Kod</p>
          <p className="text-4xl font-bold text-on-surface">{counted.length.toLocaleString('tr')}</p>
          <p className="text-xs text-on-surface-variant mt-1">{rows.length.toLocaleString('tr')} tamamlana arasından</p>
        </div>
        <div className="bg-error-container border border-error rounded p-4">
          <p className="text-xs text-on-error-container uppercase tracking-wider mb-2" style={{fontFamily: '"JetBrains Mono", monospace'}}>Fark Analizi</p>
          <p className="text-4xl font-bold text-error">{discrepancies.length}</p>
          <p className="text-xs text-on-error-container mt-1">%{rows.length ? Math.round(discrepancies.length / rows.length * 100) : 0} farklı envanter</p>
        </div>
        <div className="bg-surface border border-outline-variant rounded p-4">
          <p className="text-xs text-on-surface-variant uppercase tracking-wider mb-2" style={{fontFamily: '"JetBrains Mono", monospace'}}>Sayılmayan</p>
          <p className="text-4xl font-bold text-on-surface">{(rows.length - counted.length).toLocaleString('tr')}</p>
          <p className="text-xs text-on-surface-variant mt-1">Bekleyen kalem</p>
        </div>
      </div>

      {/* Discrepancies table */}
      {discrepancies.length === 0 ? (
        <div className="bg-surface border border-outline-variant rounded p-12 text-center">
          <span className="material-symbols-outlined text-4xl text-primary mb-3 block" style={{fontVariationSettings: "'FILL' 1"}}>check_circle</span>
          <p className="text-base font-semibold text-on-surface">Farklılık bulunamadı</p>
          <p className="text-sm text-on-surface-variant mt-1">Tüm sayılan kalemler sistem miktarıyla eşleşiyor.</p>
        </div>
      ) : (
        <div className="bg-surface border border-outline-variant rounded overflow-hidden">
          <div className="p-4 border-b border-outline-variant bg-surface-container-low flex justify-between items-center">
            <span className="text-sm font-semibold text-on-surface">Farklılıklar ({discrepancies.length})</span>
            <label className="flex items-center space-x-2 text-xs text-on-surface-variant">
              <input type="checkbox" className="rounded" />
              <span>Sadece fark olan kalemleri göster</span>
            </label>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant">
                  {['Kod / Ad','Adres','Beklenen','Sayım','Fark','İşlem'].map(h => (
                    <th key={h} className="p-3 text-[10px] font-medium text-on-surface-variant uppercase tracking-wider" style={{fontFamily: '"JetBrains Mono", monospace'}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {discrepancies.map(row => (
                  <tr key={row.id} className="border-b border-outline-variant hover:bg-surface-container-low">
                    <td className="p-3">
                      <p className="text-xs font-bold text-on-surface" style={{fontFamily: '"JetBrains Mono", monospace'}}>{row.kod}</p>
                      <p className="text-sm text-on-surface-variant">{row.ad}</p>
                    </td>
                    <td className="p-3 text-xs" style={{fontFamily: '"JetBrains Mono", monospace'}}>{row.adres}</td>
                    <td className="p-3 text-sm font-medium text-on-surface" style={{fontFamily: '"JetBrains Mono", monospace'}}>{row.sayim} {row.birim}</td>
                    <td className="p-3 text-sm font-bold text-error" style={{fontFamily: '"JetBrains Mono", monospace'}}>{row.sayilan} {row.birim}</td>
                    <td className={`p-3 text-sm font-bold ${row.fark > 0 ? 'text-primary' : 'text-error'}`} style={{fontFamily: '"JetBrains Mono", monospace'}}>
                      {row.fark > 0 ? '+' : ''}{row.fark} {row.birim}
                    </td>
                    <td className="p-3">
                      <button className="text-xs text-primary hover:underline">İncele</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
