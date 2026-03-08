import { clsx } from 'clsx'

export function Card({ children, className, padding = true, hover = false }) {
  return (
    <div
      className={clsx(
        'bg-white border border-slate-200 rounded-xl shadow-sm',
        hover && 'hover:shadow-md hover:border-slate-300 transition-all duration-200',
        padding && 'p-6',
        className
      )}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className }) {
  return (
    <div className={clsx('flex items-center justify-between mb-5', className)}>
      {children}
    </div>
  )
}

export function CardTitle({ children, className }) {
  return (
    <h3 className={clsx('text-base font-semibold text-slate-900', className)}>
      {children}
    </h3>
  )
}

export function CardDescription({ children, className }) {
  return (
    <p className={clsx('text-sm text-slate-500 mt-0.5', className)}>
      {children}
    </p>
  )
}

export function CardContent({ children, className }) {
  return (
    <div className={clsx(className)}>
      {children}
    </div>
  )
}

export function CardFooter({ children, className }) {
  return (
    <div className={clsx('mt-5 pt-5 border-t border-slate-100 flex items-center gap-3', className)}>
      {children}
    </div>
  )
}

export default Card
