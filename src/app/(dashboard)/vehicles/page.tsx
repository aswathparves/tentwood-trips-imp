'use client'

import TopNav from '@/components/layout/TopNav'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, X, Save, Car } from 'lucide-react'

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

const VEHICLE_TYPES = [
  'sedan', 'suv', 'tempo_traveller', 'van', 'bus', 'innova', 'luxury_coach',
]

export default function VehiclesPage() {
  const supabase = createClient()
  const [vehicles, setVehicles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)

  const [form, setForm] = useState({
    name: '',
    type: 'suv',
    capacity: 7,
    description: '',
    is_ac: true,
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
      await fetchVehicles()
    }
    load()
  }, [])

  async function fetchVehicles() {
    const { data } = await supabase
      .from('vehicles')
      .select('*')
      .is('archived_at', null)
      .order('type')
    setVehicles(data ?? [])
    setLoading(false)
  }

  function resetForm() {
    setForm({ name: '', type: 'suv', capacity: 7, description: '', is_ac: true })
    setEditingId(null)
    setShowForm(false)
    setError('')
  }

  function startEdit(vehicle: any) {
    setForm({
      name: vehicle.name,
      type: vehicle.type,
      capacity: vehicle.capacity,
      description: vehicle.description ?? '',
      is_ac: vehicle.is_ac,
    })
    setEditingId(vehicle.id)
    setShowForm(true)
  }

  async function handleSave() {
    if (!form.name.trim()) {
      setError('Vehicle name is required.')
      return
    }
    setSaving(true)
    setError('')

    if (editingId) {
      const { error } = await supabase
        .from('vehicles')
        .update({
          name: form.name.trim(),
          type: form.type,
          capacity: form.capacity,
          description: form.description.trim() || null,
          is_ac: form.is_ac,
        })
        .eq('id', editingId)
      if (error) { setError(error.message); setSaving(false); return }
    } else {
      const { error } = await supabase
        .from('vehicles')
        .insert({
          name: form.name.trim(),
          type: form.type,
          capacity: form.capacity,
          description: form.description.trim() || null,
          is_ac: form.is_ac,
        })
      if (error) { setError(error.message); setSaving(false); return }
    }

    await fetchVehicles()
    resetForm()
    setSaving(false)
  }

  async function handleArchive(id: string, name: string) {
    if (!isAdmin) return
    if (!window.confirm(`Archive "${name}"?`)) return
    await supabase
      .from('vehicles')
      .update({ archived_at: new Date().toISOString() })
      .eq('id', id)
    await fetchVehicles()
  }

  return (
    <>
      <TopNav title="Vehicles" />
      <main className="page-container">

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#1c1917' }}>Vehicles</h1>
            <p style={{ color: '#78716c', fontSize: '14px', marginTop: '2px' }}>
              {vehicles.length} vehicles in your library
            </p>
          </div>
          {isAdmin && (
            <button
              onClick={() => { setShowForm(true); setEditingId(null) }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: '#1c1917', color: '#fff', padding: '8px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: 500, border: 'none', cursor: 'pointer' }}
            >
              <Plus size={16} />
              Add Vehicle
            </button>
          )}
        </div>

        {/* Inline form */}
        {showForm && (
          <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e7e5e4', padding: '24px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#1c1917' }}>
                {editingId ? 'Edit Vehicle' : 'New Vehicle'}
              </h2>
              <button onClick={resetForm} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
                <X size={18} color="#78716c" />
              </button>
            </div>

            {error && (
              <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px' }}>
                <p style={{ color: '#dc2626', fontSize: '14px' }}>{error}</p>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={labelStyle}>Vehicle Name <span style={{ color: '#ef4444' }}>*</span></label>
                <input style={inputStyle} type="text" value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Toyota Innova Crysta" />
              </div>
              <div>
                <label style={labelStyle}>Type</label>
                <select style={inputStyle} value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
                  {VEHICLE_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={labelStyle}>Capacity (passengers)</label>
                <input style={inputStyle} type="number" min="1" max="60"
                  value={form.capacity}
                  onChange={(e) => setForm((f) => ({ ...f, capacity: parseInt(e.target.value) }))} />
              </div>
              <div>
                <label style={labelStyle}>Description</label>
                <input style={inputStyle} type="text" value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Premium SUV, extra luggage space" />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <button type="button"
                onClick={() => setForm((f) => ({ ...f, is_ac: !f.is_ac }))}
                style={{ width: '40px', height: '22px', borderRadius: '9999px', backgroundColor: form.is_ac ? '#1c1917' : '#d6d3d1', border: 'none', cursor: 'pointer', position: 'relative', flexShrink: 0 }}>
                <span style={{ position: 'absolute', top: '3px', left: form.is_ac ? '21px' : '3px', width: '16px', height: '16px', backgroundColor: '#fff', borderRadius: '9999px', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
              </button>
              <label style={{ fontSize: '14px', color: '#44403c' }}>Air conditioned</label>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={handleSave} disabled={saving}
                style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', backgroundColor: saving ? '#78716c' : '#1c1917', color: '#fff', padding: '10px', borderRadius: '8px', fontSize: '14px', fontWeight: 500, border: 'none', cursor: saving ? 'not-allowed' : 'pointer' }}>
                <Save size={15} />
                {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Add Vehicle'}
              </button>
              <button onClick={resetForm}
                style={{ padding: '10px 20px', border: '1px solid #d6d3d1', color: '#44403c', borderRadius: '8px', fontSize: '14px', fontWeight: 500, backgroundColor: '#fff', cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Vehicle list */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <p style={{ color: '#a8a29e', fontSize: '14px' }}>Loading...</p>
          </div>
        ) : vehicles.length === 0 ? (
          <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e7e5e4', padding: '48px 24px', textAlign: 'center' }}>
            <Car size={32} style={{ color: '#d6d3d1', margin: '0 auto 12px' }} />
            <p style={{ color: '#78716c', fontSize: '14px' }}>No vehicles yet.</p>
          </div>
        ) : (
          <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e7e5e4', overflow: 'hidden' }}>
            {vehicles.map((vehicle, i) => (
              <div key={vehicle.id}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderTop: i === 0 ? 'none' : '1px solid #f5f5f4' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '36px', height: '36px', backgroundColor: '#f5f5f4', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Car size={16} color="#78716c" />
                  </div>
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: 500, color: '#1c1917' }}>{vehicle.name}</p>
                    <p style={{ fontSize: '12px', color: '#78716c', marginTop: '2px' }}>
                      {vehicle.type.replace('_', ' ')} · {vehicle.capacity} passengers
                      {vehicle.is_ac ? ' · AC' : ' · Non-AC'}
                    </p>
                  </div>
                </div>
                {isAdmin && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => startEdit(vehicle)}
                      style={{ padding: '6px 12px', backgroundColor: '#f5f5f4', border: '1px solid #e7e5e4', borderRadius: '6px', fontSize: '12px', color: '#44403c', cursor: 'pointer' }}>
                      Edit
                    </button>
                    <button onClick={() => handleArchive(vehicle.id, vehicle.name)}
                      style={{ padding: '6px 12px', backgroundColor: '#fff', border: '1px solid #fca5a5', borderRadius: '6px', fontSize: '12px', color: '#dc2626', cursor: 'pointer' }}>
                      Archive
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