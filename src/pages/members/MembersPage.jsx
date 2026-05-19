import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, Search, UserCheck, Pencil, ShieldBan, ShieldCheck } from "lucide-react"
import { membersApi } from "../../api"
import { Button } from "../../components/ui/Button"
import { Input } from "../../components/ui/Input"
import { Select, Modal, ConfirmDialog, EmptyState, SkeletonRow, Pagination, Card, Badge } from "../../components/ui"
import { PageHeader } from "../../components/layout/PageHeader"
import { getErrorMessage, formatDate, statusColors } from "../../utils"
import toast from "react-hot-toast"

// ─── MemberForm ───────────────────────────────────────────────────────────────
//
// The API field is "fullName", not "name".
// Form state uses "fullName" to match exactly what the backend expects.

function MemberForm({ initial, onSubmit, loading }) {
  const [form, setForm] = useState(() => ({
    fullName: initial?.fullName ?? "",
    email:    initial?.email    ?? "",
    phone:    initial?.phone    ?? "",
    address:  initial?.address  ?? "",
  }))
  const [errors, setErrors] = useState({})

  function update(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    const errs = {}
    if (!form.fullName?.trim()) errs.fullName = "Full name is required"
    if (Object.keys(errs).length) return setErrors(errs)
    onSubmit({
      fullName: form.fullName.trim(),
      email:    form.email.trim()   || undefined,
      phone:    form.phone.trim()   || undefined,
      address:  form.address.trim() || undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="Full name *" name="fullName" value={form.fullName} onChange={update} error={errors.fullName} placeholder="Amina Juma" />
      <Input label="Email" name="email" type="email" value={form.email} onChange={update} placeholder="amina@example.com" />
      <Input label="Phone" name="phone" value={form.phone} onChange={update} placeholder="+255712345678" />
      <Input label="Address" name="address" value={form.address} onChange={update} placeholder="Kariakoo, Dar es Salaam" />
      <Button type="submit" loading={loading} className="w-full mt-2">
        {initial ? "Save changes" : "Register member"}
      </Button>
    </form>
  )
}

// ─── MembersPage ──────────────────────────────────────────────────────────────

export function MembersPage() {
  const qc = useQueryClient()
  const [page, setPage]             = useState(0)
  const [search, setSearch]         = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [showAdd, setShowAdd]       = useState(false)
  const [editing, setEditing]       = useState(null)
  const [toggling, setToggling]     = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ["members", { page, search, status: statusFilter }],
    queryFn: () => membersApi.list({ page, size: 10, search: search || undefined, status: statusFilter || undefined }),
  })

  // Spring Page response — same shape as categories/books
  const members       = data?.data?.data?.content      ?? []
  const totalPages    = data?.data?.data?.totalPages    ?? 0
  const totalElements = data?.data?.data?.totalElements ?? 0

  const createMutation = useMutation({
    mutationFn: membersApi.create,
    onSuccess: () => { toast.success("Member registered"); qc.invalidateQueries(["members"]); setShowAdd(false) },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => membersApi.update(id, data),
    onSuccess: () => { toast.success("Member updated"); qc.invalidateQueries(["members"]); setEditing(null) },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => membersApi.updateStatus(id, { status }),
    onSuccess: () => { toast.success("Status updated"); qc.invalidateQueries(["members"]); setToggling(null) },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  return (
    <div>
      <PageHeader
        title="Members"
        subtitle={`${totalElements} registered member${totalElements !== 1 ? 's' : ''}`}
        action={<Button icon={<Plus size={15} />} onClick={() => setShowAdd(true)}>Add member</Button>}
      />

      <div className="mb-6 flex flex-col sm:flex-row gap-3 max-w-lg">
        <Input
          placeholder="Search members…"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(0) }}
          icon={<Search size={15} />}
          className="flex-1"
        />
        <Select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(0) }} className="sm:w-40">
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="BLOCKED">Blocked</option>
        </Select>
      </div>

      <Card className="p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface">
              {["Member", "Email", "Phone", "Status", "Joined", ""].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={6} />)
              : members.length === 0
              ? (
                <tr><td colSpan={6}>
                  <EmptyState
                    icon={<UserCheck size={22} />}
                    title="No members found"
                    description={search ? `No results for "${search}"` : "Register your first library member."}
                    action={
                      search
                        ? null
                        : <Button size="sm" onClick={() => setShowAdd(true)} icon={<Plus size={13} />}>Add member</Button>
                    }
                  />
                </td></tr>
              )
              : members.map(m => (
                <tr key={m.publicId} className="border-b border-border hover:bg-surface/60 transition-colors">

                  {/* Avatar uses fullName, not name */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary text-xs font-bold">
                        {m.fullName?.[0]?.toUpperCase()}
                      </div>
                      <span className="font-medium text-text-primary">{m.fullName}</span>
                    </div>
                  </td>

                  <td className="px-4 py-3 text-text-secondary">{m.email || "—"}</td>
                  <td className="px-4 py-3 text-text-secondary">{m.phone || "—"}</td>
                  <td className="px-4 py-3">
                    <Badge color={statusColors?.[m.status] ?? "gray"}>{m.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{formatDate(m.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => setEditing(m)} className="p-1.5 rounded-lg text-text-secondary hover:text-primary hover:bg-primary-50 transition-colors" title="Edit">
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => setToggling(m)}
                        title={m.status === "ACTIVE" ? "Block member" : "Unblock member"}
                        className={`p-1.5 rounded-lg transition-colors ${m.status === 'ACTIVE' ? 'text-text-secondary hover:text-amber-600 hover:bg-amber-50' : 'text-text-secondary hover:text-green-600 hover:bg-green-50'}`}
                      >
                        {m.status === "ACTIVE" ? <ShieldBan size={14} /> : <ShieldCheck size={14} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="px-4 pb-4">
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}
      </Card>

      {/* Add modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Register member">
        {showAdd && (
          <MemberForm
            onSubmit={d => createMutation.mutate(d)}
            loading={createMutation.isPending}
          />
        )}
      </Modal>

      {/* Edit modal */}
      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit member">
        {editing && (
          <MemberForm
            initial={editing}
            onSubmit={d => updateMutation.mutate({ id: editing.publicId, data: d })}
            loading={updateMutation.isPending}
          />
        )}
      </Modal>

      {/* Block / Unblock confirmation */}
      <ConfirmDialog
        open={!!toggling}
        onClose={() => setToggling(null)}
        onConfirm={() => statusMutation.mutate({
          id: toggling.publicId,
          status: toggling.status === "ACTIVE" ? "BLOCKED" : "ACTIVE",
        })}
        loading={statusMutation.isPending}
        title={toggling?.status === "ACTIVE" ? "Block member" : "Unblock member"}
        message={`Are you sure you want to ${toggling?.status === 'ACTIVE' ? 'block' : 'unblock'} ${toggling?.fullName}?`}
        confirmLabel={toggling?.status === "ACTIVE" ? "Block" : "Unblock"}
      />
    </div>
  )
}