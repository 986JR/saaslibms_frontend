import { forwardRef } from 'react'
import { X } from 'lucide-react'
import { cn } from '../../utils'

// ─── Badge ────────────────────────────────────────────────────────────────────
const badgeColors = {
  green: 'bg-green-50 text-green-700 border-green-200',
  blue: 'bg-blue-50 text-blue-700 border-blue-200',
  red: 'bg-red-50 text-red-700 border-red-200',
  yellow: 'bg-amber-50 text-amber-700 border-amber-200',
  gray: 'bg-gray-50 text-gray-600 border-gray-200',
  primary: 'bg-primary-50 text-primary border-primary-100',
}

export function Badge({ children, color = 'gray', className }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        badgeColors[color] || badgeColors.gray,
        className
      )}
    >
      {children}
    </span>
  )
}

// ─── Select ───────────────────────────────────────────────────────────────────
export const Select = forwardRef(function Select(
  { label, error, children, className, ...props },
  ref
) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-text-primary">{label}</label>
      )}
      <select
        ref={ref}
        className={cn(
          'w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm text-text-primary',
          'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/60',
          'transition-colors duration-150 cursor-pointer',
          error && 'border-danger/50',
          className
        )}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  )
})

// ─── Textarea ─────────────────────────────────────────────────────────────────
export const Textarea = forwardRef(function Textarea(
  { label, error, className, ...props },
  ref
) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-text-primary">{label}</label>
      )}
      <textarea
        ref={ref}
        rows={3}
        className={cn(
          'w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm text-text-primary',
          'placeholder:text-text-secondary resize-none',
          'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/60',
          'transition-colors duration-150',
          error && 'border-danger/50',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  )
})

// ─── Modal ────────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, size = 'md' }) {
  if (!open) return null

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={cn(
          'relative w-full bg-white rounded-2xl shadow-dropdown animate-fade-in',
          sizes[size]
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="text-base font-semibold text-text-primary">{title}</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-secondary hover:bg-surface hover:text-text-primary transition-colors"
          >
            <X size={16} />
          </button>
        </div>
        {/* Body */}
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
export function Skeleton({ className }) {
  return (
    <div
      className={cn(
        'skeleton rounded-xl',
        className
      )}
    />
  )
}

export function SkeletonRow({ cols = 5 }) {
  return (
    <tr className="border-b border-border">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  )
}

// ─── Empty State ──────────────────────────────────────────────────────────────
export function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon && (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-surface text-text-secondary">
          {icon}
        </div>
      )}
      <h3 className="mb-1 text-sm font-semibold text-text-primary">{title}</h3>
      {description && (
        <p className="mb-4 max-w-xs text-sm text-text-secondary">{description}</p>
      )}
      {action}
    </div>
  )
}

// ─── Spinner ─────────────────────────────────────────────────────────────────
export function Spinner({ size = 'md', className }) {
  const sizes = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-8 w-8' }
  return (
    <span
      className={cn(
        'inline-block animate-spin rounded-full border-2 border-border border-t-primary',
        sizes[size],
        className
      )}
    />
  )
}

// ─── Card ─────────────────────────────────────────────────────────────────────
export function Card({ children, className, ...props }) {
  return (
    <div
      className={cn(
        'bg-white rounded-2xl border border-border shadow-card p-6',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
export function StatCard({ label, value, icon, color = 'primary', trend }) {
  const colors = {
    primary: 'bg-primary-50 text-primary',
    blue: 'bg-blue-50 text-blue-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
  }

  return (
    <Card className="flex items-start gap-4">
      <div className={cn('p-3 rounded-xl', colors[color])}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">
          {label}
        </p>
        <p className="mt-0.5 text-2xl font-bold text-text-primary">{value}</p>
        {trend && <p className="mt-1 text-xs text-text-secondary">{trend}</p>}
      </div>
    </Card>
  )
}

// ─── Confirm Dialog ───────────────────────────────────────────────────────────
export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirm', loading = false }) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <p className="text-sm text-text-secondary mb-6">{message}</p>
      <div className="flex gap-3 justify-end">
        <button
          onClick={onClose}
          className="h-9 px-4 text-sm font-medium text-text-secondary hover:text-text-primary border border-border rounded-xl hover:bg-surface transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="h-9 px-4 text-sm font-medium text-white bg-danger rounded-xl hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center gap-2"
        >
          {loading && (
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
          )}
          {confirmLabel}
        </button>
      </div>
    </Modal>
  )
}

// ─── Pagination ───────────────────────────────────────────────────────────────
export function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between px-1 pt-4">
      <p className="text-sm text-text-secondary">
        Page {page + 1} of {totalPages}
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 0}
          className="h-8 px-3 text-sm text-text-secondary border border-border rounded-lg hover:bg-surface disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Previous
        </button>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages - 1}
          className="h-8 px-3 text-sm text-text-secondary border border-border rounded-lg hover:bg-surface disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  )
}
