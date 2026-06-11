import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import type { DrawerProps } from '@/types'

// ─── Animation Variants ───────────────────────────────────────────────────────

const backdropVariants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1 },
}

const drawerVariants = {
  hidden:  { x: '100%', opacity: 0 },
  visible: { x: 0,      opacity: 1 },
}

// ─── Drawer Component ─────────────────────────────────────────────────────────

export default function Drawer({ isOpen, onClose, title, children }: DrawerProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* ── Backdrop ──────────────────────────────────────── */}
          <motion.div
            key="drawer-backdrop"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-40"
            style={{ background: 'rgba(3, 7, 18, 0.7)', backdropFilter: 'blur(4px)' }}
            aria-hidden="true"
          />

          {/* ── Drawer panel ──────────────────────────────────── */}
          <motion.div
            key="drawer-panel"
            variants={drawerVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col"
            style={{
              background: 'rgba(13, 27, 42, 0.95)',
              backdropFilter: 'blur(20px)',
              borderLeft: '1px solid rgba(26, 39, 68, 0.9)',
              boxShadow: '-8px 0 40px rgba(0, 0, 0, 0.5)',
            }}
            role="dialog"
            aria-modal="true"
            aria-label={title ?? 'Side panel'}
          >
            {/* Header */}
            <div
              className="flex h-16 flex-shrink-0 items-center justify-between border-b border-space-700 px-5"
              style={{ background: 'rgba(0,229,255,0.03)' }}
            >
              <h2 className="text-sm font-semibold text-white">
                {title ?? 'Panel'}
              </h2>
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-space-700 hover:text-slate-200"
                aria-label="Tutup panel"
              >
                <X size={16} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
