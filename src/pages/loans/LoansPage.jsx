import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, RotateCcw, Archive, BookMarked } from 'lucide-react'
import { loansApi, membersApi, booksApi } from '../../api'

import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import {
  Select,
  Modal,
  ConfirmDialog,
  EmptyState,
  SkeletonRow,
  Pagination,
  Card,
  Badge,
} from '../../components/ui'

import { PageHeader } from '../../components/layout/PageHeader'
import { getErrorMessage, formatDate, statusColors } from '../../utils'

import toast from 'react-hot-toast'

// ---------------------------------------------------------------------------
// SearchCombobox
// ---------------------------------------------------------------------------
function SearchCombobox({
  label,
  placeholder,
  searchValue,
  onSearchChange,
  options,
  onSelect,
  renderOption,
  error,
  disabled,
}) {
  const [open, setOpen] = useState(false)

  function handleSelect(option) {
    onSelect(option)
    setOpen(false)
  }

  return (
    <div className="relative flex flex-col gap-1.5">
      <Input
        label={label}
        placeholder={placeholder}
        value={searchValue}
        disabled={disabled}
        autoComplete="off"
        onChange={(e) => {
          onSearchChange(e.target.value)
          setOpen(true)
        }}
        onFocus={() => {
          if (!disabled && options.length > 0) setOpen(true)
        }}
        onBlur={() => {
          setTimeout(() => setOpen(false), 150)
        }}
      />

      {open && !disabled && options.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-52 overflow-y-auto rounded-xl border border-border bg-white shadow-dropdown">
          {options.map((option) => (
            <button
              key={option.publicId}
              type="button"
              onMouseDown={() => handleSelect(option)}
              className="w-full border-b border-border px-3 py-2.5 text-left text-sm transition-colors hover:bg-surface last:border-0"
            >
              {renderOption(option)}
            </button>
          ))}
        </div>
      )}

      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  )
}

// ---------------------------------------------------------------------------
// ReturnLoanModal  — PATCH /api/v1/loans/{publicId}/return  { quantity }
// ---------------------------------------------------------------------------
function ReturnLoanModal({ loan, onClose, onConfirm, loading }) {
  const [quantity, setQuantity] = useState(1)
  const [error, setError] = useState('')

  // Reset quantity whenever the modal opens for a new loan
  // (controlled by the `loan` prop changing)
  function handleClose() {
    setQuantity(1)
    setError('')
    onClose()
  }

  function handleSubmit(e) {
    e.preventDefault()
    const qty = parseInt(quantity, 10)

    if (!qty || qty < 1) {
      setError('Quantity must be at least 1')
      return
    }
    if (loan?.quantity && qty > loan.quantity) {
      setError(`Cannot exceed borrowed quantity (${loan.quantity})`)
      return
    }

    setError('')
    onConfirm(qty)
  }

  return (
    <Modal open={!!loan} onClose={handleClose} title="Return loan">
      {loan && (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Loan summary */}
          <div className="rounded-xl border border-border bg-surface p-3 text-sm space-y-0.5">
            <p className="font-medium text-text-primary">{loan.bookTitle}</p>
            <p className="text-text-secondary">Borrowed by {loan.memberName}</p>
            <p className="text-xs text-text-secondary pt-1">
              Borrowed quantity:{' '}
              <span className="font-semibold text-text-primary">{loan.quantity}</span>
            </p>
          </div>

          {/* Quantity */}
          <div className="flex flex-col gap-1.5">
            <Input
              label="Return quantity"
              type="number"
              min={1}
              max={loan.quantity}
              value={quantity}
              onChange={(e) => {
                setQuantity(e.target.value)
                setError('')
              }}
            />
            {error && <p className="text-xs text-danger">{error}</p>}
          </div>

          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" loading={loading} className="flex-1">
              Confirm return
            </Button>
          </div>
        </form>
      )}
    </Modal>
  )
}

// ---------------------------------------------------------------------------
// IssueLoanForm
// ---------------------------------------------------------------------------
function IssueLoanForm({ onSubmit, loading }) {
  const [form, setForm] = useState({
    memberPublicId: '',
    bookPublicId: '',
    quantity: 1,
  })
  const [errors, setErrors] = useState({})

  const [memberSearch, setMemberSearch] = useState('')
  const [selectedMember, setSelectedMember] = useState(null)

  const [bookSearch, setBookSearch] = useState('')
  const [selectedBook, setSelectedBook] = useState(null)

  const { data: membersData, isFetching: membersLoading } = useQuery({
    queryKey: ['members-search', memberSearch],
    queryFn: async () => {
      const res = await membersApi.list({ search: memberSearch, size: 20 })
      return res.data?.data?.content || []
    },
    enabled: memberSearch.trim().length >= 2 && !selectedMember,
  })

  const memberOptions = membersData || []

  const { data: booksData, isFetching: booksLoading } = useQuery({
    queryKey: ['books-search', bookSearch],
    queryFn: async () => {
      const res = await booksApi.list({ search: bookSearch, size: 20 })
      return res.data?.data?.content || []
    },
    enabled: bookSearch.trim().length >= 2 && !selectedBook,
  })

  const bookOptions = booksData || []

  function getMemberDisplayName(member) {
    return member.name || member.fullName || member.username || member.email || ''
  }

  function handleSelectMember(member) {
    setSelectedMember(member)
    setForm((prev) => ({ ...prev, memberPublicId: member.publicId || member.id || '' }))
    setMemberSearch(getMemberDisplayName(member))
    setErrors((prev) => ({ ...prev, memberPublicId: '' }))
  }

  function handleSelectBook(book) {
    setSelectedBook(book)
    setForm((prev) => ({ ...prev, bookPublicId: book.publicId || book.id || '' }))
    setBookSearch(book.title || '')
    setErrors((prev) => ({ ...prev, bookPublicId: '' }))
  }

  function handleMemberSearchChange(value) {
    setMemberSearch(value)
    setSelectedMember(null)
    setForm((prev) => ({ ...prev, memberPublicId: '' }))
  }

  function handleBookSearchChange(value) {
    setBookSearch(value)
    setSelectedBook(null)
    setForm((prev) => ({ ...prev, bookPublicId: '' }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    const newErrors = {}
    if (!form.memberPublicId) newErrors.memberPublicId = 'Please select a member'
    if (!form.bookPublicId) newErrors.bookPublicId = 'Please select a book'
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    onSubmit({ ...form, quantity: parseInt(form.quantity, 10) })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <SearchCombobox
        label="Search member"
        placeholder="Type member name..."
        searchValue={memberSearch}
        onSearchChange={handleMemberSearchChange}
        options={memberOptions}
        onSelect={handleSelectMember}
        disabled={false}
        error={errors.memberPublicId}
        renderOption={(member) => (
          <div>
            <p className="font-medium text-text-primary">{getMemberDisplayName(member)}</p>
            <p className="text-xs text-text-secondary">{member.email}</p>
          </div>
        )}
      />

      {membersLoading && (
        <p className="text-xs text-text-secondary">Searching members...</p>
      )}

      <SearchCombobox
        label="Search book"
        placeholder="Type book title..."
        searchValue={bookSearch}
        onSearchChange={handleBookSearchChange}
        options={bookOptions}
        onSelect={handleSelectBook}
        disabled={false}
        error={errors.bookPublicId}
        renderOption={(book) => (
          <div>
            <p className="font-medium text-text-primary">{book.title}</p>
            <p className="text-xs text-text-secondary">Available: {book.copiesAvailable}</p>
          </div>
        )}
      />

      {booksLoading && (
        <p className="text-xs text-text-secondary">Searching books...</p>
      )}

      <Input
        label="Quantity"
        type="number"
        min={1}
        value={form.quantity}
        onChange={(e) => setForm((prev) => ({ ...prev, quantity: e.target.value }))}
      />

      <Button type="submit" loading={loading} className="mt-2 w-full">
        Issue loan
      </Button>
    </form>
  )
}

// ---------------------------------------------------------------------------
// LoansPage
// ---------------------------------------------------------------------------
export function LoansPage() {
  const queryClient = useQueryClient()

  const [page, setPage] = useState(0)
  const [statusFilter, setStatusFilter] = useState('')

  const [showAdd, setShowAdd] = useState(false)
  const [returningLoan, setReturningLoan] = useState(null)
  const [archivingLoan, setArchivingLoan] = useState(null)

  // LOANS QUERY
  const { data, isLoading } = useQuery({
    queryKey: ['loans', page, statusFilter],
    queryFn: () =>
      loansApi.list({
        page,
        size: 10,
        status: statusFilter || undefined,
      }),
    select: (res) => res?.data?.data ?? { content: [], totalPages: 0, totalElements: 0 },
  })

  const loans = data?.content || []
  const totalPages = data?.totalPages || 0
  const totalElements = data?.totalElements || 0

  // CREATE LOAN
  const createMutation = useMutation({
    mutationFn: loansApi.create,
    onSuccess: () => {
      toast.success('Loan issued successfully')
      queryClient.invalidateQueries({ queryKey: ['loans'] })
      setShowAdd(false)
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  // RETURN LOAN — PATCH /api/v1/loans/{publicId}/return
  // loansApi.return must accept (publicId, body) and call:
  //   axios.patch(`/api/v1/loans/${publicId}/return`, body)
  const returnMutation = useMutation({
    mutationFn: ({ publicId, quantity }) =>
      loansApi.return(publicId, { quantity }),
    onSuccess: () => {
      toast.success('Loan returned successfully')
      queryClient.invalidateQueries({ queryKey: ['loans'] })
      setReturningLoan(null)
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  // ARCHIVE LOAN
  const archiveMutation = useMutation({
    mutationFn: loansApi.archive,
    onSuccess: () => {
      toast.success('Loan archived')
      queryClient.invalidateQueries({ queryKey: ['loans'] })
      setArchivingLoan(null)
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  return (
    <div>
      <PageHeader
        title="Loans"
        subtitle={`${totalElements} loan records`}
        action={
          <Button icon={<Plus size={15} />} onClick={() => setShowAdd(true)}>
            Issue loan
          </Button>
        }
      />

      {/* FILTERS */}
      <div className="mb-6 flex gap-3">
        <Select
          value={statusFilter}
          className="w-44"
          onChange={(e) => {
            setStatusFilter(e.target.value)
            setPage(0)
          }}
        >
          <option value="">All statuses</option>
          <option value="BORROWED">Borrowed</option>
          <option value="LATE">Late</option>
          <option value="RETURNED">Returned</option>
        </Select>
      </div>

      {/* TABLE */}
      <Card className="overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface">
              {['Book', 'Member', 'Qty', 'Borrowed', 'Due', 'Returned', 'Status', ''].map(
                (header) => (
                  <th
                    key={header}
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-secondary"
                  >
                    {header}
                  </th>
                )
              )}
            </tr>
          </thead>

          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <SkeletonRow key={index} cols={8} />
              ))
            ) : loans.length === 0 ? (
              <tr>
                <td colSpan={8}>
                  <EmptyState
                    icon={<BookMarked size={22} />}
                    title="No loans found"
                    description="Issue your first loan to get started."
                    action={
                      <Button
                        size="sm"
                        icon={<Plus size={13} />}
                        onClick={() => setShowAdd(true)}
                      >
                        Issue loan
                      </Button>
                    }
                  />
                </td>
              </tr>
            ) : (
              loans.map((loan) =>
                loan?.publicId ? (
                  <tr
                    key={loan.publicId}
                    className="border-b border-border transition-colors hover:bg-surface/60"
                  >
                    <td className="max-w-[180px] truncate px-4 py-3 font-medium text-text-primary">
                      {loan.bookTitle ?? '—'}
                    </td>

                    <td className="px-4 py-3 text-text-secondary">
                      {loan.memberName ?? '—'}
                    </td>

                    <td className="px-4 py-3 text-text-secondary">
                      {loan.quantity ?? '—'}
                    </td>

                    <td className="px-4 py-3 text-text-secondary">
                      {formatDate(loan.borrowDate)}
                    </td>

                    <td className="px-4 py-3 text-text-secondary">
                      {formatDate(loan.dueDate)}
                    </td>

                    <td className="px-4 py-3 text-text-secondary">
                      {formatDate(loan.returnDate)}
                    </td>

                    <td className="px-4 py-3">
                      <Badge color={statusColors[loan.status?.toUpperCase()]}>
                        {loan.status}
                      </Badge>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {(() => {
                          const status = loan.status?.toUpperCase()
                          if (status === 'BORROWED' || status === 'LATE') {
                            return (
                              <button
                                title="Return"
                                onClick={() => setReturningLoan(loan)}
                                className="rounded-lg p-1.5 text-text-secondary transition-colors hover:bg-primary-50 hover:text-primary"
                              >
                                <RotateCcw size={14} />
                              </button>
                            )
                          }
                          if (status === 'RETURNED' && !loan.archived) {
                            return (
                              <button
                                title="Archive"
                                onClick={() => setArchivingLoan(loan)}
                                className="rounded-lg p-1.5 text-text-secondary transition-colors hover:bg-amber-50 hover:text-amber-600"
                              >
                                <Archive size={14} />
                              </button>
                            )
                          }
                          return null
                        })()}
                      </div>
                    </td>
                  </tr>
                ) : null
              )
            )}
          </tbody>
        </table>

        <div className="px-4 pb-4">
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </Card>

      {/* ISSUE LOAN MODAL */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Issue loan">
        <IssueLoanForm
          onSubmit={(formData) => createMutation.mutate(formData)}
          loading={createMutation.isPending}
        />
      </Modal>

      {/* RETURN LOAN MODAL */}
      <ReturnLoanModal
        loan={returningLoan}
        onClose={() => setReturningLoan(null)}
        onConfirm={(quantity) =>
          returnMutation.mutate({ publicId: returningLoan.publicId, quantity })
        }
        loading={returnMutation.isPending}
      />

      {/* ARCHIVE DIALOG */}
      <ConfirmDialog
        open={!!archivingLoan}
        onClose={() => setArchivingLoan(null)}
        onConfirm={() => archiveMutation.mutate(archivingLoan.publicId)}
        loading={archiveMutation.isPending}
        title="Archive loan"
        message={`Archive this returned loan for "${archivingLoan?.bookTitle}"?`}
        confirmLabel="Archive"
      />
    </div>
  )
}