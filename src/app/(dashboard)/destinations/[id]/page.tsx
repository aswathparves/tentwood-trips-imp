'use client'

import TopNav from '@/components/layout/TopNav'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Plus, X, Trash2, Save } from 'lucide-react'
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

export default function DestinationDetailPage() {
  const supabase = createClient()
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [archiving, setArchiving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [notFound, setNotFound] = useState(false)

  const [form, setForm] = useState({
    name: '',
    country: '',
    state: '',
    region: '',
    description: '',
    best_time: '',
    is_international: false,
    tags: [] as string[],
    highlights: [] as string[],
  })

  const [tagInput, setTagInput] = useState('')
  const [highlightInput, setHighlightInput] = useState('')

  useEffect(() => {
    async function load() {
      // Get current user role
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()
        if (profile?.role === 'admin') setIsAdmin(true)
      }

      // Load destination
      const { data, error } = await supabase
        .from('destinations')
        .select('*')
        .eq('id', id)
        .is('archived_at', null)
        .single()

      if (error || !data) {
        setNotFound(true)
        setLoading(false)
        return
      }

      setForm({
        name: data.name ?? '',
        country: data.country ?? '',
        state: data.state ?? '',
        region: data.region ?? '',
        description: data.description ?? '',
        best_time: data.best_time ?? '',
        is_international: data.is_international ?? false,
        tags: data.tags ?? [],
        highlights: data.highlights ?? [],
      })
      setLoading(false)
    }
    load()
  }, [id])

  function addTag() {
    const val = tagInput.trim()
    if (val && !form.tags.includes(val)) {
      setForm((f) => ({ ...f, tags: [...f.tags, val] }))
    }
    setTagInput('')
  }

  function removeTag(tag: string) {
    setForm((f) => ({ ...f, tags: f.tags.filter((t) => t !== tag) }))
  }

  function addHighlight() {
    const val = highlightInput.trim()
    if (val) {
      setForm((f) => ({ ...f, highlights: [...f.highlights, val] }))
    }
    setHighlightInput('')
  }

  function removeHighlight(index: number) {
    setForm((f) => ({
      ...f,
      highlights: f.highlights.filter((_, i) => i !== index),
    }))
  }

  async function handleSave() {
    if (!form.name.trim() || !form.country.trim()) {
      setError('Destination name and country are required.')
      return
    }
    setSaving(true)
    setError('')
    setSuccess('')

    const { error } = await supabase
      .from('destinations')
      .update({
        name: form.name.trim(),
        country: form.country.trim(),
        state: form.state.trim() || null,
        region: form.region.trim() || null,
        description: form.description.trim() || null,
        best_time: form.best_time.trim() || null,
        is_international: form.is_international,
        tags: form.tags,
        highlights: form.highlights,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) {
      setError(error.message)
    } else {
      setSuccess('Destination saved successfully.')
      setTimeout(() => setSuccess(''), 3000)
    }
    setSaving(false)
  }

  async function handleArchive() {
    if (!isAdmin) return
    const confirmed = window.confirm(
      `Archive "${form.name}"? It will no longer appear in destination lists but all packages referencing it will be unaffected.`
    )
    if (!confirmed) return

    setArchiving(true)
    const { error } = await supabase
      .from('destinations')
      .update({ archived_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      setError(error.message)
      setArchiving(false)
    } else {
      router.push('/destinations')
      router.refresh()
    }
  }

  if (loading) {
    return (
      <>
        <TopNav title="Destination" />
        <main className="page-container-sm">
          <div style={{ padding: '48px 0', textAlign: 'center' }}>
            <p style={{ color: '#a8a29e', fontSize: '14px' }}>Loading...</p>
          </div>
        </main>
      </>
    )
  }

  if (notFound) {
    return (
      <>
        <TopNav title="Destination" />
        <main className="page-container-sm">
          <div style={{ padding: '48px 0', textAlign: 'center' }}>
            <p style={{ color: '#a8a29e', fontSize: '14px' }}>
              Destination not found or has been archived.
            </p>
            <Link
              href="/destinations"
              style={{
                display: 'inline-block',
                marginTop: '16px',
                color: '#1c1917',
                fontSize: '14px',
              }}
            >
              Back to Destinations
            </Link>
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <TopNav title={form.name} />
      <main className="page-container-sm">

        {/* Back */}
        <Link
          href="/destinations"
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
          Back to Destinations
        </Link>

        <div
          style={{
            backgroundColor: '#fff',
            borderRadius: '12px',
            border: '1px solid #e7e5e4',
            padding: '24px',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '24px',
            }}
          >
            <h1
              style={{
                fontSize: '18px',
                fontWeight: 600,
                color: '#1c1917',
              }}
            >
              Edit Destination
            </h1>

            {/* Archive — admin only */}
            {isAdmin && (
              <button
                onClick={handleArchive}
                disabled={archiving}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  backgroundColor: '#fff',
                  border: '1px solid #fca5a5',
                  borderRadius: '8px',
                  color: '#dc2626',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: archiving ? 'not-allowed' : 'pointer',
                  opacity: archiving ? 0.6 : 1,
                }}
              >
                <Trash2 size={14} />
                {archiving ? 'Archiving...' : 'Archive'}
              </button>
            )}
          </div>

          {/* Alerts */}
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

          {success && (
            <div
              style={{
                backgroundColor: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '8px',
                padding: '10px 14px',
                marginBottom: '16px',
              }}
            >
              <p style={{ color: '#16a34a', fontSize: '14px' }}>{success}</p>
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
                Destination Name <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                style={inputStyle}
                type="text"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
              />
            </div>
            <div>
              <label style={labelStyle}>
                Country <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                style={inputStyle}
                type="text"
                value={form.country}
                onChange={(e) =>
                  setForm((f) => ({ ...f, country: e.target.value }))
                }
              />
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
              <label style={labelStyle}>State / Province</label>
              <input
                style={inputStyle}
                type="text"
                value={form.state}
                onChange={(e) =>
                  setForm((f) => ({ ...f, state: e.target.value }))
                }
              />
            </div>
            <div>
              <label style={labelStyle}>Region</label>
              <input
                style={inputStyle}
                type="text"
                value={form.region}
                onChange={(e) =>
                  setForm((f) => ({ ...f, region: e.target.value }))
                }
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
              rows={3}
            />
          </div>

          {/* Best Time */}
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Best Time to Visit</label>
            <input
              style={inputStyle}
              type="text"
              value={form.best_time}
              onChange={(e) =>
                setForm((f) => ({ ...f, best_time: e.target.value }))
              }
              placeholder="October to June"
            />
          </div>

          {/* Tags */}
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>
              Tags{' '}
              <span style={{ color: '#a8a29e', fontWeight: 400 }}>
                (press Enter or + to add)
              </span>
            </label>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <input
                style={{ ...inputStyle, flex: 1 }}
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addTag()
                  }
                }}
                placeholder="Beach, Mountains, Family..."
              />
              <button
                type="button"
                onClick={addTag}
                style={{
                  padding: '8px 12px',
                  backgroundColor: '#f5f5f4',
                  border: '1px solid #e7e5e4',
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
              >
                <Plus size={16} color="#57534e" />
              </button>
            </div>
            {form.tags.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {form.tags.map((tag) => (
                  <span
                    key={tag}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '12px',
                      backgroundColor: '#f5f5f4',
                      color: '#44403c',
                      padding: '4px 10px',
                      borderRadius: '9999px',
                    }}
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                        display: 'flex',
                      }}
                    >
                      <X size={12} color="#78716c" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Highlights */}
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>
              Highlights{' '}
              <span style={{ color: '#a8a29e', fontWeight: 400 }}>
                (destination-level facts, not day-wise timings)
              </span>
            </label>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <input
                style={{ ...inputStyle, flex: 1 }}
                type="text"
                value={highlightInput}
                onChange={(e) => setHighlightInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addHighlight()
                  }
                }}
                placeholder="World's longest sea-crossing cable car..."
              />
              <button
                type="button"
                onClick={addHighlight}
                style={{
                  padding: '8px 12px',
                  backgroundColor: '#f5f5f4',
                  border: '1px solid #e7e5e4',
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
              >
                <Plus size={16} color="#57534e" />
              </button>
            </div>
            {form.highlights.length > 0 && (
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {form.highlights.map((h, i) => (
                  <li
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '14px',
                      color: '#44403c',
                      backgroundColor: '#fafaf9',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      marginBottom: '4px',
                    }}
                  >
                    <span>• {h}</span>
                    <button
                      type="button"
                      onClick={() => removeHighlight(i)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                      }}
                    >
                      <X size={14} color="#a8a29e" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* International toggle */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '24px',
            }}
          >
            <button
              type="button"
              onClick={() =>
                setForm((f) => ({
                  ...f,
                  is_international: !f.is_international,
                }))
              }
              style={{
                width: '40px',
                height: '22px',
                borderRadius: '9999px',
                backgroundColor: form.is_international
                  ? '#1c1917'
                  : '#d6d3d1',
                border: 'none',
                cursor: 'pointer',
                position: 'relative',
                transition: 'background-color 0.2s',
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  top: '3px',
                  left: form.is_international ? '21px' : '3px',
                  width: '16px',
                  height: '16px',
                  backgroundColor: '#fff',
                  borderRadius: '9999px',
                  transition: 'left 0.2s',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                }}
              />
            </button>
            <label style={{ fontSize: '14px', color: '#44403c' }}>
              International destination
            </label>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                flex: 1,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                backgroundColor: saving ? '#78716c' : '#1c1917',
                color: '#fff',
                padding: '10px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 500,
                border: 'none',
                cursor: saving ? 'not-allowed' : 'pointer',
              }}
            >
              <Save size={15} />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <Link
              href="/destinations"
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