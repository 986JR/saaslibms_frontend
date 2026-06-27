import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import { authApi } from '../../api'
import { getErrorMessage } from '../../utils'
import { AuthShell } from './AuthShell'

const pendingInstitutionKey = 'pendingInstitution'

function readPendingInstitution() {
  try {
    const stored = window.sessionStorage.getItem(pendingInstitutionKey)
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const pending = useMemo(() => readPendingInstitution(), [])
  const publicId = searchParams.get('publicId') || pending?.publicId || ''
  const [status, setStatus] = useState('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    async function verifyEmail() {
      if (!token) {
        setStatus('error')
        setMessage('No verification token was found in this link. Please check your email and try again.')
        return
      }

      try {
        const res = await authApi.verifyInstitutionEmail(token)
        setStatus('success')
        setMessage(res.data?.message || 'Email verified successfully. You may now set up your admin account.')
      } catch (err) {
        const errorMessage = getErrorMessage(err)
        if (errorMessage.toLowerCase().includes('already verified')) {
          setStatus('success')
          setMessage('This institution email is already verified. You can continue to admin setup.')
          return
        }

        setStatus('error')
        setMessage(errorMessage)
      }
    }

    verifyEmail()
  }, [token])

  if (status === 'loading') {
    return (
      <AuthShell>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary mb-5">
          <Loader2 size={24} className="animate-spin" />
        </div>
        <h1 className="text-xl font-bold text-text-primary font-display">Verifying your email</h1>
        <p className="mt-2 text-sm text-text-secondary">
          Hold on while we confirm your institution verification link.
        </p>
      </AuthShell>
    )
  }

  if (status === 'success') {
    const setupHref = publicId ? `/setup-admin?publicId=${encodeURIComponent(publicId)}` : '/setup-admin'

    return (
      <AuthShell>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary mb-5">
          <CheckCircle2 size={24} />
        </div>
        <h1 className="text-xl font-bold text-text-primary font-display">Email verified successfully</h1>
        <p className="mt-2 text-sm text-text-secondary">{message}</p>
        <Link
          to={setupHref}
          className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-xl bg-primary px-6 text-base font-medium text-white shadow-sm transition-colors hover:bg-primary-800"
        >
          Set up your admin account
        </Link>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      footer={(
        <>
          Need a fresh link?{' '}
          <Link to="/register" className="font-medium text-primary hover:text-primary-800 transition-colors">
            Register again
          </Link>
        </>
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-danger mb-5">
        <AlertCircle size={24} />
      </div>
      <h1 className="text-xl font-bold text-text-primary font-display">Verification failed</h1>
      <p className="mt-2 text-sm text-text-secondary">{message}</p>
      <Link
        to="/register"
        className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-xl bg-primary px-6 text-base font-medium text-white shadow-sm transition-colors hover:bg-primary-800"
      >
        Register again
      </Link>
    </AuthShell>
  )
}
