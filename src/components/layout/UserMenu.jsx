import { signOut } from 'firebase/auth'
import { useShallow } from 'zustand/react/shallow'
import { auth } from '../../firebase/index'
import useStore, { ROLE_LABELS } from '../../store/useStore'

// Avatar baş harfleri + ad/rol + çıkış — hem Sidebar hem GirisHeader'da
// aynı mantık, sadece yerleşim/boyut farklı (variant ile ayarlanır).
export default function UserMenu({ variant = 'sidebar' }) {
  const { userProfile, userRole } = useStore(
    useShallow(s => ({ userProfile: s.userProfile, userRole: s.userRole }))
  )

  const initials = (userProfile?.displayName || userProfile?.email || '??')
    .split(/[\s.@]+/).filter(Boolean).slice(0, 2).map(s => s[0]?.toUpperCase()).join('')
  const name = userProfile?.displayName || userProfile?.email || 'Kullanıcı'
  const roleLabel = ROLE_LABELS[userRole] || '—'

  const isHeader = variant === 'header'

  return (
    <div className={
      isHeader
        ? 'flex items-center gap-2 pl-2 sm:pl-3 border-l border-slate-200'
        : 'flex items-center gap-2.5'
    }>
      <div className={
        'rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600 shrink-0 ' +
        (isHeader ? 'w-7 h-7 text-[11px]' : 'w-7 h-7 text-[11px]')
      }>
        {initials || '??'}
      </div>
      <div className={isHeader ? 'hidden sm:block leading-tight min-w-0' : 'min-w-0 flex-1'}>
        <p className={'font-semibold text-slate-700 truncate ' + (isHeader ? 'text-[12px] max-w-[140px]' : 'text-[12px]')}>{name}</p>
        <p className={'text-slate-400 truncate ' + (isHeader ? 'text-[10px]' : 'text-[11px]')}>{roleLabel}</p>
      </div>
      <button
        onClick={() => signOut(auth)}
        title="Çıkış Yap"
        className={
          'flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0 ' +
          (isHeader ? 'w-8 h-8' : 'w-7 h-7')
        }
      >
        <span className="ms" style={{ fontSize: isHeader ? 17 : 16 }}>logout</span>
      </button>
    </div>
  )
}
