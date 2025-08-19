import { ReactNode, useEffect } from 'react'
import { Button } from './Button'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  actions?: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  closeOnOverlayClick?: boolean
  closeOnEsc?: boolean
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  actions,
  size = 'md',
  closeOnOverlayClick = true,
  closeOnEsc = true
}: ModalProps) {
  // Handle escape key
  useEffect(() => {
    if (!isOpen || !closeOnEsc) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, closeOnEsc, onClose])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  }

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto"
      aria-labelledby={title ? 'modal-title' : undefined}
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleOverlayClick}
      />

      {/* Modal */}
      <div className="flex min-h-screen items-center justify-center p-4">
        <div 
          className={`
            relative w-full ${sizeClasses[size]} transform rounded-lg bg-white 
            shadow-xl transition-all
          `}
        >
          {/* Header */}
          {title && (
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h2 id="modal-title" className="text-lg font-semibold text-gray-900">
                {title}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="rounded-md text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Close modal"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {/* Content */}
          <div className="px-6 py-4">
            {children}
          </div>

          {/* Actions */}
          {actions && (
            <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
              {actions}
            </div>
          )}

          {/* Close button when no title */}
          {!title && (
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 rounded-md text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Close modal"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// Convenient modal action components
interface ModalActionsProps {
  children: ReactNode
}

export function ModalActions({ children }: ModalActionsProps) {
  return (
    <div className="flex justify-end gap-3">
      {children}
    </div>
  )
}

interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  confirmVariant?: 'primary' | 'destructive'
  loading?: boolean
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  confirmVariant = 'primary',
  loading = false
}: ConfirmModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      actions={
        <ModalActions>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant={confirmVariant} onClick={onConfirm} loading={loading}>
            {confirmText}
          </Button>
        </ModalActions>
      }
    >
      <p className="text-gray-600">{message}</p>
    </Modal>
  )
}