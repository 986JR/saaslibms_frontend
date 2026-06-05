import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  BookOpen,
  Users,
  UserCheck,
  BookMarked,
  CalendarClock,
  Tags,
  PenLine,
  LogOut,
  Menu,
  X,
  Library,
  Link2,         // ← new icon for Book-Author Links
  ClipboardList,
} from 'lucide-react'
import { cn } from '../../utils'
import { useAuthStore } from '../../store/authStore'
import { authApi } from '../../api'
import toast from 'react-hot-toast'

const navItems = [
  { to: '/dashboard',    icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/books',        icon: BookOpen,        label: 'Books' },
  { to: '/authors',      icon: PenLine,         label: 'Authors' },
  { to: '/book-authors', icon: Link2,           label: 'Book-Author Links' }, // ← added
  { to: '/categories',   icon: Tags,            label: 'Categories' },
  { to: '/members',      icon: UserCheck,       label: 'Members' },
  { to: '/loans',        icon: BookMarked,      label: 'Loans' },
  { to: '/reservations', icon: CalendarClock,   label: 'Reservations' },
]

const adminOnlyItems = [
  { to: '/users', icon: Users, label: 'Staff Users' },
  { to: '/audit-logs', icon: ClipboardList, label: 'Audit Logs' },
]

function NavItem({ to, icon: Icon, label, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
          isActive
            ? 'bg-primary text-white shadow-sm'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon size={17} className={isActive ? 'text-white' : ''} />
          <span>{label}</span>
        </>
      )}
    </NavLink>
  )
}

export function Sidebar({ user }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { logout } = useAuthStore()
  const navigate = useNavigate()

  const isAdmin = user?.role === 'ADMIN'

  async function handleLogout() {
    try {
      await authApi.logout()
    } catch {
      // ignore
    } finally {
      logout()
      navigate('/login')
    }
  }

  const SidebarContent = ({ onNav }) => (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="px-4 py-5 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Library size={16} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-text-primary font-display">BookSphere</p>
            <p className="text-xs text-text-secondary truncate max-w-[160px]">
              {user?.institutionName || 'Management System'}
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-0.5">
        {navItems.map((item) => (
          <NavItem key={item.to} {...item} onClick={onNav} />
        ))}

        {isAdmin && (
          <>
            <div className="my-3 px-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary">
                Administration
              </p>
            </div>
            {adminOnlyItems.map((item) => (
              <NavItem key={item.to} {...item} onClick={onNav} />
            ))}
          </>
        )}
      </nav>

      {/* User + Logout */}
      <div className="px-3 py-4 border-t border-border">
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl mb-2 bg-surface">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white text-xs font-bold shrink-0">
            {user?.username?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-text-primary truncate">
              {user?.username || 'User'}
            </p>
            <p className="text-[11px] text-text-secondary">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile Toggle */}
      <button
        className="fixed top-4 left-4 z-50 lg:hidden flex h-9 w-9 items-center justify-center rounded-xl bg-white border border-border shadow-card"
        onClick={() => setMobileOpen(true)}
      >
        <Menu size={18} />
      </button>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-white shadow-dropdown animate-slide-in">
            <button
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-surface"
              onClick={() => setMobileOpen(false)}
            >
              <X size={16} />
            </button>
            <SidebarContent onNav={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-56 xl:w-60 bg-white border-r border-border shrink-0">
        <SidebarContent onNav={undefined} />
      </aside>
    </>
  )
}