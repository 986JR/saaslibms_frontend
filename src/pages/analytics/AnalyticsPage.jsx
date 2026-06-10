import { useMemo, useState } from 'react'
import { useQueries, useQuery } from '@tanstack/react-query'
import {
  Activity,
  AlertTriangle,
  BarChart3,
  BookOpen,
  Building2,
  Clock3,
  Database,
  Gauge,
  HardDrive,
  LibraryBig,
  Network,
  RefreshCw,
  Server,
  ShieldAlert,
  Users,
  Zap,
} from 'lucide-react'
import { analyticsApi } from '../../api'
import { Badge, Card, Select, Skeleton, StatCard } from '../../components/ui'
import { Button } from '../../components/ui/Button'
import { PageHeader } from '../../components/layout/PageHeader'
import { cn, formatDate, getErrorMessage, truncate } from '../../utils'

const tabs = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'institutions', label: 'Institutions', icon: Building2 },
  { id: 'resources', label: 'Resources', icon: BookOpen },
  { id: 'traffic', label: 'Traffic', icon: Network },
  { id: 'infrastructure', label: 'Infrastructure', icon: Server },
]

function payload(response, fallback) {
  return response?.data?.data ?? fallback
}

function number(value) {
  if (value === null || value === undefined || value === '') return '-'
  return Number(value).toLocaleString()
}

function percent(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '-'
  return `${Number(value).toFixed(1)}%`
}

function ms(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '-'
  return `${Number(value).toFixed(0)} ms`
}

function statusTone(value, warn, critical, inverse = false) {
  const numeric = Number(value || 0)
  if (inverse) {
    if (numeric < critical) return 'red'
    if (numeric < warn) return 'yellow'
    return 'green'
  }
  if (numeric > critical) return 'red'
  if (numeric > warn) return 'yellow'
  return 'green'
}

function TabButton({ tab, active, onClick }) {
  const Icon = tab.icon
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-semibold transition-colors',
        active
          ? 'bg-primary text-white shadow-sm'
          : 'border border-border bg-white text-text-secondary hover:text-text-primary'
      )}
    >
      <Icon size={16} />
      <span>{tab.label}</span>
    </button>
  )
}

function ErrorCard({ error, onRetry }) {
  return (
    <Card className="border-red-200 bg-red-50">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 text-red-600" size={18} />
          <div>
            <p className="text-sm font-semibold text-red-800">Analytics data could not be loaded</p>
            <p className="text-sm text-red-700">{getErrorMessage(error)}</p>
          </div>
        </div>
        {onRetry && (
          <Button size="sm" onClick={onRetry} icon={<RefreshCw size={14} />}>
            Retry
          </Button>
        )}
      </div>
    </Card>
  )
}

function MiniLineChart({ data = [], color = '#14532D', label = 'count' }) {
  const points = useMemo(() => {
    if (!data.length) return ''
    const width = 420
    const height = 120
    const max = Math.max(...data.map((d) => Number(d.count || 0)), 1)
    return data.map((d, i) => {
      const x = data.length === 1 ? width : (i / (data.length - 1)) * width
      const y = height - (Number(d.count || 0) / max) * (height - 16) - 8
      return `${x},${y}`
    }).join(' ')
  }, [data])

  if (!data.length) {
    return <div className="flex h-40 items-center justify-center text-sm text-text-secondary">No trend data yet</div>
  }

  return (
    <div className="h-44">
      <svg viewBox="0 0 420 140" className="h-full w-full overflow-visible">
        <polyline fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" points={points} />
        {data.map((d, i) => {
          const max = Math.max(...data.map((item) => Number(item.count || 0)), 1)
          const x = data.length === 1 ? 420 : (i / (data.length - 1)) * 420
          const y = 120 - (Number(d.count || 0) / max) * 104
          return <circle key={`${d.date}-${i}`} cx={x} cy={y} r="3" fill={color} />
        })}
      </svg>
      <div className="mt-2 flex items-center justify-between text-xs text-text-secondary">
        <span>{formatDate(data[0]?.date)}</span>
        <span>{label}</span>
        <span>{formatDate(data[data.length - 1]?.date)}</span>
      </div>
    </div>
  )
}

function BarList({ data = [], valueKey = 'count', labelKey = 'title', empty = 'No records yet' }) {
  const max = Math.max(...data.map((item) => Number(item[valueKey] || 0)), 1)

  if (!data.length) {
    return <div className="py-10 text-center text-sm text-text-secondary">{empty}</div>
  }

  return (
    <div className="space-y-3">
      {data.slice(0, 10).map((item, index) => {
        const value = Number(item[valueKey] || 0)
        return (
          <div key={`${item.publicId || item.endpoint || item[labelKey]}-${index}`} className="space-y-1.5">
            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="min-w-0 truncate font-medium text-text-primary">
                {item[labelKey] || item.endpoint || 'Unknown'}
              </span>
              <span className="shrink-0 text-xs font-semibold text-text-secondary">{number(value)}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-surface">
              <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max((value / max) * 100, 4)}%` }} />
            </div>
            {(item.institutionName || item.actorEmail) && (
              <p className="text-xs text-text-secondary">{item.institutionName || item.actorEmail}</p>
            )}
          </div>
        )
      })}
    </div>
  )
}

function MetricTile({ label, value, icon, tone = 'primary', detail }) {
  const colors = {
    primary: 'bg-primary-50 text-primary border-primary-100',
    green: 'bg-green-50 text-green-700 border-green-200',
    yellow: 'bg-amber-50 text-amber-700 border-amber-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    gray: 'bg-gray-50 text-gray-700 border-gray-200',
  }

  return (
    <div className="rounded-xl border border-border bg-white p-4">
      <div className="flex items-start gap-3">
        <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border', colors[tone] || colors.primary)}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">{label}</p>
          <p className="mt-0.5 text-xl font-bold text-text-primary">{value}</p>
          {detail && <p className="mt-1 text-xs text-text-secondary">{detail}</p>}
        </div>
      </div>
    </div>
  )
}

function AnalyticsTable({ columns, rows, empty }) {
  if (!rows?.length) {
    return <div className="py-12 text-center text-sm text-text-secondary">{empty}</div>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-surface">
            {columns.map((column) => (
              <th key={column.key} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-secondary">
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.publicId || row.actorEmail || row.endpoint || index} className="border-b border-border last:border-0">
              {columns.map((column) => (
                <td key={column.key} className="px-4 py-3 text-text-secondary">
                  {column.render ? column.render(row, index) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function OverviewPanel({ days }) {
  const [summary, loansTrend, traffic, rateLimits] = useQueries({
    queries: [
      {
        queryKey: ['analytics-summary'],
        queryFn: analyticsApi.getSummary,
        select: (res) => payload(res, {}),
        refetchInterval: 60000,
      },
      {
        queryKey: ['analytics-loans-trend', days],
        queryFn: () => analyticsApi.getLoansTrend(days),
        select: (res) => payload(res, []),
      },
      {
        queryKey: ['analytics-traffic-summary'],
        queryFn: analyticsApi.getTrafficSummary,
        select: (res) => payload(res, {}),
        refetchInterval: 30000,
      },
      {
        queryKey: ['analytics-rate-limits'],
        queryFn: analyticsApi.getRateLimitViolations,
        select: (res) => payload(res, {}),
        refetchInterval: 15000,
      },
    ],
  })

  if (summary.isError) return <ErrorCard error={summary.error} onRetry={() => summary.refetch()} />

  const data = summary.data || {}
  const trafficData = traffic.data || {}
  const rateLimitData = rateLimits.data || {}

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summary.isLoading ? <Skeleton className="h-28" /> : <StatCard label="Total Books" value={number(data.totalBooks)} icon={<BookOpen size={20} />} color="primary" />}
        {summary.isLoading ? <Skeleton className="h-28" /> : <StatCard label="Total Members" value={number(data.totalMembers)} icon={<Users size={20} />} color="blue" />}
        {summary.isLoading ? <Skeleton className="h-28" /> : <StatCard label="Active Loans" value={number(data.activeLoans)} icon={<LibraryBig size={20} />} color="amber" />}
        {summary.isLoading ? <Skeleton className="h-28" /> : <StatCard label="Overdue Loans" value={number(data.overdueLoans)} icon={<AlertTriangle size={20} />} color="red" />}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-text-primary">Loan Activity</h2>
              <p className="text-sm text-text-secondary">Daily loans for the selected period</p>
            </div>
            <Badge color="primary">{days} days</Badge>
          </div>
          {loansTrend.isLoading ? <Skeleton className="h-44" /> : <MiniLineChart data={loansTrend.data || []} label="Loans" />}
        </Card>

        <Card>
          <h2 className="mb-4 text-base font-semibold text-text-primary">Live Traffic</h2>
          <div className="space-y-3">
            <MetricTile label="Last minute" value={number(trafficData.requestsLastMinute)} icon={<Zap size={17} />} tone="blue" />
            <MetricTile label="Last hour" value={number(trafficData.requestsLastHour)} icon={<Activity size={17} />} tone="primary" detail={`${percent(trafficData.errorRatePercent)} error rate`} />
            <MetricTile label="Rate limit keys" value={number(rateLimitData.totalRateLimitKeys)} icon={<ShieldAlert size={17} />} tone={rateLimitData.totalRateLimitKeys > 0 ? 'yellow' : 'green'} detail={`${number(rateLimitData.blockedOnLogin)} login window keys`} />
          </div>
        </Card>
      </div>
    </div>
  )
}

function InstitutionsPanel({ days }) {
  const [activity, growth] = useQueries({
    queries: [
      {
        queryKey: ['analytics-institution-activity'],
        queryFn: analyticsApi.getInstitutionActivity,
        select: (res) => payload(res, []),
        staleTime: 60000,
      },
      {
        queryKey: ['analytics-institution-growth', days],
        queryFn: () => analyticsApi.getInstitutionGrowth(days),
        select: (res) => payload(res, []),
      },
    ],
  })

  if (activity.isError) return <ErrorCard error={activity.error} onRetry={() => activity.refetch()} />

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
      <Card className="xl:col-span-2">
        <h2 className="mb-1 text-base font-semibold text-text-primary">Institution Activity Ranking</h2>
        <p className="mb-4 text-sm text-text-secondary">Most active tenants by loan volume</p>
        {activity.isLoading ? (
          <Skeleton className="h-80" />
        ) : (
          <AnalyticsTable
            rows={activity.data || []}
            empty="No institution activity has been recorded yet"
            columns={[
              { key: 'name', label: 'Institution', render: (row) => <div><p className="font-semibold text-text-primary">{row.name}</p><p className="text-xs font-mono">{row.publicId}</p></div> },
              { key: 'status', label: 'Status', render: (row) => <Badge color={row.status === 'ACTIVE' ? 'green' : row.status === 'SUSPENDED' ? 'red' : 'yellow'}>{row.status}</Badge> },
              { key: 'userCount', label: 'Users', render: (row) => number(row.userCount) },
              { key: 'bookCount', label: 'Books', render: (row) => number(row.bookCount) },
              { key: 'loanCount', label: 'Loans', render: (row) => number(row.loanCount) },
              { key: 'auditActionCount', label: 'Audit Actions', render: (row) => number(row.auditActionCount) },
            ]}
          />
        )}
      </Card>

      <Card>
        <h2 className="mb-1 text-base font-semibold text-text-primary">Registration Growth</h2>
        <p className="mb-4 text-sm text-text-secondary">Daily institution signups</p>
        {growth.isLoading ? <Skeleton className="h-44" /> : <MiniLineChart data={growth.data || []} color="#2563eb" label="Institutions" />}
      </Card>
    </div>
  )
}

function ResourcesPanel({ days }) {
  const [bookMode, setBookMode] = useState('borrowed')
  const booksQuery = useQuery({
    queryKey: ['analytics-books', bookMode, days],
    queryFn: () => {
      if (bookMode === 'reserved') return analyticsApi.getTopReservedBooks({ limit: 10 })
      if (bookMode === 'viewed') return analyticsApi.getTopViewedBooks({ limit: 10, days })
      if (bookMode === 'least') return analyticsApi.getLeastBorrowedBooks(10)
      return analyticsApi.getTopBorrowedBooks({ limit: 10 })
    },
    select: (res) => payload(res, []),
  })

  const [viewsTrend, statusDist, users] = useQueries({
    queries: [
      {
        queryKey: ['analytics-book-views-trend', days],
        queryFn: () => analyticsApi.getBookViewsTrend(days),
        select: (res) => payload(res, []),
      },
      {
        queryKey: ['analytics-loan-status-distribution'],
        queryFn: analyticsApi.getLoanStatusDistribution,
        select: (res) => payload(res, {}),
      },
      {
        queryKey: ['analytics-top-users'],
        queryFn: () => analyticsApi.getTopActiveUsers(10),
        select: (res) => payload(res, []),
      },
    ],
  })

  const status = statusDist.data || {}

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
      <Card className="xl:col-span-2">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-text-primary">Resource Engagement</h2>
            <p className="text-sm text-text-secondary">Borrowing, reservations, views, and low-engagement books</p>
          </div>
          <Select value={bookMode} onChange={(e) => setBookMode(e.target.value)} className="sm:w-48">
            <option value="borrowed">Top borrowed</option>
            <option value="reserved">Top reserved</option>
            <option value="viewed">Top viewed</option>
            <option value="least">Least borrowed</option>
          </Select>
        </div>
        {booksQuery.isLoading ? <Skeleton className="h-80" /> : <BarList data={booksQuery.data || []} valueKey={bookMode === 'viewed' ? 'viewCount' : 'count'} />}
      </Card>

      <div className="space-y-6">
        <Card>
          <h2 className="mb-4 text-base font-semibold text-text-primary">Loan Status</h2>
          <div className="space-y-3">
            <MetricTile label="Borrowed" value={number(status.borrowed)} icon={<BookOpen size={17} />} tone="blue" />
            <MetricTile label="Late" value={number(status.late)} icon={<AlertTriangle size={17} />} tone={status.late > 0 ? 'red' : 'green'} />
            <MetricTile label="Returned" value={number(status.returned)} icon={<LibraryBig size={17} />} tone="green" />
          </div>
        </Card>

        <Card>
          <h2 className="mb-1 text-base font-semibold text-text-primary">Book Views Trend</h2>
          <p className="mb-4 text-sm text-text-secondary">Book detail views over time</p>
          {viewsTrend.isLoading ? <Skeleton className="h-44" /> : <MiniLineChart data={viewsTrend.data || []} color="#2563eb" label="Views" />}
        </Card>
      </div>

      <Card className="xl:col-span-3">
        <h2 className="mb-4 text-base font-semibold text-text-primary">Most Active Staff</h2>
        {users.isLoading ? <Skeleton className="h-64" /> : (
          <AnalyticsTable
            rows={users.data || []}
            empty="No staff activity has been recorded yet"
            columns={[
              { key: 'actorEmail', label: 'Staff', render: (row) => <span className="font-medium text-text-primary">{row.actorEmail}</span> },
              { key: 'actorRole', label: 'Role', render: (row) => <Badge color={row.actorRole === 'ADMIN' ? 'blue' : 'gray'}>{row.actorRole}</Badge> },
              { key: 'institutionName', label: 'Institution' },
              { key: 'actionCount', label: 'Actions', render: (row) => number(row.actionCount) },
            ]}
          />
        )}
      </Card>
    </div>
  )
}

function TrafficPanel({ days }) {
  const [traffic, top, slow, errors, trend] = useQueries({
    queries: [
      {
        queryKey: ['analytics-traffic-summary'],
        queryFn: analyticsApi.getTrafficSummary,
        select: (res) => payload(res, {}),
        refetchInterval: 30000,
      },
      {
        queryKey: ['analytics-top-endpoints', days],
        queryFn: () => analyticsApi.getTopEndpoints({ limit: 10, days }),
        select: (res) => payload(res, []),
      },
      {
        queryKey: ['analytics-slowest-endpoints', days],
        queryFn: () => analyticsApi.getSlowestEndpoints({ limit: 10, days }),
        select: (res) => payload(res, []),
      },
      {
        queryKey: ['analytics-error-rates', days],
        queryFn: () => analyticsApi.getErrorRates(days),
        select: (res) => payload(res, {}),
      },
      {
        queryKey: ['analytics-traffic-trend', days],
        queryFn: () => analyticsApi.getTrafficTrend(days),
        select: (res) => payload(res, []),
      },
    ],
  })

  const trafficData = traffic.data || {}
  const errorData = errors.data || {}

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Requests Last Minute" value={number(trafficData.requestsLastMinute)} icon={<Zap size={20} />} color="blue" />
        <StatCard label="Requests Today" value={number(trafficData.requestsToday)} icon={<Activity size={20} />} color="primary" />
        <StatCard label="Avg Response" value={ms(trafficData.avgResponseTimeMs)} icon={<Clock3 size={20} />} color={trafficData.avgResponseTimeMs > 500 ? 'red' : 'amber'} />
        <StatCard label="Error Rate" value={percent(trafficData.errorRatePercent)} icon={<ShieldAlert size={20} />} color={trafficData.errorRatePercent > 5 ? 'red' : trafficData.errorRatePercent > 2 ? 'amber' : 'primary'} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <h2 className="mb-4 text-base font-semibold text-text-primary">Traffic Volume</h2>
          {trend.isLoading ? <Skeleton className="h-44" /> : <MiniLineChart data={trend.data || []} color="#2563eb" label="Requests" />}
        </Card>
        <Card>
          <h2 className="mb-4 text-base font-semibold text-text-primary">Status Code Distribution</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <MetricTile label="2xx" value={number(errorData.count2xx)} icon={<Gauge size={17} />} tone="green" />
            <MetricTile label="4xx" value={number(errorData.count4xx)} icon={<AlertTriangle size={17} />} tone={errorData.count4xx > 0 ? 'yellow' : 'green'} />
            <MetricTile label="5xx" value={number(errorData.count5xx)} icon={<ShieldAlert size={17} />} tone={errorData.count5xx > 0 ? 'red' : 'green'} />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <h2 className="mb-4 text-base font-semibold text-text-primary">Top Endpoints</h2>
          {top.isLoading ? <Skeleton className="h-72" /> : <BarList data={top.data || []} valueKey="callCount" labelKey="endpoint" empty="No endpoint traffic yet" />}
        </Card>
        <Card>
          <h2 className="mb-4 text-base font-semibold text-text-primary">Slowest Endpoints</h2>
          {slow.isLoading ? <Skeleton className="h-72" /> : <BarList data={slow.data || []} valueKey="avgDurationMs" labelKey="endpoint" empty="No duration data yet" />}
        </Card>
      </div>
    </div>
  )
}

function InfrastructurePanel() {
  const [jvm, database, redis] = useQueries({
    queries: [
      {
        queryKey: ['analytics-jvm'],
        queryFn: analyticsApi.getJvmMetrics,
        select: (res) => payload(res, {}),
        refetchInterval: 30000,
      },
      {
        queryKey: ['analytics-database'],
        queryFn: analyticsApi.getDatabaseMetrics,
        select: (res) => payload(res, {}),
        refetchInterval: 30000,
      },
      {
        queryKey: ['analytics-redis'],
        queryFn: analyticsApi.getRedisMetrics,
        select: (res) => payload(res, {}),
        refetchInterval: 30000,
      },
    ],
  })

  const j = jvm.data || {}
  const db = database.data || {}
  const r = redis.data || {}
  const tableRows = Object.entries(db.tableRowCounts || {})
    .sort((a, b) => Number(b[1] || 0) - Number(a[1] || 0))
    .slice(0, 12)
    .map(([name, rows]) => ({ name, rows }))

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card>
          <h2 className="mb-4 text-base font-semibold text-text-primary">JVM Health</h2>
          <div className="space-y-3">
            <MetricTile label="Heap used" value={percent(j.heapUsedPercent)} icon={<Gauge size={17} />} tone={statusTone(j.heapUsedPercent, 70, 85)} detail={`${number(Math.round((j.heapUsedBytes || 0) / 1048576))} MB used`} />
            <MetricTile label="CPU usage" value={percent(j.cpuUsagePercent)} icon={<Activity size={17} />} tone={statusTone(j.cpuUsagePercent, 60, 80)} detail={`${number(j.availableProcessors)} processors`} />
            <MetricTile label="Threads" value={number(j.liveThreads)} icon={<Server size={17} />} tone="blue" detail={`${number(j.daemonThreads)} daemon, ${number(j.peakThreads)} peak`} />
            <MetricTile label="Uptime" value={j.uptimeFormatted || '-'} icon={<Clock3 size={17} />} tone="primary" />
          </div>
        </Card>

        <Card>
          <h2 className="mb-4 text-base font-semibold text-text-primary">Database Health</h2>
          <div className="space-y-3">
            <MetricTile label="Database size" value={db.databaseSizeFormatted || '-'} icon={<Database size={17} />} tone="primary" />
            <MetricTile label="Active connections" value={number(db.activeConnections)} icon={<Activity size={17} />} tone="blue" detail={`${number(db.idleConnections)} idle of ${number(db.maxConnections)} max`} />
            <MetricTile label="Pending connections" value={number(db.pendingConnections)} icon={<AlertTriangle size={17} />} tone={statusTone(db.pendingConnections, 0, 5)} />
          </div>
        </Card>

        <Card>
          <h2 className="mb-4 text-base font-semibold text-text-primary">Redis Health</h2>
          <div className="space-y-3">
            <MetricTile label="Memory used" value={r.usedMemoryFormatted || '-'} icon={<HardDrive size={17} />} tone={statusTone(r.memoryUsagePercent, 70, 85)} detail={r.maxMemoryBytes ? percent(r.memoryUsagePercent) : 'No max memory configured'} />
            <MetricTile label="Hit rate" value={percent(r.hitRatePercent)} icon={<Gauge size={17} />} tone={statusTone(r.hitRatePercent, 80, 50, true)} detail={`${number(r.keyspaceHits)} hits, ${number(r.keyspaceMisses)} misses`} />
            <MetricTile label="Keys" value={number(r.totalKeys)} icon={<Database size={17} />} tone="blue" detail={`${number(r.cacheKeys)} cache, ${number(r.rateLimitKeys)} rate-limit`} />
            <MetricTile label="Evictions" value={number(r.evictedKeys)} icon={<AlertTriangle size={17} />} tone={r.evictedKeys > 0 ? 'red' : 'green'} detail={`${number(r.connectedClients)} clients, Redis ${r.redisVersion || '-'}`} />
          </div>
        </Card>
      </div>

      <Card>
        <h2 className="mb-4 text-base font-semibold text-text-primary">Largest Tables</h2>
        <AnalyticsTable
          rows={tableRows}
          empty="No table row estimates are available"
          columns={[
            { key: 'name', label: 'Table', render: (row) => <span className="font-mono text-text-primary">{truncate(row.name, 42)}</span> },
            { key: 'rows', label: 'Estimated Rows', render: (row) => number(row.rows) },
          ]}
        />
      </Card>
    </div>
  )
}

export function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState('overview')
  const [days, setDays] = useState(30)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform Analytics"
        subtitle="Product analytics, traffic monitoring, and live infrastructure metrics for SYSTEM administrators."
        action={
          <div className="w-36">
            <Select value={days} onChange={(e) => setDays(Number(e.target.value))} title="Analytics time window">
              <option value={7}>7 days</option>
              <option value={30}>30 days</option>
              <option value={90}>90 days</option>
              <option value={365}>365 days</option>
            </Select>
          </div>
        }
      />

      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map((tab) => (
          <TabButton key={tab.id} tab={tab} active={activeTab === tab.id} onClick={() => setActiveTab(tab.id)} />
        ))}
      </div>

      {activeTab === 'overview' && <OverviewPanel days={days} />}
      {activeTab === 'institutions' && <InstitutionsPanel days={days} />}
      {activeTab === 'resources' && <ResourcesPanel days={days} />}
      {activeTab === 'traffic' && <TrafficPanel days={days} />}
      {activeTab === 'infrastructure' && <InfrastructurePanel />}
    </div>
  )
}
