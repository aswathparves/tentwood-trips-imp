'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function SetPasswordPage() {
  const router = useRouter()
  const supabase = createClient()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [checking, setChecking] = useState(true)
  const [ready, setReady] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function checkSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        router.replace('/login?error=Please+use+your+invitation+link')
        return
      }

      setReady(true)
      setChecking(false)
    }

    checkSession()
  }, [router, supabase])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.replace('/login?message=Password+created+successfully')
  }

  if (checking) {
    return (
      <main style={pageStyle}>
        <p style={loadingStyle}>Checking invitation…</p>
      </main>
    )
  }

  if (!ready) return null

  return (
    <main style={pageStyle}>
      {/* LEFT BRAND PANEL */}
      <section style={brandPanelStyle}>
        <div style={glowStyle} />

        <div style={ringTopStyle} />
        <div style={ringBottomStyle} />

        <div style={logoWrapStyle}>
          <img
            src="/tentwood-logo.png"
            alt="Tentwood Trips"
            style={logoStyle}
          />
        </div>

        <div style={brandContentStyle}>
          <p style={eyebrowStyle}>
            Travel Operations · Client Management
          </p>

          <h1 style={brandHeadingStyle}>
            Everything your travel team needs, in one place.
          </h1>

          <p style={brandTextStyle}>
            Manage leads, bookings, follow-ups and your team from a single
            workspace.
          </p>

          <div style={dividerStyle} />

          <p style={brandFooterStyle}>
            Internal workspace · Tentwood Trips
          </p>
        </div>
      </section>

      {/* RIGHT PANEL */}
      <section style={contentPanelStyle}>
        <div style={formWrapStyle}>
          <div style={headerStyle}>
            <p style={accentTextStyle}>Welcome to Tentwood Trips</p>

            <h2 style={headingStyle}>Create your password</h2>

            <p style={subheadingStyle}>
              Set a password to activate your CRM account.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* PASSWORD */}
            <div style={{ marginBottom: 22 }}>
              <label htmlFor="password" style={labelStyle}>
                Password
              </label>

              <div style={inputWrapStyle}>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  placeholder="Minimum 8 characters"
                  style={inputStyle}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={
                    showPassword ? 'Hide password' : 'Show password'
                  }
                  style={eyeButtonStyle}
                >
                  {showPassword ? (
                    <EyeOff size={18} strokeWidth={1.7} />
                  ) : (
                    <Eye size={18} strokeWidth={1.7} />
                  )}
                </button>
              </div>
            </div>

            {/* CONFIRM PASSWORD */}
            <div style={{ marginBottom: 30 }}>
              <label htmlFor="confirmPassword" style={labelStyle}>
                Confirm password
              </label>

              <div style={inputWrapStyle}>
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  placeholder="Re-enter your password"
                  style={inputStyle}
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword((value) => !value)
                  }
                  aria-label={
                    showConfirmPassword
                      ? 'Hide password'
                      : 'Show password'
                  }
                  style={eyeButtonStyle}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={18} strokeWidth={1.7} />
                  ) : (
                    <Eye size={18} strokeWidth={1.7} />
                  )}
                </button>
              </div>
            </div>

            {/* ERROR */}
            {error && (
              <div style={errorStyle}>
                {error}
              </div>
            )}

            {/* BUTTON */}
            <button
              type="submit"
              disabled={loading}
              style={{
                ...buttonStyle,
                opacity: loading ? 0.75 : 1,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Creating password…' : 'Create password'}
            </button>
          </form>

          <p style={footerStyle}>
            Internal use only · Tentwood Trips
          </p>
        </div>
      </section>

      <style>{`
        input:focus {
          border-color: #4bb9b0 !important;
          box-shadow: 0 0 0 3px rgba(75,185,176,0.10) !important;
        }

        button[type="submit"]:hover:not(:disabled) {
          background: #0d2b42 !important;
          box-shadow: 0 5px 12px rgba(18,53,79,0.16) !important;
        }

        @media (max-width: 767px) {
          main {
            display: block !important;
          }

          main > section:first-child {
            width: 100% !important;
            min-height: 360px !important;
            padding: 42px 24px 46px !important;
          }

          main > section:last-child {
            min-height: auto !important;
            padding: 52px 24px 56px !important;
          }
        }
      `}</style>
    </main>
  )
}

const pageStyle = {
  minHeight: '100vh',
  display: 'flex',
  background: '#f8f7f3',
  fontFamily:
    'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
}

const brandPanelStyle = {
  position: 'relative' as const,
  width: '46%',
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column' as const,
  justifyContent: 'space-between',
  overflow: 'hidden',
  padding: '54px clamp(32px, 5vw, 72px)',
  background: '#4bb9b0',
}

const glowStyle = {
  position: 'absolute' as const,
  inset: 0,
  background:
    'radial-gradient(circle at 50% 25%, rgba(255,255,255,0.13), transparent 42%)',
}

const ringTopStyle = {
  position: 'absolute' as const,
  width: 390,
  height: 390,
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: '50%',
  top: -210,
  left: -190,
}

const ringBottomStyle = {
  position: 'absolute' as const,
  width: 560,
  height: 560,
  border: '1px solid rgba(255,255,255,0.10)',
  borderRadius: '50%',
  right: -270,
  bottom: -250,
}

const logoWrapStyle = {
  position: 'relative' as const,
  zIndex: 1,
  display: 'flex',
  justifyContent: 'center',
}

const logoStyle = {
  display: 'block',
  width: '100%',
  maxWidth: 330,
  height: 'auto',
}

const brandContentStyle = {
  position: 'relative' as const,
  zIndex: 1,
  maxWidth: 540,
  marginTop: 'auto',
  paddingTop: 80,
}

const eyebrowStyle = {
  margin: '0 0 16px',
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.18em',
  textTransform: 'uppercase' as const,
  color: 'rgba(13,43,66,0.58)',
}

const brandHeadingStyle = {
  margin: 0,
  maxWidth: 500,
  fontSize: 'clamp(2rem, 3vw, 3rem)',
  fontWeight: 600,
  lineHeight: 1.08,
  letterSpacing: '-0.035em',
  color: '#0d2b42',
}

const brandTextStyle = {
  margin: '22px 0 0',
  maxWidth: 440,
  fontSize: 14,
  lineHeight: 1.75,
  color: 'rgba(15,40,58,0.62)',
}

const dividerStyle = {
  width: 48,
  height: 1,
  marginTop: 34,
  background: 'rgba(13,43,66,0.22)',
}

const brandFooterStyle = {
  margin: '14px 0 0',
  fontSize: 11,
  color: 'rgba(13,43,66,0.42)',
}

const contentPanelStyle = {
  flex: 1,
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '48px 56px',
  background: '#f8f7f3',
}

const formWrapStyle = {
  width: '100%',
  maxWidth: 430,
}

const headerStyle = {
  marginBottom: 38,
}

const accentTextStyle = {
  margin: '0 0 9px',
  fontSize: 13,
  fontWeight: 600,
  color: '#159b91',
}

const headingStyle = {
  margin: 0,
  fontSize: 'clamp(2rem, 3vw, 2.5rem)',
  fontWeight: 600,
  lineHeight: 1.1,
  letterSpacing: '-0.035em',
  color: '#17212b',
}

const subheadingStyle = {
  margin: '11px 0 0',
  fontSize: 14,
  lineHeight: 1.6,
  color: '#737d85',
}

const labelStyle = {
  display: 'block',
  marginBottom: 8,
  fontSize: 13,
  fontWeight: 500,
  color: '#303941',
}

const inputWrapStyle = {
  position: 'relative' as const,
}

const inputStyle = {
  display: 'block',
  width: '100%',
  height: 50,
  padding: '0 46px 0 15px',
  border: '1px solid #d9dfdc',
  borderRadius: 10,
  outline: 'none',
  background: '#fff',
  color: '#17212b',
  fontSize: 14,
  fontWeight: 400,
  boxSizing: 'border-box' as const,
  transition: 'all 0.15s ease',
}

const eyeButtonStyle = {
  position: 'absolute' as const,
  top: '50%',
  right: 13,
  transform: 'translateY(-50%)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 5,
  border: 0,
  background: 'transparent',
  color: '#8e9995',
  cursor: 'pointer',
}

const errorStyle = {
  marginBottom: 22,
  padding: '11px 14px',
  border: '1px solid #f0caca',
  borderRadius: 9,
  background: '#fff6f6',
  color: '#bd3838',
  fontSize: 13,
  lineHeight: 1.5,
}

const buttonStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '100%',
  height: 50,
  border: 0,
  borderRadius: 10,
  background: '#12354f',
  color: '#fff',
  fontSize: 14,
  fontWeight: 600,
  boxShadow: '0 2px 5px rgba(18,53,79,0.14)',
  transition: 'all 0.15s ease',
}

const footerStyle = {
  margin: '30px 0 0',
  textAlign: 'center' as const,
  fontSize: 11,
  color: '#a5aeaa',
}

const loadingStyle = {
  fontSize: 13,
  color: '#737d85',
}