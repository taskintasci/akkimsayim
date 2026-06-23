import useStore from '../../store/useStore'

const PAGE_NAMES = {
  panel: 'Panel',
  upload: 'Excel Yükle',
  sayim: 'Stok Sayımı',
  kor: 'Kör Sayım',
  rapor: 'Rapor',
  analiz: 'Sayım Analizi',
  ayarlar: 'Ayarlar',
  koranaliz: 'Kör Sayım Analizi',
  korrapor: 'Kör Sayım Raporu',
  hareketlilik: 'Hareketlilik Sayımı',
  membran: 'Membran Sayımı',
  kullanicilar: 'Kullanıcı Yönetimi',
  sayimciekran: 'Sayımcı Ekranı',
}

export default function TopBar({ activePage }) {
  const session = useStore(s => s.session)
  const pageName = PAGE_NAMES[activePage] || activePage

  return (
    <header className="h-10 shrink-0 bg-white border-b border-slate-200 flex items-center px-5 gap-2 text-sm text-slate-500">
      <span className="text-slate-800 font-semibold">{pageName}</span>
      <span className="text-slate-300">·</span>
      <span>{session.type || 'Yıl Sonu Sayımı'}</span>
      {session.tarih && (
        <>
          <span className="text-slate-300">·</span>
          <span className="mono text-xs">{session.tarih}</span>
        </>
      )}
      {session.depoAdi && (
        <>
          <span className="text-slate-300">·</span>
          <span>{session.depoAdi}</span>
        </>
      )}
    </header>
  )
}
