import { useState, useRef, useEffect } from 'react'

/**
 * Çoklu seçim dropdown.
 * value: string[]  — seçili değerler
 * options: string[] — seçenek listesi
 * placeholder: string — hiçbir şey seçilmediğinde gösterilecek metin
 * onChange: (string[]) => void
 * style: React.CSSProperties — ek stil (örn. borderColor)
 */
export default function MultiSelect({ placeholder, options, value = [], onChange, style }) {
  const [open, setOpen] = useState(false)
  const ref = useRef()

  useEffect(() => {
    function onDown(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  function toggle(opt) {
    onChange(value.includes(opt) ? value.filter(v => v !== opt) : [...value, opt])
  }

  const active = value.length > 0
  const label  = active
    ? value.length === 1 ? value[0] : `${value.length} seçili`
    : placeholder

  return (
    <div ref={ref} className="relative" style={style}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={'fsel flex items-center gap-1 pr-1.5 ' + (active ? 'fsel-active' : '')}
        style={active ? undefined : style}
      >
        <span className="flex-1 text-left truncate max-w-[100px]">{label}</span>
        {active && (
          <span
            onMouseDown={e => { e.stopPropagation(); onChange([]) }}
            className="ms text-blue-400 hover:text-blue-600 shrink-0 cursor-pointer"
            style={{ fontSize: 13 }}
          >close</span>
        )}
        <span className="ms text-slate-400 shrink-0" style={{ fontSize: 13 }}>
          {open ? 'expand_less' : 'expand_more'}
        </span>
      </button>

      {open && options.length > 0 && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-slate-200 rounded-lg shadow-lg py-1 min-w-[150px] max-h-60 overflow-y-auto">
          {options.map(opt => (
            <label
              key={opt}
              className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 cursor-pointer text-[12px] text-slate-700 select-none"
            >
              <input
                type="checkbox"
                checked={value.includes(opt)}
                onChange={() => toggle(opt)}
                className="rounded border-slate-300 accent-blue-600"
              />
              {opt}
            </label>
          ))}
          {active && (
            <div className="border-t border-slate-100 mt-1 pt-1 px-3 pb-1">
              <button
                type="button"
                onClick={() => { onChange([]); setOpen(false) }}
                className="text-[11px] text-red-400 hover:text-red-600"
              >Seçimi Temizle</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
