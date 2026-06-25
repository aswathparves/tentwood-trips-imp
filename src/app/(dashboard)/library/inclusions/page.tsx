'use client'

import TopNav from '@/components/layout/TopNav'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, X, Save, CheckSquare } from 'lucide-react'

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

export default function InclusionsPage() {
  const supabase = createClient()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'inclusion' | 'exclusion'>('inclusion')

  const [form, setForm] = useState({
    text: '',
    type: 'inclusion' as 'inclusion' | 'exclusion',
  })

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles').select('role').eq('id', user.id).single()
        if (profile?.role === 'admin') setIsAdmin(true)
      }
      await fetchItems()
    }
    load()
  }, [])

  async function fetchItems() {
    const { data } = await supabase
      .from('library_items')
      .select('*')
      .is('archived_at', null)
      .order('type')
      .order('sort_order')
    setItems(data ?? [])
    setLoading(false)
  }

  function resetForm() {
    setForm({ text: '', type: activeTab })
    setEditingId(null)
    setShowForm(false)
    setError('')
  }

  function startEdit(item: any) {
    setForm({ text: item.text, type: item.type })
    setEditingId(item.id)
    setShowForm(true)
  }

  async function handleSave() {
    if (!form.text.trim()) {
      setError('Text is required.')
      return
    }
    setSaving(true)
    setError('')

    if (editingId) {
      const { error } = await supabase
        .from('library_items')
        .update({ text: form.text.trim(), type: form.type })
        .eq('id', editingId)
      if (error) { setError(error.message); setSaving(false); return }
    } else {
      const { error } = await supabase
        .from('library_items')
        .insert({ text: form.text.trim(), type: form.type })
      if (error) { setError(error.message); setSaving(false); return }
    }

    await fetchItems()
    resetForm()
    setSaving(false)
  }

  async function handleArchive(id: string) {
    if (!isAdmin) return
    if (!window.confirm('Remove this item from the library?')) return
    await supabase
      .from('library_items')
      .update({ archived_at: new Date().toISOString() })
      .eq('id', id)
    await fetchItems()
  }

  const filtered = items.filter((i) => i.type === activeTab)

  return (
    <>
      <TopNav title="Inclusions & Exclusions Library" />
      <main className="page-container">

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#1c1917' }}>
              Inclusions & Exclusions Library
            </h1>
            <p style={{ color: '#78716c', fontSize: '14px', marginTop: '2px' }}>
              Reusable items your staff selects when building packages
            </p>
          </div>
          {isAdmin && (
            <button
              onClick={() => { setForm({ text: '', type: activeTab }); setShowForm(true); setEditingId(null) }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: '#1c1917', color: '#fff', padding: '8px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: 500, border: 'none', cursor: 'pointer' }}
            >
              <Plus size={16} />
              Add Item
            </button>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', backgroundColor: '#f5f5f4', padding: '4px', borderRadius: '10px', width: 'fit-content' }}>
          {(['inclusion', 'exclusion'] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              style={{ padding: '6px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 500, backgroundColor: activeTab === tab ? '#fff' : 'transparent', color: activeTab === tab ? '#1c1917' : '#78716c', boxShadow: activeTab === tab ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
              {tab === 'inclusion' ? '✓ Inclusions' : '✗ Exclusions'}
            </button>
          ))}
        </div>

        {/* Inline form */}
        {showForm && (
          <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e7e5e4', padding: '20px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#1c1917' }}>
                {editingId ? 'Edit Item' : 'New Item'}
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={labelStyle}>Item Text</label>
                <input style={inputStyle} type="text" value={form.text}
                  onChange={(e) => setForm((f) => ({ ...f, text: e.target.value }))}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSave() } }}
                  placeholder={activeTab === 'inclusion' ? 'All transfers by AC vehicle' : 'Airfare not included'} />
              </div>
              <div>
                <label style={labelStyle}>Type</label>
                <select style={{ ...inputStyle, width: '140px' }} value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as any }))}>
                  <option value="inclusion">Inclusion</option>
                  <option value="exclusion">Exclusion</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={handleSave} disabled={saving}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: saving ? '#78716c' : '#1c1917', color: '#fff', padding: '8px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: 500, border: 'none', cursor: saving ? 'not-allowed' : 'pointer' }}>
                <Save size={14} />
                {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Add Item'}
              </button>
              <button onClick={resetForm}
                style={{ padding: '8px 16px', border: '1px solid #d6d3d1', color: '#44403c', borderRadius: '8px', fontSize: '14px', backgroundColor: '#fff', cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <p style={{ color: '#a8a29e', fontSize: '14px' }}>Loading...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e7e5e4', padding: '48px 24px', textAlign: 'center' }}>
            <CheckSquare size={32} style={{ color: '#d6d3d1', margin: '0 auto 12px' }} />
            <p style={{ color: '#78716c', fontSize: '14px' }}>
              No {activeTab}s in library yet.
            </p>
          </div>
        ) : (
          <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e7e5e4', overflow: 'hidden' }}>
            {filtered.map((item, i) => (
              <div key={item.id}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderTop: i === 0 ? 'none' : '1px solid #f5f5f4' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '14px', color: activeTab === 'inclusion' ? '#16a34a' : '#dc2626', fontWeight: 600 }}>
                    {activeTab === 'inclusion' ? '✓' : '✗'}
                  </span>
                  <p style={{ fontSize: '14px', color: '#1c1917' }}>{item.text}</p>
                </div>
                {isAdmin && (
                  <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                    <button onClick={() => startEdit(item)}
                      style={{ padding: '4px 10px', backgroundColor: '#f5f5f4', border: '1px solid #e7e5e4', borderRadius: '6px', fontSize: '12px', color: '#44403c', cursor: 'pointer' }}>
                      Edit
                    </button>
                    <button onClick={() => handleArchive(item.id)}
                      style={{ padding: '4px 10px', backgroundColor: '#fff', border: '1px solid #fca5a5', borderRadius: '6px', fontSize: '12px', color: '#dc2626', cursor: 'pointer' }}>
                      Remove
                    </button>
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