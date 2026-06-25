'use client'

import TopNav from '@/components/layout/TopNav'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, X } from 'lucide-react'
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

interface RoomType {
  name: string
  description: string
  max_occupancy: number
}

interface MealPlan {
  code: string
  name: string
  description: string
}

export default function NewHotelPage() {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [destinations, setDestinations] = useState<any[]>([])

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

  const [roomTypes, setRoomTypes] = useState<RoomType[]>([
    { name: '', description: '', max_occupancy: 2 },
  ])

  const [mealPlans, setMealPlans] = useState<MealPlan[]>([
    { code: 'CP', name: 'Continental Plan', description: 'Breakfast included' },
  ])

  const [amenityInput, setAmenityInput] = useState('')

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

  function updateRoomType(index: number, field: keyof RoomType, value: string | number) {
    setRoomTypes((prev) =>
      prev.map((rt, i) => (i === index ? { ...rt, [field]: value } : rt))
    )
  }

  function addRoomType() {
    setRoomTypes((prev) => [
      ...prev,
      { name: '', description: '', max_occupancy: 2 },
    ])
  }

  function removeRoomType(index: number) {
    setRoomTypes((prev) => prev.filter((_, i) => i !== index))
  }

  function toggleMealPlan(plan: typeof MEAL_PLAN_OPTIONS[0]) {
    setMealPlans((prev) => {
      const exists = prev.find((p) => p.code === plan.code)
      if (exists) {
        return prev.filter((p) => p.code !== plan.code)
      }
      return [...prev, { code: plan.code, name: plan.name, description: plan.description }]
    })
  }

  async function handleSubmit() {
    if (!form.name.trim()) {
      setError('Hotel name is required.')
      return
    }
    if (!form.destination_id) {
      setError('Please select a destination.')
      return
    }
    if (roomTypes.some((rt) => !rt.name.trim())) {
      setError('All room types must have a name.')
      return
    }
    if (mealPlans.length === 0) {
      setError('Select at least one meal plan.')
      return
    }

    setLoading(true)
    setError('')

    // Insert hotel
    const { data: hotel, error: hotelError } = await supabase
      .from('hotels')
      .insert({
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
      })
      .select()
      .single()

    if (hotelError || !hotel) {
      setError(hotelError?.message ?? 'Failed to create hotel.')
      setLoading(false)
      return
    }

    // Insert room types
    if (roomTypes.length > 0) {
      const { error: rtError } = await supabase.from('room_types').insert(
        roomTypes
          .filter((rt) => rt.name.trim())
          .map((rt) => ({
            hotel_id: hotel.id,
            name: rt.name.trim(),
            description: rt.description.trim() || null,
            max_occupancy: rt.max_occupancy,
          }))
      )
      if (rtError) {
        setError('Hotel saved but failed to save room types: ' + rtError.message)
        setLoading(false)
        return
      }
    }

    // Insert meal plans
    if (mealPlans.length > 0) {
      const { error: mpError } = await supabase.from('meal_plans').insert(
        mealPlans.map((mp) => ({
          hotel_id: hotel.id,
          code: mp.code,
          name: mp.name,
          description: mp.description || null,
          inclusions: [],
        }))
      )
      if (mpError) {
        setError('Hotel saved but failed to save meal plans: ' + mpError.message)
        setLoading(false)
        return
      }
    }

    router.push('/hotels')
    router.refresh()
  }

  return (
    <>
      <TopNav title="Add Hotel" />
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
          <h1
            style={{
              fontSize: '18px',
              fontWeight: 600,
              color: '#1c1917',
              marginBottom: '24px',
            }}
          >
            New Hotel
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

          {/* Section: Basic Info */}
          <p
            style={{
              fontSize: '12px',
              fontWeight: 600,
              color: '#a8a29e',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '12px',
            }}
          >
            Basic Information
          </p>

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
                Hotel Name <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                style={inputStyle}
                type="text"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="Sunset Beach Resort"
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

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
              marginBottom: '16px',
            }}
          >
            <div>
              <label style={labelStyle}>Star Rating</label>
              <select
                style={inputStyle}
                value={form.star_rating}
                onChange={(e) =>
                  setForm((f) => ({ ...f, star_rating: e.target.value }))
                }
              >
                {['1', '2', '3', '4', '5'].map((s) => (
                  <option key={s} value={s}>
                    {s} Star
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Address</label>
              <input
                style={inputStyle}
                type="text"
                value={form.address}
                onChange={(e) =>
                  setForm((f) => ({ ...f, address: e.target.value }))
                }
                placeholder="123 Beach Road, Phu Quoc"
              />
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Description</label>
            <textarea
              style={{ ...inputStyle, resize: 'none' }}
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              placeholder="A brief description of this hotel for the PDF..."
              rows={2}
            />
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
              marginBottom: '16px',
            }}
          >
            <div>
              <label style={labelStyle}>Check-in Time</label>
              <input
                style={inputStyle}
                type="text"
                value={form.check_in_time}
                onChange={(e) =>
                  setForm((f) => ({ ...f, check_in_time: e.target.value }))
                }
              />
            </div>
            <div>
              <label style={labelStyle}>Check-out Time</label>
              <input
                style={inputStyle}
                type="text"
                value={form.check_out_time}
                onChange={(e) =>
                  setForm((f) => ({ ...f, check_out_time: e.target.value }))
                }
              />
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
              marginBottom: '24px',
            }}
          >
            <div>
              <label style={labelStyle}>Contact Phone</label>
              <input
                style={inputStyle}
                type="text"
                value={form.contact_phone}
                onChange={(e) =>
                  setForm((f) => ({ ...f, contact_phone: e.target.value }))
                }
                placeholder="+91 98765 43210"
              />
            </div>
            <div>
              <label style={labelStyle}>Website</label>
              <input
                style={inputStyle}
                type="text"
                value={form.website}
                onChange={(e) =>
                  setForm((f) => ({ ...f, website: e.target.value }))
                }
                placeholder="https://hotel.com"
              />
            </div>
          </div>

          {/* Section: Amenities */}
          <div
            style={{
              borderTop: '1px solid #f5f5f4',
              paddingTop: '20px',
              marginBottom: '24px',
            }}
          >
            <p
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: '#a8a29e',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '12px',
              }}
            >
              Amenities
            </p>

            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
                marginBottom: '12px',
              }}
            >
              {AMENITIES.map((amenity) => {
                const selected = form.amenities.includes(amenity)
                return (
                  <button
                    key={amenity}
                    type="button"
                    onClick={() => toggleAmenity(amenity)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '9999px',
                      border: `1px solid ${selected ? '#1c1917' : '#e7e5e4'}`,
                      backgroundColor: selected ? '#1c1917' : '#fff',
                      color: selected ? '#fff' : '#44403c',
                      fontSize: '13px',
                      cursor: 'pointer',
                      fontWeight: selected ? 500 : 400,
                    }}
                  >
                    {amenity}
                  </button>
                )
              })}
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                style={{ ...inputStyle, flex: 1 }}
                type="text"
                value={amenityInput}
                onChange={(e) => setAmenityInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addCustomAmenity()
                  }
                }}
                placeholder="Custom amenity..."
              />
              <button
                type="button"
                onClick={addCustomAmenity}
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
          </div>

          {/* Section: Room Types */}
          <div
            style={{
              borderTop: '1px solid #f5f5f4',
              paddingTop: '20px',
              marginBottom: '24px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '12px',
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
                Room Types
              </p>
              <button
                type="button"
                onClick={addRoomType}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '13px',
                  color: '#1c1917',
                  backgroundColor: '#f5f5f4',
                  border: '1px solid #e7e5e4',
                  borderRadius: '8px',
                  padding: '4px 10px',
                  cursor: 'pointer',
                }}
              >
                <Plus size={13} />
                Add Room Type
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {roomTypes.map((rt, index) => (
                <div
                  key={index}
                  style={{
                    backgroundColor: '#fafaf9',
                    border: '1px solid #e7e5e4',
                    borderRadius: '8px',
                    padding: '16px',
                    position: 'relative',
                  }}
                >
                  {roomTypes.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeRoomType(index)}
                      style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                        display: 'flex',
                      }}
                    >
                      <X size={15} color="#a8a29e" />
                    </button>
                  )}

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '2fr 1fr',
                      gap: '12px',
                      marginBottom: '10px',
                    }}
                  >
                    <div>
                      <label style={{ ...labelStyle, fontSize: '13px' }}>
                        Room Name <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        style={{ ...inputStyle, fontSize: '13px' }}
                        type="text"
                        value={rt.name}
                        onChange={(e) =>
                          updateRoomType(index, 'name', e.target.value)
                        }
                        placeholder="Deluxe Room"
                      />
                    </div>
                    <div>
                      <label style={{ ...labelStyle, fontSize: '13px' }}>
                        Max Occupancy
                      </label>
                      <select
                        style={{ ...inputStyle, fontSize: '13px' }}
                        value={rt.max_occupancy}
                        onChange={(e) =>
                          updateRoomType(
                            index,
                            'max_occupancy',
                            parseInt(e.target.value)
                          )
                        }
                      >
                        {[1, 2, 3, 4, 5, 6].map((n) => (
                          <option key={n} value={n}>
                            {n} {n === 1 ? 'Guest' : 'Guests'}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={{ ...labelStyle, fontSize: '13px' }}>
                      Description
                    </label>
                    <input
                      style={{ ...inputStyle, fontSize: '13px' }}
                      type="text"
                      value={rt.description}
                      onChange={(e) =>
                        updateRoomType(index, 'description', e.target.value)
                      }
                      placeholder="Mountain view, king bed, private balcony..."
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section: Meal Plans */}
          <div
            style={{
              borderTop: '1px solid #f5f5f4',
              paddingTop: '20px',
              marginBottom: '24px',
            }}
          >
            <p
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: '#a8a29e',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '12px',
              }}
            >
              Meal Plans
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {MEAL_PLAN_OPTIONS.map((plan) => {
                const selected = mealPlans.some((p) => p.code === plan.code)
                return (
                  <button
                    key={plan.code}
                    type="button"
                    onClick={() => toggleMealPlan(plan)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      border: `1px solid ${selected ? '#1c1917' : '#e7e5e4'}`,
                      backgroundColor: selected ? '#1c1917' : '#fff',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <div>
                      <p
                        style={{
                          fontSize: '14px',
                          fontWeight: 500,
                          color: selected ? '#fff' : '#1c1917',
                        }}
                      >
                        {plan.code} — {plan.name}
                      </p>
                      <p
                        style={{
                          fontSize: '12px',
                          color: selected ? '#d6d3d1' : '#78716c',
                          marginTop: '2px',
                        }}
                      >
                        {plan.description}
                      </p>
                    </div>
                    {selected && (
                      <span style={{ color: '#fff', fontSize: '16px' }}>✓</span>
                    )}
                  </button>
                )
              })}
            </div>
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
              {loading ? 'Saving...' : 'Save Hotel'}
            </button>
            <Link
              href="/hotels"
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