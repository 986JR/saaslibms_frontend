import { BookOpen, Users, BookMarked, CalendarClock, AlertTriangle, TrendingUp } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { booksApi, membersApi, loansApi, reservationsApi } from '../../api'
import { StatCard, Card, Skeleton } from '../../components/ui'
import { PageHeader } from '../../components/layout/PageHeader'
import { Badge } from '../../components/ui'
import { statusColors, formatDate } from '../../utils'
import { useAuthStore } from '../../store/authStore'

function useStats() {
  const books = useQuery({
    queryKey: ['books', { page: 0, size: 1 }],
    queryFn: () => booksApi.list({ page: 0, size: 1 }),
  })
  const members = useQuery({
    queryKey: ['members', { page: 0, size: 1 }],
    queryFn: () => membersApi.list({ page: 0, size: 1 }),
  })
  const loans = useQuery({
    queryKey: ['loans', { page: 0, size: 5 }],
    queryFn: () => loansApi.list({ page: 0, size: 5 }),
  })
  const lateLoans = useQuery({
    queryKey: ['loans', { status: 'LATE', page: 0, size: 1 }],
    queryFn: () => loansApi.list({ status: 'LATE', page: 0, size: 1 }),
  })
  const reservations = useQuery({
    queryKey: ['reservations', { page: 0, size: 1 }],
    queryFn: () => reservationsApi.list({ page: 0, size: 1 }),
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
  const { books, members, loans, lateLoans, reservations } = useStats()

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
