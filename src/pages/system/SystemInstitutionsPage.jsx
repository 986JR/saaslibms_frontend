import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Building2, Search, FilterX, AlertTriangle, ShieldCheck, Power } from 'lucide-react'
import { systemApi } from '../../api'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select, EmptyState, SkeletonRow, Pagination, Card, Badge, ConfirmDialog } from '../../components/ui'
import { PageHeader } from '../../components/layout/PageHeader'
import { getErrorMessage, formatDateTime } from '../../utils'
import toast from 'react-hot-toast'

export function SystemInstitutionsPage() {
  const qc = useQueryClient()
  const [page, setPage] = useState(0)
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [changingStatus, setChangingStatus] = useState(null) // holds { inst, targetStatus }

  // Fetch Institutions paginated + filtered
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['system-institutions', { status, search, page }],
    queryFn: () =>
      systemApi.listInstitutions({
        status: status || undefined,
        search: search || undefined,
        page,
        size: 10,
      }),
    select: (res) => res?.data?.data ?? { content: [], totalPages: 0, totalElements: 0 },
  })

  const institutions = data?.content || []
  const totalPages = data?.totalPages || 0
  const totalElements = data?.totalElements || 0

  // Mutate Institution Status
  const statusMutation = useMutation({
    mutationFn: ({ publicId, status }) => systemApi.updateInstitutionStatus(publicId, status),
    onSuccess: () => {
      toast.success('Institution status updated successfully')
      qc.invalidateQueries({ queryKey: ['system-institutions'] })
      qc.invalidateQueries({ queryKey: ['system-dashboard-stats'] })
      setChangingStatus(null)
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  function handleResetFilters() {
    setStatus('')
    setSearch('')
    setPage(0)
  }

  const hasActiveFilters = status || search

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tenant Institutions"
        subtitle={`${totalElements} registered institution${totalElements !== 1 ? 's' : ''}`}
      />

      {/* Filters */}
      <Card className="p-4 flex flex-col sm:flex-row gap-3 items-end">
        <div className="flex-1">
          <Input
            label="Search Institutions"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(0)
            }}
            icon={<Search size={15} />}
          />
        </div>
        <div className="w-full sm:w-48">
          <Select
            label="Status Filter"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value)
              setPage(0)
            }}
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
          </Select>
        </div>
        {hasActiveFilters && (
          <button
            onClick={handleResetFilters}
            className="h-10 px-3 flex items-center justify-center border border-border bg-white rounded-xl hover:bg-surface text-text-secondary hover:text-text-primary transition-colors mb-0.5"
            title="Clear all filters"
          >
            <FilterX size={16} />
          </button>
        )}
      </Card>

      {/* Table */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface">
                {['Institution Details', 'Contact info', 'Status', 'Verified', 'Created At', ''].map((h) => (
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
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={6} />)
              ) : isError ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-danger">
                    {getErrorMessage(error)}
                  </td>
                </tr>
              ) : institutions.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <EmptyState
                      icon={<Building2 size={22} />}
                      title="No institutions found"
                      description={
                        hasActiveFilters
                          ? 'No entries match your search criteria.'
                          : 'Institutions registered in the system will appear here.'
                      }
                      action={
                        hasActiveFilters ? (
                          <Button size="sm" onClick={handleResetFilters}>
                            Clear Filters
                          </Button>
                        ) : null
                      }
                    />
                  </td>
                </tr>
              ) : (
                institutions.map((inst) => (
                  <tr
                    key={inst.publicId}
                    className="border-b border-border hover:bg-surface/40 transition-colors"
                  >
                    {/* Name & Public ID */}
                    <td className="px-4 py-3 font-medium text-text-primary max-w-[200px] truncate">
                      <div className="flex flex-col">
                        <span className="font-semibold">{inst.name}</span>
                        <span className="text-[10px] font-mono text-text-secondary">{inst.publicId}</span>
                      </div>
                    </td>

                    {/* Email & Phone */}
                    <td className="px-4 py-3 text-text-secondary">
                      <div className="flex flex-col">
                        <span>{inst.email}</span>
                        <span className="text-xs">{inst.phone || 'No phone'}</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <Badge
                        color={
                          inst.status === 'ACTIVE'
                            ? 'green'
                            : inst.status === 'SUSPENDED'
                            ? 'red'
                            : 'yellow'
                        }
                      >
                        {inst.status}
                      </Badge>
                    </td>

                    {/* Verified */}
                    <td className="px-4 py-3">
                      <Badge color={inst.isVerified ? 'primary' : 'gray'}>
                        {inst.isVerified ? 'Yes' : 'No'}
                      </Badge>
                    </td>

                    {/* Created At */}
                    <td className="px-4 py-3 text-text-secondary whitespace-nowrap">
                      {formatDateTime(inst.createdAt)}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right">
                      {inst.publicId !== 'INST-SYSTEM' && (
                        <div className="flex items-center justify-end gap-1.5">
                          {inst.status === 'ACTIVE' ? (
                            <button
                              onClick={() => setChangingStatus({ inst, targetStatus: 'SUSPENDED' })}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent"
                              title="Suspend Institution"
                            >
                              <Power size={13} />
                              Suspend
                            </button>
                          ) : (
                            <button
                              onClick={() => setChangingStatus({ inst, targetStatus: 'ACTIVE' })}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-green-600 hover:bg-green-50 rounded-lg transition-colors border border-transparent"
                              title="Activate Institution"
                            >
                              <ShieldCheck size={13} />
                              Activate
                            </button>
                          )}
                        </div>
                      )}
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

      {/* Status Toggle Confirmation Dialog */}
      <ConfirmDialog
        open={!!changingStatus}
        onClose={() => setChangingStatus(null)}
        onConfirm={() =>
          statusMutation.mutate({
            publicId: changingStatus?.inst.publicId,
            status: changingStatus?.targetStatus,
          })
        }
        loading={statusMutation.isPending}
        title={changingStatus?.targetStatus === 'SUSPENDED' ? 'Suspend Institution' : 'Activate Institution'}
        message={
          changingStatus?.targetStatus === 'SUSPENDED'
            ? `Are you sure you want to suspend "${changingStatus?.inst.name}"? Users of this institution will not be able to log in or perform actions.`
            : `Are you sure you want to activate "${changingStatus?.inst.name}"?`
        }
        confirmLabel={changingStatus?.targetStatus === 'SUSPENDED' ? 'Suspend' : 'Activate'}
      />
    </div>
  )
}
