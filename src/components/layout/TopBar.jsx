export default function TopBar() {
  return (
    <header className="bg-surface border-b border-outline-variant flex justify-between items-center px-8 h-14 shrink-0">
      <div className="relative w-80">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">search</span>
        <input
          className="w-full pl-10 pr-4 py-2 border border-outline-variant rounded bg-surface-container focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm placeholder:text-on-surface-variant text-on-surface"
          placeholder="SKU veya Lokasyon Ara..."
          type="text"
        />
      </div>
      <div className="flex items-center space-x-3">
        <button className="p-2 rounded text-on-surface-variant hover:bg-surface-container-high transition-colors">
          <span className="material-symbols-outlined text-[20px]">location_on</span>
        </button>
        <button className="p-2 rounded text-on-surface-variant hover:bg-surface-container-high transition-colors relative">
          <span className="material-symbols-outlined text-[20px]">notifications</span>
          <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full"></span>
        </button>
        <button className="p-2 rounded text-on-surface-variant hover:bg-surface-container-high transition-colors">
          <span className="material-symbols-outlined text-[20px]">account_circle</span>
        </button>
      </div>
    </header>
  )
}
