import { useShallow } from 'zustand/react/shallow'
import useStore from '../../store/useStore'

// Süper yönetici için "hangi firma olarak davranıldığını" değiştiren
// <select> — hem Sidebar (aktif oturum içindeyken) hem GirisHeader (aktif
// oturum yokken) tarafından kullanılır. Firma değişince Sayımlar listesine
// dönülür (yeni firmanın oturumları henüz yüklenmemişken eski oturumda
// kalınmasın diye).
export default function FirmaSwitcher({ onNavigate, className }) {
  const { userRole, firmalar, activeFirma, setActiveFirma } = useStore(
    useShallow(s => ({
      userRole: s.userRole, firmalar: s.firmalar, activeFirma: s.activeFirma, setActiveFirma: s.setActiveFirma,
    }))
  )

  if (userRole !== 'superadmin' || firmalar.length === 0) return null

  function handleChange(e) {
    setActiveFirma(e.target.value)
    onNavigate('giris')
  }

  return (
    <select value={activeFirma || ''} onChange={handleChange} className={className}>
      {firmalar.map(f => <option key={f.id} value={f.id}>{f.ad}</option>)}
    </select>
  )
}
