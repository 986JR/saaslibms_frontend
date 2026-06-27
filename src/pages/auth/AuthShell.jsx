import { Link } from 'react-router-dom'
import { Library } from 'lucide-react'

export function AuthShell({ children, footer }) {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Link to="/login" className="flex items-center gap-2 mb-8 w-fit">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Library size={16} className="text-white" />
          </div>
          <span className="text-base font-bold text-text-primary font-display">BookSphere</span>
        </Link>

        <div className="bg-white rounded-2xl border border-border shadow-card p-8 animate-fade-in">
          {children}
        </div>

        {footer && (
          <p className="mt-5 text-center text-sm text-text-secondary">
            {footer}
          </p>
        )}
      </div>
    </div>
  )
}
