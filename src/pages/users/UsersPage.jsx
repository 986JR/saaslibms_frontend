import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Users, Pencil, Trash2 } from 'lucide-react'
import { usersApi } from '../../api'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select, Modal, ConfirmDialog, EmptyState, SkeletonRow, Pagination, Card, Badge } from '../../components/ui'
import { PageHeader } from '../../components/layout/PageHeader'
import { getErrorMessage, formatDate } from '../../utils'
import toast from 'react-hot-toast'

function UserForm({ initial, onSubmit, loading }) {
  const [form, setForm] = useState(initial || { username: '', email: '', password: '', role: 'LIBRARIAN' })
  const [errors, setErrors] = useState({})

  function update(e) {
    const { name, value } = e.target
    setForm(p => ({ ...p, [name]: value }))
    if (errors[name]) setErrors(p => ({ ...p, [name]: '' }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    const errs = {}
    if (!form.username?.trim()) errs.username = 'Username is required'
    if (!form.email?.trim()) errs.email = 'Email is required'
    if (!initial && !form.password?.trim()) errs.password = 'Password is required'
    if (Object.keys(errs).length) return setErrors(errs)
    onSubmit(form)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="Username *" name="username" value={form.username} onChange={update} error={errors.username} placeholder="john.librarian" />
      <Input label="Email *" name="email" type="email" value={form.email} onChange={update} error={errors.email} placeholder="john@library.ac.tz" />
      {!initial && (
        <Input label="Password *" name="password" type="password" value={form.password} onChange={update} error={errors.password} placeholder="••••••••" />
      )}
      <Select label="Role" name="role" value={form.role} onChange={update}>
        <option value="LIBRARIAN">Librarian</option>
        <option value="ADMIN">Admin</option>
      </Select>
      <Button type="submit" loading={loading} className="w-full mt-2">
        {initial ? 'Save changes' : 'Create user'}
      </Button>
    </form>
  )
}

export function UsersPage() {
  const qc = useQueryClient()
  const [page, setPage] = useState(0)
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['users', { page }],
    queryFn: () => usersApi.list({ page, size: 10 }),
  })

  const users = data?.data?.data?.content || []
  const totalPages = data?.data?.data?.totalPages || 0
  const totalElements = data?.data?.data?.totalElements || 0

  const createMutation = useMutation({
    mutationFn: usersApi.create,
    onSuccess: () => { toast.success('Staff user created'); qc.invalidateQueries(['users']); setShowAdd(false) },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => usersApi.update(id, data),
    onSuccess: () => { toast.success('User updated'); qc.invalidateQueries(['users']); setEditing(null) },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const deleteMutation = useMutation({
    mutationFn: usersApi.delete,
    onSuccess: () => { toast.success('User removed'); qc.invalidateQueries(['users']); setDeleting(null) },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  return (
    <div>
      <PageHeader
        title="Staff Users"
        subtitle={`${totalElements} users — Admins and Librarians`}
        action={<Button icon={<Plus size={15} />} onClick={() => setShowAdd(true)}>Add user</Button>}
      />

      <Card className="p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface">
              {['User', 'Email', 'Role', 'Joined', ''].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={5} />)
              : users.length === 0
              ? <tr><td colSpan={5}><EmptyState icon={<Users size={22} />} title="No staff users" description="Create accounts for librarians and admins." action={<Button size="sm" onClick={() => setShowAdd(true)} icon={<Plus size={13} />}>Add user</Button>} /></td></tr>
              : users.map(u => (
                <tr key={u.publicId} className="border-b border-border hover:bg-surface/60 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-white text-xs font-bold">
                        {u.username?.[0]?.toUpperCase()}
                      </div>
                      <span className="font-medium text-text-primary">{u.username}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{u.email}</td>
                  <td className="px-4 py-3">
                    <Badge color={u.role === 'ADMIN' ? 'primary' : 'blue'}>{u.role}</Badge>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{formatDate(u.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => setEditing(u)} className="p-1.5 rounded-lg text-text-secondary hover:text-primary hover:bg-primary-50 transition-colors"><Pencil size={14} /></button>
                      <button onClick={() => setDeleting(u)} className="p-1.5 rounded-lg text-text-secondary hover:text-danger hover:bg-red-50 transition-colors"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
        <div className="px-4 pb-4">
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </Card>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Create staff user">
        <UserForm onSubmit={d => createMutation.mutate(d)} loading={createMutation.isPending} />
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit user">
        {editing && <UserForm initial={editing} onSubmit={d => updateMutation.mutate({ id: editing.publicId, data: d })} loading={updateMutation.isPending} />}
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleteMutation.mutate(deleting.publicId)}
        loading={deleteMutation.isPending}
        title="Remove user"
        message={`Remove "${deleting?.username}" from the system?`}
        confirmLabel="Remove"
      />
    </div>
  )
}
