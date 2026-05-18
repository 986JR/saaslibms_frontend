import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Building2, Mail, Phone, MapPin, Library, ShieldCheck, KeyRound, CheckCircle2 } from 'lucide-react'
import { authApi } from '../../api'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { getErrorMessage } from '../../utils'
import toast from 'react-hot-toast'

const STEPS = [
  { id: 1, label: 'Register', description: 'Institution details' },
  { id: 2, label: 'Verify', description: 'Email verification' },
  { id: 3, label: 'Setup', description: 'Admin account' },
]

export function RegisterPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  // Step 1 data
  const [institution, setInstitution] = useState({
    name: '', email: '', phone: '', address: ''
  })
  const [publicId, setPublicId] = useState('')

  // Step 2 data
  const [code, setCode] = useState('')

  // Step 3 data
  const [admin, setAdmin] = useState({ password: '', confirmPassword: '' })

  function updateInstitution(e) {
    const { name, value } = e.target
    setInstitution(p => ({ ...p, [name]: value }))
    if (errors[name]) setErrors(p => ({ ...p, [name]: '' }))
  }

  function updateAdmin(e) {
    const { name, value } = e.target
    setAdmin(p => ({ ...p, [name]: value }))
    if (errors[name]) setErrors(p => ({ ...p, [name]: '' }))
  }

  // ── Step 1 ────────────────────────────────────────────────────────────────
  async function handleStep1(e) {
    e.preventDefault()
    const errs = {}
    if (!institution.name) errs.name = 'Institution name is required'
    if (!institution.email) errs.email = 'Email is required'
    if (!institution.phone) errs.phone = 'Phone is required'
    if (!institution.address) errs.address = 'Address is required'
    if (Object.keys(errs).length) return setErrors(errs)

    setLoading(true)
    try {
      const res = await authApi.registerInstitution(institution)
      setPublicId(res.data.data.publicId)
      toast.success('Verification code sent to your email!')
      setStep(2)
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  // Step 2
  async function handleStep2(e) {
    e.preventDefault()
    if (code.length !== 6) return setErrors({ code: 'Code must be 6 characters' })

    setLoading(true)
    try {
      await authApi.verifyInstitution({
        InstitutionPublicId: publicId,
        VerificationCode: code,
      })
      toast.success('Institution verified!')
      setStep(3)
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  //  Step 3 
  async function handleStep3(e) {
    e.preventDefault()
    const errs = {}
    if (!admin.password) errs.password = 'Password is required'
    if (admin.password !== admin.confirmPassword) errs.confirmPassword = 'Passwords do not match'
    if (Object.keys(errs).length) return setErrors(errs)

    setLoading(true)
    try {
      await authApi.setupAdmin({
        institutionPublicId: publicId,
        password: admin.password,
        confirmPassword: admin.confirmPassword,
      })
      toast.success('Admin account created! You can now log in.')
      navigate('/login')
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="flex items-center gap-2 mb-8">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Library size={16} className="text-white" />
          </div>
          <span className="text-base font-bold text-text-primary font-display">LibraryOS</span>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-0 mb-8">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors
                  ${step > s.id ? 'bg-primary-600 text-white' : step === s.id ? 'bg-primary text-white' : 'bg-border text-text-secondary'}
                `}>
                  {step > s.id ? <CheckCircle2 size={16} /> : s.id}
                </div>
                <p className={`text-xs mt-1 font-medium ${step >= s.id ? 'text-primary' : 'text-text-secondary'}`}>
                  {s.label}
                </p>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 mb-4 transition-colors ${step > s.id ? 'bg-primary' : 'bg-border'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-border shadow-card p-8 animate-fade-in">

          {/* Step 1 — Register */}
          {step === 1 && (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-bold text-text-primary font-display">Register your institution</h2>
                <p className="mt-1 text-sm text-text-secondary">
                  A verification code will be sent to your email.
                </p>
              </div>
              <form onSubmit={handleStep1} className="space-y-4">
                <Input
                  label="Institution name"
                  name="name"
                  placeholder="Dar es Salaam City Library"
                  value={institution.name}
                  onChange={updateInstitution}
                  error={errors.name}
                  icon={<Building2 size={15} />}
                />
                <Input
                  label="Email address"
                  name="email"
                  type="email"
                  placeholder="admin@library.ac.tz"
                  value={institution.email}
                  onChange={updateInstitution}
                  error={errors.email}
                  icon={<Mail size={15} />}
                />
                <Input
                  label="Phone number"
                  name="phone"
                  type="tel"
                  placeholder="+255712345678"
                  value={institution.phone}
                  onChange={updateInstitution}
                  error={errors.phone}
                  icon={<Phone size={15} />}
                />
                <Input
                  label="Address"
                  name="address"
                  placeholder="Samora Avenue, Dar es Salaam"
                  value={institution.address}
                  onChange={updateInstitution}
                  error={errors.address}
                  icon={<MapPin size={15} />}
                />
                <Button type="submit" loading={loading} className="w-full mt-2" size="lg">
                  Send verification code
                </Button>
              </form>
            </>
          )}

          {/* Step 2 — Verify */}
          {step === 2 && (
            <>
              <div className="mb-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary mb-4">
                  <ShieldCheck size={22} />
                </div>
                <h2 className="text-xl font-bold text-text-primary font-display">Check your email</h2>
                <p className="mt-1 text-sm text-text-secondary">
                  We sent a 6-character code to <strong>{institution.email}</strong>
                </p>
              </div>
              <form onSubmit={handleStep2} className="space-y-4">
                <Input
                  label="Verification code"
                  name="code"
                  placeholder="A9K2LM"
                  value={code}
                  onChange={(e) => { setCode(e.target.value.toUpperCase()); setErrors({}) }}
                  error={errors.code}
                  maxLength={6}
                  className="tracking-widest text-center text-lg font-mono font-bold"
                />
                <Button type="submit" loading={loading} className="w-full mt-2" size="lg">
                  Verify institution
                </Button>
              </form>
            </>
          )}

          {/* Step 3 — Setup Admin */}
          {step === 3 && (
            <>
              <div className="mb-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary mb-4">
                  <KeyRound size={22} />
                </div>
                <h2 className="text-xl font-bold text-text-primary font-display">Create admin account</h2>
                <p className="mt-1 text-sm text-text-secondary">
                  Set a secure password for your admin account. Your login email is {institution.email}.
                </p>
              </div>
              <form onSubmit={handleStep3} className="space-y-4">
                <Input
                  label="Password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={admin.password}
                  onChange={updateAdmin}
                  error={errors.password}
                />
                <Input
                  label="Confirm password"
                  name="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={admin.confirmPassword}
                  onChange={updateAdmin}
                  error={errors.confirmPassword}
                />
                <Button type="submit" loading={loading} className="w-full mt-2" size="lg">
                  Create admin account
                </Button>
              </form>
            </>
          )}
        </div>

        <p className="mt-5 text-center text-sm text-text-secondary">
          Already registered?{' '}
          <Link to="/login" className="font-medium text-primary hover:text-primary-800 transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
