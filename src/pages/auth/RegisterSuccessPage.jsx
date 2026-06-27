import { Link, useSearchParams } from 'react-router-dom'
import { MailCheck } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { AuthShell } from './AuthShell'

export function RegisterSuccessPage() {
  const [searchParams] = useSearchParams()
  const email = searchParams.get('email')

  return (
    <AuthShell
      footer={(
        <>
          Entered the wrong details?{' '}
          <Link to="/register" className="font-medium text-primary hover:text-primary-800 transition-colors">
            Register again
          </Link>
        </>
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary mb-5">
        <MailCheck size={24} />
      </div>

      <h1 className="text-xl font-bold text-text-primary font-display">Check your email</h1>
      <p className="mt-2 text-sm text-text-secondary">
        We sent a verification link{email ? <> to <strong>{email}</strong></> : ''}. Open it to verify your institution email address.
      </p>

      <div className="mt-6 space-y-3 rounded-xl border border-border bg-surface px-4 py-4 text-sm text-text-secondary">
        <p>The verification link expires in 24 hours.</p>
        <p>Check your spam folder if you do not see the message in your inbox.</p>
      </div>

      <Button className="w-full mt-6" size="lg" disabled>
        Waiting for email verification
      </Button>
    </AuthShell>
  )
}
