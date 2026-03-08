import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { clsx } from 'clsx'

const sizes = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-7xl',
}

export function Modal({ isOpen, onClose, title, description, children, size = 'md', className }) {
  const overlayRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && isOpen) onClose()
    }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Overlay */}
      <div
        ref={overlayRef}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
        onClick={(e) => {
          if (e.target === overlayRef.current) onClose()
        }}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className={clsx(
            'relative w-full bg-white rounded-2xl shadow-2xl animate-slide-up',
            sizes[size],
            className
          )}
        >
          {/* Header */}
          {(title || description) && (
            <div className="flex items-start justify-between px-6 py-5 border-b border-slate-100">
              <div>
                {title && (
                  <h2 className="text-base font-semibold text-slate-900">{title}</h2>
                )}
                {description && (
                  <p className="text-sm text-slate-500 mt-0.5">{description}</p>
                )}
              </div>
              <button
                onClick={onClose}
                className="ml-4 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors duration-150"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Close button when no header */}
          {!title && !description && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors duration-150 z-10"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Content */}
          <div>{children}</div>
        </div>
      </div>
    </div>
  )
}

export function ModalBody({ children, className }) {
  return (
    <div className={clsx('px-6 py-5', className)}>
      {children}
    </div>
  )
}

export function ModalFooter({ children, className }) {
  return (
    <div className={clsx('px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3', className)}>
      {children}
    </div>
  )
}

export default Modal
