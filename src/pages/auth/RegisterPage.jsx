import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Building2, Globe2, Mail, MapPin, Phone } from 'lucide-react'
import { authApi } from '../../api'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { getErrorMessage } from '../../utils'
import { AuthShell } from './AuthShell'
import toast from 'react-hot-toast'

const CHECK_MESSAGES = [
  'Validating your institution details...',
  'Checking your domain exists...',
  'Verifying your website is online...',
  'Checking email capability...',
  'Almost done...',
]

const pendingInstitutionKey = 'pendingInstitution'

function isValidWebsite(value) {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export function RegisterPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [messageIndex, setMessageIndex] = useState(0)
  const [errors, setErrors] = useState({})
  const [form, setForm] = useState({
    name: '',
    email: '',
    website: '',
    phone: '',
    address: '',
  })

  useEffect(() => {
    if (!loading) {
      setMessageIndex(0)
      return undefined
    }

    const timer = window.setInterval(() => {
      setMessageIndex((current) => Math.min(current + 1, CHECK_MESSAGES.length - 1))
    }, 1600)

    return () => window.clearInterval(timer)
  }, [loading])

  function updateForm(e) {
    const { name, value } = e.target
    setForm((current) => ({ ...current, [name]: value }))
    if (errors[name] || errors.form) {
      setErrors((current) => ({ ...current, [name]: '', form: '' }))
    }
  }

  function validate() {
    const nextErrors = {}
    if (!form.name.trim()) nextErrors.name = 'Institution name is required'
    if (!form.email.trim()) nextErrors.email = 'Institution email is required'
    if (!form.website.trim()) {
      nextErrors.website = 'Institution website is required'
    } else if (!isValidWebsite(form.website.trim())) {
      nextErrors.website = 'Enter a full URL, for example https://udom.ac.tz'
    }
    if (!form.phone.trim()) nextErrors.phone = 'Phone number is required'
    if (!form.address.trim()) nextErrors.address = 'Address is required'
    return nextErrors
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const nextErrors = validate()
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors)
      return
    }

    const requestBody = {
      name: form.name.trim(),
      email: form.email.trim(),
      website: form.website.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
    }

    setLoading(true)
    try {
      const res = await authApi.registerInstitution(requestBody)
      const data = res.data?.data || {}
      const publicId = data.publicId || ''

      window.sessionStorage.setItem(
        pendingInstitutionKey,
        JSON.stringify({
          publicId,
          email: requestBody.email,
          website: requestBody.website,
        })
      )

      toast.success('Verification link sent to your email')
      navigate(`/register/success?publicId=${encodeURIComponent(publicId)}&email=${encodeURIComponent(requestBody.email)}`)
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
          Already registered?{' '}
          <Link to="/login" className="font-medium text-primary hover:text-primary-800 transition-colors">
            Sign in
          </Link>
        </>
      )}
    >
      <div className="mb-6">
        <h1 className="text-xl font-bold text-text-primary font-display">Register your institution</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Use your official institution email and website so we can verify your library.
        </p>
      </div>

      {errors.form && (
        <div className="mb-4 rounded-xl border border-danger/20 bg-red-50 px-4 py-3 text-sm text-danger">
          {errors.form}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Institution name"
          name="name"
          placeholder="University of Dodoma"
          value={form.name}
          onChange={updateForm}
          error={errors.name}
          icon={<Building2 size={15} />}
        />
        <Input
          label="Institution email"
          name="email"
          type="email"
          placeholder="library@udom.ac.tz"
          value={form.email}
          onChange={updateForm}
          error={errors.email}
          hint="Personal email domains such as Gmail or Yahoo are not accepted."
          icon={<Mail size={15} />}
        />
        <Input
          label="Website"
          name="website"
          type="url"
          placeholder="https://udom.ac.tz"
          value={form.website}
          onChange={updateForm}
          error={errors.website}
          hint="Use the official website that matches your email domain."
          icon={<Globe2 size={15} />}
        />
        <Input
          label="Phone number"
          name="phone"
          type="tel"
          placeholder="+255612345678"
          value={form.phone}
          onChange={updateForm}
          error={errors.phone}
          icon={<Phone size={15} />}
        />
        <Input
          label="Address"
          name="address"
          placeholder="Dodoma, Tanzania"
          value={form.address}
          onChange={updateForm}
          error={errors.address}
          icon={<MapPin size={15} />}
        />

        {loading && (
          <div className="rounded-xl border border-primary-100 bg-primary-50 px-4 py-3 text-sm text-primary">
            {CHECK_MESSAGES[messageIndex]}
          </div>
        )}

        <Button type="submit" loading={loading} className="w-full mt-2" size="lg">
          Send verification link
        </Button>
      </form>
    </AuthShell>
  )
}
