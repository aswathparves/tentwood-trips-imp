'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const router = useRouter()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    async function checkSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        setError('This password reset link is invalid or has expired.')
        return
      }

      setReady(true)
    }

    checkSession()
  }, [])

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
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

    const supabase = createClient()

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    await supabase.auth.signOut({ scope: 'global' })

    setLoading(false)
    router.replace('/login?reset=success')
  }

  if (!ready && !error) {
    return (
      <main
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f8f7f3',
          fontFamily:
            'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        }}
      >
        <p style={{ fontSize: 13, color: '#737d85' }}>
          Checking password reset link…
        </p>
      </main>
    )
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        background: '#f8f7f3',
        fontFamily:
          'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      {/* LEFT BRAND PANEL */}
      <section
        style={{
          position: 'relative',
          width: '46%',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          overflow: 'hidden',
          padding: '54px clamp(32px, 5vw, 72px)',
          background: '#4bb9b0',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(circle at 50% 25%, rgba(255,255,255,0.13), transparent 42%)',
          }}
        />

        <div
          style={{
            position: 'absolute',
            width: 390,
            height: 390,
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '50%',
            top: -210,
            left: -190,
          }}
        />

        <div
          style={{
            position: 'absolute',
            width: 560,
            height: 560,
            border: '1px solid rgba(255,255,255,0.10)',
            borderRadius: '50%',
            right: -270,
            bottom: -250,
          }}
        />

        <div
          style={{
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <img
            src="/tentwood-logo.png"
            alt="Tentwood Trips"
            style={{
              display: 'block',
              width: '100%',
              maxWidth: 330,
              height: 'auto',
            }}
          />
        </div>

        <div
          style={{
            position: 'relative',
            zIndex: 1,
            maxWidth: 540,
            marginTop: 'auto',
            paddingTop: 80,
          }}
        >
          <p
            style={{
              margin: '0 0 16px',
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'rgba(13,43,66,0.58)',
            }}
          >
            Travel Operations · Client Management
          </p>

          <h1
            style={{
              margin: 0,
              maxWidth: 500,
              fontSize: 'clamp(2rem, 3vw, 3rem)',
              fontWeight: 600,
              lineHeight: 1.08,
              letterSpacing: '-0.035em',
              color: '#0d2b42',
            }}
          >
            Everything your travel team needs, in one place.
          </h1>

          <p
            style={{
              margin: '22px 0 0',
              maxWidth: 440,
              fontSize: 14,
              lineHeight: 1.75,
              color: 'rgba(15,40,58,0.62)',
            }}
          >
            Manage leads, bookings, follow-ups and your team from a single
            workspace.
          </p>

          <div
            style={{
              width: 48,
              height: 1,
              marginTop: 34,
              background: 'rgba(13,43,66,0.22)',
            }}
          />

          <p
            style={{
              margin: '14px 0 0',
              fontSize: 11,
              color: 'rgba(13,43,66,0.42)',
            }}
          >
            Internal workspace · Tentwood Trips
          </p>
        </div>
      </section>

      {/* RIGHT RESET PANEL */}
      <section
        style={{
          flex: 1,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px 56px',
          background: '#f8f7f3',
        }}
      >
        <div style={{ width: '100%', maxWidth: 430 }}>
          <div style={{ marginBottom: 38 }}>
            <p
              style={{
                margin: '0 0 9px',
                fontSize: 13,
                fontWeight: 600,
                color: '#159b91',
              }}
            >
              Account recovery
            </p>

            <h2
              style={{
                margin: 0,
                fontSize: 'clamp(2rem, 3vw, 2.5rem)',
                fontWeight: 600,
                lineHeight: 1.1,
                letterSpacing: '-0.035em',
                color: '#17212b',
              }}
            >
              Reset password
            </h2>

            <p
              style={{
                margin: '11px 0 0',
                fontSize: 14,
                lineHeight: 1.6,
                color: '#737d85',
              }}
            >
              Create a new password for your Tentwood Trips account.
            </p>
          </div>

          {error && !ready && (
            <div
              style={{
                padding: '12px 14px',
                border: '1px solid #f0caca',
                borderRadius: 9,
                background: '#fff6f6',
                color: '#bd3838',
                fontSize: 13,
                lineHeight: 1.5,
              }}
            >
              {error}
            </div>
          )}

          {ready && (
            <form onSubmit={handleSubmit}>
              {/* NEW PASSWORD */}
              <div style={{ marginBottom: 22 }}>
                <label
                  htmlFor="password"
                  style={{
                    display: 'block',
                    marginBottom: 8,
                    fontSize: 13,
                    fontWeight: 500,
                    color: '#303941',
                  }}
                >
                  New password
                </label>

                <div style={{ position: 'relative' }}>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your new password"
                    style={{
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
                      boxSizing: 'border-box',
                    }}
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    style={{
                      position: 'absolute',
                      top: '50%',
                      right: 13,
                      transform: 'translateY(-50%)',
                      display: 'flex',
                      padding: 5,
                      border: 0,
                      background: 'transparent',
                      color: '#8e9995',
                      cursor: 'pointer',
                    }}
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
                <label
                  htmlFor="confirmPassword"
                  style={{
                    display: 'block',
                    marginBottom: 8,
                    fontSize: 13,
                    fontWeight: 500,
                    color: '#303941',
                  }}
                >
                  Confirm password
                </label>

                <div style={{ position: 'relative' }}>
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your new password"
                    style={{
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
                      boxSizing: 'border-box',
                    }}
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
                    style={{
                      position: 'absolute',
                      top: '50%',
                      right: 13,
                      transform: 'translateY(-50%)',
                      display: 'flex',
                      padding: 5,
                      border: 0,
                      background: 'transparent',
                      color: '#8e9995',
                      cursor: 'pointer',
                    }}
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
                <div
                  style={{
                    marginBottom: 22,
                    padding: '11px 14px',
                    border: '1px solid #f0caca',
                    borderRadius: 9,
                    background: '#fff6f6',
                    color: '#bd3838',
                    fontSize: 13,
                    lineHeight: 1.5,
                  }}
                >
                  {error}
                </div>
              )}

              {/* BUTTON */}
              <button
                type="submit"
                disabled={loading}
                style={{
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
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.75 : 1,
                  boxShadow: '0 2px 5px rgba(18,53,79,0.14)',
                }}
              >
                {loading ? 'Updating…' : 'Update password'}
              </button>
            </form>
          )}

          <div
            style={{
              marginTop: 30,
              textAlign: 'center',
            }}
          >
            <a
              href="/login"
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: '#159b91',
                textDecoration: 'none',
              }}
            >
              ← Back to login
            </a>
          </div>

          <p
            style={{
              margin: '30px 0 0',
              textAlign: 'center',
              fontSize: 11,
              color: '#a5aeaa',
            }}
          >
            Internal use only · Tentwood Trips
          </p>
        </div>
      </section>

      <style>{`
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