import { Outlet, Navigate } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { useAuthStore } from '../../store/authStore'
import { Building2, Library } from 'lucide-react'

export function DashboardLayout() {
  const { accessToken, user, authChecked, authLoading } = useAuthStore()

  if (authLoading || !authChecked) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white border border-border shadow-card">
          <Library size={22} className="text-primary" />
        </div>
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-primary" />
      </div>
    )
  }

  if (!accessToken) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar — Institution & User */}
        <header className="shrink-0 h-14 bg-white border-b border-border flex items-center justify-between px-6 lg:px-8">
          <div className="flex items-center gap-2 text-sm">
            <Building2 size={16} className="text-primary" />
            <span className="font-semibold text-text-primary">
              {user?.institutionName || 'My Institution'}
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white text-xs font-bold shrink-0">
              {user?.username?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="hidden sm:block text-right">
              <p className="text-xs font-semibold text-text-primary leading-tight">
                {user?.username || 'User'}
              </p>
              <p className="text-[11px] text-text-secondary leading-tight">
                {user?.role || 'Staff'}
              </p>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <div className="min-h-full p-6 lg:p-8 animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
