import { forwardRef } from 'react'
import { cn } from '../../utils'

export const Input = forwardRef(function Input(
  { label, error, hint, icon, className, ...props },
  ref
) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-text-primary">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">
            {icon}
          </span>
        )}
        <input
          ref={ref}
          className={cn(
            'w-full rounded-xl border bg-white px-3 py-2.5 text-sm text-text-primary',
            'placeholder:text-text-secondary',
            'transition-colors duration-150',
            'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/60',
            error
              ? 'border-danger/50 focus:ring-danger/20 focus:border-danger/60'
              : 'border-border hover:border-gray-300',
            icon && 'pl-9',
            className
          )}
          {...props}
        />
      </div>
      {error && (
        <p className="text-xs text-danger">{error}</p>
      )}
      {hint && !error && (
        <p className="text-xs text-text-secondary">{hint}</p>
      )}
    </div>
  )
})
