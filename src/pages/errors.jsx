import { Link } from 'react-router-dom'
import { Library, Home, ArrowLeft } from 'lucide-react'

function ErrorLayout({ code, title, message, action }) {
  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white border border-border shadow-card mb-6">
        <Library size={22} className="text-primary" />
      </div>
      <p className="text-6xl font-bold text-primary/20 font-display mb-2">{code}</p>
      <h1 className="text-xl font-bold text-text-primary mb-2">{title}</h1>
      <p className="text-sm text-text-secondary max-w-xs mb-8">{message}</p>
      {action}
    </div>
  )
}

export function NotFoundPage() {
  return (
    <ErrorLayout
      code="404"
      title="Page not found"
      message="The page you're looking for doesn't exist or was moved."
      action={
        <Link to="/dashboard" className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary-800 transition-colors">
          <Home size={15} />
          Back to dashboard
        </Link>
      }
    />
  )
}

export function UnauthorizedPage() {
  return (
    <ErrorLayout
      code="401"
      title="Not signed in"
      message="You need to be signed in to view this page."
      action={
        <Link to="/login" className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary-800 transition-colors">
          Sign in
        </Link>
      }
    />
  )
}

export function ForbiddenPage() {
  return (
    <ErrorLayout
      code="403"
      title="Access denied"
      message="You don't have permission to access this resource."
      action={
        <Link to="/dashboard" className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary-800 transition-colors">
          <ArrowLeft size={15} />
          Go back
        </Link>
      }
    />
  )
}

export function ServerErrorPage() {
  return (
    <ErrorLayout
      code="500"
      title="Something went wrong"
      message="An unexpected error occurred. Please try again in a moment."
      action={
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary-800 transition-colors"
        >
          Retry
        </button>
      }
    />
  )
}
