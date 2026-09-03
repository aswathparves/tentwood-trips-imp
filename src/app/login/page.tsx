'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.replace('/crm')
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        background: '#f8f7f3',
        fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
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
        {/* Soft background glow */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(circle at 50% 25%, rgba(255,255,255,0.13), transparent 42%)',
            pointerEvents: 'none',
          }}
        />

        {/* Decorative rings */}
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
            position: 'absolute',
            width: 360,
            height: 360,
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '50%',
            right: -150,
            bottom: -140,
          }}
        />

        {/* LOGO */}
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            width: '100%',
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
              objectFit: 'contain',
            }}
          />
        </div>

        {/* BRAND MESSAGE */}
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            width: '100%',
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
              fontWeight: 400,
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

      {/* RIGHT LOGIN PANEL */}
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
        <div
          style={{
            width: '100%',
            maxWidth: 430,
          }}
        >
          {/* HEADER */}
          <div style={{ marginBottom: 38 }}>
            <p
              style={{
                margin: '0 0 9px',
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: '0.02em',
                color: '#159b91',
              }}
            >
              Welcome back
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
              Sign in to CRM
            </h2>

            <p
              style={{
                margin: '11px 0 0',
                fontSize: 14,
                fontWeight: 400,
                lineHeight: 1.6,
                color: '#737d85',
              }}
            >
              Access your Tentwood Trips workspace.
            </p>
          </div>

          {/* FORM */}
          <form onSubmit={handleLogin}>
            {/* EMAIL */}
            <div style={{ marginBottom: 22 }}>
              <label
                htmlFor="email"
                style={{
                  display: 'block',
                  marginBottom: 8,
                  fontSize: 13,
                  fontWeight: 500,
                  color: '#303941',
                }}
              >
                Email address
              </label>

              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                style={{
                  display: 'block',
                  width: '100%',
                  height: 50,
                  padding: '0 15px',
                  border: '1px solid #d9dfdc',
                  borderRadius: 10,
                  outline: 'none',
                  background: '#ffffff',
                  color: '#17212b',
                  fontSize: 14,
                  fontWeight: 400,
                  boxSizing: 'border-box',
                  transition: 'all 0.15s ease',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#4bb9b0'
                  e.currentTarget.style.boxShadow =
                    '0 0 0 3px rgba(75,185,176,0.10)'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#d9dfdc'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              />
            </div>

            {/* PASSWORD */}
            <div style={{ marginBottom: 30 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 8,
                }}
              >
                <label
                  htmlFor="password"
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: '#303941',
                  }}
                >
                  Password
                </label>

                <Link
                  href="/forgot-password"
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: '#159b91',
                    textDecoration: 'none',
                  }}
                >
                  Forgot password?
                </Link>
              </div>

              <div style={{ position: 'relative' }}>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  style={{
                    display: 'block',
                    width: '100%',
                    height: 50,
                    padding: '0 46px 0 15px',
                    border: '1px solid #d9dfdc',
                    borderRadius: 10,
                    outline: 'none',
                    background: '#ffffff',
                    color: '#17212b',
                    fontSize: 14,
                    fontWeight: 400,
                    boxSizing: 'border-box',
                    transition: 'all 0.15s ease',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#4bb9b0'
                    e.currentTarget.style.boxShadow =
                      '0 0 0 3px rgba(75,185,176,0.10)'
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#d9dfdc'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={
                    showPassword ? 'Hide password' : 'Show password'
                  }
                  style={{
                    position: 'absolute',
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

            {/* SIGN IN */}
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
                background: loading ? '#315875' : '#12354f',
                color: '#ffffff',
                fontSize: 14,
                fontWeight: 600,
                letterSpacing: '-0.01em',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.78 : 1,
                boxShadow: '0 2px 5px rgba(18,53,79,0.14)',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.background = '#0d2b42'
                  e.currentTarget.style.boxShadow =
                    '0 5px 12px rgba(18,53,79,0.16)'
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.background = '#12354f'
                  e.currentTarget.style.boxShadow =
                    '0 2px 5px rgba(18,53,79,0.14)'
                }
              }}
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          {/* FOOTER */}
          <p
            style={{
              margin: '30px 0 0',
              textAlign: 'center',
              fontSize: 11,
              fontWeight: 400,
              color: '#a5aeaa',
            }}
          >
            Internal use only · Tentwood Trips
          </p>
        </div>
      </section>

      {/* MOBILE */}
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

          main > section:first-child > div:last-child {
            padding-top: 50px !important;
          }

          main > section:first-child h1 {
            font-size: 2rem !important;
          }

          main > section:last-child {
            min-height: auto !important;
            padding: 52px 24px 56px !important;
          }

          main > section:last-child > div {
            max-width: 430px !important;
          }
        }

        @media (min-width: 768px) and (max-width: 1100px) {
          main > section:first-child {
            width: 43% !important;
            padding-left: 32px !important;
            padding-right: 32px !important;
          }

          main > section:last-child {
            padding-left: 36px !important;
            padding-right: 36px !important;
          }
        }
      `}</style>
    </main>
  )
}