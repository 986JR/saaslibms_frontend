import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Mail, ArrowLeft, BookOpen, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { authApi } from '../../api'

/* ─── Inline styles — mirrors LoginPage CSS variables exactly ───────── */
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=DM+Serif+Display:ital@0;1&display=swap');

  :root {
    --green-900: #14532D;
    --green-700: #15803d;
    --green-600: #16A34A;
    --green-100: #dcfce7;
    --green-50:  #f0fdf4;
    --bg:        #F6F7F5;
    --white:     #FFFFFF;
    --text-1:    #111827;
    --text-2:    #6B7280;
    --text-3:    #9CA3AF;
    --border:    #E5E7EB;
    --border-2:  #D1D5DB;
    --danger:    #DC2626;
    --shadow-sm: 0 1px 3px rgba(0,0,0,.07), 0 1px 2px rgba(0,0,0,.04);
    --shadow-md: 0 4px 16px rgba(0,0,0,.08), 0 2px 4px rgba(0,0,0,.04);
    --shadow-lg: 0 12px 40px rgba(0,0,0,.10), 0 4px 8px rgba(0,0,0,.04);
    --radius-sm: 8px;
    --radius-md: 12px;
    --radius-lg: 16px;
    --radius-xl: 24px;
  }

  html { scroll-behavior: smooth; }

  .fp-root {
    font-family: 'Inter', system-ui, sans-serif;
    font-size: 16px;
    line-height: 1.65;
    color: var(--text-1);
    background: var(--bg);
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    -webkit-font-smoothing: antialiased;
  }

  .fp-serif { font-family: 'DM Serif Display', Georgia, serif; }

  /* ── Navbar (simplified, matches lp-navbar) ── */
  .fp-navbar {
    background: rgba(246,247,245,.85);
    backdrop-filter: blur(14px);
    border-bottom: 1px solid var(--border);
    box-shadow: var(--shadow-sm);
  }
  .fp-nav-inner {
    display: flex; align-items: center; justify-content: space-between;
    height: 64px; max-width: 1200px; margin: 0 auto; padding: 0 24px;
  }
  .fp-brand {
    display: flex; align-items: center; gap: 10px; text-decoration: none;
  }
  .fp-brand-icon {
    width: 34px; height: 34px; background: var(--green-900);
    border-radius: 10px; display: flex; align-items: center; justify-content: center;
  }
  .fp-brand-name {
    font-family: 'DM Serif Display', serif; font-size: 1.2rem; color: var(--text-1);
  }
  .fp-back-link {
    display: inline-flex; align-items: center; gap: 6px;
    font-size: 14px; font-weight: 500; color: var(--text-2);
    text-decoration: none; transition: color .15s;
  }
  .fp-back-link:hover { color: var(--text-1); }

  /* ── Main layout ── */
  .fp-main {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 48px 24px;
  }

  /* ── Card ── */
  .fp-card {
    background: var(--white);
    border: 1px solid var(--border);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-lg);
    width: 100%;
    max-width: 440px;
    overflow: hidden;
    animation: fp-cardIn .35s ease-out both;
  }
  @keyframes fp-cardIn {
    from { opacity: 0; transform: translateY(18px) scale(.98); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }

  .fp-card-top {
    padding: 36px 36px 0;
  }
  .fp-card-icon {
    width: 52px; height: 52px;
    background: var(--green-50);
    border: 1px solid var(--green-100);
    border-radius: var(--radius-md);
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 20px;
  }
  .fp-card-title {
    font-family: 'DM Serif Display', serif;
    font-size: 1.75rem; font-weight: 400; line-height: 1.15;
    color: var(--text-1); margin-bottom: 10px;
  }
  .fp-card-sub {
    font-size: 14px; color: var(--text-2); line-height: 1.6;
    margin-bottom: 0;
  }

  .fp-card-body { padding: 28px 36px 36px; }

  /* ── Field ── */
  .fp-field { margin-bottom: 20px; }
  .fp-label {
    display: block; font-size: 13px; font-weight: 600;
    color: var(--text-1); margin-bottom: 6px;
  }
  .fp-input-wrap {
    position: relative; display: flex; align-items: center;
  }
  .fp-input-icon {
    position: absolute; left: 12px; color: var(--text-3);
    display: flex; align-items: center; pointer-events: none;
  }
  .fp-input {
    width: 100%; height: 46px; padding: 0 14px 0 40px;
    border: 1px solid var(--border); border-radius: var(--radius-md);
    font-size: 14px; font-family: 'Inter', sans-serif;
    color: var(--text-1); background: var(--bg);
    outline: none; transition: border-color .15s, box-shadow .15s;
    box-sizing: border-box;
  }
  .fp-input::placeholder { color: var(--text-3); }
  .fp-input:focus {
    border-color: var(--green-600);
    box-shadow: 0 0 0 3px rgba(22,163,74,.1);
    background: var(--white);
  }
  .fp-input.has-error {
    border-color: var(--danger);
    box-shadow: 0 0 0 3px rgba(220,38,38,.08);
  }
  .fp-field-error {
    font-size: 12px; color: var(--danger);
    margin-top: 6px; display: flex; align-items: center; gap: 5px;
  }

  /* ── Error box ── */
  .fp-error-box {
    display: flex; align-items: flex-start; gap: 8px;
    background: #fef2f2; border: 1px solid #fecaca;
    border-radius: var(--radius-sm); padding: 12px 14px;
    margin-bottom: 20px; font-size: 13px; color: #991b1b; line-height: 1.5;
  }
  .fp-error-box svg { flex-shrink: 0; margin-top: 1px; }

  /* ── Submit button ── */
  .fp-submit-btn {
    width: 100%; height: 48px; border: none; border-radius: var(--radius-md);
    background: var(--green-900); color: #fff;
    font-size: 14px; font-weight: 600; font-family: 'Inter', sans-serif;
    cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;
    box-shadow: 0 1px 3px rgba(20,83,45,.3);
    transition: all .15s;
  }
  .fp-submit-btn:hover:not(:disabled) {
    background: #0f3d1e; transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(20,83,45,.3);
  }
  .fp-submit-btn:active:not(:disabled) { transform: translateY(0); }
  .fp-submit-btn:disabled { opacity: .6; cursor: not-allowed; }

  /* ── Countdown resend ── */
  .fp-resend-row {
    text-align: center; margin-top: 16px;
    font-size: 13px; color: var(--text-2);
  }
  .fp-resend-btn {
    background: none; border: none; cursor: pointer;
    color: var(--green-700); font-weight: 600; font-size: 13px;
    padding: 0; font-family: 'Inter', sans-serif;
    transition: color .15s;
  }
  .fp-resend-btn:hover:not(:disabled) { color: var(--green-900); }
  .fp-resend-btn:disabled { color: var(--text-3); cursor: not-allowed; }
  .fp-countdown { color: var(--text-3); font-variant-numeric: tabular-nums; }

  /* ── Success state ── */
  .fp-success-card {
    animation: fp-cardIn .35s ease-out both;
  }
  .fp-success-icon {
    width: 56px; height: 56px;
    background: var(--green-50);
    border: 1px solid var(--green-100);
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 20px;
  }
  .fp-success-title {
    font-family: 'DM Serif Display', serif;
    font-size: 1.6rem; font-weight: 400; color: var(--text-1);
    margin-bottom: 12px;
  }
  .fp-success-text {
    font-size: 14px; color: var(--text-2); line-height: 1.7;
    margin-bottom: 8px;
  }
  .fp-success-email {
    font-weight: 600; color: var(--text-1);
  }
  .fp-success-hint {
    font-size: 12px; color: var(--text-3); margin-top: 16px; line-height: 1.6;
  }
  .fp-divider {
    height: 1px; background: var(--border); margin: 24px 0;
  }

  /* ── Footer link row ── */
  .fp-footer-link {
    text-align: center; margin-top: 24px;
    font-size: 13px; color: var(--text-2);
  }
  .fp-footer-link a {
    color: var(--green-700); font-weight: 600;
    text-decoration: none; transition: color .15s;
  }
  .fp-footer-link a:hover { color: var(--green-900); }

  /* ── Spinner ── */
  .fp-spinner { animation: fp-spin .6s linear infinite; }
  @keyframes fp-spin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }

  /* ── Page footer ── */
  .fp-page-footer {
    text-align: center; padding: 24px;
    font-size: 13px; color: var(--text-3);
    border-top: 1px solid var(--border);
  }

  @media (max-width: 480px) {
    .fp-card-top { padding: 28px 24px 0; }
    .fp-card-body { padding: 20px 24px 28px; }
  }
`

function BookIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="white"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  )
}

const RESEND_COOLDOWN = 60 // seconds

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fieldError, setFieldError] = useState('')   // inline field-level error
  const [generalError, setGeneralError] = useState('') // unexpected errors
  const [countdown, setCountdown] = useState(0)

  const emailRef = useRef(null)
  const timerRef = useRef(null)

  /* Focus email on mount */
  useEffect(() => {
    emailRef.current?.focus()
  }, [])

  /* Countdown timer for resend */
  useEffect(() => {
    if (countdown <= 0) return
    timerRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { clearInterval(timerRef.current); return 0 }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [countdown])

  const startCooldown = () => setCountdown(RESEND_COOLDOWN)

  const validateEmail = (val) => {
    if (!val.trim()) return 'Email is required'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return 'Please provide a valid email address'
    return ''
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setGeneralError('')

    const err = validateEmail(email)
    if (err) { setFieldError(err); return }
    setFieldError('')

    setLoading(true)
    try {
      await authApi.forgotPassword({ email })
      // Per API spec: always show success regardless of whether email exists
      setSubmitted(true)
      startCooldown()
    } catch (err) {
      // Only 400 validation errors should surface; anything else is unexpected
      const msg =
        err.response?.data?.errors?.[0]?.message ||
        err.response?.data?.message ||
        'Something went wrong. Please try again.'

        console.log('status:', err.response?.status)
  console.log('data:', err.response?.data)
  console.log('message:', err.message)
      // Treat validation errors as field errors, others as general
      if (err.response?.status === 400) {
        setFieldError(msg)
      } else {
        setGeneralError(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (countdown > 0) return
    setGeneralError('')
    setLoading(true)
    try {
      await authApi.forgotPassword({ email })
      startCooldown()
    } catch {
      // Silently ignore — API spec says always show success
      startCooldown()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fp-root">
      <style>{css}</style>

      {/* Navbar */}
      <nav className="fp-navbar">
        <div className="fp-nav-inner">
          <Link to="/" className="fp-brand">
            <div className="fp-brand-icon"><BookIcon size={18} /></div>
            <span className="fp-brand-name fp-serif">BookSphere</span>
          </Link>
          <Link to="/" className="fp-back-link">
            <ArrowLeft size={15} /> Back to home
          </Link>
        </div>
      </nav>

      {/* Main */}
      <main className="fp-main">
        {!submitted ? (
          /* ── Request form ── */
          <div className="fp-card">
            <div className="fp-card-top">
              <div className="fp-card-icon">
                <Mail size={22} stroke="var(--green-700)" strokeWidth={1.75} />
              </div>
              <h1 className="fp-card-title fp-serif">Forgot your password?</h1>
              <p className="fp-card-sub">
                Enter the email address linked to your BookSphere account and we'll send you a reset link.
              </p>
            </div>

            <div className="fp-card-body">
              {generalError && (
                <div className="fp-error-box">
                  <AlertCircle size={16} />
                  <span>{generalError}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate>
                <div className="fp-field">
                  <label className="fp-label" htmlFor="fp-email">Email address</label>
                  <div className="fp-input-wrap">
                    <span className="fp-input-icon"><Mail size={16} /></span>
                    <input
                      ref={emailRef}
                      id="fp-email"
                      type="email"
                      className={`fp-input${fieldError ? ' has-error' : ''}`}
                      placeholder="you@institution.edu"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setFieldError('') }}
                      autoComplete="email"
                      required
                    />
                  </div>
                  {fieldError && (
                    <p className="fp-field-error">
                      <AlertCircle size={12} /> {fieldError}
                    </p>
                  )}
                </div>

                <button type="submit" className="fp-submit-btn" disabled={loading}>
                  {loading
                    ? <><Loader2 size={18} className="fp-spinner" /> Sending reset link…</>
                    : 'Send reset link'}
                </button>
              </form>

              <div className="fp-footer-link">
                Remember your password? <Link to="/">Sign in</Link>
              </div>
            </div>
          </div>
        ) : (
          /* ── Success state ── */
          <div className="fp-card fp-success-card">
            <div className="fp-card-body" style={{ padding: '40px 36px', textAlign: 'center' }}>
              <div className="fp-success-icon">
                <CheckCircle size={26} stroke="var(--green-700)" strokeWidth={1.75} />
              </div>
              <h2 className="fp-success-title fp-serif">Check your inbox</h2>
              <p className="fp-success-text">
                If <span className="fp-success-email">{email}</span> is registered, a password reset link is on its way.
                The link expires in <strong>5 minutes</strong>.
              </p>
              <p className="fp-success-text">
                Can't find it? Check your spam or junk folder.
              </p>

              <div className="fp-divider" />

              <div className="fp-resend-row">
                {countdown > 0 ? (
                  <span>
                    Resend available in <span className="fp-countdown">{countdown}s</span>
                  </span>
                ) : (
                  <span>
                    Didn't receive it?{' '}
                    <button
                      className="fp-resend-btn"
                      onClick={handleResend}
                      disabled={loading || countdown > 0}
                    >
                      {loading ? 'Sending…' : 'Resend reset link'}
                    </button>
                  </span>
                )}
              </div>

              <p className="fp-success-hint">
                The reset link is single-use and valid for 5 minutes only. If it expires, you can always request a new one here.
              </p>

              <div className="fp-divider" />

              <div className="fp-footer-link" style={{ marginTop: 0 }}>
                <Link to="/">← Back to sign in</Link>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Page footer */}
      <footer className="fp-page-footer">
        © 2026 BookSphere · <Link to="/" style={{ color: 'var(--text-3)', textDecoration: 'none' }}>Home</Link>
      </footer>
    </div>
  )
}