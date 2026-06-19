import { useState, useRef, useMemo, useEffect } from 'react'
import { useReactToPrint } from 'react-to-print'
import useStore from '../../store/useStore'
import { sortRows, getUniqueAdresValues, parseAdres } from '../../utils/adresUtils'
import { exportResults } from '../../utils/excelExport'
import PrintSheet from '../print/PrintSheet'

function DurumBadge({ durum }) {
  return (
    <span className={
      'badge ' +
      (durum === 'Normal' ? 'badge-normal' : durum === 'Bloke' ? 'badge-bloke' : durum === 'SKTG' ? 'badge-sktg' : 'badge-normal')
    }>
      {durum || '—'}
    </span>
  )
}

export default function StokSayim({ onNavigate }) {
  const { rows, results, session, updateResult, fillFromSistem, pendingKodFilter, clearPendingKodFilter } = useStore()
  const printRef = useRef()

  const [hideSistem, setHideSistem] = useState(false)
  const [hideSayilan, setHideSayilan] = useState(false)
  const [filterSearch, setFilterSearch] = useState('')
  const [filterDurum, setFilterDurum] = useState('')
  const [filterRaf, setFilterRaf] = useState('')
  const [filterSira, setFilterSira] = useState('')
  const [filterKolon, setFilterKolon] = useState('')
  const [filterGoz, setFilterGoz] = useState('')
  const [onlyDiff, setOnlyDiff] = useState(false)
  const [sortType, setSortType] = useState('1')

  const handlePrint = useReactToPrint({ contentRef: printRef })

  useEffect(() => {
    if (pendingKodFilter) {
      setFilterSearch(pendingKodFilter)
      clearPendingKodFilter()
    }
  }, [pendingKodFilter])

  function toggleSistem() {
    const next = !hideSistem
    setHideSistem(next)
    document.body.classList.toggle('hide-sistem', next)
  }
  function toggleSayilan() {
    const next = !hideSayilan
    setHideSayilan(next)
    document.body.classList.toggle('hide-sayilan', next)
  }

  const adresVals = useMemo(() => getUniqueAdresValues(rows), [rows])

  const filtered = useMemo(() => {
    const q = filterSearch.trim().toLowerCase()
    let result = rows.filter(r => {
      if (q && !(
        r.kod?.toLowerCase().includes(q) ||
        r.ad?.toLowerCase().includes(q) ||
        r.parti?.toLowerCase().includes(q)
      )) return false
      if (filterDurum && r.durum !== filterDurum) return false
      const p = parseAdres(r.adres)
      if (filterRaf   && p.raf   !== filterRaf)   return false
      if (filterSira  && p.sira  !== filterSira)  return false
      if (filterKolon && p.kolon !== filterKolon) return false
      if (filterGoz   && p.goz   !== filterGoz)   return false
      if (onlyDiff) {
        const m = results[r.id]?.miktar
        if (m === undefined || m === '' || String(m) === String(r.sayim)) return false
      }
      return true
    })
    return sortRows(result, sortType)
  }, [rows, results, filterSearch, filterDurum, filterRaf, filterSira, filterKolon, filterGoz, onlyDiff, sortType])

  const counted   = useMemo(() => rows.filter(r => results[r.id]?.miktar !== undefined && results[r.id]?.miktar !== ''), [rows, results])
  const diffCount = useMemo(() => rows.filter(r => { const m = results[r.id]?.miktar; return m !== undefined && m !== '' && String(m) !== String(r.sayim) }).length, [rows, results])
  const waiting   = rows.length - counted.length

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* ── Üst Bar ── */}
      <div className="px-5 pt-3 pb-2 bg-white border-b border-slate-200 shrink-0">

        {/* Satır 1: Başlık + Aksiyon Butonları */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-[15px] font-bold text-slate-900">Stok Sayımı</h1>
            <p className="text-[11.5px] text-slate-400 mono">
              {rows.length.toLocaleString('tr')} kalem
              {counted.length > 0 && ` · %${rows.length ? Math.round(counted.length / rows.length * 100) : 0} sayıldı`}
              {diffCount > 0 && ` · ${diffCount} fark`}
            </p>
          </div>
          <div className="flex items-center gap-2 no-print">
            <button onClick={toggleSistem} className={'toggle-btn ' + (hideSistem ? 'active-hide' : '')}>
              <span className="ms" style={{ fontSize: 16 }}>{hideSistem ? 'visibility_off' : 'visibility'}</span>
              <span>{hideSistem ? 'Sistemi Göster' : 'Sistemi Gizle'}</span>
            </button>
            <button onClick={toggleSayilan} className={'toggle-btn ' + (hideSayilan ? 'active-hide' : '')}>
              <span className="ms" style={{ fontSize: 16 }}>{hideSayilan ? 'edit' : 'edit_off'}</span>
              <span>{hideSayilan ? 'Sayılanı Göster' : 'Sayılanı Gizle'}</span>
            </button>
            <button onClick={handlePrint} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-[12.5px] font-medium text-slate-700 hover:bg-slate-50">
              <span className="ms" style={{ fontSize: 15 }}>print</span> Yazdır
            </button>
            <button onClick={() => exportResults(rows, results, session)} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-[12.5px] font-medium text-slate-700 hover:bg-slate-50">
              <span className="ms" style={{ fontSize: 15 }}>download</span> Excel'e Aktar
            </button>
            <button
              onClick={() => {
                if (window.confirm(`${filtered.length} satırın sayılan miktarı sistem miktarıyla doldurulsun mu?`))
                  fillFromSistem(filtered)
              }}
              disabled={filtered.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-[12.5px] font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
            >
              <span className="ms" style={{ fontSize: 15 }}>content_copy</span> Sistemden Doldur
            </button>
            <button onClick={() => onNavigate('upload')} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-[12.5px] font-semibold hover:bg-blue-700">
              <span className="ms" style={{ fontSize: 15 }}>upload_file</span> RAPOR5 Yükle
            </button>
          </div>
        </div>

        {/* Satır 2: Filtreler + Sıralama */}
        <div className="flex items-center gap-2 flex-wrap no-print">
          {/* Arama çubuğu */}
          <div className="relative">
            <span className="ms absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" style={{ fontSize: 14 }}>search</span>
            <input
              type="text"
              value={filterSearch}
              onChange={e => setFilterSearch(e.target.value)}
              placeholder="Kod / Ad / Parti ara…"
              className="pl-7 pr-7 py-1 border border-slate-200 rounded-lg text-[12px] focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 w-44"
            />
            {filterSearch && (
              <button
                onClick={() => setFilterSearch('')}
                className="ms absolute right-2 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500"
                style={{ fontSize: 14 }}
              >close</button>
            )}
          </div>
          <span className="text-[11.5px] text-slate-400 font-medium">Filtre:</span>
          <select className="fsel" value={filterDurum} onChange={e => setFilterDurum(e.target.value)}>
            <option value="">Tüm Durumlar</option>
            <option>Normal</option><option>Bloke</option><option>SKTG</option>
          </select>
          <select className="fsel" value={filterRaf} onChange={e => setFilterRaf(e.target.value)}>
            <option value="">Tüm Raflar</option>
            {adresVals.raflar.map(v => <option key={v}>{v}</option>)}
          </select>
          <select className="fsel" value={filterSira} onChange={e => setFilterSira(e.target.value)}>
            <option value="">Tüm Sıralar</option>
            {adresVals.siralar.map(v => <option key={v}>{v}</option>)}
          </select>
          <select className="fsel" value={filterKolon} onChange={e => setFilterKolon(e.target.value)}>
            <option value="">Tüm Kolonlar</option>
            {adresVals.kolonlar.map(v => <option key={v}>{v}</option>)}
          </select>
          <select className="fsel" value={filterGoz} onChange={e => setFilterGoz(e.target.value)}>
            <option value="">Tüm Gözler</option>
            {adresVals.gozler.map(v => <option key={v}>{v}</option>)}
          </select>
          <label className="flex items-center gap-1.5 text-[11.5px] text-slate-500 cursor-pointer ml-1">
            <input type="checkbox" checked={onlyDiff} onChange={e => setOnlyDiff(e.target.checked)} className="rounded" />
            Sadece farklılıklar
          </label>
          <div className="ml-auto flex items-center gap-1.5">
            <span className="text-[11.5px] text-slate-400 font-medium">Sıra:</span>
            <select className="fsel" style={{ borderColor: '#93c5fd' }} value={sortType} onChange={e => setSortType(e.target.value)}>
              <option value="1">Raf › Sıra › Kolon › Göz</option>
              <option value="2">Raf › Sıra › Göz › Kolon</option>
            </select>
          </div>
        </div>

        {/* Satır 3: Mini İstatistik */}
        <div className="flex items-center gap-5 mt-2">
          <div className="flex items-center gap-1.5 text-[11.5px] text-slate-500">
            <span className="w-2 h-2 rounded-full bg-blue-500 inline-block"></span>
            Sayılan: <strong className="text-slate-700 ml-0.5">{counted.length.toLocaleString('tr')}</strong>
          </div>
          <div className="flex items-center gap-1.5 text-[11.5px] text-slate-500">
            <span className="w-2 h-2 rounded-full bg-red-400 inline-block"></span>
            Farklılık: <strong className="text-red-600 ml-0.5">{diffCount.toLocaleString('tr')}</strong>
          </div>
          <div className="flex items-center gap-1.5 text-[11.5px] text-slate-500">
            <span className="w-2 h-2 rounded-full bg-slate-300 inline-block"></span>
            Bekliyor: <strong className="text-slate-700 ml-0.5">{waiting.toLocaleString('tr')}</strong>
          </div>
        </div>
      </div>

      {/* ── Tablo ── */}
      {rows.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center bg-slate-50">
          <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mb-4 shadow-sm">
            <span className="ms text-slate-300" style={{ fontSize: 32 }}>upload_file</span>
          </div>
          <div className="text-slate-600 font-semibold text-sm mb-1">Henüz dosya yüklenmedi</div>
          <div className="text-slate-400 text-[13px] mb-4">RAPOR5.xls veya Sku_Sayım_Listesi.xlsx yükleyin</div>
          <button onClick={() => onNavigate('upload')} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-[13px] font-semibold hover:bg-blue-700">
            <span className="ms" style={{ fontSize: 18 }}>upload_file</span> Excel Yükle
          </button>
        </div>
      ) : (
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse" style={{ minWidth: 1100 }}>
            <thead className="sticky top-0 z-10">
              <tr className="bg-slate-800 text-white text-[11px] mono uppercase tracking-wider">
                <th className="px-3 py-2.5 text-center w-8">#</th>
                <th className="px-3 py-2.5 w-24">Adres</th>
                <th className="px-3 py-2.5 w-28">Kod</th>
                <th className="px-3 py-2.5">Ad</th>
                <th className="px-3 py-2.5 w-28">Parti</th>
                <th className="px-3 py-2.5 w-20 text-center">Durum</th>
                <th className="px-3 py-2.5 w-12 text-right">Adet</th>
                <th className="px-3 py-2.5 w-24">Ambalaj</th>
                <th className="px-3 py-2.5 w-20 text-right sistem-col">Sistem</th>
                <th className="px-3 py-2.5 w-24 text-right text-blue-300 sayilan-col">Sayılan ▾</th>
                <th className="px-3 py-2.5 w-12">Birim</th>
                <th className="px-3 py-2.5">Not</th>
              </tr>
            </thead>
            <tbody className="text-[12.5px]">
              {filtered.map((row, i) => {
                const res = results[row.id] || {}
                const hasValue = res.miktar !== undefined && res.miktar !== ''
                const isDiff = hasValue && String(res.miktar) !== String(row.sayim)
                return (
                  <tr
                    key={row.id}
                    className={isDiff ? 'border-b border-slate-100 hover:bg-red-50' : 'border-b border-slate-100 hover:bg-blue-50/30'}
                    style={isDiff ? { background: 'rgba(254,242,242,0.6)' } : i % 2 === 1 ? { background: '#f8fafc' } : {}}
                  >
                    <td className="px-3 py-2 text-center text-slate-400 mono text-[11px]">{i + 1}</td>
                    <td className="px-3 py-2 mono text-slate-600 text-[11.5px]">{row.adres}</td>
                    <td className="px-3 py-2 mono font-medium text-blue-700 text-[11.5px]">{row.kod}</td>
                    <td className="px-3 py-2 font-medium text-slate-800">{row.ad}</td>
                    <td className="px-3 py-2 mono text-slate-500 text-[11px]">{row.parti}</td>
                    <td className="px-3 py-2 text-center"><DurumBadge durum={row.durum} /></td>
                    <td className="px-3 py-2 text-right mono">{row.adet1}</td>
                    <td className="px-3 py-2 text-slate-500 text-[12px]">{row.ambalaj}</td>
                    <td className="px-3 py-2 text-right mono text-slate-500 sistem-col">{row.sayim}</td>
                    <td className="px-3 py-2 text-right sayilan-col">
                      <div className="flex items-center justify-end gap-1">
                        <input
                          type="number"
                          value={res.miktar ?? ''}
                          onChange={e => updateResult(row.id, { miktar: e.target.value })}
                          placeholder="—"
                          className={'input-count ' + (isDiff ? 'input-diff' : hasValue ? 'input-ok' : '')}
                        />
                        {isDiff && <span className="ms text-red-400" style={{ fontSize: 14 }}>warning</span>}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-slate-400 text-[12px]">{row.birim}</td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={res.notlar ?? ''}
                        onChange={e => updateResult(row.id, { notlar: e.target.value })}
                        placeholder="not..."
                        className="w-full bg-transparent border-none text-[12px] text-slate-400 placeholder-slate-300 outline-none"
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {filtered.length === 0 && rows.length > 0 && (
            <div className="p-8 text-center text-[11.5px] text-slate-400">Filtreye uyan kayıt yok.</div>
          )}
          {rows.length > 0 && (
            <div className="p-4 text-center text-[11.5px] text-slate-400 border-t border-slate-100">
              {filtered.length.toLocaleString('tr')} satır gösteriliyor · Toplam {rows.length.toLocaleString('tr')} kayıt
            </div>
          )}
        </div>
      )}

      {/* ── Alt Bar ── */}
      {rows.length > 0 && (
        <div className="px-5 py-2.5 bg-white border-t border-slate-200 flex items-center justify-between shrink-0 no-print">
          <p className="text-[11.5px] text-slate-400">Son kayıt: <span className="mono font-medium text-slate-600">{new Date().toLocaleTimeString('tr')}</span></p>
          <div className="flex gap-2">
            <button className="px-4 py-2 border border-slate-300 rounded-lg text-[12.5px] font-medium text-slate-700 hover:bg-slate-50">
              Taslak Kaydet
            </button>
            <button onClick={() => onNavigate('rapor')} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-[12.5px] font-semibold hover:bg-blue-700">
              Sayımı Tamamla <span className="ms" style={{ fontSize: 17 }}>arrow_forward</span>
            </button>
          </div>
        </div>
      )}

      <div className="hidden">
        <PrintSheet ref={printRef} rows={filtered} results={results} session={session} mode="sayim" hideSayilan={hideSayilan} />
      </div>
    </div>
  )
}
