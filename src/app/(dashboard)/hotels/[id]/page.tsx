'use client'

import TopNav from '@/components/layout/TopNav'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Plus, X, Save, Trash2 } from 'lucide-react'
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

const AMENITIES = [
  'WiFi', 'Pool', 'Spa', 'Gym', 'Restaurant', 'Bar',
  'Room Service', 'Parking', 'Airport Shuttle', 'Beach Access',
  'Kids Club', 'Business Center', 'Laundry', 'Concierge', 'AC',
]

const MEAL_PLAN_OPTIONS = [
  { code: 'EP', name: 'European Plan', description: 'No meals included' },
  { code: 'CP', name: 'Continental Plan', description: 'Breakfast included' },
  { code: 'MAP', name: 'Modified American Plan', description: 'Breakfast and dinner included' },
  { code: 'AP', name: 'American Plan', description: 'All meals included' },
]

export default function HotelDetailPage() {
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
  const [amenityInput, setAmenityInput] = useState('')

  const [form, setForm] = useState({
    name: '',
    destination_id: '',
    star_rating: '3',
    address: '',
    description: '',
    check_in_time: '14:00',
    check_out_time: '11:00',
    website: '',
    contact_phone: '',
    contact_email: '',
    amenities: [] as string[],
  })

  const [roomTypes, setRoomTypes] = useState<any[]>([])
  const [mealPlans, setMealPlans] = useState<any[]>([])
  const [newRoomTypes, setNewRoomTypes] = useState<any[]>([])

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

      const { data: hotel, error: hotelError } = await supabase
        .from('hotels')
        .select('*')
        .eq('id', id)
        .is('archived_at', null)
        .single()

      if (hotelError || !hotel) {
        setNotFound(true)
        setLoading(false)
        return
      }

      setForm({
        name: hotel.name ?? '',
        destination_id: hotel.destination_id ?? '',
        star_rating: hotel.star_rating ?? '3',
        address: hotel.address ?? '',
        description: hotel.description ?? '',
        check_in_time: hotel.check_in_time ?? '14:00',
        check_out_time: hotel.check_out_time ?? '11:00',
        website: hotel.website ?? '',
        contact_phone: hotel.contact_phone ?? '',
        contact_email: hotel.contact_email ?? '',
        amenities: hotel.amenities ?? [],
      })

      const { data: rts } = await supabase
        .from('room_types')
        .select('*')
        .eq('hotel_id', id)
        .is('archived_at', null)
      setRoomTypes(rts ?? [])

      const { data: mps } = await supabase
        .from('meal_plans')
        .select('*')
        .eq('hotel_id', id)
      setMealPlans(mps ?? [])

      setLoading(false)
    }
    load()
  }, [id])

  function toggleAmenity(amenity: string) {
    setForm((f) => ({
      ...f,
      amenities: f.amenities.includes(amenity)
        ? f.amenities.filter((a) => a !== amenity)
        : [...f.amenities, amenity],
    }))
  }

  function addCustomAmenity() {
    const val = amenityInput.trim()
    if (val && !form.amenities.includes(val)) {
      setForm((f) => ({ ...f, amenities: [...f.amenities, val] }))
    }
    setAmenityInput('')
  }

  function toggleMealPlan(plan: typeof MEAL_PLAN_OPTIONS[0]) {
    const exists = mealPlans.find((p) => p.code === plan.code)
    if (exists) {
      setMealPlans((prev) => prev.filter((p) => p.code !== plan.code))
    } else {
      setMealPlans((prev) => [
        ...prev,
        { code: plan.code, name: plan.name, description: plan.description, hotel_id: id },
      ])
    }
  }

  function addNewRoomType() {
    setNewRoomTypes((prev) => [
      ...prev,
      { name: '', description: '', max_occupancy: 2 },
    ])
  }

  function updateNewRoomType(index: number, field: string, value: string | number) {
    setNewRoomTypes((prev) =>
      prev.map((rt, i) => (i === index ? { ...rt, [field]: value } : rt))
    )
  }

  function removeNewRoomType(index: number) {
    setNewRoomTypes((prev) => prev.filter((_, i) => i !== index))
  }

  async function deleteRoomType(rtId: string) {
    const { error } = await supabase
      .from('room_types')
      .update({ archived_at: new Date().toISOString() })
      .eq('id', rtId)
    if (!error) {
      setRoomTypes((prev) => prev.filter((rt) => rt.id !== rtId))
    }
  }

  async function handleSave() {
    if (!form.name.trim() || !form.destination_id) {
      setError('Hotel name and destination are required.')
      return
    }
    setSaving(true)
    setError('')
    setSuccess('')

    const { error: updateError } = await supabase
      .from('hotels')
      .update({
        name: form.name.trim(),
        destination_id: form.destination_id,
        star_rating: form.star_rating,
        address: form.address.trim() || null,
        description: form.description.trim() || null,
        check_in_time: form.check_in_time,
        check_out_time: form.check_out_time,
        website: form.website.trim() || null,
        contact_phone: form.contact_phone.trim() || null,
        contact_email: form.contact_email.trim() || null,
        amenities: form.amenities,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (updateError) {
      setError(updateError.message)
      setSaving(false)
      return
    }

    // Sync meal plans — delete all and re-insert
    await supabase.from('meal_plans').delete().eq('hotel_id', id)
    if (mealPlans.length > 0) {
      await supabase.from('meal_plans').insert(
        mealPlans.map((mp) => ({
          hotel_id: id,
          code: mp.code,
          name: mp.name,
          description: mp.description || null,
          inclusions: [],
        }))
      )
    }

    // Insert new room types
    if (newRoomTypes.filter((rt) => rt.name.trim()).length > 0) {
      await supabase.from('room_types').insert(
        newRoomTypes
          .filter((rt) => rt.name.trim())
          .map((rt) => ({
            hotel_id: id,
            name: rt.name.trim(),
            description: rt.description.trim() || null,
            max_occupancy: rt.max_occupancy,
          }))
      )
      setNewRoomTypes([])

      const { data: rts } = await supabase
        .from('room_types')
        .select('*')
        .eq('hotel_id', id)
        .is('archived_at', null)
      setRoomTypes(rts ?? [])
    }

    setSuccess('Hotel saved successfully.')
    setTimeout(() => setSuccess(''), 3000)
    setSaving(false)
  }

  async function handleArchive() {
    if (!isAdmin) return
    const confirmed = window.confirm(
      `Archive "${form.name}"? It will no longer appear in hotel lists.`
    )
    if (!confirmed) return

    await supabase
      .from('hotels')
      .update({ archived_at: new Date().toISOString() })
      .eq('id', id)

    router.push('/hotels')
    router.refresh()
  }

  if (loading) {
    return (
      <>
        <TopNav title="Hotel" />
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
        <TopNav title="Hotel" />
        <main className="page-container-sm">
          <div style={{ padding: '48px 0', textAlign: 'center' }}>
            <p style={{ color: '#a8a29e', fontSize: '14px' }}>
              Hotel not found or has been archived.
            </p>
            <Link href="/hotels" style={{ color: '#1c1917', fontSize: '14px' }}>
              Back to Hotels
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
          href="/hotels"
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
          Back to Hotels
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
              Edit Hotel
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

          {/* Basic Info */}
          <p style={{ fontSize: '12px', fontWeight: 600, color: '#a8a29e', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
            Basic Information
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={labelStyle}>Hotel Name <span style={{ color: '#ef4444' }}>*</span></label>
              <input style={inputStyle} type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>Destination <span style={{ color: '#ef4444' }}>*</span></label>
              <select style={inputStyle} value={form.destination_id} onChange={(e) => setForm((f) => ({ ...f, destination_id: e.target.value }))}>
                <option value="">Select destination...</option>
                {destinations.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}, {d.country}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={labelStyle}>Star Rating</label>
              <select style={inputStyle} value={form.star_rating} onChange={(e) => setForm((f) => ({ ...f, star_rating: e.target.value }))}>
                {['1', '2', '3', '4', '5'].map((s) => (<option key={s} value={s}>{s} Star</option>))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Address</label>
              <input style={inputStyle} type="text" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Description</label>
            <textarea style={{ ...inputStyle, resize: 'none' }} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={2} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={labelStyle}>Check-in Time</label>
              <input style={inputStyle} type="text" value={form.check_in_time} onChange={(e) => setForm((f) => ({ ...f, check_in_time: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>Check-out Time</label>
              <input style={inputStyle} type="text" value={form.check_out_time} onChange={(e) => setForm((f) => ({ ...f, check_out_time: e.target.value }))} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
            <div>
              <label style={labelStyle}>Contact Phone</label>
              <input style={inputStyle} type="text" value={form.contact_phone} onChange={(e) => setForm((f) => ({ ...f, contact_phone: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>Website</label>
              <input style={inputStyle} type="text" value={form.website} onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))} />
            </div>
          </div>

          {/* Amenities */}
          <div style={{ borderTop: '1px solid #f5f5f4', paddingTop: '20px', marginBottom: '24px' }}>
            <p style={{ fontSize: '12px', fontWeight: 600, color: '#a8a29e', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
              Amenities
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
              {AMENITIES.map((amenity) => {
                const selected = form.amenities.includes(amenity)
                return (
                  <button key={amenity} type="button" onClick={() => toggleAmenity(amenity)}
                    style={{ padding: '6px 12px', borderRadius: '9999px', border: `1px solid ${selected ? '#1c1917' : '#e7e5e4'}`, backgroundColor: selected ? '#1c1917' : '#fff', color: selected ? '#fff' : '#44403c', fontSize: '13px', cursor: 'pointer' }}>
                    {amenity}
                  </button>
                )
              })}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input style={{ ...inputStyle, flex: 1 }} type="text" value={amenityInput}
                onChange={(e) => setAmenityInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomAmenity() } }}
                placeholder="Custom amenity..." />
              <button type="button" onClick={addCustomAmenity}
                style={{ padding: '8px 12px', backgroundColor: '#f5f5f4', border: '1px solid #e7e5e4', borderRadius: '8px', cursor: 'pointer' }}>
                <Plus size={16} color="#57534e" />
              </button>
            </div>
          </div>

          {/* Existing Room Types */}
          <div style={{ borderTop: '1px solid #f5f5f4', paddingTop: '20px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <p style={{ fontSize: '12px', fontWeight: 600, color: '#a8a29e', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Room Types
              </p>
              <button type="button" onClick={addNewRoomType}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: '#1c1917', backgroundColor: '#f5f5f4', border: '1px solid #e7e5e4', borderRadius: '8px', padding: '4px 10px', cursor: 'pointer' }}>
                <Plus size={13} />
                Add Room Type
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {roomTypes.map((rt) => (
                <div key={rt.id}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fafaf9', border: '1px solid #e7e5e4', borderRadius: '8px', padding: '12px 16px' }}>
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: 500, color: '#1c1917' }}>{rt.name}</p>
                    <p style={{ fontSize: '12px', color: '#78716c', marginTop: '2px' }}>
                      Max {rt.max_occupancy} guests{rt.description ? ` · ${rt.description}` : ''}
                    </p>
                  </div>
                  {isAdmin && (
                    <button type="button" onClick={() => deleteRoomType(rt.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: '4px' }}>
                      <Trash2 size={14} color="#a8a29e" />
                    </button>
                  )}
                </div>
              ))}

              {newRoomTypes.map((rt, index) => (
                <div key={index}
                  style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '16px', position: 'relative' }}>
                  <p style={{ fontSize: '11px', color: '#16a34a', fontWeight: 600, marginBottom: '10px' }}>NEW ROOM TYPE</p>
                  <button type="button" onClick={() => removeNewRoomType(index)}
                    style={{ position: 'absolute', top: '12px', right: '12px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
                    <X size={15} color="#a8a29e" />
                  </button>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px', marginBottom: '10px' }}>
                    <div>
                      <label style={{ ...labelStyle, fontSize: '13px' }}>Room Name</label>
                      <input style={{ ...inputStyle, fontSize: '13px' }} type="text" value={rt.name}
                        onChange={(e) => updateNewRoomType(index, 'name', e.target.value)} placeholder="Suite" />
                    </div>
                    <div>
                      <label style={{ ...labelStyle, fontSize: '13px' }}>Max Occupancy</label>
                      <select style={{ ...inputStyle, fontSize: '13px' }} value={rt.max_occupancy}
                        onChange={(e) => updateNewRoomType(index, 'max_occupancy', parseInt(e.target.value))}>
                        {[1, 2, 3, 4, 5, 6].map((n) => (<option key={n} value={n}>{n} {n === 1 ? 'Guest' : 'Guests'}</option>))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label style={{ ...labelStyle, fontSize: '13px' }}>Description</label>
                    <input style={{ ...inputStyle, fontSize: '13px' }} type="text" value={rt.description}
                      onChange={(e) => updateNewRoomType(index, 'description', e.target.value)} placeholder="Ocean view, king bed..." />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Meal Plans */}
          <div style={{ borderTop: '1px solid #f5f5f4', paddingTop: '20px', marginBottom: '24px' }}>
            <p style={{ fontSize: '12px', fontWeight: 600, color: '#a8a29e', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
              Meal Plans
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {MEAL_PLAN_OPTIONS.map((plan) => {
                const selected = mealPlans.some((p) => p.code === plan.code)
                return (
                  <button key={plan.code} type="button" onClick={() => toggleMealPlan(plan)}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: '8px', border: `1px solid ${selected ? '#1c1917' : '#e7e5e4'}`, backgroundColor: selected ? '#1c1917' : '#fff', cursor: 'pointer', textAlign: 'left' }}>
                    <div>
                      <p style={{ fontSize: '14px', fontWeight: 500, color: selected ? '#fff' : '#1c1917' }}>{plan.code} — {plan.name}</p>
                      <p style={{ fontSize: '12px', color: selected ? '#d6d3d1' : '#78716c', marginTop: '2px' }}>{plan.description}</p>
                    </div>
                    {selected && <span style={{ color: '#fff', fontSize: '16px' }}>✓</span>}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={handleSave} disabled={saving}
              style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', backgroundColor: saving ? '#78716c' : '#1c1917', color: '#fff', padding: '10px', borderRadius: '8px', fontSize: '14px', fontWeight: 500, border: 'none', cursor: saving ? 'not-allowed' : 'pointer' }}>
              <Save size={15} />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <Link href="/hotels"
              style={{ padding: '10px 20px', border: '1px solid #d6d3d1', color: '#44403c', borderRadius: '8px', fontSize: '14px', fontWeight: 500, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
              Cancel
            </Link>
          </div>
        </div>
      </main>
    </>
  )
}