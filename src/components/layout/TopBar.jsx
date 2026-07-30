import useStore from '../../store/useStore'

const PAGE_NAMES = {
  giris: 'Sayımlar',
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
  sayimciekran: 'Sayımcı Ekranı',
  epsonpanel: 'Panel',
  epsonsayim: 'Stok Sayımı',
  epsonanaliz: 'Sayım Analizi',
  epsonrapor: 'Sayım Raporu',
  epsonkor: 'Kör Sayım',
  epsonkoranaliz: 'Kör Sayım Analizi',
  epsonkorrapor: 'Kör Sayım Raporu',
  firmayonetimi: 'Firma Yönetimi',
}

export default function TopBar({ activePage, onMenu }) {
  const session = useStore(s => s.session) || {}
  const pageName = PAGE_NAMES[activePage] || activePage

  return (
    <header className="h-10 shrink-0 bg-white border-b border-slate-200 flex items-center px-3 md:px-5 gap-2 text-sm text-slate-500 min-w-0">
      <button
        onClick={onMenu}
        className="md:hidden w-10 h-10 -ml-2 flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 shrink-0"
        aria-label="Menüyü aç"
      >
        <span className="ms" style={{ fontSize: 20 }}>menu</span>
      </button>
      <span className="text-slate-800 font-semibold whitespace-nowrap">{pageName}</span>
      <span className="text-slate-300">·</span>
      <span className="truncate">{session.type || 'Yıl Sonu Sayımı'}</span>
      {session.tarih && (
        <>
          <span className="text-slate-300 hidden sm:inline">·</span>
          <span className="mono text-xs hidden sm:inline">{session.tarih}</span>
        </>
      )}
      {session.depoAdi && (
        <>
          <span className="text-slate-300 hidden sm:inline">·</span>
          <span className="hidden sm:inline truncate">{session.depoAdi}</span>
        </>
      )}
    </header>
  )
}
