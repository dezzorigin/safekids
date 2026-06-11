import type { ReactNode } from 'react'
import { motion } from 'framer-motion'

interface CardProps {
  children: ReactNode
  className?: string
  /** Enable hover lift + border glow */
  interactive?: boolean
  /** Show a subtle cyan top-border accent */
  accent?: boolean
  onClick?: () => void
}

export default function Card({
  children,
  className = '',
  interactive = false,
  accent = false,
  onClick,
}: CardProps) {
  const base = [
    'relative rounded-xl border-4 border-black bg-white p-5 shadow-brutal',
    'transition-all duration-200',
    accent ? 'border-t-sky-400 border-t-8' : '',
    interactive
      ? 'cursor-pointer hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-brutal-sm'
      : '',
    className,
  ].filter(Boolean).join(' ')

  return (
    <motion.div
      className={base}
      onClick={onClick}
    >
      {/* Optional top accent line */}
      {accent && (
        <div
          className="absolute inset-x-0 top-0 h-2 bg-sky-400 border-b-4 border-black"
        />
      )}
      {children}
    </motion.div>
  )
}
