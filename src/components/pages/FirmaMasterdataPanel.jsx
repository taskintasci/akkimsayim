import { useState, useRef } from 'react'
import useStore from '../../store/useStore'
import { parseSkuMasterdataFile, parseLokasyonFile } from '../../utils/masterdataImport'
import { exportSkuMasterdataTemplate, exportLokasyonMasterdataTemplate } from '../../utils/excelExport'

function MasterdataSection({ title, desc, count, onDownloadTemplate, onParse, onUpload }) {
  const inputRef = useRef()
  const [dragging, setDragging] = useState(false)
  const [parsing, setParsing]   = useState(false)
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview]   = useState(null) // parse edilmiş, onay bekleyen öğeler
  const [error, setError]       = useState('')

  async function handleFile(file) {
    if (!file) return
    setError('')
    setParsing(true)
    try {
      const items = await onParse(file)
      if (items.length === 0) throw new Error('Dosyada geçerli satır bulunamadı.')
      setPreview(items)
    } catch (err) {
      setError(err?.message || 'Dosya okunamadı.')
    } finally {
      setParsing(false)
    }
  }

  function onDrop(e) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  async function confirmUpload() {
    setUploading(true)
    setError('')
    try {
      await onUpload(preview)
      setPreview(null)
    } catch (err) {
      setError(err?.message || 'Yüklenemedi.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="border border-slate-200 rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="text-sm font-semibold text-slate-800">{title}</div>
          <div className="text-[11.5px] text-slate-400">{desc}</div>
        </div>
        <div className={
          'text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ' +
          (count > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600')
        }>
          {count > 0 ? `${count.toLocaleString('tr')} kayıt` : 'Yüklenmedi'}
        </div>
      </div>

      {preview ? (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center justify-between gap-3">
          <div className="text-[12.5px] text-blue-800">
            <strong>{preview.length.toLocaleString('tr')}</strong> kayıt okundu. Mevcut listenin tamamen yerini alacak.
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => setPreview(null)} disabled={uploading} className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700">İptal</button>
            <button
              onClick={confirmUpload}
              disabled={uploading}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-semibold rounded-lg"
            >
              {uploading ? 'Yükleniyor…' : 'Onayla ve Yükle'}
            </button>
          </div>
        </div>
      ) : (
        <div
          onDrop={onDrop}
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onClick={() => inputRef.current?.click()}
          className={
            'border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all ' +
            (dragging ? 'border-blue-400 bg-blue-50' : 'border-slate-300 hover:border-blue-300 hover:bg-slate-50')
          }
        >
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={e => { const f = e.target.files[0]; if (f) handleFile(f); e.target.value = '' }}
          />
          {parsing ? (
            <span className="text-xs text-slate-400 flex items-center justify-center gap-1.5">
              <span className="ms animate-spin" style={{ fontSize: 15 }}>progress_activity</span> Okunuyor…
            </span>
          ) : (
            <span className="text-xs text-slate-500">Dosya sürükleyin veya seçin (.xlsx, .xls) — {count > 0 ? 'değiştirmek için' : 'yüklemek için'}</span>
          )}
        </div>
      )}
      {error && <div className="mt-2 text-xs text-red-600">{error}</div>}
      <button onClick={onDownloadTemplate} className="mt-2 flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800">
        <span className="ms" style={{ fontSize: 13 }}>download</span> Şablon İndir
      </button>
    </div>
  )
}

// firma: {id, ad, skuMasterdataSayisi, lokasyonSayisi} — süper yönetici (Firma
// Yönetimi, herhangi bir firma) ve firmanın kendi yöneticisi (Ayarlar →
// Masterdata, sadece kendi firması) tarafından ortak kullanılır.
export default function FirmaMasterdataPanel({ firma }) {
  const { uploadFirmaSkuMasterdata, uploadFirmaLokasyonlar } = useStore()
  if (!firma) return null

  return (
    <div className="flex flex-col gap-4">
      <MasterdataSection
        title="SKU Masterdata"
        desc="Kod / Ad / Birim"
        count={firma.skuMasterdataSayisi || 0}
        onDownloadTemplate={exportSkuMasterdataTemplate}
        onParse={parseSkuMasterdataFile}
        onUpload={items => uploadFirmaSkuMasterdata(firma.id, items)}
      />
      <MasterdataSection
        title="Lokasyonlar"
        desc="Tek sütun: Lokasyon"
        count={firma.lokasyonSayisi || 0}
        onDownloadTemplate={exportLokasyonMasterdataTemplate}
        onParse={parseLokasyonFile}
        onUpload={items => uploadFirmaLokasyonlar(firma.id, items)}
      />
    </div>
  )
}
