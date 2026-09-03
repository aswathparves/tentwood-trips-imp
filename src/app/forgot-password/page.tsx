'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    const supabase = createClient()

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    setMessage(
      'If an account exists for this email, a password reset link has been sent.'
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
      {/* LEFT */}
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

      {/* RIGHT */}
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
              Forgot password?
            </h2>

            <p
              style={{
                margin: '11px 0 0',
                fontSize: 14,
                lineHeight: 1.6,
                color: '#737d85',
              }}
            >
              Enter your email and we'll send you a password reset link.
            </p>
          </div>

          {message && (
            <div
              style={{
                marginBottom: 24,
                padding: '12px 14px',
                border: '1px solid #bfe3df',
                borderRadius: 9,
                background: '#f0faf8',
                color: '#147a73',
                fontSize: 13,
                lineHeight: 1.5,
              }}
            >
              {message}
            </div>
          )}

          {error && (
            <div
              style={{
                marginBottom: 24,
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

          {!message && (
            <form onSubmit={handleSubmit}>
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
                placeholder="you@tentwoodtrips.com"
                style={{
                  display: 'block',
                  width: '100%',
                  height: 50,
                  padding: '0 15px',
                  border: '1px solid #d9dfdc',
                  borderRadius: 10,
                  outline: 'none',
                  background: '#fff',
                  color: '#17212b',
                  fontSize: 14,
                  fontWeight: 400,
                  boxSizing: 'border-box',
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
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  height: 50,
                  marginTop: 30,
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
                {loading ? 'Sending…' : 'Send reset link'}
              </button>
            </form>
          )}

          <div
            style={{
              marginTop: 30,
              textAlign: 'center',
            }}
          >
            <Link
              href="/login"
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: '#159b91',
                textDecoration: 'none',
              }}
            >
              ← Back to login
            </Link>
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