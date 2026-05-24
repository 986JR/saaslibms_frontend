import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  Lock, Eye, EyeOff, ArrowLeft, BookOpen,
  CheckCircle, AlertCircle, Loader2, ShieldAlert
} from 'lucide-react'
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

  .rp-root {
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

  .rp-serif { font-family: 'DM Serif Display', Georgia, serif; }

  /* ── Navbar ── */
  .rp-navbar {
    background: rgba(246,247,245,.85);
    backdrop-filter: blur(14px);
    border-bottom: 1px solid var(--border);
    box-shadow: var(--shadow-sm);
  }
  .rp-nav-inner {
    display: flex; align-items: center; justify-content: space-between;
    height: 64px; max-width: 1200px; margin: 0 auto; padding: 0 24px;
  }
  .rp-brand {
    display: flex; align-items: center; gap: 10px; text-decoration: none;
  }
  .rp-brand-icon {
    width: 34px; height: 34px; background: var(--green-900);
    border-radius: 10px; display: flex; align-items: center; justify-content: center;
  }
  .rp-brand-name {
    font-family: 'DM Serif Display', serif; font-size: 1.2rem; color: var(--text-1);
  }
  .rp-back-link {
    display: inline-flex; align-items: center; gap: 6px;
    font-size: 14px; font-weight: 500; color: var(--text-2);
    text-decoration: none; transition: color .15s;
  }
  .rp-back-link:hover { color: var(--text-1); }

  /* ── Main ── */
  .rp-main {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 48px 24px;
  }

  /* ── Card ── */
  .rp-card {
    background: var(--white);
    border: 1px solid var(--border);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-lg);
    width: 100%;
    max-width: 440px;
    overflow: hidden;
    animation: rp-cardIn .35s ease-out both;
  }
  @keyframes rp-cardIn {
    from { opacity: 0; transform: translateY(18px) scale(.98); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }

  .rp-card-top { padding: 36px 36px 0; }
  .rp-card-icon {
    width: 52px; height: 52px;
    background: var(--green-50);
    border: 1px solid var(--green-100);
    border-radius: var(--radius-md);
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 20px;
  }
  .rp-card-icon.danger {
    background: #fef2f2;
    border-color: #fecaca;
  }
  .rp-card-title {
    font-family: 'DM Serif Display', serif;
    font-size: 1.75rem; font-weight: 400; line-height: 1.15;
    color: var(--text-1); margin-bottom: 10px;
  }
  .rp-card-sub {
    font-size: 14px; color: var(--text-2); line-height: 1.6;
  }
  .rp-card-body { padding: 28px 36px 36px; }

  /* ── Password strength bar ── */
  .rp-strength-wrap { margin-top: 8px; }
  .rp-strength-track {
    height: 3px; background: var(--border);
    border-radius: 99px; overflow: hidden; margin-bottom: 4px;
  }
  .rp-strength-fill {
    height: 100%; border-radius: 99px;
    transition: width .3s ease, background .3s ease;
  }
  .rp-strength-label {
    font-size: 11px; font-weight: 600; letter-spacing: .04em;
  }

  /* ── Fields ── */
  .rp-field { margin-bottom: 16px; }
  .rp-label {
    display: block; font-size: 13px; font-weight: 600;
    color: var(--text-1); margin-bottom: 6px;
  }
  .rp-input-wrap {
    position: relative; display: flex; align-items: center;
  }
  .rp-input-icon {
    position: absolute; left: 12px; color: var(--text-3);
    display: flex; align-items: center; pointer-events: none;
  }
  .rp-input {
    width: 100%; height: 46px; padding: 0 44px 0 40px;
    border: 1px solid var(--border); border-radius: var(--radius-md);
    font-size: 14px; font-family: 'Inter', sans-serif;
    color: var(--text-1); background: var(--bg);
    outline: none; transition: border-color .15s, box-shadow .15s;
    box-sizing: border-box;
  }
  .rp-input::placeholder { color: var(--text-3); }
  .rp-input:focus {
    border-color: var(--green-600);
    box-shadow: 0 0 0 3px rgba(22,163,74,.1);
    background: var(--white);
  }
  .rp-input.has-error {
    border-color: var(--danger);
    box-shadow: 0 0 0 3px rgba(220,38,38,.08);
  }
  .rp-pw-toggle {
    position: absolute; right: 10px; background: none; border: none;
    cursor: pointer; color: var(--text-3); padding: 4px;
    display: flex; align-items: center; transition: color .15s;
  }
  .rp-pw-toggle:hover { color: var(--text-1); }
  .rp-field-error {
    font-size: 12px; color: var(--danger);
    margin-top: 6px; display: flex; align-items: center; gap: 5px;
  }

  /* ── Error / info boxes ── */
  .rp-error-box {
    display: flex; align-items: flex-start; gap: 8px;
    background: #fef2f2; border: 1px solid #fecaca;
    border-radius: var(--radius-sm); padding: 12px 14px;
    margin-bottom: 20px; font-size: 13px; color: #991b1b; line-height: 1.6;
  }
  .rp-error-box svg { flex-shrink: 0; margin-top: 1px; }
  .rp-error-box a {
    color: #991b1b; font-weight: 600; text-decoration: underline;
  }

  /* ── Submit ── */
  .rp-submit-btn {
    width: 100%; height: 48px; border: none; border-radius: var(--radius-md);
    background: var(--green-900); color: #fff;
    font-size: 14px; font-weight: 600; font-family: 'Inter', sans-serif;
    cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;
    box-shadow: 0 1px 3px rgba(20,83,45,.3);
    transition: all .15s;
    margin-top: 8px;
  }
  .rp-submit-btn:hover:not(:disabled) {
    background: #0f3d1e; transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(20,83,45,.3);
  }
  .rp-submit-btn:active:not(:disabled) { transform: translateY(0); }
  .rp-submit-btn:disabled { opacity: .6; cursor: not-allowed; }

  /* ── Requirements checklist ── */
  .rp-req-list {
    list-style: none; padding: 0; margin: 6px 0 0;
    display: flex; flex-direction: column; gap: 4px;
  }
  .rp-req-item {
    display: flex; align-items: center; gap: 6px;
    font-size: 12px; color: var(--text-3);
    transition: color .2s;
  }
  .rp-req-item.met { color: var(--green-700); }
  .rp-req-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: var(--border-2); flex-shrink: 0;
    transition: background .2s;
  }
  .rp-req-item.met .rp-req-dot { background: var(--green-600); }

  /* ── Success state ── */
  .rp-success-icon {
    width: 56px; height: 56px;
    background: var(--green-50);
    border: 1px solid var(--green-100);
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 20px;
  }
  .rp-success-title {
    font-family: 'DM Serif Display', serif;
    font-size: 1.6rem; font-weight: 400; color: var(--text-1);
    margin-bottom: 12px;
  }
  .rp-success-text {
    font-size: 14px; color: var(--text-2); line-height: 1.7; margin-bottom: 0;
  }
  .rp-divider {
    height: 1px; background: var(--border); margin: 24px 0;
  }

  /* ── Redirect countdown ── */
  .rp-redirect-note {
    font-size: 13px; color: var(--text-3); margin-top: 12px;
    font-variant-numeric: tabular-nums;
  }

  /* ── Footer link ── */
  .rp-footer-link {
    text-align: center; margin-top: 20px;
    font-size: 13px; color: var(--text-2);
  }
  .rp-footer-link a {
    color: var(--green-700); font-weight: 600;
    text-decoration: none; transition: color .15s;
  }
  .rp-footer-link a:hover { color: var(--green-900); }

  /* ── Spinner ── */
  .rp-spinner { animation: rp-spin .6s linear infinite; }
  @keyframes rp-spin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }

  /* ── Page footer ── */
  .rp-page-footer {
    text-align: center; padding: 24px;
    font-size: 13px; color: var(--text-3);
    border-top: 1px solid var(--border);
  }

  @media (max-width: 480px) {
    .rp-card-top { padding: 28px 24px 0; }
    .rp-card-body { padding: 20px 24px 28px; }
  }
`

/* ── Password strength helper ── */
function getStrength(pw) {
  if (!pw) return { score: 0, label: '', color: 'transparent', width: '0%' }
  let score = 0
  if (pw.length >= 8) score++
  if (pw.length >= 12) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++

  const map = [
    { label: 'Too short',  color: '#DC2626', width: '20%' },
    { label: 'Weak',       color: '#DC2626', width: '30%' },
    { label: 'Fair',       color: '#F59E0B', width: '55%' },
    { label: 'Good',       color: '#16A34A', width: '75%' },
    { label: 'Strong',     color: '#15803d', width: '100%' },
  ]
  return { score, ...map[Math.min(score, 4)] }
}

function BookIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="white"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  )
}

/* ── Error states that block form submission entirely ── */
const BLOCKING_ERRORS = [
  'Invalid or expired reset token',
  'This reset link has expired',
  'This reset link has already been used',
  'Required request parameter',
]

function isBlockingError(msg) {
  return BLOCKING_ERRORS.some((e) => msg?.includes(e))
}

const REDIRECT_DELAY = 5 // seconds before auto-redirect to login

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const [fieldErrors, setFieldErrors] = useState({})  // { newPassword, confirmPassword }
  const [serverError, setServerError] = useState('')   // blocking server errors
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [redirectCount, setRedirectCount] = useState(REDIRECT_DELAY)

  const newPwRef = useRef(null)

  /* Focus new password on mount (if token present) */
  useEffect(() => {
    if (token) newPwRef.current?.focus()
  }, [token])

  /* Auto-redirect countdown after success */
  useEffect(() => {
    if (!success) return
    const timer = setInterval(() => {
      setRedirectCount((c) => {
        if (c <= 1) {
          clearInterval(timer)
          navigate('/')
          return 0
        }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [success, navigate])

  const strength = getStrength(newPassword)

  const validate = () => {
    const errs = {}
    if (!newPassword) errs.newPassword = 'New password is required'
    else if (newPassword.length < 8) errs.newPassword = 'Password must be at least 8 characters'
    if (!confirmPassword) errs.confirmPassword = 'Password confirmation is required'
    else if (newPassword && confirmPassword && newPassword !== confirmPassword)
      errs.confirmPassword = 'Passwords do not match'
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setServerError('')

    const errs = validate()
    if (Object.keys(errs).length) { setFieldErrors(errs); return }
    setFieldErrors({})

    setLoading(true)
    try {
      await authApi.resetPassword(token, { newPassword, confirmPassword })
      setSuccess(true)
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.errors?.[0]?.message ||
        'Something went wrong. Please try again.'

      if (isBlockingError(msg)) {
        setServerError(msg)
      } else {
        // Non-blocking — field-level or password mismatch from server
        setFieldErrors({ confirmPassword: msg })
      }
    } finally {
      setLoading(false)
    }
  }

  /* ── Missing token guard ── */
  if (!token) {
    return (
      <div className="rp-root">
        <style>{css}</style>
        <nav className="rp-navbar">
          <div className="rp-nav-inner">
            <Link to="/" className="rp-brand">
              <div className="rp-brand-icon"><BookIcon /></div>
              <span className="rp-brand-name rp-serif">BookSphere</span>
            </Link>
          </div>
        </nav>
        <main className="rp-main">
          <div className="rp-card">
            <div className="rp-card-top">
              <div className="rp-card-icon danger">
                <ShieldAlert size={22} stroke="#DC2626" strokeWidth={1.75} />
              </div>
              <h1 className="rp-card-title rp-serif">Invalid reset link</h1>
              <p className="rp-card-sub">
                This page requires a valid reset token from your email. The link may be incomplete or was opened incorrectly.
              </p>
            </div>
            <div className="rp-card-body">
              <Link to="/forgot-password" style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                width: '100%', height: 48, borderRadius: 'var(--radius-md)',
                background: 'var(--green-900)', color: '#fff',
                fontSize: 14, fontWeight: 600, textDecoration: 'none',
                boxShadow: '0 1px 3px rgba(20,83,45,.3)',
              }}>
                Request a new reset link
              </Link>
              <div className="rp-footer-link">
                <Link to="/">← Back to sign in</Link>
              </div>
            </div>
          </div>
        </main>
        <footer className="rp-page-footer">© 2026 BookSphere</footer>
      </div>
    )
  }

  return (
    <div className="rp-root">
      <style>{css}</style>

      {/* Navbar */}
      <nav className="rp-navbar">
        <div className="rp-nav-inner">
          <Link to="/" className="rp-brand">
            <div className="rp-brand-icon"><BookIcon /></div>
            <span className="rp-brand-name rp-serif">BookSphere</span>
          </Link>
          <Link to="/forgot-password" className="rp-back-link">
            <ArrowLeft size={15} /> Request new link
          </Link>
        </div>
      </nav>

      <main className="rp-main">
        {!success ? (
          /* ── Reset form ── */
          <div className="rp-card">
            <div className="rp-card-top">
              <div className="rp-card-icon">
                <Lock size={22} stroke="var(--green-700)" strokeWidth={1.75} />
              </div>
              <h1 className="rp-card-title rp-serif">Set a new password</h1>
              <p className="rp-card-sub">
                Choose a strong password for your BookSphere account. It must be at least 8 characters.
              </p>
            </div>

            <div className="rp-card-body">
              {/* Blocking server errors */}
              {serverError && (
                <div className="rp-error-box">
                  <AlertCircle size={16} />
                  <span>
                    {serverError}{' '}
                    <Link to="/forgot-password">Request a new link →</Link>
                  </span>
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate>
                {/* New Password */}
                <div className="rp-field">
                  <label className="rp-label" htmlFor="rp-new">New password</label>
                  <div className="rp-input-wrap">
                    <span className="rp-input-icon"><Lock size={16} /></span>
                    <input
                      ref={newPwRef}
                      id="rp-new"
                      type={showNew ? 'text' : 'password'}
                      className={`rp-input${fieldErrors.newPassword ? ' has-error' : ''}`}
                      placeholder="At least 8 characters"
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value)
                        setFieldErrors((f) => ({ ...f, newPassword: '' }))
                      }}
                      autoComplete="new-password"
                      disabled={!!serverError}
                    />
                    <button
                      type="button"
                      className="rp-pw-toggle"
                      onClick={() => setShowNew((v) => !v)}
                      tabIndex={-1}
                      aria-label="Toggle password visibility"
                    >
                      {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  {/* Strength bar — shown once user starts typing */}
                  {newPassword && (
                    <div className="rp-strength-wrap">
                      <div className="rp-strength-track">
                        <div
                          className="rp-strength-fill"
                          style={{ width: strength.width, background: strength.color }}
                        />
                      </div>
                      <span className="rp-strength-label" style={{ color: strength.color }}>
                        {strength.label}
                      </span>
                    </div>
                  )}

                  {/* Requirements */}
                  {newPassword && (
                    <ul className="rp-req-list">
                      <li className={`rp-req-item${newPassword.length >= 8 ? ' met' : ''}`}>
                        <span className="rp-req-dot" /> At least 8 characters
                      </li>
                      <li className={`rp-req-item${/[A-Z]/.test(newPassword) ? ' met' : ''}`}>
                        <span className="rp-req-dot" /> One uppercase letter
                      </li>
                      <li className={`rp-req-item${/[0-9]/.test(newPassword) ? ' met' : ''}`}>
                        <span className="rp-req-dot" /> One number
                      </li>
                    </ul>
                  )}

                  {fieldErrors.newPassword && (
                    <p className="rp-field-error">
                      <AlertCircle size={12} /> {fieldErrors.newPassword}
                    </p>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="rp-field">
                  <label className="rp-label" htmlFor="rp-confirm">Confirm new password</label>
                  <div className="rp-input-wrap">
                    <span className="rp-input-icon"><Lock size={16} /></span>
                    <input
                      id="rp-confirm"
                      type={showConfirm ? 'text' : 'password'}
                      className={`rp-input${fieldErrors.confirmPassword ? ' has-error' : ''}`}
                      placeholder="Repeat your new password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value)
                        setFieldErrors((f) => ({ ...f, confirmPassword: '' }))
                      }}
                      autoComplete="new-password"
                      disabled={!!serverError}
                    />
                    <button
                      type="button"
                      className="rp-pw-toggle"
                      onClick={() => setShowConfirm((v) => !v)}
                      tabIndex={-1}
                      aria-label="Toggle confirm password visibility"
                    >
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {fieldErrors.confirmPassword && (
                    <p className="rp-field-error">
                      <AlertCircle size={12} /> {fieldErrors.confirmPassword}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  className="rp-submit-btn"
                  disabled={loading || !!serverError}
                >
                  {loading
                    ? <><Loader2 size={18} className="rp-spinner" /> Resetting password…</>
                    : 'Reset password'}
                </button>
              </form>

              <div className="rp-footer-link">
                Remember your password? <Link to="/">Sign in</Link>
              </div>
            </div>
          </div>
        ) : (
          /* ── Success state ── */
          <div className="rp-card">
            <div className="rp-card-body" style={{ padding: '40px 36px', textAlign: 'center' }}>
              <div className="rp-success-icon">
                <CheckCircle size={26} stroke="var(--green-700)" strokeWidth={1.75} />
              </div>
              <h2 className="rp-success-title rp-serif">Password reset!</h2>
              <p className="rp-success-text">
                Your password has been updated successfully. You can now sign in with your new password.
              </p>
              <div className="rp-divider" />
              <Link to="/" style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                width: '100%', height: 48, borderRadius: 'var(--radius-md)',
                background: 'var(--green-900)', color: '#fff',
                fontSize: 14, fontWeight: 600, textDecoration: 'none',
                boxShadow: '0 1px 3px rgba(20,83,45,.3)',
              }}>
                Go to sign in
              </Link>
              <p className="rp-redirect-note">
                Redirecting automatically in {redirectCount}s…
              </p>
            </div>
          </div>
        )}
      </main>

      <footer className="rp-page-footer">
        © 2026 BookSphere · <Link to="/" style={{ color: 'var(--text-3)', textDecoration: 'none' }}>Home</Link>
      </footer>
    </div>
  )
}