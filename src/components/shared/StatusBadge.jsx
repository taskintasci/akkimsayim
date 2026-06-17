const STATUS_STYLES = {
  Normal:   'bg-surface-container text-on-surface border border-outline-variant',
  Bloke:    'bg-inverse-surface text-inverse-on-surface',
  SKTG:     'bg-error-container text-on-error-container',
  Yedirme:  'bg-secondary-container text-on-secondary-container',
  Deneme:   'bg-primary-container text-on-primary-container',
  İhracat:  'bg-surface-container-high text-on-surface',
}

export default function StatusBadge({ status }) {
  const cls = STATUS_STYLES[status] || STATUS_STYLES.Normal
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${cls}`}>
      {status}
    </span>
  )
}
