import { useState } from 'react'
import useStore from '../../store/useStore'
import { exportRaporFarklar } from '../../utils/excelExport'

const EMPTY_FORM = { kod: '', ad: '', adres: '', parti: '', durum: '', miktar: '', birim: '', not: '' }

export default function KorSayimRapor({ onNavigate }) {
  const { korMatched, results, session, setPendingKodFilter, manualRows, addManualRow, removeManualRow } = useStore()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const rows = korMatched

  async function handleAddManual(e) {
    e.preventDefault()
    if (!form.kod.trim() || !form.miktar) return
    setSaving(true)
    await addManualRow({
      kod:    form.kod.trim().toUpperCase(),
      ad:     form.ad.trim(),
      adres:  form.adres.trim(),
      parti:  form.parti.trim(),
      durum:  form.durum.trim(),
      miktar: form.miktar,
      birim:  form.birim.trim(),
      not:    form.not.trim(),
    })
    setSaving(false)
    setForm(EMPTY_FORM)
    setShowForm(false)
  }

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

  if (rows.length === 0) {
    return (
      <div className="flex flex-col gap-5">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Kör Stok Sayım Raporu</h1>
          <p className="text-[13px] text-slate-500 mt-0.5">Kör sayım listesi henüz oluşturulmadı</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <span className="ms text-slate-300 mb-3 block" style={{ fontSize: 48 }}>summarize</span>
          <div className="text-[14px] font-semibold text-slate-700 mb-1">Rapor Oluşturulamadı</div>
          <div className="text-[13px] text-slate-400 mb-4">Önce Kör Stok Sayımı sayfasından liste oluşturun</div>
          <button onClick={() => onNavigate('kor')} className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-[13px] font-semibold hover:bg-blue-700">
            <span className="ms" style={{ fontSize: 16 }}>visibility_off</span> Kör Sayım Sayfasına Git
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5 print-content">
      {/* Başlık */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Kör Stok Sayım Raporu</h1>
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
              ? 'Henüz sayım yapılmamış. Kör Sayım sayfasından başlayın.'
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
                <th className="px-3 py-1.5">Parti</th>
                <th className="px-3 py-1.5">Durum</th>
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
                  <td className="px-3 py-1.5 mono text-slate-500 text-[12px]">{row.parti || '—'}</td>
                  <td className="px-3 py-1.5 text-[12px] text-slate-500">{row.durum || '—'}</td>
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
                      onClick={() => { setPendingKodFilter(row.kod); onNavigate('kor') }}
                      className="text-[12px] text-blue-600 hover:underline font-medium"
                    >İncele</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Manuel Eklenen Kalemler */}
      <div className="bg-white rounded-xl border border-amber-200 overflow-hidden">
        <div className="px-4 py-2.5 border-b border-amber-100 flex items-center justify-between bg-amber-50">
          <div className="flex items-center gap-2">
            <span className="ms text-amber-600" style={{ fontSize: 18 }}>add_box</span>
            <p className="text-[13px] font-semibold text-amber-900">
              Sistemde Bulunmayan Kalemler
              {manualRows.length > 0 && <span className="badge bg-amber-100 text-amber-700 ml-2">{manualRows.length}</span>}
            </p>
          </div>
          <button
            onClick={() => { setShowForm(f => !f); setForm(EMPTY_FORM) }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[12.5px] font-semibold no-print"
          >
            <span className="ms" style={{ fontSize: 15 }}>{showForm ? 'close' : 'add'}</span>
            {showForm ? 'İptal' : 'Manuel Ekle'}
          </button>
        </div>

        {/* Ekleme Formu */}
        {showForm && (
          <form onSubmit={handleAddManual} className="px-4 py-3 border-b border-amber-100 bg-amber-50/40 no-print flex flex-col gap-2">
            <div className="grid grid-cols-6 gap-2">
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Stok Kodu *</label>
                <input
                  autoFocus
                  type="text"
                  value={form.kod}
                  onChange={e => setForm(f => ({ ...f, kod: e.target.value }))}
                  placeholder="KOD123"
                  className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-[12.5px] mono focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                  required
                />
              </div>
              <div className="col-span-2">
                <label className="block text-[11px] text-slate-500 mb-1">Ürün Adı</label>
                <input
                  type="text"
                  value={form.ad}
                  onChange={e => setForm(f => ({ ...f, ad: e.target.value }))}
                  placeholder="Ürün adı..."
                  className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-[12.5px] focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Adres</label>
                <input
                  type="text"
                  value={form.adres}
                  onChange={e => setForm(f => ({ ...f, adres: e.target.value }))}
                  placeholder="A-01-1-1"
                  className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-[12.5px] mono focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Parti</label>
                <input
                  type="text"
                  value={form.parti}
                  onChange={e => setForm(f => ({ ...f, parti: e.target.value }))}
                  placeholder="PT240101"
                  className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-[12.5px] mono focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Durum</label>
                <input
                  type="text"
                  value={form.durum}
                  onChange={e => setForm(f => ({ ...f, durum: e.target.value }))}
                  placeholder="Serbest / KK..."
                  className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-[12.5px] focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                />
              </div>
            </div>
            <div className="grid grid-cols-6 gap-2 items-end">
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Sayılan Miktar *</label>
                <div className="flex gap-1">
                  <input
                    type="number"
                    value={form.miktar}
                    onChange={e => setForm(f => ({ ...f, miktar: e.target.value }))}
                    placeholder="0"
                    className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-[12.5px] mono focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                    required
                  />
                  <input
                    type="text"
                    value={form.birim}
                    onChange={e => setForm(f => ({ ...f, birim: e.target.value }))}
                    placeholder="KG"
                    className="w-16 border border-slate-300 rounded-lg px-2 py-1.5 text-[12.5px] mono focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                  />
                </div>
              </div>
              <div className="col-span-4">
                <label className="block text-[11px] text-slate-500 mb-1">Not</label>
                <input
                  type="text"
                  value={form.not}
                  onChange={e => setForm(f => ({ ...f, not: e.target.value }))}
                  placeholder="Açıklama..."
                  className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-[12.5px] focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={saving || !form.kod.trim() || !form.miktar}
                  className="w-full px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[12.5px] font-semibold disabled:opacity-40"
                >
                  {saving ? '…' : 'Ekle'}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Manuel kayıt listesi */}
        {manualRows.length === 0 ? (
          <div className="px-4 py-6 text-center text-[12.5px] text-slate-400">
            Sistemde bulunmayan ürün eklemek için "Manuel Ekle" butonunu kullanın.
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[11px] mono text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <th className="px-3 py-1.5">Kod / Ad</th>
                <th className="px-3 py-1.5">Parti</th>
                <th className="px-3 py-1.5">Durum</th>
                <th className="px-3 py-1.5">Adres</th>
                <th className="px-3 py-1.5 text-right">Sistem</th>
                <th className="px-3 py-1.5 text-right">Sayılan</th>
                <th className="px-3 py-1.5 text-right">Fark</th>
                <th className="px-3 py-1.5">Not</th>
                <th className="px-3 py-1.5 no-print"></th>
              </tr>
            </thead>
            <tbody className="text-[12.5px] divide-y divide-slate-50">
              {manualRows.map((row, i) => (
                <tr key={row.id} className={i % 2 === 1 ? 'bg-amber-50/30' : ''}>
                  <td className="px-3 py-1.5">
                    <p className="mono font-semibold text-amber-700 text-[11px]">{row.kod}</p>
                    <p className="text-slate-700">{row.ad || <span className="text-slate-400 italic">—</span>}</p>
                  </td>
                  <td className="px-3 py-1.5 mono text-slate-500 text-[12px]">{row.parti || '—'}</td>
                  <td className="px-3 py-1.5 text-slate-500 text-[12px]">{row.durum || '—'}</td>
                  <td className="px-3 py-1.5 mono text-slate-500 text-[12px]">{row.adres || '—'}</td>
                  <td className="px-3 py-1.5 text-right mono text-slate-400">0</td>
                  <td className="px-3 py-1.5 text-right mono font-bold text-emerald-600">
                    +{row.miktar} <span className="text-emerald-400 text-[11px]">{row.birim}</span>
                  </td>
                  <td className="px-3 py-1.5 text-right mono font-bold text-emerald-600">
                    +{row.miktar} <span className="opacity-60 text-[11px]">{row.birim}</span>
                  </td>
                  <td className="px-3 py-1.5 text-slate-500 text-[12px]">{row.not || '—'}</td>
                  <td className="px-3 py-1.5 text-center no-print">
                    <button
                      onClick={() => removeManualRow(row.id)}
                      className="text-slate-400 hover:text-red-500 transition-colors"
                      title="Sil"
                    >
                      <span className="ms" style={{ fontSize: 16 }}>delete</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
