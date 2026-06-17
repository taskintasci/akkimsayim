export default function StatCard({ label, value, sub, icon, variant = 'default' }) {
  const variantCls = {
    default: 'bg-surface border-outline-variant',
    primary: 'bg-surface border-outline-variant',
    error: 'bg-error-container border-error',
  }
  const labelCls = { default: 'text-on-surface-variant', primary: 'text-on-surface-variant', error: 'text-on-error-container' }
  const valueCls = { default: 'text-on-surface', primary: 'text-primary', error: 'text-error' }
  const iconCls  = { default: 'text-outline', primary: 'text-primary', error: 'text-error' }

  return (
    <div className={`border rounded p-4 flex flex-col justify-between ${variantCls[variant]}`}>
      <div className="flex justify-between items-center mb-2">
        <span className={`text-[10px] font-medium uppercase tracking-wider ${labelCls[variant]}`} style={{fontFamily: '"JetBrains Mono", monospace'}}>
          {label}
        </span>
        {icon && <span className={`material-symbols-outlined ${iconCls[variant]}`} style={variant === 'error' ? {fontVariationSettings: "'FILL' 1"} : {}}>{icon}</span>}
      </div>
      <div className={`text-3xl font-bold tracking-tight ${valueCls[variant]}`}>{value}</div>
      {sub && <div className={`text-xs mt-1 ${labelCls[variant]}`}>{sub}</div>}
    </div>
  )
}
