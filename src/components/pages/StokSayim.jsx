import { useRef } from 'react'
import { useReactToPrint } from 'react-to-print'
import useStore from '../../store/useStore'
import StatCard from '../shared/StatCard'
import StatusBadge from '../shared/StatusBadge'
import FileDropZone from '../shared/FileDropZone'
import PrintSheet from '../print/PrintSheet'

export default function StokSayim({ onNavigate }) {
  const { rows, results, session, importRows, updateResult } = useStore()
  const printRef = useRef()

  const handlePrint = useReactToPrint({ content: () => printRef.current })

  const counted = rows.filter(r => results[r.id]?.miktar !== undefined && results[r.id]?.miktar !== '')
  const discrepancies = rows.filter(r => {
    const m = results[r.id]?.miktar
    return m !== undefined && m !== '' && String(m) !== String(r.sayim)
  })

  return (
    <div className="max-w-[1400px] mx-auto">
      {/* Page header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-on-background tracking-tight">{session.sayimBasligi || 'Stok Sayımı'}</h2>
          <p className="text-sm text-on-surface-variant mt-1">{session.depoAdi} • Başlangıç: {session.tarih || '--'}</p>
        </div>
        <div className="flex space-x-3">
          <button onClick={handlePrint} className="flex items-center space-x-2 bg-surface border border-outline-variant text-on-surface px-4 py-2 rounded text-sm font-semibold hover:bg-surface-container transition-colors no-print">
            <span className="material-symbols-outlined text-[20px]">print</span>
            <span>Listeyi Yazdır</span>
          </button>
          <button onClick={() => onNavigate('kor-sayim')} className="flex items-center space-x-2 bg-secondary-container text-on-secondary-container px-4 py-2 rounded text-sm font-bold hover:bg-secondary-fixed transition-colors no-print">
            <span className="material-symbols-outlined text-[20px]">visibility_off</span>
            <span>Kör Sayım</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard label="Toplam SKU" value={rows.length.toLocaleString('tr')} icon="inventory_2" />
        <StatCard
          label="Sayılan"
          value={counted.length}
          sub={rows.length ? `/ ${rows.length} (%${Math.round(counted.length / rows.length * 100)})` : '/ 0'}
          icon="check_circle"
          variant="primary"
        />
        <StatCard label="Farklılıklar" value={discrepancies.length} sub="İncelenmesi gerekiyor" icon="warning" variant="error" />
      </div>

      {/* Import area if no rows */}
      {rows.length === 0 && (
        <div className="mb-6">
          <FileDropZone
            label="Sku_Sayım_Listesi.xlsx dosyasını yükleyin"
            onFile={importRows}
          />
        </div>
      )}

      {/* Table */}
      {rows.length > 0 && (
        <div className="bg-surface border border-outline-variant rounded flex flex-col overflow-hidden mb-8">
          <div className="flex justify-between items-center p-4 border-b border-outline-variant bg-surface-container-low">
            <div className="flex items-center space-x-2">
              <span className="material-symbols-outlined text-on-surface-variant">filter_list</span>
              <span className="text-sm text-on-surface-variant">{rows.length.toLocaleString('tr')} kayıt</span>
            </div>
            <div className="flex items-center space-x-2 text-xs text-on-surface-variant" style={{fontFamily: '"JetBrains Mono", monospace'}}>
              <button onClick={() => importRows(null)} className="px-3 py-1 border border-outline-variant rounded hover:bg-surface-container-high text-xs">
                Listeyi Temizle
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1100px]">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant">
                  {['No','Adres','Kod','Ad','Parti','Durum','Adet1','Ambalaj','Sayım (Sistem)','Sayılan','Birim','Not'].map(h => (
                    <th key={h} className="p-3 text-[10px] font-medium text-on-surface-variant uppercase tracking-wider" style={{fontFamily: '"JetBrains Mono", monospace'}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="text-sm">
                {rows.slice(0, 200).map((row, i) => {
                  const res = results[row.id] || {}
                  const hasValue = res.miktar !== undefined && res.miktar !== ''
                  const isDiscrepancy = hasValue && String(res.miktar) !== String(row.sayim)
                  return (
                    <tr key={row.id} className={`zebra-stripe border-b border-outline-variant hover:bg-surface-container-high transition-colors ${isDiscrepancy ? 'bg-error-container/10 border-error/30' : ''}`}>
                      <td className="p-3 text-center text-on-surface-variant text-xs" style={{fontFamily: '"JetBrains Mono", monospace'}}>{row.siraNo}</td>
                      <td className="p-3 text-xs" style={{fontFamily: '"JetBrains Mono", monospace'}}>{row.adres}</td>
                      <td className="p-3 text-xs text-primary font-medium" style={{fontFamily: '"JetBrains Mono", monospace'}}>{row.kod}</td>
                      <td className="p-3 font-medium text-on-surface max-w-[200px] truncate">{row.ad}</td>
                      <td className="p-3 text-xs text-on-surface-variant" style={{fontFamily: '"JetBrains Mono", monospace'}}>{row.parti}</td>
                      <td className="p-3"><StatusBadge status={row.durum} /></td>
                      <td className="p-3 text-right text-xs" style={{fontFamily: '"JetBrains Mono", monospace'}}>{row.adet1}</td>
                      <td className="p-3 text-xs text-on-surface-variant">{row.ambalaj}</td>
                      <td className="p-3 text-right text-xs text-on-surface-variant" style={{fontFamily: '"JetBrains Mono", monospace'}}>{row.sayim}</td>
                      <td className="p-3 w-28">
                        <div className="relative">
                          <input
                            type="number"
                            value={res.miktar ?? ''}
                            onChange={e => updateResult(row.id, { miktar: e.target.value })}
                            placeholder="--"
                            className={`w-full border rounded px-2 py-1.5 text-right text-xs h-9 focus:outline-none ${
                              isDiscrepancy
                                ? 'border-2 border-error text-error font-bold'
                                : hasValue
                                ? 'border border-outline-variant text-on-surface'
                                : 'border-2 border-primary focus:ring-1 focus:ring-primary'
                            }`}
                            style={{fontFamily: '"JetBrains Mono", monospace'}}
                          />
                          {hasValue && !isDiscrepancy && (
                            <span className="material-symbols-outlined absolute right-[-22px] top-1/2 -translate-y-1/2 text-primary text-[16px]">check</span>
                          )}
                          {isDiscrepancy && (
                            <span className="material-symbols-outlined absolute right-[-22px] top-1/2 -translate-y-1/2 text-error text-[16px]">warning</span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-xs text-on-surface-variant">{row.birim}</td>
                      <td className="p-3 min-w-[120px]">
                        <input
                          type="text"
                          value={res.notlar ?? ''}
                          onChange={e => updateResult(row.id, { notlar: e.target.value })}
                          placeholder="Not ekle..."
                          className="w-full bg-transparent border-none text-xs text-on-surface-variant placeholder:text-outline focus:outline-none focus:ring-0 p-0"
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {rows.length > 200 && (
              <div className="p-4 text-center text-sm text-on-surface-variant border-t border-outline-variant">
                İlk 200 kayıt gösteriliyor. Toplamda {rows.length.toLocaleString('tr')} kayıt yüklü. Yazdırma tüm listeyi kapsar.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer actions */}
      {rows.length > 0 && (
        <div className="flex justify-between items-center bg-surface border border-outline-variant p-4 rounded no-print">
          <span className="text-sm text-on-surface-variant">Son kayıt: {new Date().toLocaleTimeString('tr')}</span>
          <div className="flex space-x-4">
            <button className="px-6 py-3 border border-outline text-sm font-semibold rounded text-on-surface hover:bg-surface-container-high transition-colors">
              Taslağı Kaydet
            </button>
            <button
              onClick={() => onNavigate('raporlar')}
              className="px-6 py-3 bg-primary text-on-primary text-sm font-bold rounded hover:bg-on-primary-fixed-variant transition-colors flex items-center space-x-2"
            >
              <span>Sayımı Tamamla</span>
              <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
            </button>
          </div>
        </div>
      )}

      {/* Hidden print area */}
      <div className="hidden">
        <PrintSheet ref={printRef} rows={rows} results={results} session={session} blindMode={false} />
      </div>
    </div>
  )
}
