import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ClipboardList, Eye, RefreshCw, FilterX, HelpCircle } from 'lucide-react'
import { auditLogsApi, usersApi } from '../../api'
import { Button } from '../../components/ui/Button'
import { Select, Modal, EmptyState, SkeletonRow, Pagination, Card, Badge } from '../../components/ui'
import { PageHeader } from '../../components/layout/PageHeader'
import { getErrorMessage, formatDateTime } from '../../utils'

// ─── Constants ───────────────────────────────────────────────────────────────

const ENTITY_TYPES = [
  { value: 'BOOK', label: 'Book' },
  { value: 'AUTHOR', label: 'Author' },
  { value: 'BOOK_AUTHOR', label: 'Book-Author Link' },
  { value: 'CATEGORY', label: 'Category' },
  { value: 'MEMBER', label: 'Member' },
  { value: 'LOAN', label: 'Loan' },
  { value: 'RESERVATION', label: 'Reservation' },
  { value: 'USER', label: 'Staff User' },
]

const AUDIT_ACTIONS = [
  // Book
  { value: 'BOOK_CREATED', label: 'Book Created' },
  { value: 'BOOK_UPDATED', label: 'Book Updated' },
  { value: 'BOOK_DELETED', label: 'Book Deleted' },
  // Author
  { value: 'AUTHOR_CREATED', label: 'Author Created' },
  { value: 'AUTHOR_UPDATED', label: 'Author Updated' },
  { value: 'AUTHOR_DELETED', label: 'Author Deleted' },
  // BookAuthor
  { value: 'BOOK_AUTHOR_LINKED', label: 'Book-Author Linked' },
  { value: 'BOOK_AUTHOR_RELINKED', label: 'Book-Author Relinked' },
  { value: 'BOOK_AUTHOR_UNLINKED', label: 'Book-Author Unlinked' },
  // Category
  { value: 'CATEGORY_CREATED', label: 'Category Created' },
  { value: 'CATEGORY_UPDATED', label: 'Category Updated' },
  { value: 'CATEGORY_DELETED', label: 'Category Deleted' },
  // Member
  { value: 'MEMBER_CREATED', label: 'Member Created' },
  { value: 'MEMBER_UPDATED', label: 'Member Updated' },
  { value: 'MEMBER_BLOCKED', label: 'Member Blocked' },
  { value: 'MEMBER_DELETED', label: 'Member Deleted' },
  // Loan
  { value: 'LOAN_ISSUED', label: 'Loan Issued' },
  { value: 'LOAN_RETURNED', label: 'Loan Returned' },
  { value: 'LOAN_MARKED_OVERDUE', label: 'Loan Marked Overdue' },
  // Reservation
  { value: 'RESERVATION_CREATED', label: 'Reservation Created' },
  { value: 'RESERVATION_CANCELLED', label: 'Reservation Cancelled' },
  // User
  { value: 'USER_CREATED', label: 'User Created' },
  { value: 'USER_UPDATED', label: 'User Updated' },
  { value: 'USER_DISABLED', label: 'User Disabled' },
  { value: 'USER_DELETED', label: 'User Deleted' },
]

const actionColors = {
  // Created/Issued/Linked/Fulfill -> Green
  BOOK_CREATED: 'green',
  AUTHOR_CREATED: 'green',
  CATEGORY_CREATED: 'green',
  MEMBER_CREATED: 'green',
  USER_CREATED: 'green',
  LOAN_ISSUED: 'green',
  RESERVATION_CREATED: 'green',
  BOOK_AUTHOR_LINKED: 'green',

  // Updated/Relinked -> Yellow
  BOOK_UPDATED: 'yellow',
  AUTHOR_UPDATED: 'yellow',
  CATEGORY_UPDATED: 'yellow',
  MEMBER_UPDATED: 'yellow',
  USER_UPDATED: 'yellow',
  BOOK_AUTHOR_RELINKED: 'yellow',

  // Deleted/Blocked/Disabled/Cancelled -> Red or Gray
  BOOK_DELETED: 'red',
  AUTHOR_DELETED: 'red',
  CATEGORY_DELETED: 'red',
  MEMBER_DELETED: 'red',
  USER_DELETED: 'red',
  MEMBER_BLOCKED: 'red',
  USER_DISABLED: 'red',
  RESERVATION_CANCELLED: 'red',
  BOOK_AUTHOR_UNLINKED: 'red',

  // Returns/Other -> Blue
  LOAN_RETURNED: 'blue',
  LOAN_MARKED_OVERDUE: 'red',
}

// Helper to format action string beautifully
function formatActionLabel(action) {
  const item = AUDIT_ACTIONS.find(a => a.value === action)
  if (item) return item.label
  return action.replace(/_/g, ' ')
}

// ─── Metadata Details Visualizer ──────────────────────────────────────────────

function MetadataViewer({ metadata }) {
  if (!metadata) {
    return <span className="text-text-secondary italic text-xs">No metadata available</span>
  }

  let parsed = null
  try {
    parsed = typeof metadata === 'string' ? JSON.parse(metadata) : metadata
  } catch (e) {
    return <pre className="bg-surface text-text-primary p-3 rounded-xl text-xs overflow-x-auto border border-border font-mono">{metadata}</pre>
  }

  if (!parsed || typeof parsed !== 'object' || Object.keys(parsed).length === 0) {
    return <span className="text-text-secondary italic text-xs">No key-value attributes</span>
  }

  // Format keys nicely (e.g. copiesTotal -> Copies Total)
  const formatKey = (key) => {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
  }

  return (
    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
      {Object.entries(parsed).map(([key, val]) => (
        <div key={key} className="bg-surface border border-border p-3 rounded-xl flex flex-col gap-0.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary">
            {formatKey(key)}
          </span>
          <span className="text-sm font-medium text-text-primary truncate" title={String(val)}>
            {val === null || val === undefined ? '—' : String(val)}
          </span>
        </div>
      ))}
    </div>
  )
}

// ─── Main Page Component ──────────────────────────────────────────────────────

export function AuditLogsPage() {
  const [page, setPage] = useState(0)
  const [action, setAction] = useState('')
  const [entityType, setEntityType] = useState('')
  const [actorId, setActorId] = useState('')
  const [detailLog, setDetailLog] = useState(null)

  // Fetch users for the filter dropdown
  const { data: usersData } = useQuery({
    queryKey: ['users-list-for-audit'],
    queryFn: () => usersApi.list({ size: 100 }),
    staleTime: 60000, // cache for 1 minute
  })
  const staffUsers = usersData?.data?.data || []

  // Fetch Audit Logs with filters and pagination
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['audit-logs', { action, entityType, actorId, page }],
    queryFn: () =>
      auditLogsApi.list({
        action: action || undefined,
        entityType: entityType || undefined,
        actorId: actorId || undefined,
        page,
        size: 15,
      }),
  })

  const auditLogs = data?.data?.data?.content || []
  const totalPages = data?.data?.data?.totalPages || 0
  const totalElements = data?.data?.data?.totalElements || 0

  function handleResetFilters() {
    setAction('')
    setEntityType('')
    setActorId('')
    setPage(0)
  }

  const hasActiveFilters = action || entityType || actorId

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Logs"
        subtitle="Security and history trail of institution actions."
        action={
          <Button
            variant="outline"
            icon={<RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />}
            onClick={() => refetch()}
            disabled={isLoading}
          >
            Refresh
          </Button>
        }
      />

      {/* Filter Section */}
      <Card className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
        <Select
          label="Entity Type"
          value={entityType}
          onChange={(e) => {
            setEntityType(e.target.value)
            setPage(0)
          }}
        >
          <option value="">All Entities</option>
          {ENTITY_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </Select>

        <Select
          label="Action"
          value={action}
          onChange={(e) => {
            setAction(e.target.value)
            setPage(0)
          }}
        >
          <option value="">All Actions</option>
          {AUDIT_ACTIONS.map((a) => (
            <option key={a.value} value={a.value}>
              {a.label}
            </option>
          ))}
        </Select>

        <div className="flex gap-2 items-center">
          <div className="flex-1">
            <Select
              label="Staff Actor"
              value={actorId}
              onChange={(e) => {
                setActorId(e.target.value)
                setPage(0)
              }}
            >
              <option value="">All Staff</option>
              {staffUsers.map((u) => (
                <option key={u.publicId} value={u.publicId}>
                  {u.username} ({u.role})
                </option>
              ))}
            </Select>
          </div>
          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="h-10 px-3 flex items-center justify-center border border-border bg-white rounded-xl hover:bg-surface text-text-secondary hover:text-text-primary transition-colors mt-6"
              title="Clear all filters"
            >
              <FilterX size={16} />
            </button>
          )}
        </div>
      </Card>

      {/* Table Section */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface">
                {['Timestamp', 'Actor', 'Action', 'Entity Reference', ''].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={5} />)
              ) : isError ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-danger">
                    {getErrorMessage(error)}
                  </td>
                </tr>
              ) : auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <EmptyState
                      icon={<ClipboardList size={22} />}
                      title="No audit logs found"
                      description={
                        hasActiveFilters
                          ? 'No entries match your filter criteria. Try expanding your search filters.'
                          : 'Events performed by staff members will be recorded here.'
                      }
                      action={
                        hasActiveFilters ? (
                          <Button size="sm" onClick={handleResetFilters}>
                            Reset Filters
                          </Button>
                        ) : null
                      }
                    />
                  </td>
                </tr>
              ) : (
                auditLogs.map((log) => (
                  <tr
                    key={log.id}
                    className="border-b border-border hover:bg-surface/40 transition-colors"
                  >
                    {/* Timestamp */}
                    <td className="px-4 py-3 whitespace-nowrap text-text-secondary">
                      {formatDateTime(log.createdAt)}
                    </td>

                    {/* Actor */}
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="font-medium text-text-primary">{log.actorEmail}</span>
                        <span className="text-[10px] text-text-secondary uppercase tracking-wider">
                          Role: {log.actorRole}
                        </span>
                      </div>
                    </td>

                    {/* Action */}
                    <td className="px-4 py-3">
                      <Badge color={actionColors[log.action] || 'gray'}>
                        {formatActionLabel(log.action)}
                      </Badge>
                    </td>

                    {/* Entity Reference */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs text-text-primary bg-surface border border-border px-1.5 py-0.5 rounded-lg">
                          {log.entityType}
                        </span>
                        {log.entityPublicId && (
                          <span className="font-mono text-xs text-text-secondary">
                            {log.entityPublicId}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Detail Inspector Button */}
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setDetailLog(log)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-text-secondary hover:text-primary hover:bg-primary-50 rounded-lg transition-colors border border-transparent hover:border-primary-100"
                        title="View Full Details"
                      >
                        <Eye size={13} />
                        Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-4 pb-4 border-t border-border">
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}
      </Card>

      {/* Audit Log Detail Inspector Modal */}
      <Modal
        open={!!detailLog}
        onClose={() => setDetailLog(null)}
        title="Audit Log Detail Inspector"
        size="lg"
      >
        {detailLog && (
          <div className="space-y-5">
            {/* General Log Info Card */}
            <div className="grid grid-cols-2 gap-4 bg-surface p-4 rounded-xl border border-border text-sm">
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-text-secondary">Log ID</span>
                <span className="font-mono text-xs text-text-primary truncate" title={detailLog.id}>
                  {detailLog.id}
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-text-secondary">Logged At</span>
                <span className="text-text-primary">
                  {formatDateTime(detailLog.createdAt)}
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-text-secondary">Actor Email</span>
                <span className="text-text-primary font-medium truncate" title={detailLog.actorEmail}>
                  {detailLog.actorEmail}
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-text-secondary">Actor UUID</span>
                <span className="font-mono text-xs text-text-secondary truncate" title={detailLog.actorId}>
                  {detailLog.actorId}
                </span>
              </div>
            </div>

            {/* Entity/Action Details */}
            <div className="flex flex-wrap gap-3 items-center justify-between border-t border-b border-border py-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-text-secondary uppercase">Action Executed:</span>
                <Badge color={actionColors[detailLog.action] || 'gray'}>
                  {formatActionLabel(detailLog.action)}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-text-secondary uppercase">Target Entity:</span>
                <span className="font-mono text-xs text-text-primary bg-surface border border-border px-1.5 py-0.5 rounded-lg">
                  {detailLog.entityType}
                </span>
                {detailLog.entityPublicId && (
                  <span className="font-mono text-xs text-text-secondary">
                    {detailLog.entityPublicId}
                  </span>
                )}
              </div>
            </div>

            {/* Parsed Metadata Section */}
            <div className="space-y-2">
              <div className="flex items-center gap-1 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                <HelpCircle size={13} />
                Action Metadata Context
              </div>
              <MetadataViewer metadata={detailLog.metadata} />
            </div>

            <div className="flex justify-end pt-2">
              <Button onClick={() => setDetailLog(null)} variant="outline">
                Close Inspector
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
