import { cn } from '../../utils'

const variants = {
  primary: 'bg-primary text-white hover:bg-primary-800 active:bg-primary-900 shadow-sm',
  secondary: 'bg-white text-text-primary border border-border hover:bg-surface active:bg-gray-100',
  danger: 'bg-danger text-white hover:bg-red-700 active:bg-red-800',
  ghost: 'text-text-secondary hover:bg-surface hover:text-text-primary',
  success: 'bg-primary-600 text-white hover:bg-primary-700',
}

const sizes = {
  sm: 'h-8 px-3 text-sm rounded-lg',
  md: 'h-10 px-4 text-sm rounded-xl',
  lg: 'h-11 px-6 text-base rounded-xl',
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  className,
  ...props
}) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium transition-all duration-150',
        'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-1',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : icon ? (
        <span className="shrink-0">{icon}</span>
      ) : null}
      {children}
    </button>
  )
}
