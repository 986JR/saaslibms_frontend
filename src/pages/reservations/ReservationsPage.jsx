import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, CalendarClock, X } from 'lucide-react'
import { reservationsApi, membersApi, booksApi } from '../../api'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select, Modal, ConfirmDialog, EmptyState, SkeletonRow, Pagination, Card, Badge } from '../../components/ui'
import { PageHeader } from '../../components/layout/PageHeader'
import { getErrorMessage, formatDate, statusColors } from '../../utils'
import toast from 'react-hot-toast'

// ─── SearchDropdown ───────────────────────────────────────────────────────────
//
// Generic dropdown that shows a primary label and a secondary detail line.
// Rendered below whichever Input it follows.

function SearchDropdown({ options, onSelect, keyField, labelField, detailField }) {
  if (!options.length) return null
  return (
    <div className="border border-border rounded-xl overflow-hidden shadow-lg bg-white max-h-48 overflow-y-auto mt-1 z-10 relative">
      {options.map(opt => (
        <button
          type="button"
          key={opt[keyField]}
          onClick={() => onSelect(opt)}
          className="w-full text-left px-3 py-2.5 text-sm hover:bg-surface transition-colors border-b border-border last:border-0"
        >
          <p className="font-medium text-text-primary">{opt[labelField]}</p>
          <p className="text-xs text-text-secondary">{opt[detailField]}</p>
        </button>
      ))}
    </div>
  )
}

// ─── ReservationForm ──────────────────────────────────────────────────────────

function ReservationForm({ onSubmit, loading }) {
  const [form, setForm]               = useState({ memberPublicId: '', bookPublicId: '' })
  const [memberSearch, setMemberSearch] = useState('')
  const [bookSearch, setBookSearch]   = useState('')
  const [selectedMember, setSelectedMember] = useState(null)  // track chosen member
  const [selectedBook, setSelectedBook]     = useState(null)  // track chosen book
  const [errors, setErrors]           = useState({})

  // Search members — needs at least 2 chars
  const { data: membersData } = useQuery({
    queryKey: ['members', { search: memberSearch }],
    queryFn: () => membersApi.list({ search: memberSearch || undefined, size: 20 }),
    enabled: memberSearch.length > 1 && !selectedMember,  // stop searching once picked
  })

  // Search books — needs at least 2 chars
  const { data: booksData } = useQuery({
    queryKey: ['books', { search: bookSearch }],
    queryFn: () => booksApi.list({ search: bookSearch || undefined, size: 20 }),
    enabled: bookSearch.length > 1 && !selectedBook,
  })

  //
  // Members API returns fullName (not name).
  // Books   API returns title.
  //
  const memberOptions = selectedMember ? [] : (membersData?.data?.data?.content ?? [])
  const bookOptions   = selectedBook   ? [] : (booksData?.data?.data?.content   ?? [])

  function handleSelectMember(m) {
    setSelectedMember(m)
    setForm(prev => ({ ...prev, memberPublicId: m.publicId }))
    // Show "Full Name (MEMBER-XXXXXX)" in the input so the user sees both
    setMemberSearch(`${m.fullName} (${m.publicId})`)
    if (errors.memberPublicId) setErrors(prev => ({ ...prev, memberPublicId: '' }))
  }

  function handleSelectBook(b) {
    setSelectedBook(b)
    setForm(prev => ({ ...prev, bookPublicId: b.publicId }))
    // Show "Title (BOOK-XXXXXX)" in the input
    setBookSearch(`${b.title} (${b.publicId})`)
    if (errors.bookPublicId) setErrors(prev => ({ ...prev, bookPublicId: '' }))
  }

  function clearMember() {
    setSelectedMember(null)
    setForm(prev => ({ ...prev, memberPublicId: '' }))
    setMemberSearch('')
  }

  function clearBook() {
    setSelectedBook(null)
    setForm(prev => ({ ...prev, bookPublicId: '' }))
    setBookSearch('')
  }

  function handleSubmit(e) {
    e.preventDefault()
    const errs = {}
    if (!form.memberPublicId) errs.memberPublicId = 'Select a member'
    if (!form.bookPublicId)   errs.bookPublicId   = 'Select a book'
    if (Object.keys(errs).length) return setErrors(errs)
    onSubmit(form)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      {/* Member search */}
      <div>
        <div className="relative">
          <Input
            label="Search member"
            placeholder="Type member name…"
            value={memberSearch}
            onChange={e => {
              setMemberSearch(e.target.value)
              // If user edits the field after picking, clear the selection
              if (selectedMember) clearMember()
            }}
          />
          {/* Clear button shown after a member is picked */}
          {selectedMember && (
            <button
              type="button"
              onClick={clearMember}
              className="absolute right-2 top-8 p-1 rounded text-text-secondary hover:text-danger"
              title="Clear selection"
            >
              <X size={13} />
            </button>
          )}
        </div>
        {/* Dropdown — shows fullName as the primary label, email as detail */}
        <SearchDropdown
          options={memberOptions}
          onSelect={handleSelectMember}
          keyField="publicId"
          labelField="fullName"
          detailField="email"
        />
        {errors.memberPublicId && (
          <p className="text-xs text-danger mt-1">{errors.memberPublicId}</p>
        )}
      </div>

      {/* Book search */}
      <div>
        <div className="relative">
          <Input
            label="Search book"
            placeholder="Type book title…"
            value={bookSearch}
            onChange={e => {
              setBookSearch(e.target.value)
              if (selectedBook) clearBook()
            }}
          />
          {selectedBook && (
            <button
              type="button"
              onClick={clearBook}
              className="absolute right-2 top-8 p-1 rounded text-text-secondary hover:text-danger"
              title="Clear selection"
            >
              <X size={13} />
            </button>
          )}
        </div>
        {/* Dropdown — shows title as primary label, publicId as detail */}
        <SearchDropdown
          options={bookOptions}
          onSelect={handleSelectBook}
          keyField="publicId"
          labelField="title"
          detailField="publicId"
        />
        {errors.bookPublicId && (
          <p className="text-xs text-danger mt-1">{errors.bookPublicId}</p>
        )}
      </div>

      <Button type="submit" loading={loading} className="w-full mt-2">
        Create reservation
      </Button>
    </form>
  )
}

// ─── ReservationsPage ─────────────────────────────────────────────────────────

export function ReservationsPage() {
  const qc = useQueryClient()
  const [page, setPage]             = useState(0)
  const [statusFilter, setStatusFilter] = useState('')
  const [showAdd, setShowAdd]       = useState(false)
  const [cancelling, setCancelling] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['reservations', { page, status: statusFilter }],
    queryFn: () => reservationsApi.list({ page, size: 10, status: statusFilter || undefined }),
  })

  const reservations  = data?.data?.data?.content      ?? []
  const totalPages    = data?.data?.data?.totalPages    ?? 0
  const totalElements = data?.data?.data?.totalElements ?? 0

  const createMutation = useMutation({
    mutationFn: reservationsApi.create,
    onSuccess: () => {
      toast.success('Reservation created')
      qc.invalidateQueries(['reservations'])
      setShowAdd(false)
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const cancelMutation = useMutation({
    mutationFn: (id) => reservationsApi.cancel(id),
    onSuccess: () => {
      toast.success('Reservation cancelled')
      qc.invalidateQueries(['reservations'])
      setCancelling(null)
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  return (
    <div>
      <PageHeader
        title="Reservations"
        subtitle={`${totalElements} reservation${totalElements !== 1 ? 's' : ''}`}
        action={
          <Button icon={<Plus size={15} />} onClick={() => setShowAdd(true)}>
            New reservation
          </Button>
        }
      />

      <div className="mb-6">
        <Select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(0) }}
          className="w-44"
        >
          <option value="">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="FULFILLED">Fulfilled</option>
          <option value="CANCELLED">Cancelled</option>
          <option value="EXPIRED">Expired</option>
        </Select>
      </div>

      <Card className="p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface">
              {['Book', 'Member', 'Queue', 'Status', 'Created', ''].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={6} />)
            ) : reservations.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <EmptyState
                    icon={<CalendarClock size={22} />}
                    title="No reservations"
                    description="Create reservations to queue members for unavailable books."
                    action={
                      <Button size="sm" onClick={() => setShowAdd(true)} icon={<Plus size={13} />}>
                        New reservation
                      </Button>
                    }
                  />
                </td>
              </tr>
            ) : (
              reservations.map(r => (
                <tr key={r.publicId} className="border-b border-border hover:bg-surface/60 transition-colors">
                  <td className="px-4 py-3 font-medium text-text-primary max-w-[160px] truncate">{r.bookTitle}</td>
                  <td className="px-4 py-3 text-text-secondary">{r.memberName}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-surface text-xs font-bold text-text-primary border border-border">
                      {r.queuePosition}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge color={statusColors?.[r.status] ?? 'gray'}>{r.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-text-secondary whitespace-nowrap">{formatDate(r.createdAt)}</td>
                  <td className="px-4 py-3">
                    {(r.status === 'PENDING' || r.status === 'FULFILLED') && (
                      <button
                        onClick={() => setCancelling(r)}
                        className="p-1.5 rounded-lg text-text-secondary hover:text-danger hover:bg-red-50 transition-colors"
                        title="Cancel reservation"
                      >
                        <X size={14} />
                      </button>
                    )}
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

      {/* New reservation modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="New reservation">
        {showAdd && (
          <ReservationForm
            onSubmit={d => createMutation.mutate(d)}
            loading={createMutation.isPending}
          />
        )}
      </Modal>

      {/* Cancel confirmation */}
      <ConfirmDialog
        open={!!cancelling}
        onClose={() => setCancelling(null)}
        onConfirm={() => cancelMutation.mutate(cancelling.publicId)}
        loading={cancelMutation.isPending}
        title="Cancel reservation"
        message={`Cancel the reservation for "${cancelling?.bookTitle}" by ${cancelling?.memberName}?`}
        confirmLabel="Cancel reservation"
      />
    </div>
  )
}