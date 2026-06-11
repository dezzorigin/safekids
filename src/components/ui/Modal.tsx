import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
}

const SIZE_STYLES = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
}

export default function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  // Close on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            key="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-yellow-100/80"
          />

          {/* Modal panel */}
          <motion.div
            key="modal-panel"
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1,    y: 0  }}
            exit={{    opacity: 0, scale: 0.95, y: 12 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className={[
              'relative z-10 w-full rounded-xl overflow-hidden border-4 border-black shadow-brutal-lg bg-white',
              SIZE_STYLES[size],
            ].join(' ')}
            role="dialog"
            aria-modal="true"
            aria-label={title}
          >
            {/* Header */}
            {title && (
              <div className="flex items-center justify-between border-b-2 border-sky-100 bg-sky-50 px-5 py-4">
                <h2 className="text-base font-bold text-sky-900">{title}</h2>
                <button
                  onClick={onClose}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-sky-200 hover:text-sky-700"
                  aria-label="Tutup modal"
                >
                  <X size={18} />
                </button>
              </div>
            )}

            {/* Content */}
            <div className="p-6 bg-white">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
