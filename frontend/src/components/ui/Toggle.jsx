import { clsx } from 'clsx'

export function Toggle({ checked, onChange, label, description, disabled, size = 'md' }) {
  const sizes = {
    sm: {
      track: 'h-4 w-7',
      thumb: 'h-3 w-3',
      translate: 'translate-x-3',
    },
    md: {
      track: 'h-5 w-9',
      thumb: 'h-4 w-4',
      translate: 'translate-x-4',
    },
    lg: {
      track: 'h-6 w-11',
      thumb: 'h-5 w-5',
      translate: 'translate-x-5',
    },
  }

  const s = sizes[size] || sizes.md

  return (
    <label className={clsx('flex items-start gap-3', disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer')}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={clsx(
          'relative inline-flex shrink-0 rounded-full transition-colors duration-200 ease-in-out',
          'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2',
          s.track,
          checked ? 'bg-brand-600' : 'bg-slate-200',
          disabled && 'cursor-not-allowed'
        )}
      >
        <span
          className={clsx(
            'inline-block rounded-full bg-white shadow transform transition-transform duration-200 ease-in-out',
            'my-auto mx-0.5',
            s.thumb,
            checked ? s.translate : 'translate-x-0'
          )}
        />
      </button>

      {(label || description) && (
        <div className="flex-1 min-w-0">
          {label && (
            <span className="block text-sm font-medium text-slate-700 leading-5">
              {label}
            </span>
          )}
          {description && (
            <span className="block text-xs text-slate-500 mt-0.5 leading-4">
              {description}
            </span>
          )}
        </div>
      )}
    </label>
  )
}

export default Toggle
