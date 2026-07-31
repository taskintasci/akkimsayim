import useStore from '../../store/useStore'
import FirmaMasterdataPanel from './FirmaMasterdataPanel'

export default function FirmaMasterdataModal({ firmaId, onClose }) {
  const { firmalar } = useStore()
  const firma = firmalar.find(f => f.id === firmaId)
  if (!firma) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-xl p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-slate-900 font-bold text-lg">Masterdata — {firma.ad}</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100">
            <span className="ms" style={{ fontSize: 20 }}>close</span>
          </button>
        </div>
        <p className="text-slate-400 text-xs mb-4">
          Manuel giriş doğrulaması için kullanılan referans listeleri. Her iki liste de bu firmanın kullanıcıları için zorunludur.
        </p>
        <FirmaMasterdataPanel firma={firma} />
      </div>
    </div>
  )
}
