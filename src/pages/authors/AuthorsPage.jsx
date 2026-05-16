import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, PenLine, Pencil, Trash2 } from 'lucide-react'
import { authorsApi } from '../../api'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Textarea } from '../../components/ui'
import { Modal, ConfirmDialog, EmptyState, SkeletonRow, Pagination, Card } from '../../components/ui'
import { PageHeader } from '../../components/layout/PageHeader'
import { getErrorMessage } from '../../utils'
import toast from 'react-hot-toast'

function AuthorForm({ initial, onSubmit, loading }) {
  const [form, setForm] = useState(initial || { name: '', bio: '' })
  const [errors, setErrors] = useState({})

  function update(e) {
    const { name, value } = e.target
    setForm(p => ({ ...p, [name]: value }))
    if (errors[name]) setErrors(p => ({ ...p, [name]: '' }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.name?.trim()) return setErrors({ name: 'Name is required' })
    onSubmit(form)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="Full name *" name="name" value={form.name} onChange={update} error={errors.name} placeholder="Robert C. Martin" />
      <Textarea label="Bio" name="bio" value={form.bio} onChange={update} placeholder="Brief description…" />
      <Button type="submit" loading={loading} className="w-full mt-2">
        {initial ? 'Save changes' : 'Add author'}
      </Button>
    </form>
  )
}

export function AuthorsPage() {
  const qc = useQueryClient()
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['authors', { page, search }],
    queryFn: () => authorsApi.list({ page, size: 10, search: search || undefined }),
  })

  const authors = data?.data?.data?.content || []
  const totalPages = data?.data?.data?.totalPages || 0

  const createMutation = useMutation({
    mutationFn: authorsApi.create,
    onSuccess: () => { toast.success('Author added'); qc.invalidateQueries(['authors']); setShowAdd(false) },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => authorsApi.update(id, data),
    onSuccess: () => { toast.success('Author updated'); qc.invalidateQueries(['authors']); setEditing(null) },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const deleteMutation = useMutation({
    mutationFn: authorsApi.delete,
    onSuccess: () => { toast.success('Author removed'); qc.invalidateQueries(['authors']); setDeleting(null) },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  return (
    <div>
      <PageHeader
        title="Authors"
        subtitle="Manage book authors"
        action={<Button icon={<Plus size={15} />} onClick={() => setShowAdd(true)}>Add author</Button>}
      />

      <div className="mb-6 max-w-sm">
        <Input
          placeholder="Search authors…"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(0) }}
          icon={<Search size={15} />}
        />
      </div>

      <Card className="p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface">
              {['Name', 'Bio', ''].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={3} />)
              : authors.length === 0
              ? <tr><td colSpan={3}><EmptyState icon={<PenLine size={22} />} title="No authors found" description="Add authors to link them with books." action={<Button size="sm" onClick={() => setShowAdd(true)} icon={<Plus size={13} />}>Add author</Button>} /></td></tr>
              : authors.map(a => (
                <tr key={a.publicId} className="border-b border-border hover:bg-surface/60 transition-colors">
                  <td className="px-4 py-3 font-medium text-text-primary w-56">{a.name}</td>
                  <td className="px-4 py-3 text-text-secondary text-xs max-w-xs truncate">{a.bio || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => setEditing(a)} className="p-1.5 rounded-lg text-text-secondary hover:text-primary hover:bg-primary-50 transition-colors"><Pencil size={14} /></button>
                      <button onClick={() => setDeleting(a)} className="p-1.5 rounded-lg text-text-secondary hover:text-danger hover:bg-red-50 transition-colors"><Trash2 size={14} /></button>
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

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add author">
        <AuthorForm onSubmit={d => createMutation.mutate(d)} loading={createMutation.isPending} />
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit author">
        {editing && <AuthorForm initial={editing} onSubmit={d => updateMutation.mutate({ id: editing.publicId, data: d })} loading={updateMutation.isPending} />}
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleteMutation.mutate(deleting.publicId)}
        loading={deleteMutation.isPending}
        title="Remove author"
        message={`Remove "${deleting?.name}"? This will unlink them from all books.`}
        confirmLabel="Remove"
      />
    </div>
  )
}
