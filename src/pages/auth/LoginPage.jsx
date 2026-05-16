import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, Library } from 'lucide-react'
import { authApi } from '../../api'
import { useAuthStore } from '../../store/authStore'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { getErrorMessage } from '../../utils'
import toast from 'react-hot-toast'

export function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuthStore()

  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  function handleChange(e) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  function validate() {
    const errs = {}
    if (!form.email) errs.email = 'Email is required'
    if (!form.password) errs.password = 'Password is required'
    return errs
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) return setErrors(errs)

    setLoading(true)
    try {
      const res = await authApi.login(form)
      const { accessToken, user } = res.data.data
      login(accessToken, user)
      navigate('/dashboard')
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-2/5 bg-primary p-12">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20">
            <Library size={18} className="text-white" />
          </div>
          <span className="text-lg font-bold text-white font-display">LibraryOS</span>
        </div>

        <div>
          <blockquote className="text-white/90 text-xl font-light leading-relaxed">
            "A library is the delivery room for the birth of ideas, a place where history comes to life."
          </blockquote>
          <p className="mt-4 text-white/60 text-sm">— Norman Cousins</p>
        </div>

        <div className="text-white/40 text-xs">
          Institutional Library Management System
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          {/* Mobile brand */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Library size={16} className="text-white" />
            </div>
            <span className="text-base font-bold text-text-primary font-display">LibraryOS</span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-text-primary font-display">Welcome back</h1>
            <p className="mt-1.5 text-sm text-text-secondary">
              Sign in to your library management account
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email address"
              name="email"
              type="email"
              placeholder="admin@library.ac.tz"
              value={form.email}
              onChange={handleChange}
              error={errors.email}
              icon={<Mail size={15} />}
              autoComplete="email"
            />
            <Input
              label="Password"
              name="password"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              error={errors.password}
              icon={<Lock size={15} />}
              autoComplete="current-password"
            />

            <Button
              type="submit"
              loading={loading}
              className="w-full mt-2"
              size="lg"
            >
              Sign in
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-text-secondary">
            New institution?{' '}
            <Link to="/register" className="font-medium text-primary hover:text-primary-800 transition-colors">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
