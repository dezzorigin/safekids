import { forwardRef } from 'react'
import { motion } from 'framer-motion'
import type { ButtonVariant } from '@/types'

// ─── Props ────────────────────────────────────────────────────────────────────

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

// ─── Variant styles ───────────────────────────────────────────────────────────

const VARIANT_STYLES: Record<ButtonVariant, string> = {
  primary: [
    'bg-sky-400 text-black font-black',
    'hover:bg-sky-300 active:bg-sky-500',
    'shadow-brutal hover:shadow-brutal-sm',
    'border-4 border-black',
  ].join(' '),

  secondary: [
    'bg-white text-black font-black',
    'hover:bg-gray-100 active:bg-gray-200',
    'border-4 border-black',
    'shadow-brutal hover:shadow-brutal-sm',
  ].join(' '),

  ghost: [
    'bg-transparent text-black font-black',
    'hover:bg-sky-200 active:bg-sky-300',
    'border-4 border-transparent hover:border-black',
  ].join(' '),

  danger: [
    'bg-red-400 text-black font-black',
    'hover:bg-red-300 active:bg-red-500',
    'border-4 border-black',
    'shadow-brutal hover:shadow-brutal-sm',
  ].join(' '),
}

const SIZE_STYLES = {
  sm: 'h-10 px-4 text-xs rounded-xl gap-1.5 border-2',
  md: 'h-12 px-6 text-sm rounded-xl gap-2',
  lg: 'h-14 px-8 text-base rounded-xl gap-2.5',
}

// ─── Button ───────────────────────────────────────────────────────────────────

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      className = '',
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || isLoading

    return (
      <motion.button
        ref={ref}
        disabled={isDisabled}
        className={[
          'inline-flex items-center justify-center transition-all duration-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-black',
          'disabled:cursor-not-allowed disabled:opacity-50',
          !isDisabled && 'hover:translate-x-[2px] hover:translate-y-[2px]',
          VARIANT_STYLES[variant],
          SIZE_STYLES[size],
          className,
        ].filter(Boolean).join(' ')}
        onClick={props.onClick}
        onFocus={props.onFocus}
        onBlur={props.onBlur}
        onMouseEnter={props.onMouseEnter}
        onMouseLeave={props.onMouseLeave}
        id={props.id}
        type={props.type ?? 'button'}
        form={props.form}
        name={props.name}
        value={props.value}
        aria-label={props['aria-label']}
        aria-disabled={isDisabled}
      >
        {isLoading ? (
          <svg
            className="h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        ) : (
          <>
            {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
          </>
        )}
      </motion.button>
    )
  },
)

Button.displayName = 'Button'
export default Button
