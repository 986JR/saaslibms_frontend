import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, BookOpen, Trash2, Pencil } from 'lucide-react'
import { booksApi, categoriesApi } from '../../api'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Modal, ConfirmDialog, EmptyState, SkeletonRow, Pagination, Card } from '../../components/ui'
import { PageHeader } from '../../components/layout/PageHeader'
import { getErrorMessage, formatDate, cn } from '../../utils'
import toast from 'react-hot-toast'

// ─── BookForm ─────────────────────────────────────────────────────────────────

function BookForm({ initial, onSubmit, loading, categories }) {
  const safeCategories = Array.isArray(categories) ? categories : []

  const [form, setForm] = useState(() => ({
    title:         initial?.title         ?? '',
    isbn:          initial?.isbn          ?? '',
    publisher:     initial?.publisher     ?? '',
    publishedYear: initial?.publishedYear ?? '',
    copiesTotal:   initial?.copiesTotal   ?? 1,
    categoryName:  initial?.categoryName  ?? '',
  }))

  const [errors, setErrors] = useState({})

  function update(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
  }

  function validate() {
    const errs = {}
    if (!form.title?.trim()) errs.title = 'Title is required'
    if (!form.copiesTotal || Number(form.copiesTotal) < 1)
      errs.copiesTotal = 'At least 1 copy required'
    return errs
  }

  function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) return setErrors(errs)

    const isbn      = (form.isbn         || '').trim()
    const publisher = (form.publisher    || '').trim()
    const category  = (form.categoryName || '').trim()

    onSubmit({
      title:         (form.title || '').trim(),
      isbn:          isbn      || undefined,
      publisher:     publisher || undefined,
      publishedYear: form.publishedYear ? parseInt(form.publishedYear, 10) : undefined,
      copiesTotal:   parseInt(form.copiesTotal, 10),
      categoryName:  category  || undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      <Input
        label="Title *"
        name="title"
        value={form.title}
        onChange={update}
        error={errors.title}
        placeholder="Clean Code"
      />

      <div className="grid grid-cols-2 gap-3">
        <Input label="ISBN" name="isbn" value={form.isbn} onChange={update} placeholder="978-0-13-468599-1" />
        <Input label="Publisher" name="publisher" value={form.publisher} onChange={update} placeholder="Prentice Hall" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input label="Published Year" name="publishedYear" type="number" value={form.publishedYear} onChange={update} placeholder="2008" />
        <Input label="Total Copies *" name="copiesTotal" type="number" value={form.copiesTotal} onChange={update} error={errors.copiesTotal} min={1} />
      </div>

      {/*
        Category dropdown — uses native <select> for reliability.
        safeCategories comes from the cache (fetched when page loads),
        so this is always populated by the time the modal opens.
      */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-text-secondary">Category</label>
        <select
          name="categoryName"
          value={form.categoryName}
          onChange={update}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="">— No category —</option>
          {safeCategories.map(cat => (
            <option key={cat.publicId} value={cat.name}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      <Button type="submit" loading={loading} className="w-full mt-2">
        {initial ? 'Save changes' : 'Add book'}
      </Button>
    </form>
  )
}

// ─── BooksPage ────────────────────────────────────────────────────────────────

export function BooksPage() {
  const qc = useQueryClient()
  const [page, setPage]         = useState(0)
  const [search, setSearch]     = useState('')
  const [showAdd, setShowAdd]   = useState(false)
  const [editing, setEditing]   = useState(null)
  const [deleting, setDeleting] = useState(null)

  // ── Categories — fetched once when the page mounts, cached forever ──────────
  //
  // Your categories API returns: { success, message, data: [...array...], timestamp }
  // Same flat-array shape as users — NO .content, NO .totalPages.
  // staleTime: Infinity means React Query will never re-fetch automatically;
  // the dropdown is always ready before the modal even opens.
  //
  const { data: catData } = useQuery({
    queryKey: ['categories'],
    queryFn:  () => categoriesApi.list(),   // no page/size — fetch all at once
    staleTime: Infinity,
  })
  //                        axios wrapper  ↓    your API envelope ↓   plain array ↓
  const categories = catData?.data?.data?.content ?? []

  // ── Books — paginated + searchable ─────────────────────────────────────────
  //
  // Books DO use Spring Page, so the response is:
  //   { success, message, data: { content, totalPages, totalElements, ... } }
  //
  const { data, isLoading } = useQuery({
    queryKey: ['books', { page, search }],
    queryFn:  () => booksApi.list({ page, size: 10, search: search || undefined }),
  })
  const books         = data?.data?.data?.content      ?? []
  const totalPages    = data?.data?.data?.totalPages    ?? 0
  const totalElements = data?.data?.data?.totalElements ?? 0

  // ── Mutations ───────────────────────────────────────────────────────────────

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

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div>
      <PageHeader
        title="Books"
        subtitle={`${totalElements} book${totalElements !== 1 ? 's' : ''} in catalogue`}
        action={
          <Button icon={<Plus size={15} />} onClick={() => setShowAdd(true)}>
            Add book
          </Button>
        }
      />

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
              {['Title', 'ISBN', 'Publisher', 'Year', 'Category', 'Total', 'Available', 'Added', ''].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={9} />)
            ) : books.length === 0 ? (
              <tr>
                <td colSpan={9}>
                  <EmptyState
                    icon={<BookOpen size={22} />}
                    title="No books found"
                    description={search ? `No results for "${search}"` : 'Add your first book to get started.'}
                    action={
                      search
                        ? null
                        : <Button size="sm" onClick={() => setShowAdd(true)} icon={<Plus size={13} />}>Add book</Button>
                    }
                  />
                </td>
              </tr>
            ) : (
              books.map(book => (
                <tr key={book.publicId} className="border-b border-border hover:bg-surface/60 transition-colors">
                  <td className="px-4 py-3 font-medium text-text-primary max-w-[180px] truncate">{book.title}</td>
                  <td className="px-4 py-3 text-text-secondary font-mono text-xs">{book.isbn || '—'}</td>
                  <td className="px-4 py-3 text-text-secondary">{book.publisher || '—'}</td>
                  <td className="px-4 py-3 text-text-secondary">{book.publishedYear || '—'}</td>
                  <td className="px-4 py-3 text-text-secondary">{book.categoryName || '—'}</td>
                  <td className="px-4 py-3 text-center">{book.copiesTotal}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={cn('font-semibold', book.copiesAvailable === 0 ? 'text-danger' : 'text-primary-600')}>
                      {book.copiesAvailable}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-text-secondary whitespace-nowrap">{formatDate(book.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => setEditing(book)} className="p-1.5 rounded-lg text-text-secondary hover:text-primary hover:bg-primary-50 transition-colors" title="Edit book">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => setDeleting(book)} className="p-1.5 rounded-lg text-text-secondary hover:text-danger hover:bg-red-50 transition-colors" title="Delete book">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="px-4 pb-4">
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}
      </Card>

      {/* Add modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add new book">
        {showAdd && (
          <BookForm
            categories={categories}
            onSubmit={d => createMutation.mutate(d)}
            loading={createMutation.isPending}
          />
        )}
      </Modal>

      {/* Edit modal */}
      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit book">
        {editing && (
          <BookForm
            initial={editing}
            categories={categories}
            onSubmit={d => updateMutation.mutate({ id: editing.publicId, data: d })}
            loading={updateMutation.isPending}
          />
        )}
      </Modal>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleteMutation.mutate(deleting?.publicId)}
        loading={deleteMutation.isPending}
        title="Delete book"
        message={`Are you sure you want to delete "${deleting?.title}"? This cannot be undone.`}
        confirmLabel="Delete"
      />
    </div>
  )
}