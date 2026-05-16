import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, BookMarked, RotateCcw, Archive } from 'lucide-react'
import { loansApi, membersApi, booksApi } from '../../api'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select, Modal, ConfirmDialog, EmptyState, SkeletonRow, Pagination, Card, Badge } from '../../components/ui'
import { PageHeader } from '../../components/layout/PageHeader'
import { getErrorMessage, formatDate, statusColors } from '../../utils'
import toast from 'react-hot-toast'

function IssueLoanForm({ onSubmit, loading }) {
  const [form, setForm] = useState({ memberPublicId: '', bookPublicId: '', quantity: 1 })
  const [errors, setErrors] = useState({})

  // Search members
  const [memberSearch, setMemberSearch] = useState('')
  const { data: membersData } = useQuery({
    queryKey: ['members', { search: memberSearch }],
    queryFn: () => membersApi.list({ search: memberSearch || undefined, size: 20 }),
    enabled: memberSearch.length > 1,
  })
  const memberOptions = membersData?.data?.data?.content || []

  // Search books
  const [bookSearch, setBookSearch] = useState('')
  const { data: booksData } = useQuery({
    queryKey: ['books', { search: bookSearch }],
    queryFn: () => booksApi.list({ search: bookSearch || undefined, size: 20 }),
    enabled: bookSearch.length > 1,
  })
  const bookOptions = booksData?.data?.data?.content || []

  function handleSubmit(e) {
    e.preventDefault()
    const errs = {}
    if (!form.memberPublicId) errs.memberPublicId = 'Select a member'
    if (!form.bookPublicId) errs.bookPublicId = 'Select a book'
    if (Object.keys(errs).length) return setErrors(errs)
    onSubmit({ ...form, quantity: parseInt(form.quantity) })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex flex-col gap-1.5">
        <Input
          label="Search member"
          placeholder="Type member name…"
          value={memberSearch}
          onChange={e => setMemberSearch(e.target.value)}
        />
        {memberOptions.length > 0 && (
          <div className="border border-border rounded-xl overflow-hidden shadow-dropdown bg-white max-h-40 overflow-y-auto">
            {memberOptions.map(m => (
              <button
                type="button"
                key={m.publicId}
                onClick={() => { setForm(p => ({ ...p, memberPublicId: m.publicId })); setMemberSearch(m.name) }}
                className="w-full text-left px-3 py-2.5 text-sm hover:bg-surface transition-colors border-b border-border last:border-0"
              >
                <p className="font-medium">{m.name}</p>
                <p className="text-xs text-text-secondary">{m.publicId}</p>
              </button>
            ))}
          </div>
        )}
        {errors.memberPublicId && <p className="text-xs text-danger">{errors.memberPublicId}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <Input
          label="Search book"
          placeholder="Type book title…"
          value={bookSearch}
          onChange={e => setBookSearch(e.target.value)}
        />
        {bookOptions.length > 0 && (
          <div className="border border-border rounded-xl overflow-hidden shadow-dropdown bg-white max-h-40 overflow-y-auto">
            {bookOptions.map(b => (
              <button
                type="button"
                key={b.publicId}
                onClick={() => { setForm(p => ({ ...p, bookPublicId: b.publicId })); setBookSearch(b.title) }}
                className="w-full text-left px-3 py-2.5 text-sm hover:bg-surface transition-colors border-b border-border last:border-0"
              >
                <p className="font-medium">{b.title}</p>
                <p className="text-xs text-text-secondary">Available: {b.copiesAvailable}</p>
              </button>
            ))}
          </div>
        )}
        {errors.bookPublicId && <p className="text-xs text-danger">{errors.bookPublicId}</p>}
      </div>

      <Input
        label="Quantity"
        type="number"
        min={1}
        value={form.quantity}
        onChange={e => setForm(p => ({ ...p, quantity: e.target.value }))}
      />

      <Button type="submit" loading={loading} className="w-full mt-2">Issue loan</Button>
    </form>
  )
}

export function LoansPage() {
  const qc = useQueryClient()
  const [page, setPage] = useState(0)
  const [statusFilter, setStatusFilter] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [returning, setReturning] = useState(null)
  const [archiving, setArchiving] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['loans', { page, status: statusFilter }],
    queryFn: () => loansApi.list({ page, size: 10, status: statusFilter || undefined }),
  })

  const loans = data?.data?.data?.content || []
  const totalPages = data?.data?.data?.totalPages || 0
  const totalElements = data?.data?.data?.totalElements || 0

  const createMutation = useMutation({
    mutationFn: loansApi.create,
    onSuccess: () => { toast.success('Loan issued'); qc.invalidateQueries(['loans']); setShowAdd(false) },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const returnMutation = useMutation({
    mutationFn: (id) => loansApi.return(id),
    onSuccess: () => { toast.success('Loan returned'); qc.invalidateQueries(['loans']); setReturning(null) },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const archiveMutation = useMutation({
    mutationFn: loansApi.archive,
    onSuccess: () => { toast.success('Loan archived'); qc.invalidateQueries(['loans']); setArchiving(null) },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  return (
    <div>
      <PageHeader
        title="Loans"
        subtitle={`${totalElements} loan records`}
        action={
          <Button icon={<Plus size={15} />} onClick={() => setShowAdd(true)}>Issue loan</Button>
        }
      />

      <div className="mb-6 flex gap-3">
        <Select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(0) }}
          className="w-40"
        >
          <option value="">All statuses</option>
          <option value="BORROWED">Borrowed</option>
          <option value="LATE">Late</option>
          <option value="RETURNED">Returned</option>
        </Select>
      </div>

      <Card className="p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface">
              {['Book', 'Member', 'Borrowed', 'Due', 'Returned', 'Status', ''].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={7} />)
              : loans.length === 0
              ? (
                <tr><td colSpan={7}>
                  <EmptyState
                    icon={<BookMarked size={22} />}
                    title="No loans found"
                    description="Issue your first loan to get started."
                    action={<Button size="sm" onClick={() => setShowAdd(true)} icon={<Plus size={13} />}>Issue loan</Button>}
                  />
                </td></tr>
              )
              : loans.map(loan => (
                <tr key={loan.publicId} className="border-b border-border hover:bg-surface/60 transition-colors">
                  <td className="px-4 py-3 font-medium text-text-primary max-w-[180px] truncate">{loan.bookTitle}</td>
                  <td className="px-4 py-3 text-text-secondary">{loan.memberName}</td>
                  <td className="px-4 py-3 text-text-secondary">{formatDate(loan.borrowDate)}</td>
                  <td className="px-4 py-3 text-text-secondary">{formatDate(loan.dueDate)}</td>
                  <td className="px-4 py-3 text-text-secondary">{formatDate(loan.returnDate)}</td>
                  <td className="px-4 py-3">
                    <Badge color={statusColors[loan.status]}>{loan.status}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      {(loan.status === 'BORROWED' || loan.status === 'LATE') && (
                        <button onClick={() => setReturning(loan)} className="p-1.5 rounded-lg text-text-secondary hover:text-primary hover:bg-primary-50 transition-colors" title="Return">
                          <RotateCcw size={14} />
                        </button>
                      )}
                      {loan.status === 'RETURNED' && (
                        <button onClick={() => setArchiving(loan)} className="p-1.5 rounded-lg text-text-secondary hover:text-amber-600 hover:bg-amber-50 transition-colors" title="Archive">
                          <Archive size={14} />
                        </button>
                      )}
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

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Issue loan">
        <IssueLoanForm onSubmit={(d) => createMutation.mutate(d)} loading={createMutation.isPending} />
      </Modal>

      <ConfirmDialog
        open={!!returning}
        onClose={() => setReturning(null)}
        onConfirm={() => returnMutation.mutate(returning.publicId)}
        loading={returnMutation.isPending}
        title="Return loan"
        message={`Mark "${returning?.bookTitle}" as returned by ${returning?.memberName}?`}
        confirmLabel="Confirm return"
      />

      <ConfirmDialog
        open={!!archiving}
        onClose={() => setArchiving(null)}
        onConfirm={() => archiveMutation.mutate(archiving.publicId)}
        loading={archiveMutation.isPending}
        title="Archive loan"
        message={`Archive this returned loan for "${archiving?.bookTitle}"? It will be hidden from the main list.`}
        confirmLabel="Archive"
      />
    </div>
  )
}
