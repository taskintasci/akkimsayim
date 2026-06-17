export default function Sidebar({ activePage, onNavigate }) {
  const navItems = [
    { id: 'panel', icon: 'inventory_2', label: 'Stok Sayımı' },
    { id: 'kor-sayim', icon: 'visibility_off', label: 'Kör Sayım' },
    { id: 'raporlar', icon: 'analytics', label: 'Raporlar' },
    { id: 'ayarlar', icon: 'settings', label: 'Ayarlar' },
  ]

  return (
    <aside className="bg-surface-container-low border-r border-outline-variant flex flex-col h-full py-6 px-4 w-64 shrink-0 hidden md:flex">
      <div className="mb-8">
        <h1 className="text-xl font-black text-on-surface tracking-tighter">Akkim Sayım</h1>
        <p className="text-xs text-on-surface-variant mt-0.5" style={{fontFamily: '"JetBrains Mono", monospace'}}>ChemStack Pro</p>
      </div>

      <div className="flex items-center space-x-3 mb-6 p-2 rounded-lg bg-surface border border-outline-variant">
        <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-bold text-sm">
          AK
        </div>
        <div>
          <p className="text-xs font-bold text-on-surface" style={{fontFamily: '"JetBrains Mono", monospace'}}>901 ALİŞAN DEPO</p>
          <p className="text-xs text-on-surface-variant">Akkim Kimya</p>
        </div>
      </div>

      <button
        onClick={() => onNavigate('kor-sayim')}
        className="w-full bg-primary text-on-primary text-sm font-bold py-3 rounded-lg mb-6 hover:bg-on-primary-fixed-variant transition-colors flex items-center justify-center space-x-2"
      >
        <span className="material-symbols-outlined text-[20px]">add_circle</span>
        <span>Yeni Sayım Başlat</span>
      </button>

      <nav className="flex-1 space-y-1">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-all text-left ${
              activePage === item.id
                ? 'bg-primary-container text-on-primary-container font-bold translate-x-1'
                : 'text-on-surface-variant hover:bg-surface-container-highest'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]" style={activePage === item.id ? {fontVariationSettings: "'FILL' 1"} : {}}>
              {item.icon}
            </span>
            <span className="text-sm">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="border-t border-outline-variant pt-4">
        <p className="text-xs text-on-surface-variant text-center">v1.0.0</p>
      </div>
    </aside>
  )
}
