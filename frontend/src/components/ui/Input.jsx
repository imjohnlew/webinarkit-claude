import { clsx } from 'clsx'
import { forwardRef } from 'react'

export const Input = forwardRef(function Input(
  {
    label,
    hint,
    error,
    className,
    containerClassName,
    icon: Icon,
    iconRight: IconRight,
    size = 'md',
    ...props
  },
  ref
) {
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-3 py-2.5 text-sm',
    lg: 'px-4 py-3 text-base',
  }

  const input = (
    <div className="relative">
      {Icon && (
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Icon className="h-4 w-4 text-slate-400" />
        </div>
      )}
      <input
        ref={ref}
        className={clsx(
          'block w-full border rounded-lg placeholder-slate-400 bg-white',
          'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500',
          'transition-colors duration-150',
          'disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed',
          error
            ? 'border-red-300 text-red-900 focus:ring-red-500 focus:border-red-500'
            : 'border-slate-200 text-slate-900',
          Icon && 'pl-10',
          IconRight && 'pr-10',
          sizes[size],
          className
        )}
        {...props}
      />
      {IconRight && (
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <IconRight className="h-4 w-4 text-slate-400" />
        </div>
      )}
    </div>
  )

  if (!label && !hint && !error) return input

  return (
    <div className={clsx('space-y-1.5', containerClassName)}>
      {label && (
        <label className="block text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      {input}
      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
      {hint && !error && (
        <p className="text-xs text-slate-500">{hint}</p>
      )}
    </div>
  )
})

export default Input
