import { clsx } from 'clsx'

const variants = {
  active: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20',
  inactive: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200',
  draft: 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20',
  live: 'bg-red-50 text-red-700 ring-1 ring-red-600/20 animate-pulse',
  blue: 'bg-blue-50 text-blue-700 ring-1 ring-blue-600/20',
  purple: 'bg-purple-50 text-purple-700 ring-1 ring-purple-600/20',
}

const sizes = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
  lg: 'px-3 py-1 text-sm',
}

export function Badge({ children, variant = 'inactive', size = 'md', className, dot = false }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 font-medium rounded-full',
        variants[variant] || variants.inactive,
        sizes[size],
        className
      )}
    >
      {dot && (
        <span
          className={clsx(
            'w-1.5 h-1.5 rounded-full',
            variant === 'active' && 'bg-emerald-500',
            variant === 'inactive' && 'bg-slate-400',
            variant === 'draft' && 'bg-amber-500',
            variant === 'live' && 'bg-red-500',
            variant === 'blue' && 'bg-blue-500',
            variant === 'purple' && 'bg-purple-500',
          )}
        />
      )}
      {children}
    </span>
  )
}

export default Badge
