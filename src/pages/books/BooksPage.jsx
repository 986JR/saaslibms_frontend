import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, BookOpen, Trash2, Pencil } from 'lucide-react'
import { booksApi } from '../../api'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Modal, ConfirmDialog, EmptyState, Skeleton, SkeletonRow, Pagination, Card } from '../../components/ui'
import { PageHeader } from '../../components/layout/PageHeader'
import { getErrorMessage, formatDate, cn } from '../../utils'
import toast from 'react-hot-toast'

function BookForm({ initial, onSubmit, loading }) {
  const [form, setForm] = useState(initial || {
    title: '', isbn: '', publishedYear: '', copiesTotal: 1, description: ''
  })
  const [errors, setErrors] = useState({})

  function update(e) {
    const { name, value } = e.target
    setForm(p => ({ ...p, [name]: value }))
    if (errors[name]) setErrors(p => ({ ...p, [name]: '' }))
  }

  function validate() {
    const errs = {}
    if (!form.title?.trim()) errs.title = 'Title is required'
    if (!form.copiesTotal || form.copiesTotal < 1) errs.copiesTotal = 'At least 1 copy required'
    return errs
  }

  function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) return setErrors(errs)
    onSubmit({
      ...form,
      copiesTotal: parseInt(form.copiesTotal),
      publishedYear: form.publishedYear ? parseInt(form.publishedYear) : undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="Title *" name="title" value={form.title} onChange={update} error={errors.title} placeholder="Clean Code" />
      <div className="grid grid-cols-2 gap-3">
        <Input label="ISBN" name="isbn" value={form.isbn} onChange={update} placeholder="978-0-13-468599-1" />
        <Input label="Published Year" name="publishedYear" type="number" value={form.publishedYear} onChange={update} placeholder="2008" />
      </div>
      <Input label="Total Copies *" name="copiesTotal" type="number" value={form.copiesTotal} onChange={update} error={errors.copiesTotal} min={1} />
      <div className="flex gap-3 pt-2">
        <Button type="submit" loading={loading} className="flex-1">
          {initial ? 'Save changes' : 'Add book'}
        </Button>
      </div>
    </form>
  )
}

export function BooksPage() {
  const qc = useQueryClient()
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['books', { page, search }],
    queryFn: () => booksApi.list({ page, size: 10, search: search || undefined }),
  })

  const books = data?.data?.data?.content || []
  const totalPages = data?.data?.data?.totalPages || 0
  const totalElements = data?.data?.data?.totalElements || 0

  const createMutation = useMutation({
    mutationFn: booksApi.create,
    onSuccess: () => {
      toast.success('Book added')
      qc.invalidateQueries(['books'])
      setShowAdd(false)
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => booksApi.update(id, data),
    onSuccess: () => {
      toast.success('Book updated')
      qc.invalidateQueries(['books'])
      setEditing(null)
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const deleteMutation = useMutation({
    mutationFn: booksApi.delete,
    onSuccess: () => {
      toast.success('Book deleted')
      qc.invalidateQueries(['books'])
      setDeleting(null)
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  return (
    <div>
      <PageHeader
        title="Books"
        subtitle={`${totalElements} books in catalogue`}
        action={
          <Button icon={<Plus size={15} />} onClick={() => setShowAdd(true)}>
            Add book
          </Button>
        }
      />

      {/* Search */}
      <div className="mb-6 max-w-sm">
        <Input
          placeholder="Search books…"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(0) }}
          icon={<Search size={15} />}
        />
      </div>

      <Card className="p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface">
              {['Title', 'ISBN', 'Year', 'Total', 'Available', 'Added', ''].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={7} />)
              : books.length === 0
              ? (
                <tr>
                  <td colSpan={7}>
                    <EmptyState
                      icon={<BookOpen size={22} />}
                      title="No books found"
                      description="Add your first book to get started."
                      action={
                        <Button size="sm" onClick={() => setShowAdd(true)} icon={<Plus size={13} />}>
                          Add book
                        </Button>
                      }
                    />
                  </td>
                </tr>
              )
              : books.map(book => (
                <tr key={book.publicId} className="border-b border-border hover:bg-surface/60 transition-colors">
                  <td className="px-4 py-3 font-medium text-text-primary">{book.title}</td>
                  <td className="px-4 py-3 text-text-secondary font-mono text-xs">{book.isbn || '—'}</td>
                  <td className="px-4 py-3 text-text-secondary">{book.publishedYear || '—'}</td>
                  <td className="px-4 py-3">{book.copiesTotal}</td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      'font-semibold',
                      book.copiesAvailable === 0 ? 'text-danger' : 'text-primary-600'
                    )}>
                      {book.copiesAvailable}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{formatDate(book.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setEditing(book)}
                        className="p-1.5 rounded-lg text-text-secondary hover:text-primary hover:bg-primary-50 transition-colors"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => setDeleting(book)}
                        className="p-1.5 rounded-lg text-text-secondary hover:text-danger hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
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

      {/* Add Modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add new book">
        <BookForm
          onSubmit={(data) => createMutation.mutate(data)}
          loading={createMutation.isPending}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit book">
        {editing && (
          <BookForm
            initial={editing}
            onSubmit={(data) => updateMutation.mutate({ id: editing.publicId, data })}
            loading={updateMutation.isPending}
          />
        )}
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleteMutation.mutate(deleting.publicId)}
        loading={deleteMutation.isPending}
        title="Delete book"
        message={`Are you sure you want to delete "${deleting?.title}"? This cannot be undone.`}
        confirmLabel="Delete"
      />
    </div>
  )
}
