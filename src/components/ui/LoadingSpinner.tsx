interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  label?: string
}

const SIZES = {
  sm: { ring: 'h-5 w-5 border-2', text: 'text-xs' },
  md: { ring: 'h-8 w-8 border-2', text: 'text-sm' },
  lg: { ring: 'h-12 w-12 border-[3px]', text: 'text-base' },
}

export default function LoadingSpinner({ size = 'md', label }: LoadingSpinnerProps) {
  const { ring, text } = SIZES[size]
  return (
    <div className="flex flex-col items-center justify-center gap-3" role="status" aria-label={label ?? 'Loading'}>
      <div className="relative">
        {/* Outer track */}
        <div className={['rounded-full border-space-700', ring].join(' ')} />
        {/* Spinning arc */}
        <div
          className={['absolute inset-0 animate-spin rounded-full border-transparent border-t-cyan-400', ring].join(' ')}
          style={{ boxShadow: '0 0 8px rgba(0,229,255,0.5)' }}
        />
      </div>
      {label && <p className={['font-medium text-slate-400', text].join(' ')}>{label}</p>}
    </div>
  )
}
