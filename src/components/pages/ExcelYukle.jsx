import { useRef, useState } from 'react'
import useStore from '../../store/useStore'

export default function ExcelYukle({ onNavigate }) {
  const { rows, importRows, importFormat } = useStore()
  const inputRef = useRef()
  const [dragging, setDragging] = useState(false)

  function handleFile(file) {
    if (!file) return
    importRows(file)
  }

  function onDrop(e) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  function onDragOver(e) {
    e.preventDefault()
    setDragging(true)
  }

  function onDragLeave() {
    setDragging(false)
  }

  function onInputChange(e) {
    const file = e.target.files[0]
    if (file) handleFile(file)
    e.target.value = ''
  }

  const formatLabel = importFormat === 'rapor5' ? 'RAPOR5' : importFormat === 'sku' ? 'SKU Listesi' : '—'

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-800 mb-1">Excel Yükle</h1>
      <p className="text-sm text-slate-500 mb-6">RAPOR5.xls veya Sku_Sayım_Listesi.xlsx formatındaki dosyanızı yükleyin.</p>

      {/* Drop zone */}
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => inputRef.current?.click()}
        className={
          'border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all mb-6 ' +
          (dragging
            ? 'border-blue-500 bg-blue-50'
            : rows.length > 0
            ? 'border-green-400 bg-green-50'
            : 'border-slate-300 bg-white hover:border-blue-400 hover:bg-blue-50/30')
        }
      >
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={onInputChange}
        />
        {rows.length > 0 ? (
          <>
            <div className="w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center mx-auto mb-3">
              <span className="ms text-green-600" style={{ fontSize: 28 }}>check_circle</span>
            </div>
            <div className="text-lg font-bold text-green-700 mb-1">
              {rows.length.toLocaleString('tr')} satır yüklendi
            </div>
            <div className="text-sm text-slate-500">
              Format: <span className="font-semibold text-slate-700">{formatLabel}</span>
            </div>
            <div className="mt-4 text-xs text-slate-400">Farklı bir dosya yüklemek için tıklayın veya sürükleyin</div>
          </>
        ) : (
          <>
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
              <span className="ms text-slate-400" style={{ fontSize: 28 }}>upload_file</span>
            </div>
            <div className="text-base font-semibold text-slate-700 mb-1">
              {dragging ? 'Dosyayı bırakın' : 'Dosyayı sürükleyin veya seçin'}
            </div>
            <div className="text-sm text-slate-400">Excel dosyası (.xlsx, .xls)</div>
          </>
        )}
      </div>

      {/* RAPOR5 info card */}
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
            <span className="ms text-emerald-600" style={{ fontSize: 18 }}>table_view</span>
          </div>
          <div>
            <div className="font-semibold text-slate-800 text-[13.5px]">RAPOR5 Desteklenen Sütunlar</div>
            <div className="text-[11.5px] text-slate-400 mono">SAP dışa aktarım formatı · .xls ve .xlsx</div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-1">
          {['Adres', 'Kod', 'Ad', 'Parti', 'Durum', 'Palet Adet', 'Birim 1', 'Son Kırılım Miktar', 'Son Kırılım Birim', 'Barkod'].map(col => (
            <div key={col} className="flex items-center gap-1.5 text-[12.5px] text-slate-600">
              <span className="ms text-emerald-500 shrink-0" style={{ fontSize: 14 }}>check</span>
              {col}
            </div>
          ))}
        </div>
        <p className="text-[11.5px] text-slate-400 mt-3 pt-3 border-t border-slate-100">
          Kod içermeyen satırlar otomatik filtrelenir. Başlık satırı ilk 6 satırda otomatik bulunur.
        </p>
      </div>

      {/* Actions */}
      {rows.length > 0 && (
        <div className="flex gap-3 mt-6">
          <button
            onClick={() => onNavigate('sayim')}
            className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm flex items-center justify-center gap-2 transition-colors"
          >
            <span className="ms">fact_check</span>
            Stok Sayımına Geç
          </button>
          <button
            onClick={() => importRows(null)}
            className="px-4 py-3 border border-slate-300 text-slate-600 hover:bg-slate-50 rounded-xl text-sm font-medium transition-colors"
          >
            Temizle
          </button>
        </div>
      )}
    </div>
  )
}
