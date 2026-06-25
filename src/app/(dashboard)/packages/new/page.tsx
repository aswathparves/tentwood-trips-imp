'use client'

import TopNav from '@/components/layout/TopNav'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'

const CATEGORIES = [
  { value: 'honeymoon',     label: '💑 Honeymoon' },
  { value: 'family',        label: '👨‍👩‍👧 Family' },
  { value: 'group',         label: '👥 Group' },
  { value: 'corporate',     label: '💼 Corporate' },
  { value: 'adventure',     label: '🏔️ Adventure' },
  { value: 'pilgrimage',    label: '🛕 Pilgrimage' },
  { value: 'international', label: '✈️ International' },
  { value: 'weekend',       label: '🌅 Weekend Getaway' },
  { value: 'custom',        label: '📦 Custom' },
]

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: '8px',
  border: '1px solid #d6d3d1',
  fontSize: '14px',
  color: '#1c1917',
  outline: 'none',
  backgroundColor: '#fff',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '13px',
  fontWeight: 500,
  color: '#44403c',
  marginBottom: '6px',
}

export default function NewPackagePage() {
  const router = useRouter()

  const [name, setName] = useState('')
  const [category, setCategory] = useState('custom')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleCreate() {
    if (!name.trim()) {
      setError('Please enter a package name.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/packages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), category }),
      })

      const json = await res.json()

      if (!res.ok) {
        setError(json.error ?? 'Failed to create package.')
        setLoading(false)
        return
      }

      // Redirect straight into the Package Builder
      router.push(`/packages/${json.data.id}`)
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <>
      <TopNav title="New Package" />
      <main className="page-container-sm">

        {/* Back link */}
        <Link
          href="/packages"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            color: '#78716c',
            fontSize: '14px',
            textDecoration: 'none',
            marginBottom: '24px',
          }}
        >
          <ArrowLeft size={15} />
          Back to Packages
        </Link>

        <div
          style={{
            backgroundColor: '#fff',
            borderRadius: '12px',
            border: '1px solid #e7e5e4',
            overflow: 'hidden',
          }}
        >
          {/* Card header */}
          <div
            style={{
              padding: '20px 24px',
              borderBottom: '1px solid #f5f5f4',
              backgroundColor: '#fafaf9',
            }}
          >
            <h1 style={{ fontSize: '16px', fontWeight: 600, color: '#1c1917' }}>
              Create New Package
            </h1>
            <p style={{ fontSize: '13px', color: '#78716c', marginTop: '2px' }}>
              A package code will be auto-generated. You can fill in full details in the builder.
            </p>
          </div>

          {/* Form body */}
          <div style={{ padding: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

              {/* Name */}
              <div>
                <label style={labelStyle}>Package Name *</label>
                <input
                  style={inputStyle}
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                  placeholder="e.g. Goa Honeymoon Escape 4N/5D"
                  autoFocus
                />
              </div>

              {/* Category */}
              <div>
                <label style={labelStyle}>Category</label>
                <select
                  style={inputStyle}
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Error */}
              {error && (
                <p
                  style={{
                    fontSize: '13px',
                    color: '#dc2626',
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: '8px',
                    padding: '10px 14px',
                  }}
                >
                  {error}
                </p>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', gap: '12px', paddingTop: '4px' }}>
                <button
                  onClick={handleCreate}
                  disabled={loading}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    backgroundColor: loading ? '#a8a29e' : '#1c1917',
                    color: '#fff',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 500,
                    border: 'none',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    transition: 'background-color 0.15s',
                  }}
                >
                  {loading && <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />}
                  {loading ? 'Creating...' : 'Create & Open Builder'}
                </button>

                <Link
                  href="/packages"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#78716c',
                    border: '1px solid #e7e5e4',
                    textDecoration: 'none',
                    backgroundColor: '#fff',
                  }}
                >
                  Cancel
                </Link>
              </div>

            </div>
          </div>
        </div>

      </main>
    </>
  )
}
