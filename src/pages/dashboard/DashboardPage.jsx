import { BookOpen, Users, BookMarked, CalendarClock, AlertTriangle, TrendingUp, Building2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { booksApi, membersApi, loansApi, reservationsApi, systemApi } from '../../api'
import { StatCard, Card, Skeleton } from '../../components/ui'
import { PageHeader } from '../../components/layout/PageHeader'
import { Badge } from '../../components/ui'
import { statusColors, formatDate } from '../../utils'
import { useAuthStore } from '../../store/authStore'

function useStats(isSystem) {
  const books = useQuery({
    queryKey: ['books', { page: 0, size: 1 }],
    queryFn: () => booksApi.list({ page: 0, size: 1 }),
    enabled: !isSystem,
  })
  const members = useQuery({
    queryKey: ['members', { page: 0, size: 1 }],
    queryFn: () => membersApi.list({ page: 0, size: 1 }),
    enabled: !isSystem,
  })
  const loans = useQuery({
    queryKey: ['loans', { page: 0, size: 5 }],
    queryFn: () => loansApi.list({ page: 0, size: 5 }),
    enabled: !isSystem,
  })
  const lateLoans = useQuery({
    queryKey: ['loans', { status: 'LATE', page: 0, size: 1 }],
    queryFn: () => loansApi.list({ status: 'LATE', page: 0, size: 1 }),
    enabled: !isSystem,
  })
  const reservations = useQuery({
    queryKey: ['reservations', { page: 0, size: 1 }],
    queryFn: () => reservationsApi.list({ page: 0, size: 1 }),
    enabled: !isSystem,
  })

  return { books, members, loans, lateLoans, reservations }
}

function StatSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-border shadow-card p-6 flex items-start gap-4">
      <Skeleton className="h-12 w-12 shrink-0" />
      <div className="flex-1">
        <Skeleton className="h-3 w-20 mb-2" />
        <Skeleton className="h-7 w-16" />
      </div>
    </div>
  )
}

export function DashboardPage() {
  const { user } = useAuthStore()
  const isSystem = user?.role === 'SYSTEM'
  const { books, members, loans, lateLoans, reservations } = useStats(isSystem)

  const systemStats = useQuery({
    queryKey: ['system-dashboard-stats'],
    queryFn: () => systemApi.getDashboardStats(),
    enabled: isSystem,
    select: (res) => res?.data?.data,
  })

  if (isSystem) {
    const stats = systemStats.data || {}
    return (
      <div>
        <PageHeader
          title={`Welcome back, ${user?.username || 'DevOne'} ⚙️`}
          subtitle="Library Management System Global Administration Dashboard."
        />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 mb-8">
          {systemStats.isLoading ? <StatSkeleton /> : (
            <StatCard
              label="Total Institutions"
              value={stats.totalInstitutions ?? '—'}
              icon={<Building2 size={20} />}
              color="primary"
            />
          )}
          {systemStats.isLoading ? <StatSkeleton /> : (
            <StatCard
              label="Active Inst."
              value={stats.activeInstitutions ?? '—'}
              icon={<Building2 size={20} />}
              color="blue"
            />
          )}
          {systemStats.isLoading ? <StatSkeleton /> : (
            <StatCard
              label="Suspended Inst."
              value={stats.suspendedInstitutions ?? '—'}
              icon={<AlertTriangle size={20} />}
              color="red"
            />
          )}
          {systemStats.isLoading ? <StatSkeleton /> : (
            <StatCard
              label="Total Users"
              value={stats.totalUsers ?? '—'}
              icon={<Users size={20} />}
              color="amber"
            />
          )}
          {systemStats.isLoading ? <StatSkeleton /> : (
            <StatCard
              label="System Admins"
              value={stats.systemAdmins ?? '—'}
              icon={<Users size={20} />}
              color="primary"
            />
          )}
        </div>

        {/* Actions & Information */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <Card className="h-full">
              <h2 className="text-base font-semibold text-text-primary mb-5">System Management Overview</h2>
              <p className="text-sm text-text-secondary leading-relaxed mb-6">
                As a System Administrator, you have complete control over all tenant institutions registered in the Library Management System. 
                You can suspend offending institutions, inspect system-wide user credentials, and perform database/administrative audits.
              </p>
              <div className="bg-surface border border-border p-4 rounded-xl text-xs space-y-2 font-mono text-text-secondary">
                <p><span className="font-semibold text-primary">System Base URL:</span> http://localhost:8080/api/v1</p>
                <p><span className="font-semibold text-primary">Role:</span> {user?.role}</p>
                <p><span className="font-semibold text-primary">Logged in as:</span> {user?.email}</p>
              </div>
            </Card>
          </div>

          <Card>
            <h2 className="text-base font-semibold text-text-primary mb-5">Quick Actions</h2>
            <div className="space-y-2">
              {[
                { label: 'Manage Institutions', href: '/system/institutions', desc: 'Activate, view, or suspend tenant library groups' },
                { label: 'Manage Global Users', href: '/system/users', desc: 'Create system admins or tenant user accounts' },
                { label: 'View Audit Logs', href: '/audit-logs', desc: 'Security actions and activity logs' },
              ].map((action) => (
                <a
                  key={action.href}
                  href={action.href}
                  className="flex items-start gap-3 p-3 rounded-xl hover:bg-surface transition-colors group"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                    <TrendingUp size={14} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">{action.label}</p>
                    <p className="text-xs text-text-secondary">{action.desc}</p>
                  </div>
                </a>
              ))}
            </div>
          </Card>
        </div>
      </div>
    )
  }

  const recentLoans = loans.data?.data?.data?.content || []

  return (
    <div>
      <PageHeader
        title={`Good day, ${user?.username || 'there'} 👋`}
        subtitle="Here's what's happening in your library today."
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {books.isLoading ? <StatSkeleton /> : (
          <StatCard
            label="Total Books"
            value={books.data?.data?.data?.totalElements ?? '—'}
            icon={<BookOpen size={20} />}
            color="primary"
          />
        )}
        {members.isLoading ? <StatSkeleton /> : (
          <StatCard
            label="Members"
            value={members.data?.data?.data?.totalElements ?? '—'}
            icon={<Users size={20} />}
            color="blue"
          />
        )}
        {loans.isLoading ? <StatSkeleton /> : (
          <StatCard
            label="Active Loans"
            value={loans.data?.data?.data?.totalElements ?? '—'}
            icon={<BookMarked size={20} />}
            color="amber"
          />
        )}
        {lateLoans.isLoading ? <StatSkeleton /> : (
          <StatCard
            label="Overdue"
            value={lateLoans.data?.data?.data?.totalElements ?? '—'}
            icon={<AlertTriangle size={20} />}
            color="red"
          />
        )}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <Card>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-text-primary">Recent Loans</h2>
              <a href="/loans" className="text-sm text-primary hover:text-primary-800 font-medium transition-colors">
                View all →
              </a>
            </div>

            {loans.isLoading ? (
              <div className="space-y-3">
                {[1,2,3,4].map(i => <Skeleton key={i} className="h-12" />)}
              </div>
            ) : recentLoans.length === 0 ? (
              <p className="text-sm text-text-secondary text-center py-8">No loans yet</p>
            ) : (
              <div className="divide-y divide-border">
                {recentLoans.map((loan) => (
                  <div key={loan.publicId} className="flex items-center justify-between py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">{loan.bookTitle}</p>
                      <p className="text-xs text-text-secondary">{loan.memberName} · Due {formatDate(loan.dueDate)}</p>
                    </div>
                    <Badge color={statusColors[loan.status]}>{loan.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <Card>
          <h2 className="text-base font-semibold text-text-primary mb-5">Quick Actions</h2>
          <div className="space-y-2">
            {[
              { label: 'Issue a new loan', href: '/loans', desc: 'Borrow a book for a member' },
              { label: 'Add a new book', href: '/books', desc: 'Expand your catalogue' },
              { label: 'Register a member', href: '/members', desc: 'Onboard a new patron' },
              { label: 'Create reservation', href: '/reservations', desc: 'Queue a book for a member' },
            ].map((action) => (
              <a
                key={action.href}
                href={action.href}
                className="flex items-start gap-3 p-3 rounded-xl hover:bg-surface transition-colors group"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                  <TrendingUp size={14} />
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">{action.label}</p>
                  <p className="text-xs text-text-secondary">{action.desc}</p>
                </div>
              </a>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
