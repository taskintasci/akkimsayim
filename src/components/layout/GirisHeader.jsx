import { useShallow } from 'zustand/react/shallow'
import useStore from '../../store/useStore'
import FirmaSwitcher from './FirmaSwitcher'
import UserMenu from './UserMenu'

// Aktif sayım oturumu yokken (Sayımlar listesi / Ayarlar) kullanılan sade
// üst bilgi çubuğu — bu ekranlarda oturum-bağımlı menü öğeleri olmadığından
// tam Sidebar yerine tek satırlık bir header yeterli ve daha az yer kaplar.
export default function GirisHeader({ activePage, onNavigate }) {
  const { userRole, firmaProfile } = useStore(
    useShallow(s => ({ userRole: s.userRole, firmaProfile: s.firmaProfile }))
  )

  const isYonetici = userRole === 'yonetici' || userRole === 'superadmin'

  return (
    <header className="h-14 shrink-0 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 gap-3">
      <button onClick={() => onNavigate('giris')} className="flex items-center gap-2.5 shrink-0">
        <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
          <span className="ms text-white" style={{ fontSize: 16 }}>warehouse</span>
        </div>
        <div className="text-left leading-tight">
          <div className="font-bold text-slate-900 text-[13px]">Sayım Planı</div>
          {firmaProfile?.ad && <div className="text-[10px] text-slate-400">{firmaProfile.ad}</div>}
        </div>
      </button>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <FirmaSwitcher
          onNavigate={onNavigate}
          className="border border-slate-300 rounded-lg px-2 py-1.5 text-[12px] text-slate-700 bg-white focus:outline-none focus:border-blue-400"
        />

        {isYonetici && (
          <button
            onClick={() => onNavigate('ayarlar')}
            className={
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all ' +
              (activePage === 'ayarlar'
                ? 'bg-blue-50 text-blue-700'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50')
            }
          >
            <span className="ms" style={{ fontSize: 16 }}>settings</span>
            Ayarlar
          </button>
        )}

        <UserMenu variant="header" />
      </div>
    </header>
  )
}
