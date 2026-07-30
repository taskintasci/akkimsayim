import { signOut } from 'firebase/auth'
import { useShallow } from 'zustand/react/shallow'
import { auth } from '../../firebase/index'
import useStore, { ROLE_LABELS } from '../../store/useStore'

// Aktif sayım oturumu yokken (Sayımlar listesi / Ayarlar) kullanılan sade
// üst bilgi çubuğu — bu ekranlarda oturum-bağımlı menü öğeleri olmadığından
// tam Sidebar yerine tek satırlık bir header yeterli ve daha az yer kaplar.
export default function GirisHeader({ activePage, onNavigate }) {
  const { userProfile, userRole, firmalar, firmaProfile, activeFirma, setActiveFirma } = useStore(
    useShallow(s => ({
      userProfile: s.userProfile, userRole: s.userRole,
      firmalar: s.firmalar, firmaProfile: s.firmaProfile, activeFirma: s.activeFirma, setActiveFirma: s.setActiveFirma,
    }))
  )

  const initials = (userProfile?.displayName || userProfile?.email || '??')
    .split(/[\s.@]+/).filter(Boolean).slice(0, 2).map(s => s[0]?.toUpperCase()).join('')

  const isYonetici = userRole === 'yonetici' || userRole === 'superadmin'

  function handleFirmaSwitch(firmaId) {
    setActiveFirma(firmaId)
    onNavigate('giris')
  }

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
        {userRole === 'superadmin' && firmalar.length > 0 && (
          <select
            value={activeFirma || ''}
            onChange={e => handleFirmaSwitch(e.target.value)}
            className="border border-slate-300 rounded-lg px-2 py-1.5 text-[12px] text-slate-700 bg-white focus:outline-none focus:border-blue-400"
          >
            {firmalar.map(f => <option key={f.id} value={f.id}>{f.ad}</option>)}
          </select>
        )}

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

        <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-slate-200">
          <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-[11px] font-bold text-slate-600 shrink-0">
            {initials || '??'}
          </div>
          <div className="hidden sm:block leading-tight min-w-0">
            <p className="text-[12px] font-semibold text-slate-700 truncate max-w-[140px]">{userProfile?.displayName || userProfile?.email || 'Kullanıcı'}</p>
            <p className="text-[10px] text-slate-400">{ROLE_LABELS[userRole] || '—'}</p>
          </div>
          <button
            onClick={() => signOut(auth)}
            title="Çıkış Yap"
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
          >
            <span className="ms" style={{ fontSize: 17 }}>logout</span>
          </button>
        </div>
      </div>
    </header>
  )
}
