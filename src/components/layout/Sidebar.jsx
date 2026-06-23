import { signOut } from 'firebase/auth'
import { useShallow } from 'zustand/react/shallow'
import { auth } from '../../firebase/index'
import useStore, { ROLE_LABELS } from '../../store/useStore'

function NavBtn({ item, activePage, onNavigate }) {
  const active = activePage === item.id
  return (
    <button
      onClick={() => onNavigate(item.id)}
      className={
        'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-[13px] transition-all ' +
        (active
          ? 'bg-blue-50 text-blue-700 font-semibold'
          : 'text-slate-600 hover:bg-slate-50 font-normal')
      }
    >
      <span className="ms" style={{ fontSize: 17 }}>{item.icon}</span>
      <span className="leading-tight">{item.label}</span>
    </button>
  )
}

function Divider() {
  return <div className="my-1.5 border-t border-slate-100" />
}

// Menü öğeleri — her birinin hangi rollere görüneceği tanımlı
const MENU = [
  { id: 'panel',        icon: 'grid_view',      label: 'Panel',                   roles: ['yonetici', 'kontrolcu'] },
  { divider: true,      roles: ['yonetici', 'kontrolcu'] },
  { id: 'sayim',        icon: 'fact_check',     label: 'Tüm Stok Sayımı',         roles: ['yonetici'] },
  { id: 'analiz',       icon: 'monitoring',     label: 'Tüm Stok Sayım Analizi',  roles: ['yonetici', 'kontrolcu'] },
  { id: 'rapor',        icon: 'analytics',      label: 'Tüm Stok Rapor',          roles: ['yonetici', 'kontrolcu'] },
  { divider: true,      roles: ['yonetici', 'kontrolcu'] },
  { id: 'kor',          icon: 'visibility_off', label: 'Kör Stok Sayımı',         roles: ['yonetici'] },
  { id: 'koranaliz',    icon: 'query_stats',    label: 'Kör Stok Sayım Analizi',  roles: ['yonetici', 'kontrolcu'] },
  { id: 'korrapor',     icon: 'summarize',      label: 'Kör Stok Sayım Raporu',   roles: ['yonetici', 'kontrolcu'] },
  { divider: true,      roles: ['yonetici'] },
  { id: 'hareketlilik', icon: 'trending_up',    label: 'Hareketlilik Sayımı',     roles: ['yonetici'] },
  { id: 'membran',      icon: 'layers',         label: 'Membran Sayımı',          roles: ['yonetici'] },
  { divider: true,      roles: ['yonetici', 'kontrolcu'] },
  { id: 'sayimciekran', icon: 'swipe',          label: 'Sayımcı Ekranı',          roles: ['yonetici', 'kontrolcu'] },
]

export default function Sidebar({ activePage, onNavigate, onSettings }) {
  const { session, setActiveSession, userProfile, userRole } = useStore(
    useShallow(s => ({ session: s.session, setActiveSession: s.setActiveSession, userProfile: s.userProfile, userRole: s.userRole }))
  )

  const initials = (userProfile?.displayName || userProfile?.email || '??')
    .split(/[\s.@]+/).filter(Boolean).slice(0, 2).map(s => s[0]?.toUpperCase()).join('')

  // Rol ardışık divider'larla biten/başlayan boşlukları temizle
  const visible = MENU.filter(m => m.roles.includes(userRole))
  const cleaned = visible.filter((m, i) => {
    if (!m.divider) return true
    const prev = visible[i - 1]
    return prev && !prev.divider   // baştaki ve ardışık divider'ları at
  })

  return (
    <aside className="w-56 shrink-0 bg-white border-r border-slate-200 flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 pt-5 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
            <span className="ms text-white" style={{ fontSize: 16 }}>warehouse</span>
          </div>
          <span className="font-bold text-slate-900 text-[15px]">Akkim Sayım</span>
        </div>
        <button
          onClick={() => setActiveSession(null)}
          className="ml-9 flex items-center gap-1 text-[11px] text-blue-600 hover:underline mono mt-0.5"
        >
          <span className="ms" style={{ fontSize: 12 }}>swap_horiz</span>
          {session.type || 'Sayım Değiştir'}
        </button>
      </div>

      {/* Main nav */}
      <nav className="flex-1 px-3 py-3 overflow-y-auto space-y-0.5">
        {cleaned.map((m, i) =>
          m.divider
            ? <Divider key={'d' + i} />
            : <NavBtn key={m.id} item={m} activePage={activePage} onNavigate={onNavigate} />
        )}
      </nav>

      {/* Aktif sayım + kullanıcı */}
      <div className="px-5 pb-3 pt-3 border-t border-slate-100">
        <div className="bg-slate-50 rounded-lg p-2.5 mb-3">
          <p className="text-[10px] text-slate-400 mono uppercase tracking-wide">Aktif Sayım</p>
          <p className="text-[12px] font-semibold text-slate-700 mt-0.5 truncate">{session.type || '—'}</p>
          <p className="text-[11px] text-slate-400 mono truncate">{session.depoAdi || '—'}</p>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-[11px] font-bold text-slate-600 shrink-0">
            {initials || '??'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-semibold text-slate-700 truncate">{userProfile?.displayName || userProfile?.email || 'Kullanıcı'}</p>
            <p className="text-[11px] text-slate-400 truncate">{ROLE_LABELS[userRole] || '—'}</p>
          </div>
          <button
            onClick={() => signOut(auth)}
            title="Çıkış Yap"
            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
          >
            <span className="ms" style={{ fontSize: 16 }}>logout</span>
          </button>
        </div>

        {/* Ayarlar linki — yalnızca yönetici */}
        {userRole === 'yonetici' && (
          <button
            onClick={() => onNavigate('ayarlar')}
            className={
              'mt-2 w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-[12px] transition-all ' +
              (activePage === 'ayarlar'
                ? 'bg-blue-50 text-blue-700 font-semibold'
                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50')
            }
          >
            <span className="ms" style={{ fontSize: 15 }}>settings</span>
            Ayarlar
            <span className="ml-auto text-[10px] text-slate-400">+ Kullanıcılar</span>
          </button>
        )}
      </div>
    </aside>
  )
}
