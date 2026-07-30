import { useState, useEffect } from 'react'
import useStore from '../../store/useStore'

const SABLON_OPTIONS = [
  { id: 'standart', label: 'Standart (RAPOR5 / SKU)', desc: 'Tüm Stok Sayımı, Kör Sayım, Hareketlilik, Membran sayfa ailesi' },
  { id: 'wms31',    label: 'WMS_Rapor_31',            desc: 'Palet barkodu / beyanname bazlı depo sayım sayfa ailesi' },
]

const EMPTY_FORM = { ad: '', unvan: '', sablon: 'standart' }

export default function FirmaYonetimi() {
  const { firmalar, loadFirmalar, createFirma, updateFirma } = useStore()
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { loadFirmalar().finally(() => setLoading(false)) }, [])

  async function handleCreate(e) {
    e.preventDefault()
    setError('')
    if (!form.ad.trim()) { setError('Firma adı gerekli.'); return }
    setSaving(true)
    try {
      await createFirma({ ad: form.ad.trim(), unvan: form.unvan.trim(), sablon: form.sablon })
      setForm(EMPTY_FORM)
    } catch (err) {
      setError('Firma oluşturulamadı: ' + (err?.message || ''))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold text-slate-800 mb-1">Firma Yönetimi</h1>
      <p className="text-sm text-slate-500 mb-5">Sisteme yeni firma ekleyin, mevcut firmaları düzenleyin.</p>

      {/* Yeni firma formu */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <span className="ms text-blue-500" style={{ fontSize: 18 }}>add_business</span>
          Yeni Firma Ekle
        </h3>
        <form onSubmit={handleCreate} className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Firma Adı</label>
            <input type="text" value={form.ad}
              onChange={e => setForm(f => ({ ...f, ad: e.target.value }))}
              placeholder="Örn: Yeni Firma A.Ş."
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Yasal Unvan (yazdırma/export'ta kullanılır)</label>
            <input type="text" value={form.unvan}
              onChange={e => setForm(f => ({ ...f, unvan: e.target.value }))}
              placeholder="Örn: YENİ FİRMA SAN. TİC. A.Ş."
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200" />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Sayım Şablonu</label>
            <div className="flex flex-col gap-2">
              {SABLON_OPTIONS.map(s => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, sablon: s.id }))}
                  className={
                    'flex items-center gap-3 p-3 rounded-xl border text-left transition-all ' +
                    (form.sablon === s.id
                      ? 'bg-blue-50 border-blue-400 ring-1 ring-blue-400'
                      : 'bg-white border-slate-200 hover:border-slate-300')
                  }
                >
                  <div className="flex-1">
                    <div className="text-slate-800 text-sm font-medium">{s.label}</div>
                    <div className="text-slate-400 text-xs">{s.desc}</div>
                  </div>
                  {form.sablon === s.id && <span className="ms text-blue-500" style={{ fontSize: 18 }}>check_circle</span>}
                </button>
              ))}
            </div>
          </div>
          {error && <div className="col-span-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-red-700 text-sm">{error}</div>}
          <div className="col-span-2">
            <button type="submit" disabled={saving}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm font-semibold rounded-xl flex items-center gap-2 transition-colors">
              <span className={'ms ' + (saving ? 'animate-spin' : '')} style={{ fontSize: 18 }}>
                {saving ? 'progress_activity' : 'add'}
              </span>
              {saving ? 'Oluşturuluyor…' : 'Firma Oluştur'}
            </button>
          </div>
        </form>
      </div>

      {/* Firma listesi */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
          <span className="ms text-slate-400" style={{ fontSize: 18 }}>domain</span>
          <span className="text-sm font-semibold text-slate-700">Firmalar</span>
          <span className="badge bg-slate-100 text-slate-500">{firmalar.length}</span>
        </div>
        {loading ? (
          <div className="px-5 py-8 text-center text-sm text-slate-400 flex items-center justify-center gap-2">
            <span className="ms animate-spin" style={{ fontSize: 18 }}>progress_activity</span> Yükleniyor…
          </div>
        ) : firmalar.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-slate-400">Henüz firma yok.</div>
        ) : (
          <table className="w-full text-[13px]">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="px-5 py-2.5 text-left font-semibold">Firma Adı</th>
                <th className="px-5 py-2.5 text-left font-semibold">Unvan</th>
                <th className="px-5 py-2.5 text-left font-semibold">Şablon</th>
                <th className="px-5 py-2.5 text-right font-semibold">Durum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {firmalar.map(f => (
                <tr key={f.id} className="hover:bg-slate-50/50">
                  <td className="px-5 py-3 font-medium text-slate-800">{f.ad}</td>
                  <td className="px-5 py-3 text-slate-500 text-xs">{f.unvan || '—'}</td>
                  <td className="px-5 py-3 text-slate-500 text-xs">{SABLON_OPTIONS.find(s => s.id === f.sablon)?.label || f.sablon}</td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => updateFirma(f.id, { aktif: !(f.aktif !== false) })}
                      className={
                        'text-xs font-semibold rounded-full px-3 py-1 transition-colors ' +
                        (f.aktif !== false ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'bg-slate-100 text-slate-500 hover:bg-slate-200')
                      }
                    >
                      {f.aktif !== false ? 'Aktif' : 'Pasif'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <p className="px-5 py-3 text-[11px] text-slate-400 border-t border-slate-50">
          Not: Pasif firmalar Firma Seçimi ekranında görünmez ama mevcut verileri korunur. Kalıcı silme desteklenmiyor.
        </p>
      </div>
    </div>
  )
}
