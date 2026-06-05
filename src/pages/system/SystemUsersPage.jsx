import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Users, Plus, Pencil, Trash2, Search, FilterX } from 'lucide-react'
import { systemApi } from '../../api'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select, Modal, ConfirmDialog, EmptyState, SkeletonRow, Pagination, Card, Badge } from '../../components/ui'
import { PageHeader } from '../../components/layout/PageHeader'
import { getErrorMessage } from '../../utils'
import toast from 'react-hot-toast'

// ─── Global User Form ────────────────────────────────────────────────────────

function SystemUserForm({ initial, onSubmit, loading, institutions }) {
  const [form, setForm] = useState(
    initial
      ? {
          username: initial.username,
          email: initial.email,
          role: initial.role,
          status: initial.status || 'ACTIVE',
          institutionPublicId: initial.insititutionId || '',
        }
      : {
          username: '',
          email: '',
          password: '',
          role: 'LIBRARIAN',
          institutionPublicId: '',
        }
  )
  const [errors, setErrors] = useState({})

  function update(e) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    const errs = {}
    if (!form.username?.trim()) errs.username = 'Username is required'
    if (!form.email?.trim()) errs.email = 'Email is required'
    if (!initial && !form.password?.trim()) errs.password = 'Password is required'
    if (form.role !== 'SYSTEM' && !form.institutionPublicId) {
      errs.institutionPublicId = 'Institution is required for staff users'
    }

    if (Object.keys(errs).length) return setErrors(errs)

    onSubmit({
      ...form,
      institutionPublicId: form.role === 'SYSTEM' ? undefined : form.institutionPublicId,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Username *"
        name="username"
        value={form.username}
        onChange={update}
        error={errors.username}
        placeholder="john.doe"
      />
      <Input
        label="Email *"
        name="email"
        type="email"
        value={form.email}
        onChange={update}
        error={errors.email}
        placeholder="john@example.com"
      />
      {!initial && (
        <Input
          label="Password *"
          name="password"
          type="password"
          value={form.password}
          onChange={update}
          error={errors.password}
          placeholder="••••••••"
        />
      )}
      <Select label="Role *" name="role" value={form.role} onChange={update}>
        <option value="LIBRARIAN">Librarian</option>
        <option value="ADMIN">Institution Admin</option>
        <option value="SYSTEM">System Admin</option>
      </Select>

      {form.role !== 'SYSTEM' && (
        <Select
          label="Assigned Institution *"
          name="institutionPublicId"
          value={form.institutionPublicId}
          onChange={update}
          error={errors.institutionPublicId}
        >
          <option value="">— Select Institution —</option>
          {institutions.map((inst) => (
            <option key={inst.publicId} value={inst.publicId}>
              {inst.name} ({inst.publicId})
            </option>
          ))}
        </Select>
      )}

      {initial && (
        <Select label="Status" name="status" value={form.status} onChange={update}>
          <option value="ACTIVE">Active</option>
          <option value="DISABLED">Disabled</option>
        </Select>
      )}

      <Button type="submit" loading={loading} className="w-full mt-2">
        {initial ? 'Save changes' : 'Create user'}
      </Button>
    </form>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function SystemUsersPage() {
  const qc = useQueryClient()
  const [page, setPage] = useState(0)
  const [roleFilter, setRoleFilter] = useState('')
  const [instFilter, setInstFilter] = useState('')

  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)

  // Fetch all institutions (uncached) to populate dropdowns
  const { data: instData } = useQuery({
    queryKey: ['system-institutions-lookup'],
    queryFn: () => systemApi.listInstitutions({ size: 100 }),
    select: (res) => res?.data?.data?.content || [],
  })
  const institutionsList = instData || []

  // Fetch system users paginated
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['system-users', { roleFilter, instFilter, page }],
    queryFn: () =>
      systemApi.listUsers({
        role: roleFilter || undefined,
        institutionPublicId: instFilter || undefined,
        page,
        size: 10,
      }),
    select: (res) => res?.data?.data ?? { content: [], totalPages: 0, totalElements: 0 },
  })

  const users = data?.content || []
  const totalPages = data?.totalPages || 0
  const totalElements = data?.totalElements || 0

  // Mutations
  const createMutation = useMutation({
    mutationFn: systemApi.createUser,
    onSuccess: () => {
      toast.success('User created successfully')
      qc.invalidateQueries({ queryKey: ['system-users'] })
      qc.invalidateQueries({ queryKey: ['system-dashboard-stats'] })
      setShowAdd(false)
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => systemApi.updateUser(id, data),
    onSuccess: () => {
      toast.success('User updated successfully')
      qc.invalidateQueries({ queryKey: ['system-users'] })
      setEditing(null)
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const deleteMutation = useMutation({
    mutationFn: systemApi.deleteUser,
    onSuccess: () => {
      toast.success('User disabled successfully')
      qc.invalidateQueries({ queryKey: ['system-users'] })
      qc.invalidateQueries({ queryKey: ['system-dashboard-stats'] })
      setDeleting(null)
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  function handleResetFilters() {
    setRoleFilter('')
    setInstFilter('')
    setPage(0)
  }

  const hasActiveFilters = roleFilter || instFilter

  return (
    <div className="space-y-6">
      <PageHeader
        title="Global Users"
        subtitle={`${totalElements} user${totalElements !== 1 ? 's' : ''} in system`}
        action={
          <Button icon={<Plus size={15} />} onClick={() => setShowAdd(true)}>
            Add user
          </Button>
        }
      />

      {/* Filters */}
      <Card className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
        <Select
          label="Filter by Role"
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value)
            setPage(0)
          }}
        >
          <option value="">All Roles</option>
          <option value="LIBRARIAN">Librarian</option>
          <option value="ADMIN">Institution Admin</option>
          <option value="SYSTEM">System Admin</option>
        </Select>

        <Select
          label="Filter by Institution"
          value={instFilter}
          onChange={(e) => {
            setInstFilter(e.target.value)
            setPage(0)
          }}
        >
          <option value="">All Institutions</option>
          {institutionsList.map((inst) => (
            <option key={inst.publicId} value={inst.publicId}>
              {inst.name}
            </option>
          ))}
        </Select>

        {hasActiveFilters && (
          <button
            onClick={handleResetFilters}
            className="h-10 px-3 flex items-center justify-center border border-border bg-white rounded-xl hover:bg-surface text-text-secondary hover:text-text-primary transition-colors"
            title="Clear all filters"
          >
            <FilterX size={16} />
            <span className="ml-1 text-xs">Clear Filters</span>
          </button>
        )}
      </Card>

      {/* Table */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface">
                {['User info', 'Email', 'Role', 'Institution', 'Status', ''].map((h) => (
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
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <EmptyState
                      icon={<Users size={22} />}
                      title="No users found"
                      description={
                        hasActiveFilters
                          ? 'No users match your filters.'
                          : 'Create your first system administrator or tenant staff user.'
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
                users.map((u) => (
                  <tr
                    key={u.publicId}
                    className="border-b border-border hover:bg-surface/40 transition-colors"
                  >
                    {/* User profile avatar + name */}
                    <td className="px-4 py-3 font-medium text-text-primary">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-white text-xs font-bold">
                          {u.username?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div className="flex flex-col">
                          <span>{u.username}</span>
                          <span className="text-[10px] font-mono text-text-secondary">{u.publicId}</span>
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="px-4 py-3 text-text-secondary">{u.email}</td>

                    {/* Role */}
                    <td className="px-4 py-3">
                      <Badge
                        color={
                          u.role === 'SYSTEM'
                            ? 'primary'
                            : u.role === 'ADMIN'
                            ? 'blue'
                            : 'gray'
                        }
                      >
                        {u.role}
                      </Badge>
                    </td>

                    {/* Institution */}
                    <td className="px-4 py-3 text-text-secondary truncate max-w-[150px]">
                      {u.role === 'SYSTEM' ? (
                        <span className="italic font-medium text-primary">System Admin</span>
                      ) : (
                        u.insititutionId || '—'
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <Badge color={u.status === 'ACTIVE' ? 'green' : 'red'}>
                        {u.status}
                      </Badge>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setEditing(u)}
                          className="p-1.5 rounded-lg text-text-secondary hover:text-primary hover:bg-primary-50 transition-colors"
                          title="Edit User"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => setDeleting(u)}
                          className="p-1.5 rounded-lg text-text-secondary hover:text-danger hover:bg-red-50 transition-colors"
                          title="Disable User"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
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

      {/* Add Modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Create System/Staff User">
        <SystemUserForm
          institutions={institutionsList}
          onSubmit={(d) => createMutation.mutate(d)}
          loading={createMutation.isPending}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit System/Staff User">
        {editing && (
          <SystemUserForm
            initial={editing}
            institutions={institutionsList}
            onSubmit={(d) => updateMutation.mutate({ id: editing.publicId, data: d })}
            loading={updateMutation.isPending}
          />
        )}
      </Modal>

      {/* Delete/Disable Confirmation */}
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleteMutation.mutate(deleting.publicId)}
        loading={deleteMutation.isPending}
        title="Disable User"
        message={`Disable the user account for "${deleting?.username}"? They will no longer be able to log in.`}
        confirmLabel="Disable"
      />
    </div>
  )
}
