import useStore from '../../store/useStore'

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

export default function Sidebar({ activePage, onNavigate }) {
  const { session, setActiveSession } = useStore()

  const nav = (id, icon, label) => (
    <NavBtn key={id} item={{ id, icon, label }} activePage={activePage} onNavigate={onNavigate} />
  )

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
        {nav('panel', 'grid_view', 'Panel')}
        <Divider />
        {nav('sayim',  'fact_check',      'Tüm Stok Sayımı')}
        {nav('analiz', 'monitoring',      'Tüm Stok Sayım Analizi')}
        {nav('rapor',  'analytics',       'Tüm Stok Rapor')}
        <Divider />
        {nav('kor',          'visibility_off', 'Kör Stok Sayımı')}
        {nav('koranaliz',    'query_stats',    'Kör Stok Sayım Analizi')}
        {nav('korrapor',     'summarize',      'Kör Stok Sayım Raporu')}
        <Divider />
        {nav('hareketlilik', 'trending_up',    'Hareketlilik Sayımı')}
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
            TT
          </div>
          <div className="min-w-0">
            <p className="text-[12px] font-semibold text-slate-700 truncate">Taskin T.</p>
            <p className="text-[11px] text-slate-400 truncate">Depo Sorumlusu</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
