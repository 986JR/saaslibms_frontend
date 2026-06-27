import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { KeyRound } from 'lucide-react'
import { authApi } from '../../api'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { getErrorMessage } from '../../utils'
import { AuthShell } from './AuthShell'
import toast from 'react-hot-toast'

const pendingInstitutionKey = 'pendingInstitution'

function readPendingInstitution() {
  try {
    const stored = window.sessionStorage.getItem(pendingInstitutionKey)
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

export function SetupAdminPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const pending = useMemo(() => readPendingInstitution(), [])
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [form, setForm] = useState({
    institutionPublicId: searchParams.get('publicId') || pending?.publicId || '',
    password: '',
    confirmPassword: '',
  })

  function updateForm(e) {
    const { name, value } = e.target
    setForm((current) => ({ ...current, [name]: value }))
    if (errors[name] || errors.form) {
      setErrors((current) => ({ ...current, [name]: '', form: '' }))
    }
  }

  function validate() {
    const nextErrors = {}
    if (!form.institutionPublicId.trim()) nextErrors.institutionPublicId = 'Institution public ID is required'
    if (!form.password) nextErrors.password = 'Password is required'
    if (form.password && form.password.length < 8) nextErrors.password = 'Password must be at least 8 characters'
    if (!form.confirmPassword) nextErrors.confirmPassword = 'Please confirm your password'
    if (form.password && form.confirmPassword && form.password !== form.confirmPassword) {
      nextErrors.confirmPassword = 'Passwords do not match'
    }
    return nextErrors
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const nextErrors = validate()
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors)
      return
    }

    setLoading(true)
    try {
      await authApi.setupAdmin({
        institutionPublicId: form.institutionPublicId.trim(),
        password: form.password,
        confirmPassword: form.confirmPassword,
      })

      window.sessionStorage.removeItem(pendingInstitutionKey)
      toast.success('Admin account created. You can now log in.')
      navigate('/login')
    } catch (err) {
      setErrors({ form: getErrorMessage(err) })
      toast.error(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      footer={(
        <>
          Already have an admin account?{' '}
          <Link to="/login" className="font-medium text-primary hover:text-primary-800 transition-colors">
            Sign in
          </Link>
        </>
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary mb-5">
        <KeyRound size={24} />
      </div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-text-primary font-display">Create admin account</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Set the password for your institution administrator login.
        </p>
      </div>

      {errors.form && (
        <div className="mb-4 rounded-xl border border-danger/20 bg-red-50 px-4 py-3 text-sm text-danger">
          {errors.form}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Institution public ID"
          name="institutionPublicId"
          placeholder="INST-XXXXXXXX"
          value={form.institutionPublicId}
          onChange={updateForm}
          error={errors.institutionPublicId}
          hint="Use the ID shown after registration if it was not filled automatically."
        />
        <Input
          label="Password"
          name="password"
          type="password"
          placeholder="Enter a secure password"
          value={form.password}
          onChange={updateForm}
          error={errors.password}
          autoComplete="new-password"
        />
        <Input
          label="Confirm password"
          name="confirmPassword"
          type="password"
          placeholder="Confirm your password"
          value={form.confirmPassword}
          onChange={updateForm}
          error={errors.confirmPassword}
          autoComplete="new-password"
        />
        <Button type="submit" loading={loading} className="w-full mt-2" size="lg">
          Create admin account
        </Button>
      </form>
    </AuthShell>
  )
}
