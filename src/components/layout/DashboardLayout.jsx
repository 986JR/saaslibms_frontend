import { Outlet, Navigate } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { useAuthStore } from '../../store/authStore'
import { Building2, User } from 'lucide-react'

export function DashboardLayout() {
  const { accessToken, user } = useAuthStore()

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
