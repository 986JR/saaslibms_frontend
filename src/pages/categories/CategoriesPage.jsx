import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Tags, Pencil, Trash2 } from 'lucide-react'
import { categoriesApi } from '../../api'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Modal, ConfirmDialog, EmptyState, SkeletonRow, Pagination, Card } from '../../components/ui'
import { PageHeader } from '../../components/layout/PageHeader'
import { getErrorMessage } from '../../utils'
import toast from 'react-hot-toast'

export function CategoriesPage() {
  const qc = useQueryClient()
  const [page, setPage] = useState(0)
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [formName, setFormName] = useState('')
  const [formError, setFormError] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['categories', { page }],
    queryFn: () => categoriesApi.list({ page, size: 15 }),
  })

  const categories = data?.data?.data?.content || []
  const totalPages = data?.data?.data?.totalPages || 0

  const createMutation = useMutation({
    mutationFn: () => categoriesApi.create({ name: formName }),
    onSuccess: () => { toast.success('Category created'); qc.invalidateQueries(['categories']); setShowAdd(false); setFormName('') },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const updateMutation = useMutation({
    mutationFn: () => categoriesApi.update(editing.publicId, { name: formName }),
    onSuccess: () => { toast.success('Category renamed'); qc.invalidateQueries(['categories']); setEditing(null); setFormName('') },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const deleteMutation = useMutation({
    mutationFn: () => categoriesApi.delete(deleting.publicId),
    onSuccess: () => { toast.success('Category deleted'); qc.invalidateQueries(['categories']); setDeleting(null) },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  function openEdit(cat) {
    setEditing(cat)
    setFormName(cat.name)
    setFormError('')
  }

  function openAdd() {
    setFormName('')
    setFormError('')
    setShowAdd(true)
  }

  function submitForm(e, mutation) {
    e.preventDefault()
    if (!formName.trim()) return setFormError('Name is required')
    mutation.mutate()
  }

  const CategoryForm = ({ mutation, loading }) => (
    <form onSubmit={e => submitForm(e, mutation)} className="space-y-4">
      <Input
        label="Category name *"
        value={formName}
        onChange={e => { setFormName(e.target.value); setFormError('') }}
        error={formError}
        placeholder="e.g. Science Fiction"
        autoFocus
      />
      <Button type="submit" loading={loading} className="w-full">Save</Button>
    </form>
  )

  return (
    <div>
      <PageHeader
        title="Categories"
        subtitle="Organise books by category"
        action={<Button icon={<Plus size={15} />} onClick={openAdd}>Add category</Button>}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-16 rounded-2xl bg-white border border-border animate-pulse" />
          ))
          : categories.length === 0
          ? (
            <div className="sm:col-span-2 lg:col-span-3">
              <EmptyState
                icon={<Tags size={22} />}
                title="No categories yet"
                description="Create categories to organise your books."
                action={<Button size="sm" onClick={openAdd} icon={<Plus size={13} />}>Add category</Button>}
              />
            </div>
          )
          : categories.map(cat => (
            <div key={cat.publicId} className="flex items-center justify-between bg-white rounded-2xl border border-border shadow-card px-5 py-4 group hover:shadow-card-hover transition-shadow">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 text-primary">
                  <Tags size={15} />
                </div>
                <span className="text-sm font-medium text-text-primary">{cat.name}</span>
              </div>
              <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openEdit(cat)} className="p-1.5 rounded-lg text-text-secondary hover:text-primary hover:bg-primary-50 transition-colors"><Pencil size={13} /></button>
                <button onClick={() => setDeleting(cat)} className="p-1.5 rounded-lg text-text-secondary hover:text-danger hover:bg-red-50 transition-colors"><Trash2 size={13} /></button>
              </div>
            </div>
          ))
        }
      </div>

      {totalPages > 1 && (
        <div className="mt-4">
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="New category" size="sm">
        <CategoryForm mutation={createMutation} loading={createMutation.isPending} />
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Rename category" size="sm">
        <CategoryForm mutation={updateMutation} loading={updateMutation.isPending} />
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleteMutation.mutate()}
        loading={deleteMutation.isPending}
        title="Delete category"
        message={`Delete "${deleting?.name}"? Books in this category will not be deleted.`}
        confirmLabel="Delete"
      />
    </div>
  )
}
