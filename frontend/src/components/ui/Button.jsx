import { clsx } from 'clsx'

const variants = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-700 focus:ring-brand-500',
  secondary: 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 active:bg-slate-100 focus:ring-brand-500',
  ghost: 'text-slate-600 hover:bg-slate-100 active:bg-slate-200 focus:ring-slate-300',
  danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-700 focus:ring-red-500',
  'danger-ghost': 'text-red-600 hover:bg-red-50 active:bg-red-100 focus:ring-red-300',
  dark: 'bg-slate-800 text-white hover:bg-slate-700 active:bg-slate-700 focus:ring-slate-500',
}

const sizes = {
  xs: 'px-2.5 py-1.5 text-xs gap-1',
  sm: 'px-3 py-2 text-sm gap-1.5',
  md: 'px-4 py-2.5 text-sm gap-2',
  lg: 'px-5 py-3 text-base gap-2',
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className,
  disabled,
  loading,
  icon: Icon,
  iconRight: IconRight,
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={clsx(
        'inline-flex items-center justify-center font-medium rounded-lg transition-colors duration-150',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant] || variants.primary,
        sizes[size],
        className
      )}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin -ml-0.5 h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : Icon ? (
        <Icon className="w-4 h-4 shrink-0" />
      ) : null}
      {children}
      {IconRight && !loading && <IconRight className="w-4 h-4 shrink-0" />}
    </button>
  )
}

export default Button
