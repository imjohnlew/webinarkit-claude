import { clsx } from 'clsx'
import { forwardRef } from 'react'
import { ChevronDown } from 'lucide-react'

export const Select = forwardRef(function Select(
  {
    label,
    hint,
    error,
    className,
    containerClassName,
    options = [],
    placeholder,
    size = 'md',
    ...props
  },
  ref
) {
  const sizes = {
    sm: 'pl-3 pr-8 py-1.5 text-sm',
    md: 'pl-3 pr-8 py-2.5 text-sm',
    lg: 'pl-4 pr-10 py-3 text-base',
  }

  const select = (
    <div className="relative">
      <select
        ref={ref}
        className={clsx(
          'block w-full border rounded-lg bg-white appearance-none cursor-pointer',
          'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500',
          'transition-colors duration-150',
          'disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed',
          error
            ? 'border-red-300 text-red-900 focus:ring-red-500 focus:border-red-500'
            : 'border-slate-200 text-slate-900',
          sizes[size],
          className
        )}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => {
          if (typeof opt === 'string') {
            return (
              <option key={opt} value={opt}>
                {opt}
              </option>
            )
          }
          return (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          )
        })}
      </select>
      <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none">
        <ChevronDown className="h-4 w-4 text-slate-400" />
      </div>
    </div>
  )

  if (!label && !hint && !error) return select

  return (
    <div className={clsx('space-y-1.5', containerClassName)}>
      {label && (
        <label className="block text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      {select}
      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
      {hint && !error && (
        <p className="text-xs text-slate-500">{hint}</p>
      )}
    </div>
  )
})

export default Select
