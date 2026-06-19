import useStore from '../../store/useStore'
import { exportRaporFarklar } from '../../utils/excelExport'

export default function Rapor({ onNavigate }) {
  const { rows, results, session, setPendingKodFilter } = useStore()

  const counted = rows.filter(r => results[r.id]?.miktar !== undefined && results[r.id]?.miktar !== '')
  const discrepancies = rows
    .filter(r => {
      const m = results[r.id]?.miktar
      return m !== undefined && m !== '' && String(m) !== String(r.sayim)
    })
    .map(r => ({
      ...r,
      sayilan: results[r.id]?.miktar,
      fark: Number(results[r.id]?.miktar) - Number(String(r.sayim).replace(',', '.')),
    }))

  const pct = rows.length ? Math.round((counted.length / rows.length) * 100) : 0

  return (
    <div className="flex flex-col gap-5 print-content">
      {/* Başlık */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Mutabakat Raporu</h1>
          <p className="text-[13px] text-slate-500 mt-0.5">Onaydan önce tüm farklılıkları inceleyin</p>
        </div>
        <div className="flex gap-2 no-print">
          <button onClick={() => window.print()} className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-300 rounded-lg text-[13px] font-medium text-slate-700 hover:bg-slate-50">
            <span className="ms" style={{ fontSize: 16 }}>print</span> Yazdır
          </button>
          <button
            onClick={() => exportRaporFarklar(discrepancies, session)}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 rounded-lg text-[13px] font-medium text-slate-700 hover:bg-slate-50"
          >
            <span className="ms" style={{ fontSize: 16 }}>download</span> Excel İndir
          </button>
          <button className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-lg text-[13px] font-bold hover:bg-emerald-700">
            <span className="ms" style={{ fontSize: 16 }}>check_circle</span> Onayla
          </button>
        </div>
      </div>

      {/* 3 İstatistik Kartı */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-[11px] text-slate-400 mono uppercase tracking-wide mb-2">Sayılan Toplam</p>
          <p className="text-3xl font-bold text-slate-900">{counted.length.toLocaleString('tr')}</p>
          <p className="text-[12px] text-slate-400 mt-1">{rows.length.toLocaleString('tr')} kalem arasından</p>
        </div>
        <div className={discrepancies.length > 0 ? 'bg-red-50 rounded-xl border border-red-200 p-4' : 'bg-white rounded-xl border border-slate-200 p-4'}>
          <p className={`text-[11px] mono uppercase tracking-wide mb-2 ${discrepancies.length > 0 ? 'text-red-400' : 'text-slate-400'}`}>Fark Analizi</p>
          <p className={`text-3xl font-bold ${discrepancies.length > 0 ? 'text-red-600' : 'text-slate-900'}`}>{discrepancies.length}</p>
          <p className={`text-[12px] mt-1 ${discrepancies.length > 0 ? 'text-red-400' : 'text-slate-400'}`}>
            {discrepancies.length > 0 ? 'Sistem ile uyuşmuyor' : 'Fark yok'}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-[11px] text-slate-400 mono uppercase tracking-wide mb-2">Sayılmayan</p>
          <p className="text-3xl font-bold text-slate-900">{(rows.length - counted.length).toLocaleString('tr')}</p>
          <p className="text-[12px] text-slate-400 mt-1">Bekliyor</p>
        </div>
      </div>

      {/* Farklılıklar Tablosu */}
      {discrepancies.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <span className="ms text-green-500 mb-3 block" style={{ fontSize: 48 }}>check_circle</span>
          <div className="text-[14px] font-semibold text-slate-700">Farklılık bulunamadı</div>
          <div className="text-[13px] text-slate-400 mt-1">
            {counted.length === 0
              ? 'Henüz sayım yapılmamış. Stok Sayımı sayfasından başlayın.'
              : 'Tüm sayılan kalemler sistem miktarıyla eşleşiyor.'}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-3 py-1.5 border-b border-slate-100 flex items-center justify-between">
            <p className="text-[13px] font-semibold text-slate-700">
              Farklılıklar <span className="badge bg-red-50 text-red-600 ml-1">{discrepancies.length}</span>
            </p>
            <label className="flex items-center gap-2 text-[12px] text-slate-500 cursor-pointer">
              <input type="checkbox" className="rounded" /> Sadece büyük farklar (±%10)
            </label>
          </div>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[11px] mono text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <th className="px-3 py-1.5">Kod / Ad</th>
                <th className="px-3 py-1.5">Adres</th>
                <th className="px-3 py-1.5 text-right">Sistem</th>
                <th className="px-3 py-1.5 text-right">Sayılan</th>
                <th className="px-3 py-1.5 text-right">Fark</th>
                <th className="px-3 py-1.5 text-center">İşlem</th>
              </tr>
            </thead>
            <tbody className="text-[12.5px] divide-y divide-slate-50">
              {discrepancies.map((row, i) => (
                <tr key={row.id} className={i % 2 === 1 ? 'bg-slate-50/50 hover:bg-slate-50' : 'hover:bg-slate-50'}>
                  <td className="px-3 py-1.5">
                    <p className="mono font-semibold text-blue-700 text-[11px]">{row.kod}</p>
                    <p className="text-slate-700">{row.ad}</p>
                  </td>
                  <td className="px-3 py-1.5 mono text-slate-500 text-[12px]">{row.adres}</td>
                  <td className="px-3 py-1.5 text-right mono font-medium">
                    {row.sayim} <span className="text-slate-400 text-[11px]">{row.birim}</span>
                  </td>
                  <td className="px-3 py-1.5 text-right mono font-bold text-red-600">
                    {row.sayilan} <span className="text-red-400 text-[11px]">{row.birim}</span>
                  </td>
                  <td className={`px-3 py-1.5 text-right mono font-bold ${row.fark > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {row.fark > 0 ? '+' : ''}{row.fark.toLocaleString('tr', { maximumFractionDigits: 2 })} <span className="opacity-60 text-[11px]">{row.birim}</span>
                  </td>
                  <td className="px-3 py-1.5 text-center">
                    <button
                      onClick={() => { setPendingKodFilter(row.kod); onNavigate('sayim') }}
                      className="text-[12px] text-blue-600 hover:underline font-medium"
                    >İncele</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
