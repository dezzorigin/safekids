import type { BadgeVariant } from '@/types'

interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
  dot?: boolean
  className?: string
}

const BADGE_STYLES: Record<BadgeVariant, string> = {
  active:  'bg-sky-300',
  warning: 'bg-yellow-300',
  muted:   'bg-slate-200',
}

const DOT_COLORS: Record<BadgeVariant, string> = {
  active:  'bg-black',
  warning: 'bg-black',
  muted:   'bg-black',
}

export default function Badge({
  variant = 'muted',
  children,
  dot = false,
  className = '',
}: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-black text-black border-2 border-black shadow-brutal-sm',
        BADGE_STYLES[variant],
        className,
      ].filter(Boolean).join(' ')}
    >
      {dot && (
        <span className={['h-1.5 w-1.5 rounded-full', DOT_COLORS[variant]].join(' ')} />
      )}
      {children}
    </span>
  )
}
