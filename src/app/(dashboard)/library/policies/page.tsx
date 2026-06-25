'use client'

import TopNav from '@/components/layout/TopNav'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Plus, X, Save, ScrollText, Edit2 } from 'lucide-react'

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

export default function PoliciesPage() {
  const supabase = createClient()
  const [policies, setPolicies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'terms_and_conditions' | 'cancellation_policy'>('terms_and_conditions')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: '',
    type: 'terms_and_conditions' as 'terms_and_conditions' | 'cancellation_policy',
    content: '',
    is_default: false,
  })

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles').select('role').eq('id', user.id).single()
        if (profile?.role === 'admin') setIsAdmin(true)
      }
      await fetchPolicies()
    }
    load()
  }, [])

  async function fetchPolicies() {
    const { data } = await supabase
      .from('policies')
      .select('*')
      .is('archived_at', null)
      .order('is_default', { ascending: false })
      .order('name')
    setPolicies(data ?? [])
    setLoading(false)
  }

  function resetForm() {
    setForm({ name: '', type: activeTab, content: '', is_default: false })
    setEditingId(null)
    setShowForm(false)
    setError('')
  }

  function startEdit(policy: any) {
    setForm({
      name: policy.name,
      type: policy.type,
      content: policy.content,
      is_default: policy.is_default,
    })
    setEditingId(policy.id)
    setShowForm(true)
    setExpandedId(null)
  }

  async function handleSave() {
    if (!form.name.trim() || !form.content.trim()) {
      setError('Name and content are required.')
      return
    }
    setSaving(true)
    setError('')

    if (editingId) {
      const { error } = await supabase
        .from('policies')
        .update({
          name: form.name.trim(),
          type: form.type,
          content: form.content.trim(),
          is_default: form.is_default,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingId)
      if (error) { setError(error.message); setSaving(false); return }
    } else {
      const { data: { user } } = await supabase.auth.getUser()
      const { error } = await supabase
        .from('policies')
        .insert({
          name: form.name.trim(),
          type: form.type,
          content: form.content.trim(),
          is_default: form.is_default,
          created_by: user?.id,
        })
      if (error) { setError(error.message); setSaving(false); return }
    }

    await fetchPolicies()
    resetForm()
    setSaving(false)
  }

  async function handleArchive(id: string, name: string) {
    if (!isAdmin) return
    if (!window.confirm(`Archive policy "${name}"?`)) return
    await supabase
      .from('policies')
      .update({ archived_at: new Date().toISOString() })
      .eq('id', id)
    await fetchPolicies()
  }

  const filtered = policies.filter((p) => p.type === activeTab)

  return (
    <>
      <TopNav title="Policies Library" />
      <main className="page-container">

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#1c1917' }}>Policies Library</h1>
            <p style={{ color: '#78716c', fontSize: '14px', marginTop: '2px' }}>
              Terms & conditions and cancellation policies for packages
            </p>
          </div>
          {isAdmin && (
            <button
              onClick={() => { setForm({ name: '', type: activeTab, content: '', is_default: false }); setShowForm(true); setEditingId(null) }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: '#1c1917', color: '#fff', padding: '8px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: 500, border: 'none', cursor: 'pointer' }}>
              <Plus size={16} />
              Add Policy
            </button>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', backgroundColor: '#f5f5f4', padding: '4px', borderRadius: '10px', width: 'fit-content' }}>
          {([
            { key: 'terms_and_conditions', label: 'Terms & Conditions' },
            { key: 'cancellation_policy', label: 'Cancellation Policy' },
          ] as const).map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              style={{ padding: '6px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 500, backgroundColor: activeTab === tab.key ? '#fff' : 'transparent', color: activeTab === tab.key ? '#1c1917' : '#78716c', boxShadow: activeTab === tab.key ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Inline form */}
        {showForm && (
          <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e7e5e4', padding: '24px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#1c1917' }}>
                {editingId ? 'Edit Policy' : 'New Policy'}
              </h2>
              <button onClick={resetForm} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
                <X size={18} color="#78716c" />
              </button>
            </div>

            {error && (
              <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 14px', marginBottom: '12px' }}>
                <p style={{ color: '#dc2626', fontSize: '14px' }}>{error}</p>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={labelStyle}>Policy Name <span style={{ color: '#ef4444' }}>*</span></label>
                <input style={inputStyle} type="text" value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Standard Terms & Conditions" />
              </div>
              <div>
                <label style={labelStyle}>Type</label>
                <select style={inputStyle} value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as any }))}>
                  <option value="terms_and_conditions">Terms & Conditions</option>
                  <option value="cancellation_policy">Cancellation Policy</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>
                Content <span style={{ color: '#ef4444' }}>*</span>
                <span style={{ color: '#a8a29e', fontWeight: 400, marginLeft: '6px' }}>
                  (plain text, use line breaks for sections)
                </span>
              </label>
              <textarea
                style={{ ...inputStyle, resize: 'vertical', minHeight: '200px', fontFamily: 'system-ui', lineHeight: '1.6' }}
                value={form.content}
                onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                placeholder={`1. BOOKING CONFIRMATION\nBooking is confirmed only upon receipt of advance payment.\n\n2. PAYMENT\nFull payment must be cleared 7 days prior to departure.`}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <button type="button"
                onClick={() => setForm((f) => ({ ...f, is_default: !f.is_default }))}
                style={{ width: '40px', height: '22px', borderRadius: '9999px', backgroundColor: form.is_default ? '#1c1917' : '#d6d3d1', border: 'none', cursor: 'pointer', position: 'relative', flexShrink: 0 }}>
                <span style={{ position: 'absolute', top: '3px', left: form.is_default ? '21px' : '3px', width: '16px', height: '16px', backgroundColor: '#fff', borderRadius: '9999px', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
              </button>
              <label style={{ fontSize: '14px', color: '#44403c' }}>
                Set as default for new packages
              </label>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={handleSave} disabled={saving}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: saving ? '#78716c' : '#1c1917', color: '#fff', padding: '8px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: 500, border: 'none', cursor: saving ? 'not-allowed' : 'pointer' }}>
                <Save size={14} />
                {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Add Policy'}
              </button>
              <button onClick={resetForm}
                style={{ padding: '8px 16px', border: '1px solid #d6d3d1', color: '#44403c', borderRadius: '8px', fontSize: '14px', backgroundColor: '#fff', cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Policy list */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <p style={{ color: '#a8a29e', fontSize: '14px' }}>Loading...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e7e5e4', padding: '48px 24px', textAlign: 'center' }}>
            <ScrollText size={32} style={{ color: '#d6d3d1', margin: '0 auto 12px' }} />
            <p style={{ color: '#78716c', fontSize: '14px' }}>No policies yet.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filtered.map((policy) => (
              <div key={policy.id}
                style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e7e5e4', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button
                      onClick={() => setExpandedId(expandedId === policy.id ? null : policy.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}>
                      <p style={{ fontSize: '14px', fontWeight: 600, color: '#1c1917' }}>{policy.name}</p>
                      <p style={{ fontSize: '12px', color: '#78716c', marginTop: '2px' }}>
                        {expandedId === policy.id ? 'Click to collapse' : 'Click to preview'}
                      </p>
                    </button>
                    {policy.is_default && (
                      <span style={{ fontSize: '11px', backgroundColor: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', padding: '2px 8px', borderRadius: '9999px', fontWeight: 500 }}>
                        Default
                      </span>
                    )}
                  </div>
                  {isAdmin && (
                    <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                      <button onClick={() => startEdit(policy)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px 12px', backgroundColor: '#f5f5f4', border: '1px solid #e7e5e4', borderRadius: '6px', fontSize: '12px', color: '#44403c', cursor: 'pointer' }}>
                        <Edit2 size={12} />
                        Edit
                      </button>
                      <button onClick={() => handleArchive(policy.id, policy.name)}
                        style={{ padding: '6px 12px', backgroundColor: '#fff', border: '1px solid #fca5a5', borderRadius: '6px', fontSize: '12px', color: '#dc2626', cursor: 'pointer' }}>
                        Archive
                      </button>
                    </div>
                  )}
                </div>
                {expandedId === policy.id && (
                  <div style={{ padding: '16px 20px', borderTop: '1px solid #f5f5f4', backgroundColor: '#fafaf9' }}>
                    <pre style={{ fontSize: '13px', color: '#44403c', whiteSpace: 'pre-wrap', fontFamily: 'system-ui', lineHeight: '1.7', margin: 0 }}>
                      {policy.content}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  )
}