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

const YON      = ['yonetici', 'superadmin']
const YON_KONT = ['yonetici', 'kontrolcu', 'superadmin']

// Menü öğeleri — her birinin hangi rollere ve hangi firma şablonuna
// görüneceği tanımlı. sablon belirtilmemişse şablondan bağımsız (paylaşılan).
const MENU = [
  { id: 'giris',        icon: 'history',        label: 'Sayımlar',                roles: YON_KONT, sessionless: true },
  { divider: true,      roles: YON_KONT },
  { id: 'panel',        icon: 'grid_view',      label: 'Panel',                   roles: YON_KONT, sablon: ['standart'] },
  { divider: true,      roles: YON_KONT },
  { id: 'sayim',        icon: 'fact_check',     label: 'Tüm Stok Sayımı',         roles: YON, sablon: ['standart'] },
  { id: 'analiz',       icon: 'monitoring',     label: 'Tüm Stok Sayım Analizi',  roles: YON_KONT, sablon: ['standart'] },
  { id: 'rapor',        icon: 'analytics',      label: 'Tüm Stok Rapor',          roles: YON_KONT, sablon: ['standart'] },
  { divider: true,      roles: YON_KONT },
  { id: 'kor',          icon: 'visibility_off', label: 'Kör Stok Sayımı',         roles: YON, sablon: ['standart'] },
  { id: 'koranaliz',    icon: 'query_stats',    label: 'Kör Stok Sayım Analizi',  roles: YON_KONT, sablon: ['standart'] },
  { id: 'korrapor',     icon: 'summarize',      label: 'Kör Stok Sayım Raporu',   roles: YON_KONT, sablon: ['standart'] },
  { divider: true,      roles: YON },
  { id: 'hareketlilik', icon: 'trending_up',    label: 'Hareketlilik Sayımı',     roles: YON, sablon: ['standart'] },
  { id: 'membran',      icon: 'layers',         label: 'Membran Sayımı',          roles: YON, sablon: ['standart'] },
  { divider: true,      roles: YON_KONT },
  { id: 'epsonpanel',     icon: 'grid_view',       label: 'Panel',                  roles: YON_KONT, sablon: ['wms31'] },
  { id: 'epsonsayim',     icon: 'fact_check',      label: 'Stok Sayımı',            roles: YON, sablon: ['wms31'] },
  { id: 'epsonanaliz',    icon: 'monitoring',      label: 'Sayım Analizi',          roles: YON_KONT, sablon: ['wms31'] },
  { id: 'epsonrapor',     icon: 'analytics',       label: 'Sayım Raporu',           roles: YON_KONT, sablon: ['wms31'] },
  { id: 'epsonkor',       icon: 'visibility_off',  label: 'Kör Sayımı',             roles: YON, sablon: ['wms31'] },
  { id: 'epsonkoranaliz', icon: 'query_stats',     label: 'Kör Sayım Analizi',      roles: YON_KONT, sablon: ['wms31'] },
  { id: 'epsonkorrapor',  icon: 'summarize',       label: 'Kör Sayım Raporu',       roles: YON_KONT, sablon: ['wms31'] },
  { divider: true,      roles: YON_KONT },
  { id: 'sayimciekran', icon: 'swipe',          label: 'Sayımcı Ekranı',          roles: YON_KONT },
  { divider: true,      roles: ['superadmin'] },
  { id: 'firmayonetimi', icon: 'domain',        label: 'Firma Yönetimi',          roles: ['superadmin'], sessionless: true },
]

export default function Sidebar({ activePage, onNavigate, onSettings, className = 'flex' }) {
  const { session, activeSessionId, setActiveSession, userProfile, userRole, firmalar, firmaProfile, activeFirma, setActiveFirma } = useStore(
    useShallow(s => ({
      session: s.session, activeSessionId: s.activeSessionId, setActiveSession: s.setActiveSession, userProfile: s.userProfile, userRole: s.userRole,
      firmalar: s.firmalar, firmaProfile: s.firmaProfile, activeFirma: s.activeFirma, setActiveFirma: s.setActiveFirma,
    }))
  )
  const aktifSayim = session || {}

  const initials = (userProfile?.displayName || userProfile?.email || '??')
    .split(/[\s.@]+/).filter(Boolean).slice(0, 2).map(s => s[0]?.toUpperCase()).join('')

  const currentSablon = firmaProfile?.sablon

  function handleSayimDegistir() {
    setActiveSession(null)
    onNavigate('giris')
  }

  function handleFirmaSwitch(firmaId) {
    setActiveFirma(firmaId)
    onNavigate('giris')
  }

  // Rol + şablon + oturum-bağımlılığı filtrelemesi, ardından ardışık/baştaki divider'ları temizle
  const visible = MENU.filter(m =>
    m.roles.includes(userRole) &&
    (!m.sablon || !currentSablon || m.sablon.includes(currentSablon)) &&
    (m.sessionless || activeSessionId)
  )
  const cleaned = visible.filter((m, i) => {
    if (!m.divider) return true
    const prev = visible[i - 1]
    return prev && !prev.divider   // baştaki ve ardışık divider'ları at
  })

  return (
    <aside className={`w-56 shrink-0 bg-white border-r border-slate-200 ${className} flex-col h-full`}>
      {/* Logo */}
      <div className="px-5 pt-5 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
            <span className="ms text-white" style={{ fontSize: 16 }}>warehouse</span>
          </div>
          <span className="font-bold text-slate-900 text-[13px] leading-tight">Sayım Planı</span>
        </div>
        {firmaProfile?.ad && (
          <p className="ml-9 text-[11px] text-slate-400 truncate">{firmaProfile.ad}</p>
        )}
        <button
          onClick={handleSayimDegistir}
          className="ml-9 flex items-center gap-1 text-[11px] text-blue-600 hover:underline mono mt-0.5"
        >
          <span className="ms" style={{ fontSize: 12 }}>swap_horiz</span>
          {aktifSayim.type || 'Sayım Değiştir'}
        </button>
      </div>

      {/* Süper yönetici: firma switcher */}
      {userRole === 'superadmin' && firmalar.length > 0 && (
        <div className="px-5 pt-3 pb-1">
          <label className="block text-[10px] text-slate-400 mono uppercase tracking-wide mb-1">Firma (görünüm)</label>
          <select
            value={activeFirma || ''}
            onChange={e => handleFirmaSwitch(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-[12px] text-slate-700 focus:outline-none focus:border-blue-400"
          >
            {firmalar.map(f => <option key={f.id} value={f.id}>{f.ad}</option>)}
          </select>
        </div>
      )}

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
          <p className="text-[12px] font-semibold text-slate-700 mt-0.5 truncate">{aktifSayim.type || '—'}</p>
          <p className="text-[11px] text-slate-400 mono truncate">{aktifSayim.depoAdi || '—'}</p>
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

        {/* Ayarlar linki — yönetici ve süper yönetici */}
        {(userRole === 'yonetici' || userRole === 'superadmin') && (
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
