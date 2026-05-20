import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Link2, Pencil, Trash2, BookOpen, PenLine, Zap, CheckCircle2, X } from 'lucide-react'
import { bookAuthorsApi, booksApi, authorsApi } from '../../api'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import {
  Modal,
  ConfirmDialog,
  EmptyState,
  SkeletonRow,
  Card,
} from '../../components/ui'
import { PageHeader } from '../../components/layout/PageHeader'
import { getErrorMessage } from '../../utils'
import toast from 'react-hot-toast'

// ─── Styles ──────────────────────────────────────────────────────────────────
const MATCHER_STYLES = `
@keyframes ba-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%       { opacity: .7; transform: scale(1.06); }
}
@keyframes ba-beam {
  0%   { stroke-dashoffset: 300; opacity: 0; }
  20%  { opacity: 1; }
  100% { stroke-dashoffset: 0;   opacity: 1; }
}
@keyframes ba-spark {
  0%   { transform: scale(0) rotate(0deg);   opacity: 1; }
  100% { transform: scale(1.4) rotate(45deg); opacity: 0; }
}
@keyframes ba-slide-up {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0);   }
}
.ba-card-book:hover,
.ba-card-author:hover {
  border-color: var(--color-primary);
  background: var(--color-primary-50, #f0fdf4);
}
.ba-card-book.selected,
.ba-card-author.selected {
  border-color: var(--color-primary) !important;
  background: var(--color-primary-50, #f0fdf4) !important;
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 18%, transparent);
}
.ba-ready-btn { animation: ba-pulse 1.6s ease-in-out infinite; }
.ba-beam-line { stroke-dasharray: 300; animation: ba-beam .55s ease-out forwards; }
.ba-spark     { animation: ba-spark .5s ease-out forwards; }
.ba-slide-up  { animation: ba-slide-up .25s ease-out both; }
`

// ─── Fetch all links across all books ────────────────────────────────────────
// Strategy: get all books (up to 200), then fire getByBook for each in parallel.
// Results are flattened into one list. React Query caches each by-book call
// individually so navigating away and back is instant.
async function fetchAllLinks(books) {
  if (!books.length) return []
  const results = await Promise.all(
    books.map(b =>
      bookAuthorsApi.getByBook(b.publicId).catch(() => null) // skip 404s silently
    )
  )
  return results
    .filter(Boolean)
    .flatMap(r => r?.data?.data ?? [])
}

// ─── LinkMatcherModal ─────────────────────────────────────────────────────────
function LinkMatcherModal({ open, onClose, onSubmit, loading }) {
  const [selectedBook,   setSelectedBook]   = useState(null)
  const [selectedAuthor, setSelectedAuthor] = useState(null)
  const [bookSearch,     setBookSearch]     = useState('')
  const [authorSearch,   setAuthorSearch]   = useState('')

  const { data: booksData, isLoading: loadingBooks } = useQuery({
    queryKey: ['books-all'],
    queryFn: () => booksApi.list({ page: 0, size: 100 }),
    enabled: open,
    staleTime: 30_000,
  })

  const { data: authorsData, isLoading: loadingAuthors } = useQuery({
    queryKey: ['authors-all'],
    queryFn: () => authorsApi.list({ page: 0, size: 100 }),
    enabled: open,
    staleTime: 30_000,
  })

  const books = (booksData?.data?.data?.content ?? [])
    .filter(b => b.title?.toLowerCase().includes(bookSearch.toLowerCase()))

  const authors = (authorsData?.data?.data?.content ?? [])
    .filter(a => a.name?.toLowerCase().includes(authorSearch.toLowerCase()))

  const bothSelected = selectedBook && selectedAuthor

  function handleClose() {
    setSelectedBook(null)
    setSelectedAuthor(null)
    setBookSearch('')
    setAuthorSearch('')
    onClose()
  }

  function handleLink() {
    if (!bothSelected || loading) return
    onSubmit({
      bookPublicId:   selectedBook.publicId,
      authorPublicId: selectedAuthor.publicId,
    })
  }

  const ready = bothSelected && !loading

  return (
    <Modal open={open} onClose={handleClose} title="Link a book to an author">
      <style>{MATCHER_STYLES}</style>

      {/* Selected pair display */}
      <div className="flex items-center gap-3 mb-4 px-1">
        <div className={`flex-1 min-w-0 rounded-xl border-2 px-3 py-2 transition-all duration-200 ${
          selectedBook ? 'border-primary bg-primary-50' : 'border-dashed border-border bg-surface'
        }`}>
          {selectedBook ? (
            <div className="ba-slide-up">
              <p className="text-[10px] font-bold uppercase tracking-wider text-primary mb-0.5">Book</p>
              <p className="text-xs font-semibold text-text-primary truncate">{selectedBook.title}</p>
              <p className="text-[10px] text-primary font-mono opacity-70">{selectedBook.publicId}</p>
            </div>
          ) : (
            <p className="text-xs text-text-secondary italic">Pick a book →</p>
          )}
        </div>

        <div className="relative shrink-0 flex items-center justify-center w-10 h-10">
          <svg viewBox="0 0 40 40" className="w-10 h-10 absolute">
            {bothSelected ? (
              <>
                <line x1="0" y1="20" x2="40" y2="20" stroke="var(--color-primary)" strokeWidth="2.5" strokeLinecap="round" className="ba-beam-line" />
                <circle cx="40" cy="20" r="4" fill="var(--color-primary)" className="ba-spark" />
              </>
            ) : (
              <line x1="4" y1="20" x2="36" y2="20" stroke="#e2e8f0" strokeWidth="2" strokeDasharray="4 4" strokeLinecap="round" />
            )}
          </svg>
          <div className={`relative z-10 flex h-7 w-7 items-center justify-center rounded-full transition-all duration-300 ${
            bothSelected ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-surface border border-border text-text-secondary'
          }`}>
            {bothSelected ? <CheckCircle2 size={14} /> : <Link2 size={13} />}
          </div>
        </div>

        <div className={`flex-1 min-w-0 rounded-xl border-2 px-3 py-2 transition-all duration-200 ${
          selectedAuthor ? 'border-primary bg-primary-50' : 'border-dashed border-border bg-surface'
        }`}>
          {selectedAuthor ? (
            <div className="ba-slide-up">
              <p className="text-[10px] font-bold uppercase tracking-wider text-primary mb-0.5">Author</p>
              <p className="text-xs font-semibold text-text-primary truncate">{selectedAuthor.name}</p>
              <p className="text-[10px] text-primary font-mono opacity-70">{selectedAuthor.publicId}</p>
            </div>
          ) : (
            <p className="text-xs text-text-secondary italic">← Pick an author</p>
          )}
        </div>
      </div>

      {/* Two-column picker */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Books */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1.5">
            <BookOpen size={13} className="text-primary" />
            <span className="text-xs font-bold text-text-primary uppercase tracking-wider">Books</span>
            {selectedBook && (
              <button type="button" onClick={() => setSelectedBook(null)} className="ml-auto text-text-secondary hover:text-danger transition-colors">
                <X size={12} />
              </button>
            )}
          </div>
          <Input placeholder="Filter books…" value={bookSearch} onChange={e => setBookSearch(e.target.value)} icon={<Search size={13} />} />
          <div className="overflow-y-auto space-y-1.5" style={{ maxHeight: 240 }}>
            {loadingBooks
              ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-11 rounded-xl bg-surface animate-pulse" />)
              : books.length === 0
              ? <p className="text-xs text-text-secondary italic px-2 py-3">No books found</p>
              : books.map(book => (
                  <button
                    key={book.publicId} type="button"
                    onClick={() => setSelectedBook(selectedBook?.publicId === book.publicId ? null : book)}
                    className={`ba-card-book w-full text-left rounded-xl border-2 px-3 py-2 transition-all duration-150 ${
                      selectedBook?.publicId === book.publicId ? 'selected' : 'border-border bg-white'
                    }`}
                  >
                    <p className="text-xs font-semibold text-text-primary truncate leading-tight">{book.title}</p>
                    <p className="text-[10px] text-text-secondary font-mono mt-0.5">{book.publicId}</p>
                  </button>
                ))
            }
          </div>
        </div>

        {/* Authors */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1.5">
            <PenLine size={13} className="text-primary" />
            <span className="text-xs font-bold text-text-primary uppercase tracking-wider">Authors</span>
            {selectedAuthor && (
              <button type="button" onClick={() => setSelectedAuthor(null)} className="ml-auto text-text-secondary hover:text-danger transition-colors">
                <X size={12} />
              </button>
            )}
          </div>
          <Input placeholder="Filter authors…" value={authorSearch} onChange={e => setAuthorSearch(e.target.value)} icon={<Search size={13} />} />
          <div className="overflow-y-auto space-y-1.5" style={{ maxHeight: 240 }}>
            {loadingAuthors
              ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-11 rounded-xl bg-surface animate-pulse" />)
              : authors.length === 0
              ? <p className="text-xs text-text-secondary italic px-2 py-3">No authors found</p>
              : authors.map(author => (
                  <button
                    key={author.publicId} type="button"
                    onClick={() => setSelectedAuthor(selectedAuthor?.publicId === author.publicId ? null : author)}
                    className={`ba-card-author w-full text-left rounded-xl border-2 px-3 py-2 transition-all duration-150 ${
                      selectedAuthor?.publicId === author.publicId ? 'selected' : 'border-border bg-white'
                    }`}
                  >
                    <p className="text-xs font-semibold text-text-primary truncate leading-tight">{author.name}</p>
                    <p className="text-[10px] text-text-secondary font-mono mt-0.5">{author.publicId}</p>
                  </button>
                ))
            }
          </div>
        </div>
      </div>

      {/* Link button */}
      <button
        type="button" onClick={handleLink} disabled={!ready}
        className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
          ready
            ? 'ba-ready-btn bg-primary text-white hover:opacity-90 shadow-lg shadow-primary/20 cursor-pointer'
            : 'bg-surface text-text-secondary border border-border cursor-not-allowed'
        }`}
      >
        {loading ? (
          <>
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
            Linking…
          </>
        ) : ready ? (
          <><Zap size={15} /> Create link</>
        ) : (
          <><Link2 size={15} /> Select a book and an author to link</>
        )}
      </button>
    </Modal>
  )
}

// ─── RelinkForm ───────────────────────────────────────────────────────────────
function RelinkForm({ initial, onSubmit, loading }) {
  const [form, setForm] = useState(initial || { bookPublicId: '', authorPublicId: '' })
  const [errors, setErrors] = useState({})

  function update(e) {
    const { name, value } = e.target
    setForm(p => ({ ...p, [name]: value }))
    if (errors[name]) setErrors(p => ({ ...p, [name]: '' }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    const errs = {}
    if (!form.bookPublicId?.trim())   errs.bookPublicId   = 'Book public ID is required'
    if (!form.authorPublicId?.trim()) errs.authorPublicId = 'Author public ID is required'
    if (Object.keys(errs).length) return setErrors(errs)
    onSubmit(form)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2.5 text-xs text-amber-800">
        <span className="font-semibold">Note:</span> Both fields are required.
        To change only one side, keep the other ID the same.
      </div>
      <Input label="Book public ID *" name="bookPublicId" value={form.bookPublicId} onChange={update} error={errors.bookPublicId} placeholder="BOOK-K3MP9R" />
      <Input label="Author public ID *" name="authorPublicId" value={form.authorPublicId} onChange={update} error={errors.authorPublicId} placeholder="AUTH-9F3K2L" />
      <Button type="submit" loading={loading} className="w-full mt-2">Save changes</Button>
    </form>
  )
}

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const active = status === 'ACTIVE'
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
      active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
    }`}>
      {status}
    </span>
  )
}

// ─── BookAuthorsPage ──────────────────────────────────────────────────────────
export function BookAuthorsPage() {
  const qc = useQueryClient()
  const [search,   setSearch]   = useState('')
  const [showAdd,  setShowAdd]  = useState(false)
  const [editing,  setEditing]  = useState(null)
  const [deleting, setDeleting] = useState(null)

  // Step 1 — load all books (needed to drive the parallel link queries)
  const { data: booksData, isLoading: loadingBooks } = useQuery({
    queryKey: ['books-all'],
    queryFn: () => booksApi.list({ page: 0, size: 200 }),
    staleTime: 30_000,
  })
  const allBooks = booksData?.data?.data?.content ?? []

  // Step 2 — fetch all links in parallel, keyed together so invalidation works
  const { data: allLinks, isLoading: loadingLinks } = useQuery({
    queryKey: ['book-authors-all', allBooks.map(b => b.publicId)],
    queryFn: () => fetchAllLinks(allBooks),
    enabled: allBooks.length > 0,
    staleTime: 30_000,
  })

  const loading = loadingBooks || loadingLinks

  // Client-side filter by book title, author name, or either public ID
  const links = (allLinks ?? []).filter(link => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      link.bookTitle?.toLowerCase().includes(q) ||
      link.authorName?.toLowerCase().includes(q) ||
      link.bookPublicId?.toLowerCase().includes(q) ||
      link.authorPublicId?.toLowerCase().includes(q)
    )
  })

  // ── Mutations ──────────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: bookAuthorsApi.create,
    onSuccess: () => {
      toast.success('Link created')
      qc.invalidateQueries(['book-authors-all'])
      qc.invalidateQueries(['books-all'])
      setShowAdd(false)
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => bookAuthorsApi.update(id, data),
    onSuccess: () => {
      toast.success('Link updated')
      qc.invalidateQueries(['book-authors-all'])
      setEditing(null)
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const deleteMutation = useMutation({
    mutationFn: bookAuthorsApi.delete,
    onSuccess: () => {
      toast.success('Link removed')
      qc.invalidateQueries(['book-authors-all'])
      setDeleting(null)
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  return (
    <div>
      <PageHeader
        title="Book-Author Links"
        subtitle={loading ? 'Loading…' : `${links.length} link${links.length !== 1 ? 's' : ''}`}
        action={
          <Button icon={<Plus size={15} />} onClick={() => setShowAdd(true)}>
            Add link
          </Button>
        }
      />

      {/* Search */}
      <div className="mb-6 max-w-sm">
        <Input
          placeholder="Search by book, author or ID…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          icon={<Search size={15} />}
        />
      </div>

      {/* Results table */}
      <Card className="p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface">
              {['Book', 'ISBN', 'Author', 'Status', ''].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={5} />)
            ) : links.length === 0 ? (
              <tr>
                <td colSpan={5}>
                  <EmptyState
                    icon={<Link2 size={22} />}
                    title={search ? 'No results found' : 'No links yet'}
                    description={
                      search
                        ? `No links match "${search}"`
                        : 'Add your first book-author link to get started.'
                    }
                    action={
                      !search && (
                        <Button size="sm" onClick={() => setShowAdd(true)} icon={<Plus size={13} />}>
                          Add link
                        </Button>
                      )
                    }
                  />
                </td>
              </tr>
            ) : (
              links.map(link => (
                <tr key={link.id} className="border-b border-border hover:bg-surface/60 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-text-primary">{link.bookTitle}</p>
                    <p className="text-[11px] text-text-secondary font-mono mt-0.5">{link.bookPublicId}</p>
                  </td>
                  <td className="px-4 py-3 text-text-secondary text-xs font-mono">{link.bookIsbn || '—'}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-text-primary">{link.authorName}</p>
                    <p className="text-[11px] text-text-secondary font-mono mt-0.5">{link.authorPublicId}</p>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={link.authorStatus} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setEditing({ id: link.id, bookPublicId: link.bookPublicId, authorPublicId: link.authorPublicId })}
                        className="p-1.5 rounded-lg text-text-secondary hover:text-primary hover:bg-primary-50 transition-colors"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => setDeleting(link)}
                        className="p-1.5 rounded-lg text-text-secondary hover:text-danger hover:bg-red-50 transition-colors"
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
      </Card>

      {/* Matcher modal */}
      <LinkMatcherModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onSubmit={d => createMutation.mutate(d)}
        loading={createMutation.isPending}
      />

      {/* Edit modal */}
      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit link">
        {editing && (
          <RelinkForm
            initial={editing}
            onSubmit={d => updateMutation.mutate({ id: editing.id, data: d })}
            loading={updateMutation.isPending}
          />
        )}
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleteMutation.mutate(deleting.id)}
        loading={deleteMutation.isPending}
        title="Remove link"
        message={
          deleting
            ? `Remove the link between "${deleting.bookTitle}" and "${deleting.authorName}"? This will also remove all other books linked to this author within your institution.`
            : ''
        }
        confirmLabel="Remove"
      />
    </div>
  )
}