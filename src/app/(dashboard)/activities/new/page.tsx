'use client'

import TopNav from '@/components/layout/TopNav'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

const inputStyle = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: '8px',
  border: '1px solid #d6d3d1',
  fontSize: '14px',
  color: '#1c1917',
  outline: 'none',
  backgroundColor: '#fff',
}

const labelStyle = {
  display: 'block' as const,
  fontSize: '14px',
  fontWeight: 500,
  color: '#44403c',
  marginBottom: '6px',
}

const CATEGORIES = [
  'sightseeing',
  'adventure',
  'cultural',
  'leisure',
  'dining',
  'transfer',
  'nature',
  'shopping',
  'wellness',
]

export default function NewActivityPage() {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [destinations, setDestinations] = useState<any[]>([])

  const [form, setForm] = useState({
    name: '',
    destination_id: '',
    category: 'sightseeing',
    description: '',
    duration_hours: '',
    typical_cost: '',
    has_entry_fee: false,
    requires_guide: false,
    tags: [] as string[],
  })

  useEffect(() => {
    async function loadDestinations() {
      const { data } = await supabase
        .from('destinations')
        .select('id, name, country')
        .is('archived_at', null)
        .order('name')
      setDestinations(data ?? [])
    }
    loadDestinations()
  }, [])

  async function handleSubmit() {
    if (!form.name.trim()) {
      setError('Activity name is required.')
      return
    }
    if (!form.destination_id) {
      setError('Please select a destination.')
      return
    }

    setLoading(true)
    setError('')

    const { error } = await supabase.from('activities').insert({
      name: form.name.trim(),
      destination_id: form.destination_id,
      category: form.category,
      description: form.description.trim() || null,
      duration_hours: form.duration_hours ? parseFloat(form.duration_hours) : null,
      typical_cost: form.typical_cost ? parseFloat(form.typical_cost) : null,
      has_entry_fee: form.has_entry_fee,
      requires_guide: form.requires_guide,
      tags: form.tags,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/activities')
    router.refresh()
  }

  return (
    <>
      <TopNav title="Add Activity" />
      <main className="page-container-sm">

        <Link
          href="/activities"
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
          Back to Activities
        </Link>

        <div
          style={{
            backgroundColor: '#fff',
            borderRadius: '12px',
            border: '1px solid #e7e5e4',
            padding: '24px',
          }}
        >
          <h1
            style={{
              fontSize: '18px',
              fontWeight: 600,
              color: '#1c1917',
              marginBottom: '24px',
            }}
          >
            New Activity
          </h1>

          {error && (
            <div
              style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                padding: '10px 14px',
                marginBottom: '16px',
              }}
            >
              <p style={{ color: '#dc2626', fontSize: '14px' }}>{error}</p>
            </div>
          )}

          {/* Row 1 */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
              marginBottom: '16px',
            }}
          >
            <div>
              <label style={labelStyle}>
                Activity Name <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                style={inputStyle}
                type="text"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="4 Islands Speedboat Tour"
              />
            </div>
            <div>
              <label style={labelStyle}>
                Destination <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select
                style={inputStyle}
                value={form.destination_id}
                onChange={(e) =>
                  setForm((f) => ({ ...f, destination_id: e.target.value }))
                }
              >
                <option value="">Select destination...</option>
                {destinations.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}, {d.country}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2 */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
              marginBottom: '16px',
            }}
          >
            <div>
              <label style={labelStyle}>Category</label>
              <select
                style={inputStyle}
                value={form.category}
                onChange={(e) =>
                  setForm((f) => ({ ...f, category: e.target.value }))
                }
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c.charAt(0).toUpperCase() + c.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Duration (hours)</label>
              <input
                style={inputStyle}
                type="number"
                step="0.5"
                min="0"
                value={form.duration_hours}
                onChange={(e) =>
                  setForm((f) => ({ ...f, duration_hours: e.target.value }))
                }
                placeholder="2.5"
              />
            </div>
          </div>

          {/* Description */}
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Description</label>
            <textarea
              style={{ ...inputStyle, resize: 'none' }}
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              placeholder="Describe what happens during this activity..."
              rows={3}
            />
          </div>

          {/* Typical Cost */}
          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>
              Typical Cost (₹){' '}
              <span style={{ color: '#a8a29e', fontWeight: 400 }}>
                (reference only, not used in package pricing)
              </span>
            </label>
            <input
              style={inputStyle}
              type="number"
              value={form.typical_cost}
              onChange={(e) =>
                setForm((f) => ({ ...f, typical_cost: e.target.value }))
              }
              placeholder="1500"
            />
          </div>

          {/* Flags */}
          <div
            style={{
              borderTop: '1px solid #f5f5f4',
              paddingTop: '20px',
              marginBottom: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            <p
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: '#a8a29e',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Flags
            </p>

            {[
              {
                key: 'has_entry_fee',
                label: 'Has entry fee',
                sublabel: 'Tickets or entrance charges apply',
              },
              {
                key: 'requires_guide',
                label: 'Requires guide',
                sublabel: 'A local guide is needed for this activity',
              },
            ].map((flag) => (
              <div
                key={flag.key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  backgroundColor: '#fafaf9',
                  borderRadius: '8px',
                  border: '1px solid #e7e5e4',
                }}
              >
                <div>
                  <p style={{ fontSize: '14px', color: '#1c1917', fontWeight: 500 }}>
                    {flag.label}
                  </p>
                  <p style={{ fontSize: '12px', color: '#78716c', marginTop: '2px' }}>
                    {flag.sublabel}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      [flag.key]: !f[flag.key as keyof typeof f],
                    }))
                  }
                  style={{
                    width: '40px',
                    height: '22px',
                    borderRadius: '9999px',
                    backgroundColor:
                      form[flag.key as keyof typeof form] ? '#1c1917' : '#d6d3d1',
                    border: 'none',
                    cursor: 'pointer',
                    position: 'relative',
                    flexShrink: 0,
                  }}
                >
                  <span
                    style={{
                      position: 'absolute',
                      top: '3px',
                      left: form[flag.key as keyof typeof form] ? '21px' : '3px',
                      width: '16px',
                      height: '16px',
                      backgroundColor: '#fff',
                      borderRadius: '9999px',
                      transition: 'left 0.2s',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                    }}
                  />
                </button>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{
                flex: 1,
                backgroundColor: loading ? '#78716c' : '#1c1917',
                color: '#fff',
                padding: '10px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 500,
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Saving...' : 'Save Activity'}
            </button>
            <Link
              href="/activities"
              style={{
                padding: '10px 20px',
                border: '1px solid #d6d3d1',
                color: '#44403c',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 500,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
              }}
            >
              Cancel
            </Link>
          </div>
        </div>
      </main>
    </>
  )
}