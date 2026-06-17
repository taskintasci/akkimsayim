import { useState, useRef } from 'react'
import { useReactToPrint } from 'react-to-print'
import useStore from '../../store/useStore'
import PrintSheet from '../print/PrintSheet'

export default function KorSayim({ onNavigate }) {
  const { rows, session, setSession } = useStore()
  const [codeInput, setCodeInput] = useState('')
  const [tur, setTur] = useState(1)
  const [filtered, setFiltered] = useState([])
  const [step, setStep] = useState('input') // 'input' | 'preview'
  const printRef = useRef()

  const handlePrint = useReactToPrint({ content: () => printRef.current })

  const buildList = () => {
    const codes = codeInput.split(/[\n,;]/).map(c => c.trim()).filter(Boolean)
    const found = rows.filter(r => codes.includes(r.kod))
    setFiltered(found)
    setStep('preview')
  }

  if (step === 'preview') {
    return (
      <div className="max-w-[1400px] mx-auto">
        <div className="flex items-center space-x-4 mb-6 no-print">
          <button onClick={() => setStep('input')} className="flex items-center space-x-2 text-sm text-on-surface-variant hover:text-on-surface">
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            <span>Geri</span>
          </button>
          <h2 className="text-2xl font-bold text-on-background">Kör Sayım Listesi</h2>
          <span className="text-sm text-on-surface-variant">({filtered.length} kalem, Tur {tur})</span>
        </div>

        <div className="flex space-x-3 mb-6 no-print">
          <button
            onClick={handlePrint}
            className="flex items-center space-x-2 bg-primary text-on-primary px-6 py-3 rounded font-bold text-sm hover:bg-on-primary-fixed-variant transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">print</span>
            <span>Yazdır (A4 Yatay)</span>
          </button>
          <button
            onClick={() => onNavigate('panel')}
            className="flex items-center space-x-2 bg-surface border border-outline-variant text-on-surface px-6 py-3 rounded font-semibold text-sm hover:bg-surface-container transition-colors"
          >
            <span>Sayım Paneline Dön</span>
          </button>
        </div>

        <div className="bg-surface border border-outline-variant rounded p-4 text-sm text-on-surface-variant no-print mb-4">
          <strong className="text-on-surface">{filtered.length}</strong> kalem listelendi. Yazdırıldığında <strong className="text-on-surface">{Math.ceil(filtered.length / 25)}</strong> sayfa A4 yatay çıkar. Sayım sütunu boş bırakılmıştır (kör sayım).
        </div>

        <div id="print-area">
          <PrintSheet ref={printRef} rows={filtered} results={{}} session={{...session, tur}} blindMode={true} />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold text-on-background tracking-tight mb-2">Kör Sayım</h2>
      <p className="text-sm text-on-surface-variant mb-8">Sayılacak ürün kodlarını girin. Sistem miktarı yazdırma listesinde gösterilmez.</p>

      <div className="bg-surface border border-outline-variant rounded p-6 mb-6">
        <h3 className="text-base font-semibold text-on-surface mb-4">Sayım Bilgileri</h3>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-on-surface-variant mb-1 uppercase tracking-wide" style={{fontFamily: '"JetBrains Mono", monospace'}}>Depo Adı</label>
            <input className="w-full border border-outline-variant rounded px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary" value={session.depoAdi} onChange={e => setSession({ depoAdi: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-medium text-on-surface-variant mb-1 uppercase tracking-wide" style={{fontFamily: '"JetBrains Mono", monospace'}}>Sayım Başlığı</label>
            <input className="w-full border border-outline-variant rounded px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary" value={session.sayimBasligi} onChange={e => setSession({ sayimBasligi: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-medium text-on-surface-variant mb-1 uppercase tracking-wide" style={{fontFamily: '"JetBrains Mono", monospace'}}>Tarih</label>
            <input type="date" className="w-full border border-outline-variant rounded px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary" value={session.tarih} onChange={e => setSession({ tarih: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-medium text-on-surface-variant mb-1 uppercase tracking-wide" style={{fontFamily: '"JetBrains Mono", monospace'}}>Sayım Turu</label>
            <select className="w-full border border-outline-variant rounded px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary" value={tur} onChange={e => setTur(Number(e.target.value))}>
              <option value={1}>Tur 1</option>
              <option value={2}>Tur 2</option>
              <option value={3}>Tur 3</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-surface border border-outline-variant rounded p-6 mb-6">
        <label className="block text-sm font-semibold text-on-surface mb-2">
          Ürün Kodları
          <span className="text-xs font-normal text-on-surface-variant ml-2">(her satıra bir kod, virgül veya noktalı virgülle de girebilirsiniz)</span>
        </label>
        <textarea
          value={codeInput}
          onChange={e => setCodeInput(e.target.value)}
          rows={10}
          placeholder={"H-510181\nH-510246\nH-510542\n..."}
          className="w-full border border-outline-variant rounded px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none"
          style={{fontFamily: '"JetBrains Mono", monospace'}}
        />
        <p className="text-xs text-on-surface-variant mt-2">
          {rows.length === 0
            ? '⚠ Önce Stok Sayımı sayfasından Excel yükleyin.'
            : `${codeInput.split(/[\n,;]/).filter(c => c.trim()).length} kod girildi`}
        </p>
      </div>

      <button
        onClick={buildList}
        disabled={rows.length === 0 || !codeInput.trim()}
        className="w-full bg-primary text-on-primary py-4 rounded font-bold text-sm hover:bg-on-primary-fixed-variant transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
      >
        <span className="material-symbols-outlined">checklist</span>
        <span>Sayım Listesi Oluştur</span>
      </button>
    </div>
  )
}
