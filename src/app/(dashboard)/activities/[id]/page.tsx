'use client'

import TopNav from '@/components/layout/TopNav'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Save, Trash2 } from 'lucide-react'
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
  'sightseeing', 'adventure', 'cultural', 'leisure',
  'dining', 'transfer', 'nature', 'shopping', 'wellness',
]

export default function ActivityDetailPage() {
  const supabase = createClient()
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [notFound, setNotFound] = useState(false)
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
  })

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()
        if (profile?.role === 'admin') setIsAdmin(true)
      }

      const { data: dests } = await supabase
        .from('destinations')
        .select('id, name, country')
        .is('archived_at', null)
        .order('name')
      setDestinations(dests ?? [])

      const { data, error } = await supabase
        .from('activities')
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
        destination_id: data.destination_id ?? '',
        category: data.category ?? 'sightseeing',
        description: data.description ?? '',
        duration_hours: data.duration_hours?.toString() ?? '',
        typical_cost: data.typical_cost?.toString() ?? '',
        has_entry_fee: data.has_entry_fee ?? false,
        requires_guide: data.requires_guide ?? false,
      })
      setLoading(false)
    }
    load()
  }, [id])

  async function handleSave() {
    if (!form.name.trim() || !form.destination_id) {
      setError('Activity name and destination are required.')
      return
    }
    setSaving(true)
    setError('')
    setSuccess('')

    const { error } = await supabase
      .from('activities')
      .update({
        name: form.name.trim(),
        destination_id: form.destination_id,
        category: form.category,
        description: form.description.trim() || null,
        duration_hours: form.duration_hours ? parseFloat(form.duration_hours) : null,
        typical_cost: form.typical_cost ? parseFloat(form.typical_cost) : null,
        has_entry_fee: form.has_entry_fee,
        requires_guide: form.requires_guide,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) {
      setError(error.message)
    } else {
      setSuccess('Activity saved successfully.')
      setTimeout(() => setSuccess(''), 3000)
    }
    setSaving(false)
  }

  async function handleArchive() {
    if (!isAdmin) return
    const confirmed = window.confirm(
      `Archive "${form.name}"? It will no longer appear in activity lists.`
    )
    if (!confirmed) return

    await supabase
      .from('activities')
      .update({ archived_at: new Date().toISOString() })
      .eq('id', id)

    router.push('/activities')
    router.refresh()
  }

  if (loading) {
    return (
      <>
        <TopNav title="Activity" />
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
        <TopNav title="Activity" />
        <main className="page-container-sm">
          <div style={{ padding: '48px 0', textAlign: 'center' }}>
            <p style={{ color: '#a8a29e', fontSize: '14px' }}>
              Activity not found or archived.
            </p>
            <Link href="/activities" style={{ color: '#1c1917', fontSize: '14px' }}>
              Back to Activities
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
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '24px',
            }}
          >
            <h1 style={{ fontSize: '18px', fontWeight: 600, color: '#1c1917' }}>
              Edit Activity
            </h1>
            {isAdmin && (
              <button
                onClick={handleArchive}
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
                  cursor: 'pointer',
                }}
              >
                <Trash2 size={14} />
                Archive
              </button>
            )}
          </div>

          {error && (
            <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px' }}>
              <p style={{ color: '#dc2626', fontSize: '14px' }}>{error}</p>
            </div>
          )}
          {success && (
            <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px' }}>
              <p style={{ color: '#16a34a', fontSize: '14px' }}>{success}</p>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={labelStyle}>Activity Name <span style={{ color: '#ef4444' }}>*</span></label>
              <input style={inputStyle} type="text" value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>Destination <span style={{ color: '#ef4444' }}>*</span></label>
              <select style={inputStyle} value={form.destination_id}
                onChange={(e) => setForm((f) => ({ ...f, destination_id: e.target.value }))}>
                <option value="">Select destination...</option>
                {destinations.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}, {d.country}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={labelStyle}>Category</label>
              <select style={inputStyle} value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Duration (hours)</label>
              <input style={inputStyle} type="number" step="0.5" min="0"
                value={form.duration_hours}
                onChange={(e) => setForm((f) => ({ ...f, duration_hours: e.target.value }))}
                placeholder="2.5" />
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Description</label>
            <textarea style={{ ...inputStyle, resize: 'none' }} value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={3} />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>
              Typical Cost (₹){' '}
              <span style={{ color: '#a8a29e', fontWeight: 400 }}>(reference only)</span>
            </label>
            <input style={inputStyle} type="number" value={form.typical_cost}
              onChange={(e) => setForm((f) => ({ ...f, typical_cost: e.target.value }))} />
          </div>

          <div style={{ borderTop: '1px solid #f5f5f4', paddingTop: '20px', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <p style={{ fontSize: '12px', fontWeight: 600, color: '#a8a29e', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Flags</p>
            {[
              { key: 'has_entry_fee', label: 'Has entry fee', sublabel: 'Tickets or entrance charges apply' },
              { key: 'requires_guide', label: 'Requires guide', sublabel: 'A local guide is needed' },
            ].map((flag) => (
              <div key={flag.key}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', backgroundColor: '#fafaf9', borderRadius: '8px', border: '1px solid #e7e5e4' }}>
                <div>
                  <p style={{ fontSize: '14px', color: '#1c1917', fontWeight: 500 }}>{flag.label}</p>
                  <p style={{ fontSize: '12px', color: '#78716c', marginTop: '2px' }}>{flag.sublabel}</p>
                </div>
                <button type="button"
                  onClick={() => setForm((f) => ({ ...f, [flag.key]: !f[flag.key as keyof typeof f] }))}
                  style={{ width: '40px', height: '22px', borderRadius: '9999px', backgroundColor: form[flag.key as keyof typeof form] ? '#1c1917' : '#d6d3d1', border: 'none', cursor: 'pointer', position: 'relative', flexShrink: 0 }}>
                  <span style={{ position: 'absolute', top: '3px', left: form[flag.key as keyof typeof form] ? '21px' : '3px', width: '16px', height: '16px', backgroundColor: '#fff', borderRadius: '9999px', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                </button>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={handleSave} disabled={saving}
              style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', backgroundColor: saving ? '#78716c' : '#1c1917', color: '#fff', padding: '10px', borderRadius: '8px', fontSize: '14px', fontWeight: 500, border: 'none', cursor: saving ? 'not-allowed' : 'pointer' }}>
              <Save size={15} />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <Link href="/activities"
              style={{ padding: '10px 20px', border: '1px solid #d6d3d1', color: '#44403c', borderRadius: '8px', fontSize: '14px', fontWeight: 500, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
              Cancel
            </Link>
          </div>
        </div>
      </main>
    </>
  )
}