'use client'

import TopNav from '@/components/layout/TopNav'
import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { usePackageBuilder } from '@/store/packageBuilderStore'
import { createClient } from '@/lib/supabase/client'
import {
  Plus, X, ChevronDown, ChevronUp, Save,
  Check, AlertCircle, Loader2, ArrowLeft,
  MapPin, Users, Hotel, Car, Calendar,
  List, DollarSign, FileText, Star, Package
} from 'lucide-react'
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
  fontSize: '13px',
  fontWeight: 500,
  color: '#44403c',
  marginBottom: '5px',
}

const sectionStyle = {
  backgroundColor: '#fff',
  borderRadius: '12px',
  border: '1px solid #e7e5e4',
  marginBottom: '16px',
  overflow: 'hidden' as const,
}

const sectionHeaderStyle = {
  padding: '16px 20px',
  borderBottom: '1px solid #f5f5f4',
  display: 'flex' as const,
  alignItems: 'center' as const,
  justifyContent: 'space-between' as const,
  cursor: 'pointer' as const,
  backgroundColor: '#fafaf9',
}

const CATEGORIES = [
  { value: 'honeymoon', label: '💑 Honeymoon' },
  { value: 'family', label: '👨‍👩‍👧 Family' },
  { value: 'group', label: '👥 Group' },
  { value: 'corporate', label: '💼 Corporate' },
  { value: 'adventure', label: '🏔️ Adventure' },
  { value: 'pilgrimage', label: '🛕 Pilgrimage' },
  { value: 'international', label: '✈️ International' },
  { value: 'weekend', label: '🌅 Weekend' },
  { value: 'custom', label: '📦 Custom' },
]

const STATUSES = [
  { value: 'draft', label: 'Draft', color: '#78716c' },
  { value: 'review', label: 'Review', color: '#854d0e' },
  { value: 'approved', label: 'Approved', color: '#1d4ed8' },
  { value: 'sent', label: 'Sent to Client', color: '#5b21b6' },
  { value: 'booked', label: 'Booked', color: '#166534' },
  { value: 'completed', label: 'Completed', color: '#065f46' },
  { value: 'cancelled', label: 'Cancelled', color: '#991b1b' },
]

export default function PackageBuilderPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const supabase = createClient()

  const store = usePackageBuilder()
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null)
  const [loadingPackage, setLoadingPackage] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [destinations, setDestinations] = useState<any[]>([])
  const [hotels, setHotels] = useState<any[]>([])
  const [roomTypes, setRoomTypes] = useState<any[]>([])
  const [mealPlans, setMealPlans] = useState<any[]>([])
  const [activities, setActivities] = useState<any[]>([])
  const [vehicles, setVehicles] = useState<any[]>([])
  const [libraryItems, setLibraryItems] = useState<any[]>([])
  const [policies, setPolicies] = useState<any[]>([])
  const [reviews, setReviews] = useState<any[]>([])
  const [activitySearch, setActivitySearch] = useState<Record<number, string>>({})
  const [pdfGenerating, setPdfGenerating] = useState(false)
  const [pdfUrl, setPdfUrl] = useState('')
  const [pdfError, setPdfError] = useState('')

  // Section collapse state
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({
    guests: true,
    hotels: true,
    transport: true,
    days: true,
    inclusions: true,
    pricing: true,
    policies: true,
    reviews: true,
  })

  function toggleSection(key: string) {
    setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  // Load package data
  useEffect(() => {
    async function load() {
      store.resetStore()
      store.setPackageId(id)

      const res = await fetch(`/api/packages/${id}`)
      if (!res.ok) { setNotFound(true); setLoadingPackage(false); return }

      const { data: pkg } = await res.json()
      if (!pkg) { setNotFound(true); setLoadingPackage(false); return }

      // Hydrate store
      store.setField('name', pkg.name ?? '')
      store.setField('package_code', pkg.package_code ?? '')
      store.setField('category', pkg.category ?? 'custom')
      store.setField('status', pkg.status ?? 'draft')
      store.setField('internal_notes', pkg.internal_notes ?? '')
      store.setField('adults', pkg.adults ?? 2)
      store.setField('children', pkg.children ?? 0)
      store.setField('infants', pkg.infants ?? 0)
      store.setField('children_ages', pkg.children_ages ?? [])

      // Destinations
      if (pkg.package_destinations?.length > 0) {
        const legs = pkg.package_destinations
          .sort((a: any, b: any) => a.leg_order - b.leg_order)
          .map((d: any) => ({
            id: d.id,
            destination_id: d.destination_id,
            destination_name: d.destinations?.name,
            leg_order: d.leg_order,
            nights: d.nights,
          }))
        store.setField('destinations', legs)
      }

      // Hotels
      if (pkg.package_hotels?.length > 0) {
        store.setField('hotels', pkg.package_hotels.map((h: any) => ({
          id: h.id,
          hotel_id: h.hotel_id,
          hotel_name: h.hotels?.name,
          room_type_id: h.room_type_id ?? '',
          room_type_name: h.room_types?.name,
          meal_plan_id: h.meal_plan_id ?? '',
          meal_plan_name: h.meal_plans?.name,
          tier: h.tier,
          room_count: h.room_count,
          occupancy_type: h.occupancy_type,
          check_in_date: h.check_in_date ?? '',
          check_out_date: h.check_out_date ?? '',
          notes: h.notes ?? '',
          leg_order: h.sort_order,
        })))
      }

      // Transfers
      if (pkg.package_transfers?.length > 0) {
        store.setField('transfers', pkg.package_transfers)
      }
      if (pkg.package_intercity_transfers?.length > 0) {
        store.setField('intercityTransfers', pkg.package_intercity_transfers)
      }

      // Days
      if (pkg.package_days?.length > 0) {
        const days = pkg.package_days
          .sort((a: any, b: any) => a.day_number - b.day_number)
          .map((d: any) => ({
            id: d.id,
            day_number: d.day_number,
            title: d.title ?? '',
            date: d.date ?? '',
            vehicle_id: d.vehicle_id ?? '',
            meals_included: d.meals_included ?? [],
            notes: d.notes ?? '',
            ai_description: d.ai_description ?? '',
            activities: (d.package_day_activities ?? [])
              .sort((a: any, b: any) => a.sort_order - b.sort_order)
              .map((a: any) => ({
                id: a.id,
                activity_id: a.activity_id,
                custom_name: a.custom_name ?? '',
                time_slot: a.time_slot ?? '',
                duration_hours: a.duration_hours,
                is_optional: a.is_optional,
                notes: a.notes ?? '',
                sort_order: a.sort_order,
              })),
          }))
        store.setField('days', days)
      } else if (pkg.total_nights > 0) {
        store.initDays(pkg.total_nights)
      }

      // Inclusions
      if (pkg.package_inclusions?.length > 0) {
        store.setField('inclusions', pkg.package_inclusions.map((i: any) => ({
          id: i.id,
          text: i.text,
          type: i.type,
        })))
      }

      // Pricing
      if (pkg.package_pricing) {
        const p = pkg.package_pricing
        store.updatePricing({
          cost_per_adult: p.cost_per_adult ?? 0,
          cost_per_child: p.cost_per_child ?? 0,
          cost_per_infant: p.cost_per_infant ?? 0,
          single_supplement: p.single_supplement ?? 0,
          triple_reduction: p.triple_reduction ?? 0,
          markup_percent: p.markup_percent ?? 0,
          discount_amount: p.discount_amount ?? 0,
          discount_reason: p.discount_reason ?? '',
          gst_percent: p.gst_percent ?? 5,
          base_total: p.base_total ?? 0,
          gst_total: p.gst_total ?? 0,
          grand_total: p.grand_total ?? 0,
          advance_amount: p.advance_amount ?? 0,
          show_cost_breakup: p.show_cost_breakup ?? false,
        })
      }

      // Payment schedule
      if (pkg.package_payment_schedule?.length > 0) {
        store.setField('paymentSchedule', pkg.package_payment_schedule
          .sort((a: any, b: any) => a.sort_order - b.sort_order))
      }

      // Policies
      const tnc = pkg.package_policies?.find((p: any) => p.type === 'terms_and_conditions')
      const cancel = pkg.package_policies?.find((p: any) => p.type === 'cancellation_policy')
      if (tnc) { store.setField('tnc_policy_id', tnc.policy_id ?? ''); store.setField('tnc_content', tnc.content) }
      if (cancel) { store.setField('cancellation_policy_id', cancel.policy_id ?? ''); store.setField('cancellation_content', cancel.content) }

      // Reviews
      if (pkg.package_reviews?.length > 0) {
        store.setField('selected_review_ids', pkg.package_reviews.map((r: any) => r.review_id))
      }

      setLoadingPackage(false)
    }

    load()
  }, [id])

  // Load master data
  useEffect(() => {
    async function loadMasterData() {
      const [destsRes, hotelsRes, activitiesRes, vehiclesRes, libraryRes, policiesRes, reviewsRes] =
        await Promise.all([
          supabase.from('destinations').select('id, name, country, state').is('archived_at', null).order('name'),
          supabase.from('hotels').select('id, name, star_rating, destination_id').is('archived_at', null).order('name'),
          supabase.from('activities').select('id, name, category, destination_id, duration_hours').is('archived_at', null).order('name'),
          supabase.from('vehicles').select('id, name, type, capacity').is('archived_at', null).order('name'),
          supabase.from('library_items').select('*').is('archived_at', null).order('sort_order'),
          supabase.from('policies').select('*').is('archived_at', null).order('is_default', { ascending: false }),
          supabase.from('reviews').select('*').eq('is_visible', true).order('created_at', { ascending: false }),
        ])

      setDestinations(destsRes.data ?? [])
      setHotels(hotelsRes.data ?? [])
      setActivities(activitiesRes.data ?? [])
      setVehicles(vehiclesRes.data ?? [])
      setLibraryItems(libraryRes.data ?? [])
      setPolicies(policiesRes.data ?? [])
      setReviews(reviewsRes.data ?? [])

      // Load room types and meal plans for all hotels
      const { data: rts } = await supabase.from('room_types').select('*').is('archived_at', null)
      const { data: mps } = await supabase.from('meal_plans').select('*')
      setRoomTypes(rts ?? [])
      setMealPlans(mps ?? [])
    }
    loadMasterData()
  }, [])

  // Auto-save with debounce
  const autoSave = useCallback(async () => {
    const s = usePackageBuilder.getState()
    if (!s.packageId || !s.isDirty) return

    s.setSaving(true)
    s.setSaveError(null)

    try {
      const sections = [
        {
          section: 'header',
          data: { name: s.name, category: s.category, status: s.status, total_nights: s.destinations.reduce((sum, d) => sum + d.nights, 0) || 1, internal_notes: s.internal_notes },
        },
        { section: 'guests', data: { adults: s.adults, children: s.children, infants: s.infants, children_ages: s.children_ages } },
        { section: 'destinations', data: { destinations: s.destinations } },
        { section: 'hotels', data: { hotels: s.hotels } },
        { section: 'transfers', data: { transfers: s.transfers, intercityTransfers: s.intercityTransfers } },
        { section: 'days', data: { days: s.days } },
        { section: 'inclusions', data: { inclusions: s.inclusions } },
        { section: 'pricing', data: { ...s.pricing, paymentSchedule: s.paymentSchedule } },
        { section: 'policies', data: { tnc_policy_id: s.tnc_policy_id, tnc_content: s.tnc_content, cancellation_policy_id: s.cancellation_policy_id, cancellation_content: s.cancellation_content } },
        { section: 'reviews', data: { review_ids: s.selected_review_ids } },
      ]

      for (const { section, data } of sections) {
        await fetch(`/api/packages/${s.packageId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ section, data }),
        })
      }

      s.markSaved()
    } catch (err: any) {
      s.setSaveError('Failed to save. Please check your connection.')
    } finally {
      s.setSaving(false)
    }
  }, [])

  useEffect(() => {
    if (!store.isDirty) return
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(autoSave, 2000)
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current) }
  }, [store.isDirty, store.name, store.category, store.status, store.adults, store.children, store.infants, store.destinations, store.hotels, store.transfers, store.days, store.inclusions, store.pricing, store.paymentSchedule, store.tnc_content, store.cancellation_content, store.selected_review_ids])

  if (loadingPackage) {
    return (
      <>
        <TopNav title="Package Builder" />
        <main className="page-container" style={{ textAlign: 'center', paddingTop: '64px' }}>
          <Loader2 size={24} style={{ color: '#a8a29e', margin: '0 auto 12px', animation: 'spin 1s linear infinite' }} />
          <p style={{ color: '#a8a29e', fontSize: '14px' }}>Loading package...</p>
        </main>
      </>
    )
  }

  if (notFound) {
    return (
      <>
        <TopNav title="Package Builder" />
        <main className="page-container" style={{ textAlign: 'center', paddingTop: '64px' }}>
          <p style={{ color: '#a8a29e', fontSize: '14px' }}>Package not found.</p>
          <Link href="/packages" style={{ color: '#1c1917', fontSize: '14px', display: 'block', marginTop: '12px' }}>Back to Packages</Link>
        </main>
      </>
    )
  }

  const totalNights = store.destinations.reduce((sum, d) => sum + d.nights, 0)
  const totalDays = totalNights + 1

  return (
    <>
      <TopNav title={store.name || 'Package Builder'} />
      <main style={{ padding: '24px', width: '100%', maxWidth: '1100px', margin: '0 auto' }}>

        {/* Back + Save status */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <Link href="/packages"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#78716c', fontSize: '14px', textDecoration: 'none' }}>
            <ArrowLeft size={15} />
            Back to Packages
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {store.saving && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#78716c', fontSize: '13px' }}>
                <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                Saving...
              </div>
            )}
            {!store.saving && store.lastSaved && !store.isDirty && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#16a34a', fontSize: '13px' }}>
                <Check size={14} />
                Saved
              </div>
            )}
            {!store.saving && store.isDirty && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#854d0e', fontSize: '13px' }}>
                <AlertCircle size={14} />
                Unsaved changes
              </div>
            )}
            {store.saveError && (
              <div style={{ color: '#dc2626', fontSize: '13px' }}>{store.saveError}</div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#fafaf9', border: '1px solid #e7e5e4', borderRadius: '8px', padding: '6px 12px' }}>
              <span style={{ fontSize: '12px', color: '#78716c' }}>Code:</span>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#1c1917', fontFamily: 'monospace' }}>{store.package_code}</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '16px', alignItems: 'start' }}>

          {/* Left: All sections */}
          <div>

            {/* ── SECTION 1: PACKAGE HEADER ── */}
            <div style={sectionStyle}>
              <div style={{ ...sectionHeaderStyle, cursor: 'default' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Package size={16} color="#78716c" />
                  <span style={{ fontSize: '14px', fontWeight: 600, color: '#1c1917' }}>Package Details</span>
                </div>
              </div>
              <div style={{ padding: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={labelStyle}>Package Name</label>
                    <input style={inputStyle} type="text" value={store.name}
                      onChange={(e) => store.setField('name', e.target.value)}
                      placeholder="Phu Quoc Honeymoon Escape 4N/5D" />
                  </div>
                  <div>
                    <label style={labelStyle}>Category</label>
                    <select style={inputStyle} value={store.category}
                      onChange={(e) => store.setField('category', e.target.value)}>
                      {CATEGORIES.map((c) => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Status</label>
                    <select style={inputStyle} value={store.status}
                      onChange={(e) => store.setField('status', e.target.value)}>
                      {STATUSES.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Internal Notes (not shown in PDF)</label>
                  <textarea style={{ ...inputStyle, resize: 'none' }} rows={2}
                    value={store.internal_notes}
                    onChange={(e) => store.setField('internal_notes', e.target.value)}
                    placeholder="Client preferences, special requests, follow-up notes..." />
                </div>
              </div>
            </div>

            {/* ── SECTION 2: DESTINATIONS ── */}
            <div style={sectionStyle}>
              <div style={sectionHeaderStyle} onClick={() => toggleSection('destinations')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MapPin size={16} color="#78716c" />
                  <span style={{ fontSize: '14px', fontWeight: 600, color: '#1c1917' }}>Destinations</span>
                  {store.destinations.length > 0 && (
                    <span style={{ fontSize: '12px', backgroundColor: '#f5f5f4', color: '#78716c', padding: '1px 8px', borderRadius: '9999px' }}>
                      {store.destinations.map(d => d.destination_name).join(' → ')} · {totalNights}N/{totalDays}D
                    </span>
                  )}
                </div>
                {collapsed.destinations ? <ChevronDown size={16} color="#78716c" /> : <ChevronUp size={16} color="#78716c" />}
              </div>

              {!collapsed.destinations && (
                <div style={{ padding: '20px' }}>
                  {store.destinations.length === 0 && (
                    <p style={{ fontSize: '13px', color: '#a8a29e', marginBottom: '16px' }}>
                      Add at least one destination. For multi-destination packages, add them in travel order.
                    </p>
                  )}

                  {/* Destination legs */}
                  {store.destinations.map((leg, index) => (
                    <div key={leg.leg_order}
                      style={{ backgroundColor: '#fafaf9', border: '1px solid #e7e5e4', borderRadius: '10px', padding: '16px', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#78716c', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Leg {leg.leg_order}
                        </span>
                        <button onClick={() => {
                          store.removeDestination(leg.leg_order)
                          const remaining = store.destinations.filter(d => d.leg_order !== leg.leg_order)
                          const totalN = remaining.reduce((s, d) => s + d.nights, 0)
                          if (totalN > 0) store.initDays(totalN)
                        }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: '2px' }}>
                          <X size={15} color="#a8a29e" />
                        </button>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                        <div>
                          <label style={labelStyle}>Destination</label>
                          <select style={inputStyle} value={leg.destination_id}
                            onChange={(e) => {
                              const dest = destinations.find(d => d.id === e.target.value)
                              store.updateDestination(leg.leg_order, {
                                destination_id: e.target.value,
                                destination_name: dest?.name,
                              })
                            }}>
                            <option value="">Select destination...</option>
                            {destinations.map((d) => (
                              <option key={d.id} value={d.id}>{d.name}, {d.country}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label style={labelStyle}>Nights</label>
                          <input style={inputStyle} type="number" min="1" max="30"
                            value={leg.nights}
                            onChange={(e) => {
                              store.updateDestination(leg.leg_order, { nights: parseInt(e.target.value) || 1 })
                              const updated = store.destinations.map(d =>
                                d.leg_order === leg.leg_order ? { ...d, nights: parseInt(e.target.value) || 1 } : d
                              )
                              const totalN = updated.reduce((s, d) => s + d.nights, 0)
                              store.initDays(totalN)
                            }} />
                        </div>
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={() => {
                      const nextOrder = store.destinations.length + 1
                      store.addDestination({
                        destination_id: '',
                        destination_name: '',
                        leg_order: nextOrder,
                        nights: 2,
                      })
                      const totalN = store.destinations.reduce((s, d) => s + d.nights, 0) + 2
                      store.initDays(totalN)
                    }}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', backgroundColor: '#fff', border: '1px dashed #d6d3d1', borderRadius: '8px', fontSize: '13px', color: '#44403c', cursor: 'pointer', width: '100%', justifyContent: 'center' }}>
                    <Plus size={14} />
                    Add Destination Leg
                  </button>

                  {totalNights > 0 && (
                    <div style={{ marginTop: '12px', padding: '10px 14px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px' }}>
                      <p style={{ fontSize: '13px', color: '#166534', fontWeight: 500 }}>
                        Total: {totalNights} Nights / {totalDays} Days
                        {store.destinations.length > 1 && (
                          <span style={{ fontWeight: 400, marginLeft: '8px' }}>
                            ({store.destinations.map(d => `${d.destination_name || '?'} ${d.nights}N`).join(', ')})
                          </span>
                        )}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── SECTION 3: GUESTS ── */}
            <div style={sectionStyle}>
              <div style={sectionHeaderStyle} onClick={() => toggleSection('guests')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Users size={16} color="#78716c" />
                  <span style={{ fontSize: '14px', fontWeight: 600, color: '#1c1917' }}>Guests</span>
                  <span style={{ fontSize: '12px', backgroundColor: '#f5f5f4', color: '#78716c', padding: '1px 8px', borderRadius: '9999px' }}>
                    {store.adults} adults{store.children > 0 ? `, ${store.children} children` : ''}{store.infants > 0 ? `, ${store.infants} infants` : ''}
                  </span>
                </div>
                {collapsed.guests ? <ChevronDown size={16} color="#78716c" /> : <ChevronUp size={16} color="#78716c" />}
              </div>

              {!collapsed.guests && (
                <div style={{ padding: '20px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    <div>
                      <label style={labelStyle}>Adults</label>
                      <input style={inputStyle} type="number" min="1" max="50"
                        value={store.adults}
                        onChange={(e) => store.setField('adults', parseInt(e.target.value) || 1)} />
                    </div>
                    <div>
                      <label style={labelStyle}>Children</label>
                      <input style={inputStyle} type="number" min="0" max="20"
                        value={store.children}
                        onChange={(e) => {
                          const count = parseInt(e.target.value) || 0
                          store.setField('children', count)
                          store.setField('children_ages', Array(count).fill(0))
                        }} />
                    </div>
                    <div>
                      <label style={labelStyle}>Infants (under 2)</label>
                      <input style={inputStyle} type="number" min="0" max="10"
                        value={store.infants}
                        onChange={(e) => store.setField('infants', parseInt(e.target.value) || 0)} />
                    </div>
                  </div>

                  {store.children > 0 && (
                    <div>
                      <label style={labelStyle}>Children Ages</label>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {Array.from({ length: store.children }).map((_, i) => (
                          <div key={i} style={{ width: '80px' }}>
                            <input style={{ ...inputStyle, textAlign: 'center' }} type="number" min="2" max="17"
                              value={store.children_ages[i] || ''}
                              placeholder={`Child ${i + 1}`}
                              onChange={(e) => {
                                const ages = [...store.children_ages]
                                ages[i] = parseInt(e.target.value) || 0
                                store.setField('children_ages', ages)
                              }} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── SECTION 4: HOTELS ── */}
            <div style={sectionStyle}>
              <div style={sectionHeaderStyle} onClick={() => toggleSection('hotels')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Hotel size={16} color="#78716c" />
                  <span style={{ fontSize: '14px', fontWeight: 600, color: '#1c1917' }}>Hotels</span>
                  {store.hotels.length > 0 && (
                    <span style={{ fontSize: '12px', backgroundColor: '#f5f5f4', color: '#78716c', padding: '1px 8px', borderRadius: '9999px' }}>
                      {store.hotels.length} option{store.hotels.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                {collapsed.hotels ? <ChevronDown size={16} color="#78716c" /> : <ChevronUp size={16} color="#78716c" />}
              </div>

              {!collapsed.hotels && (
                <div style={{ padding: '20px' }}>
                  {store.destinations.length === 0 && (
                    <p style={{ fontSize: '13px', color: '#a8a29e' }}>Add destinations first.</p>
                  )}

                  {store.destinations.map((leg) => {
                    const legHotels = store.hotels.filter(h => h.leg_order === leg.leg_order)
                    const destHotels = hotels.filter(h => h.destination_id === leg.destination_id)

                    return (
                      <div key={leg.leg_order} style={{ marginBottom: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                          <p style={{ fontSize: '13px', fontWeight: 600, color: '#44403c' }}>
                            {leg.destination_name || `Leg ${leg.leg_order}`} · {leg.nights} nights
                          </p>
                          <button
                            onClick={() => {
                              store.addHotel({
                                hotel_id: '',
                                room_type_id: '',
                                meal_plan_id: '',
                                tier: 'standard',
                                room_count: 1,
                                occupancy_type: 'double',
                                leg_order: leg.leg_order,
                              })
                            }}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#1c1917', backgroundColor: '#f5f5f4', border: '1px solid #e7e5e4', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer' }}>
                            <Plus size={12} />
                            Add Option
                          </button>
                        </div>

                        {legHotels.length === 0 && (
                          <p style={{ fontSize: '13px', color: '#a8a29e', padding: '12px 0' }}>
                            No hotel options added for this leg yet.
                          </p>
                        )}

                        {legHotels.map((hotel, hotelIndex) => {
                          const actualIndex = store.hotels.findIndex(h => h === hotel)
                          const hotelRoomTypes = roomTypes.filter(rt => rt.hotel_id === hotel.hotel_id)
                          const hotelMealPlans = mealPlans.filter(mp => mp.hotel_id === hotel.hotel_id)

                          return (
                            <div key={hotelIndex}
                              style={{ backgroundColor: '#fafaf9', border: '1px solid #e7e5e4', borderRadius: '10px', padding: '16px', marginBottom: '10px', position: 'relative' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                                <span style={{ fontSize: '11px', fontWeight: 600, color: '#78716c', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                  Option {hotelIndex + 1}
                                </span>
                                <button onClick={() => store.removeHotel(actualIndex)}
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
                                  <X size={14} color="#a8a29e" />
                                </button>
                              </div>

                              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px', marginBottom: '10px' }}>
                                <div>
                                  <label style={labelStyle}>Hotel</label>
                                  <select style={inputStyle}
                                    value={hotel.hotel_id}
                                    onChange={(e) => {
                                      const h = hotels.find(h => h.id === e.target.value)
                                      store.updateHotel(actualIndex, {
                                        hotel_id: e.target.value,
                                        hotel_name: h?.name,
                                        room_type_id: '',
                                        meal_plan_id: '',
                                      })
                                    }}>
                                    <option value="">Select hotel...</option>
                                    {destHotels.map(h => (
                                      <option key={h.id} value={h.id}>{h.name} ({h.star_rating}★)</option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label style={labelStyle}>Tier</label>
                                  <select style={inputStyle} value={hotel.tier}
                                    onChange={(e) => store.updateHotel(actualIndex, { tier: e.target.value as any })}>
                                    {['budget', 'standard', 'deluxe', 'luxury'].map(t => (
                                      <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                                    ))}
                                  </select>
                                </div>
                              </div>

                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                                <div>
                                  <label style={labelStyle}>Room Type</label>
                                  <select style={inputStyle} value={hotel.room_type_id}
                                    onChange={(e) => {
                                      const rt = roomTypes.find(r => r.id === e.target.value)
                                      store.updateHotel(actualIndex, { room_type_id: e.target.value, room_type_name: rt?.name })
                                    }}
                                    disabled={!hotel.hotel_id}>
                                    <option value="">Select...</option>
                                    {hotelRoomTypes.map(rt => (
                                      <option key={rt.id} value={rt.id}>{rt.name}</option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label style={labelStyle}>Meal Plan</label>
                                  <select style={inputStyle} value={hotel.meal_plan_id}
                                    onChange={(e) => {
                                      const mp = mealPlans.find(m => m.id === e.target.value)
                                      store.updateHotel(actualIndex, { meal_plan_id: e.target.value, meal_plan_name: mp?.name })
                                    }}
                                    disabled={!hotel.hotel_id}>
                                    <option value="">Select...</option>
                                    {hotelMealPlans.map(mp => (
                                      <option key={mp.id} value={mp.id}>{mp.code} — {mp.name}</option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label style={labelStyle}>Rooms</label>
                                  <input style={inputStyle} type="number" min="1" max="20"
                                    value={hotel.room_count}
                                    onChange={(e) => store.updateHotel(actualIndex, { room_count: parseInt(e.target.value) || 1 })} />
                                </div>
                              </div>

                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                                <div>
                                  <label style={labelStyle}>Occupancy</label>
                                  <select style={inputStyle} value={hotel.occupancy_type}
                                    onChange={(e) => store.updateHotel(actualIndex, { occupancy_type: e.target.value as any })}>
                                    <option value="single">Single</option>
                                    <option value="double">Double</option>
                                    <option value="triple">Triple</option>
                                  </select>
                                </div>
                                <div>
                                  <label style={labelStyle}>Check-in</label>
                                  <input style={inputStyle} type="date" value={hotel.check_in_date ?? ''}
                                    onChange={(e) => store.updateHotel(actualIndex, { check_in_date: e.target.value })} />
                                </div>
                                <div>
                                  <label style={labelStyle}>Check-out</label>
                                  <input style={inputStyle} type="date" value={hotel.check_out_date ?? ''}
                                    onChange={(e) => store.updateHotel(actualIndex, { check_out_date: e.target.value })} />
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* ── SECTION 5: TRANSPORTATION ── */}
            <div style={sectionStyle}>
              <div style={sectionHeaderStyle} onClick={() => toggleSection('transport')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Car size={16} color="#78716c" />
                  <span style={{ fontSize: '14px', fontWeight: 600, color: '#1c1917' }}>Transportation</span>
                  {(store.transfers.length + store.intercityTransfers.length) > 0 && (
                    <span style={{ fontSize: '12px', backgroundColor: '#f5f5f4', color: '#78716c', padding: '1px 8px', borderRadius: '9999px' }}>
                      {store.transfers.length + store.intercityTransfers.length} transfers
                    </span>
                  )}
                </div>
                {collapsed.transport ? <ChevronDown size={16} color="#78716c" /> : <ChevronUp size={16} color="#78716c" />}
              </div>

              {!collapsed.transport && (
                <div style={{ padding: '20px' }}>

                  {/* Pickup & Drop */}
                  <p style={{ fontSize: '12px', fontWeight: 600, color: '#a8a29e', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
                    Pickup & Drop Transfers
                  </p>

                  {store.transfers.map((transfer, index) => (
                    <div key={index}
                      style={{ backgroundColor: '#fafaf9', border: '1px solid #e7e5e4', borderRadius: '10px', padding: '14px', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: transfer.is_pickup ? '#166534' : '#991b1b' }}>
                          {transfer.is_pickup ? '↓ PICKUP' : '↑ DROP'}
                        </span>
                        <button onClick={() => store.removeTransfer(index)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
                          <X size={14} color="#a8a29e" />
                        </button>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                        <div>
                          <label style={labelStyle}>Type</label>
                          <select style={inputStyle} value={transfer.transfer_type}
                            onChange={(e) => {
                              const updated = [...store.transfers]
                              updated[index] = { ...updated[index], transfer_type: e.target.value }
                              store.setField('transfers', updated)
                            }}>
                            <option value="airport">Airport</option>
                            <option value="railway">Railway Station</option>
                            <option value="bus_stand">Bus Stand</option>
                            <option value="hotel">Hotel</option>
                            <option value="port">Port</option>
                          </select>
                        </div>
                        <div>
                          <label style={labelStyle}>Location Name</label>
                          <input style={inputStyle} type="text" value={transfer.location_name}
                            onChange={(e) => {
                              const updated = [...store.transfers]
                              updated[index] = { ...updated[index], location_name: e.target.value }
                              store.setField('transfers', updated)
                            }}
                            placeholder="Chandigarh Airport" />
                        </div>
                        <div>
                          <label style={labelStyle}>Vehicle</label>
                          <select style={inputStyle} value={transfer.vehicle_id ?? ''}
                            onChange={(e) => {
                              const v = vehicles.find(v => v.id === e.target.value)
                              const updated = [...store.transfers]
                              updated[index] = { ...updated[index], vehicle_id: e.target.value, vehicle_name: v?.name }
                              store.setField('transfers', updated)
                            }}>
                            <option value="">Select vehicle...</option>
                            {vehicles.map(v => (
                              <option key={v.id} value={v.id}>{v.name} ({v.capacity} pax)</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
                        <div>
                          <label style={labelStyle}>Date</label>
                          <input style={inputStyle} type="date" value={transfer.date ?? ''}
                            onChange={(e) => {
                              const updated = [...store.transfers]
                              updated[index] = { ...updated[index], date: e.target.value }
                              store.setField('transfers', updated)
                            }} />
                        </div>
                        <div>
                          <label style={labelStyle}>Flight / Train No.</label>
                          <input style={inputStyle} type="text" value={transfer.flight_train_no ?? ''}
                            onChange={(e) => {
                              const updated = [...store.transfers]
                              updated[index] = { ...updated[index], flight_train_no: e.target.value }
                              store.setField('transfers', updated)
                            }}
                            placeholder="6E 2341" />
                        </div>
                      </div>
                    </div>
                  ))}

                  <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                    <button
                      onClick={() => store.addTransfer({ transfer_type: 'airport', location_name: '', is_pickup: true })}
                      style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '8px', backgroundColor: '#fff', border: '1px dashed #d6d3d1', borderRadius: '8px', fontSize: '13px', color: '#166534', cursor: 'pointer' }}>
                      <Plus size={13} />
                      Add Pickup
                    </button>
                    <button
                      onClick={() => store.addTransfer({ transfer_type: 'airport', location_name: '', is_pickup: false })}
                      style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '8px', backgroundColor: '#fff', border: '1px dashed #d6d3d1', borderRadius: '8px', fontSize: '13px', color: '#991b1b', cursor: 'pointer' }}>
                      <Plus size={13} />
                      Add Drop
                    </button>
                  </div>

                  {/* Intercity transfers */}
                  {store.destinations.length > 1 && (
                    <>
                      <p style={{ fontSize: '12px', fontWeight: 600, color: '#a8a29e', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
                        Intercity Transfers
                      </p>

                      {store.intercityTransfers.map((transfer, index) => (
                        <div key={index}
                          style={{ backgroundColor: '#fafaf9', border: '1px solid #e7e5e4', borderRadius: '10px', padding: '14px', marginBottom: '10px' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
                            <button onClick={() => store.removeIntercityTransfer(index)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
                              <X size={14} color="#a8a29e" />
                            </button>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                            <div>
                              <label style={labelStyle}>From</label>
                              <select style={inputStyle} value={transfer.from_destination_id ?? ''}
                                onChange={(e) => {
                                  const updated = [...store.intercityTransfers]
                                  updated[index] = { ...updated[index], from_destination_id: e.target.value }
                                  store.setField('intercityTransfers', updated)
                                }}>
                                <option value="">Select...</option>
                                {store.destinations.map(d => (
                                  <option key={d.destination_id} value={d.destination_id}>{d.destination_name}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label style={labelStyle}>To</label>
                              <select style={inputStyle} value={transfer.to_destination_id ?? ''}
                                onChange={(e) => {
                                  const updated = [...store.intercityTransfers]
                                  updated[index] = { ...updated[index], to_destination_id: e.target.value }
                                  store.setField('intercityTransfers', updated)
                                }}>
                                <option value="">Select...</option>
                                {store.destinations.map(d => (
                                  <option key={d.destination_id} value={d.destination_id}>{d.destination_name}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label style={labelStyle}>Mode</label>
                              <select style={inputStyle} value={transfer.mode ?? 'road'}
                                onChange={(e) => {
                                  const updated = [...store.intercityTransfers]
                                  updated[index] = { ...updated[index], mode: e.target.value }
                                  store.setField('intercityTransfers', updated)
                                }}>
                                <option value="road">Road</option>
                                <option value="flight">Flight</option>
                                <option value="train">Train</option>
                                <option value="ferry">Ferry</option>
                              </select>
                            </div>
                          </div>
                          <div style={{ marginTop: '10px' }}>
                            <label style={labelStyle}>Vehicle (for road transfers)</label>
                            <select style={inputStyle} value={transfer.vehicle_id ?? ''}
                              onChange={(e) => {
                                const v = vehicles.find(v => v.id === e.target.value)
                                const updated = [...store.intercityTransfers]
                                updated[index] = { ...updated[index], vehicle_id: e.target.value, vehicle_name: v?.name }
                                store.setField('intercityTransfers', updated)
                              }}>
                              <option value="">Select vehicle...</option>
                              {vehicles.map(v => (
                                <option key={v.id} value={v.id}>{v.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      ))}

                      <button
                        onClick={() => store.addIntercityTransfer({ mode: 'road' })}
                        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '8px', backgroundColor: '#fff', border: '1px dashed #d6d3d1', borderRadius: '8px', fontSize: '13px', color: '#44403c', cursor: 'pointer', width: '100%' }}>
                        <Plus size={13} />
                        Add Intercity Transfer
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* ── SECTION 6: DAY PLANNER ── */}
            <div style={sectionStyle}>
              <div style={sectionHeaderStyle} onClick={() => toggleSection('days')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calendar size={16} color="#78716c" />
                  <span style={{ fontSize: '14px', fontWeight: 600, color: '#1c1917' }}>Day Planner</span>
                  {store.days.length > 0 && (
                    <span style={{ fontSize: '12px', backgroundColor: '#f5f5f4', color: '#78716c', padding: '1px 8px', borderRadius: '9999px' }}>
                      {store.days.length} days
                    </span>
                  )}
                </div>
                {collapsed.days ? <ChevronDown size={16} color="#78716c" /> : <ChevronUp size={16} color="#78716c" />}
              </div>

              {!collapsed.days && (
                <div style={{ padding: '20px' }}>
                  {store.days.length === 0 && (
                    <p style={{ fontSize: '13px', color: '#a8a29e' }}>
                      Add destinations first to auto-generate days.
                    </p>
                  )}

                  {store.days.map((day) => {
                    // Figure out which destination this day belongs to
                    let nightsAccum = 0
                    let dayDestination = store.destinations[0]
                    for (const leg of store.destinations) {
                      nightsAccum += leg.nights
                      if (day.day_number <= nightsAccum + 1) {
                        dayDestination = leg
                        break
                      }
                    }

                    const destActivities = activities.filter(a => a.destination_id === dayDestination?.destination_id)
                    const searchTerm = activitySearch[day.day_number] ?? ''
                    const filteredActivities = destActivities.filter(a =>
                      searchTerm === '' ||
                      a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      a.category.toLowerCase().includes(searchTerm.toLowerCase())
                    )

                    return (
                      <div key={day.day_number}
                        style={{ border: '1px solid #e7e5e4', borderRadius: '10px', marginBottom: '12px', overflow: 'hidden' }}>

                        {/* Day header */}
                        <div style={{ backgroundColor: '#1c1917', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '12px', fontWeight: 700, color: '#f5f5f4', backgroundColor: 'rgba(255,255,255,0.15)', padding: '2px 10px', borderRadius: '9999px' }}>
                              DAY {day.day_number}
                            </span>
                            {dayDestination?.destination_name && (
                              <span style={{ fontSize: '11px', color: '#a8a29e' }}>
                                {dayDestination.destination_name}
                              </span>
                            )}
                          </div>
                          <input
                            style={{ backgroundColor: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: '13px', fontWeight: 500, flex: 1, marginLeft: '12px', maxWidth: '300px' }}
                            value={day.title ?? ''}
                            onChange={(e) => store.updateDay(day.day_number, { title: e.target.value })}
                            placeholder="Day title..." />
                        </div>

                        <div style={{ padding: '16px' }}>

                          {/* Added activities */}
                          {day.activities.length > 0 && (
                            <div style={{ marginBottom: '12px' }}>
                              {day.activities.map((activity, aIndex) => (
                                <div key={aIndex}
                                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: '#fafaf9', border: '1px solid #e7e5e4', borderRadius: '8px', marginBottom: '6px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                                    <input
                                      style={{ width: '80px', padding: '4px 8px', borderRadius: '6px', border: '1px solid #e7e5e4', fontSize: '12px', color: '#78716c', outline: 'none', backgroundColor: '#fff' }}
                                      value={activity.time_slot ?? ''}
                                      onChange={(e) => {
                                        const updated = [...day.activities]
                                        updated[aIndex] = { ...updated[aIndex], time_slot: e.target.value }
                                        store.updateDay(day.day_number, { activities: updated })
                                      }}
                                      placeholder="9:00 AM" />
                                    <p style={{ fontSize: '13px', color: '#1c1917', fontWeight: 500 }}>
                                      {activity.activity_id
                                        ? activities.find(a => a.id === activity.activity_id)?.name ?? activity.custom_name
                                        : activity.custom_name}
                                    </p>
                                  </div>
                                  <button onClick={() => store.removeActivityFromDay(day.day_number, aIndex)}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: '2px' }}>
                                    <X size={14} color="#a8a29e" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Activity search + list */}
                          <div style={{ marginBottom: '10px' }}>
                            <input
                              style={{ ...inputStyle, fontSize: '13px', marginBottom: '8px' }}
                              type="text"
                              value={searchTerm}
                              onChange={(e) => setActivitySearch(prev => ({ ...prev, [day.day_number]: e.target.value }))}
                              placeholder={`Search activities for ${dayDestination?.destination_name ?? 'this destination'}...`}
                            />

                            {destActivities.length === 0 && (
                              <p style={{ fontSize: '12px', color: '#a8a29e' }}>
                                No activities found for {dayDestination?.destination_name}. Add activities in the Activities module first.
                              </p>
                            )}

                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                              {filteredActivities.map(activity => {
                                const alreadyAdded = day.activities.some(a => a.activity_id === activity.id)
                                return (
                                  <button key={activity.id}
                                    disabled={alreadyAdded}
                                    onClick={() => store.addActivityToDay(day.day_number, {
                                      activity_id: activity.id,
                                      activity_name: activity.name,
                                      sort_order: day.activities.length,
                                      is_optional: false,
                                    })}
                                    style={{ padding: '5px 12px', borderRadius: '9999px', border: `1px solid ${alreadyAdded ? '#e7e5e4' : '#d6d3d1'}`, backgroundColor: alreadyAdded ? '#f5f5f4' : '#fff', color: alreadyAdded ? '#a8a29e' : '#44403c', fontSize: '12px', cursor: alreadyAdded ? 'default' : 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    {alreadyAdded ? '✓' : '+'}
                                    {activity.name}
                                    {activity.duration_hours && (
                                      <span style={{ color: '#a8a29e' }}>{activity.duration_hours}h</span>
                                    )}
                                  </button>
                                )
                              })}
                            </div>
                          </div>

                          {/* Custom activity */}
                          <button
                            onClick={() => store.addActivityToDay(day.day_number, {
                              custom_name: 'Custom Activity',
                              sort_order: day.activities.length,
                              is_optional: false,
                            })}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '5px 10px', backgroundColor: '#fff', border: '1px dashed #d6d3d1', borderRadius: '6px', fontSize: '12px', color: '#78716c', cursor: 'pointer' }}>
                            <Plus size={12} />
                            Add custom activity
                          </button>

                          {/* Day notes + meals */}
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '12px' }}>
                            <div>
                              <label style={labelStyle}>Meals Included</label>
                              <div style={{ display: 'flex', gap: '6px' }}>
                                {['Breakfast', 'Lunch', 'Dinner'].map(meal => {
                                  const included = day.meals_included?.includes(meal)
                                  return (
                                    <button key={meal} type="button"
                                      onClick={() => {
                                        const meals = day.meals_included ?? []
                                        store.updateDay(day.day_number, {
                                          meals_included: included
                                            ? meals.filter(m => m !== meal)
                                            : [...meals, meal]
                                        })
                                      }}
                                      style={{ padding: '4px 10px', borderRadius: '6px', border: `1px solid ${included ? '#1c1917' : '#e7e5e4'}`, backgroundColor: included ? '#1c1917' : '#fff', color: included ? '#fff' : '#78716c', fontSize: '12px', cursor: 'pointer' }}>
                                      {meal.charAt(0)}
                                    </button>
                                  )
                                })}
                              </div>
                            </div>
                            <div>
                              <label style={labelStyle}>Day Notes</label>
                              <input style={{ ...inputStyle, fontSize: '12px' }} type="text"
                                value={day.notes ?? ''}
                                onChange={(e) => store.updateDay(day.day_number, { notes: e.target.value })}
                                placeholder="Overnight train, leisure day..." />
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* ── SECTION 7: INCLUSIONS ── */}
            <div style={sectionStyle}>
              <div style={sectionHeaderStyle} onClick={() => toggleSection('inclusions')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <List size={16} color="#78716c" />
                  <span style={{ fontSize: '14px', fontWeight: 600, color: '#1c1917' }}>Inclusions & Exclusions</span>
                  {store.inclusions.length > 0 && (
                    <span style={{ fontSize: '12px', backgroundColor: '#f5f5f4', color: '#78716c', padding: '1px 8px', borderRadius: '9999px' }}>
                      {store.inclusions.filter(i => i.type === 'inclusion').length} in · {store.inclusions.filter(i => i.type === 'exclusion').length} ex
                    </span>
                  )}
                </div>
                {collapsed.inclusions ? <ChevronDown size={16} color="#78716c" /> : <ChevronUp size={16} color="#78716c" />}
              </div>

              {!collapsed.inclusions && (
                <div style={{ padding: '20px' }}>
                  {['inclusion', 'exclusion'].map((type) => (
                    <div key={type} style={{ marginBottom: '20px' }}>
                      <p style={{ fontSize: '12px', fontWeight: 600, color: type === 'inclusion' ? '#166534' : '#991b1b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
                        {type === 'inclusion' ? '✓ Inclusions' : '✗ Exclusions'}
                      </p>

                      {/* Added items */}
                      {store.inclusions.filter(i => i.type === type).map((item, index) => {
                        const actualIndex = store.inclusions.indexOf(item)
                        return (
                          <div key={index}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px', backgroundColor: '#fafaf9', border: '1px solid #e7e5e4', borderRadius: '7px', marginBottom: '5px' }}>
                            <span style={{ fontSize: '13px', color: type === 'inclusion' ? '#16a34a' : '#dc2626', fontWeight: 600 }}>
                              {type === 'inclusion' ? '✓' : '✗'}
                            </span>
                            <input
                              style={{ flex: 1, border: 'none', outline: 'none', fontSize: '13px', color: '#1c1917', backgroundColor: 'transparent' }}
                              value={item.text}
                              onChange={(e) => {
                                const updated = [...store.inclusions]
                                updated[actualIndex] = { ...updated[actualIndex], text: e.target.value }
                                store.setField('inclusions', updated)
                              }} />
                            <button onClick={() => store.removeInclusion(actualIndex)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
                              <X size={13} color="#a8a29e" />
                            </button>
                          </div>
                        )
                      })}

                      {/* Library items */}
                      <div style={{ marginTop: '8px' }}>
                        <p style={{ fontSize: '11px', color: '#a8a29e', marginBottom: '6px' }}>Add from library:</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '8px' }}>
                          {libraryItems
                            .filter(li => li.type === type)
                            .filter(li => !store.inclusions.some(i => i.text === li.text && i.type === type))
                            .map(li => (
                              <button key={li.id}
                                onClick={() => store.addInclusion({ text: li.text, type: type as any })}
                                style={{ padding: '4px 10px', borderRadius: '9999px', border: '1px solid #e7e5e4', backgroundColor: '#fff', color: '#44403c', fontSize: '12px', cursor: 'pointer' }}>
                                + {li.text}
                              </button>
                            ))}
                        </div>

                        <button
                          onClick={() => store.addInclusion({ text: '', type: type as any })}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '5px 10px', backgroundColor: '#fff', border: '1px dashed #d6d3d1', borderRadius: '6px', fontSize: '12px', color: '#78716c', cursor: 'pointer' }}>
                          <Plus size={12} />
                          Add custom {type}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── SECTION 8: PRICING ── */}
            <div style={sectionStyle}>
              <div style={sectionHeaderStyle} onClick={() => toggleSection('pricing')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <DollarSign size={16} color="#78716c" />
                  <span style={{ fontSize: '14px', fontWeight: 600, color: '#1c1917' }}>Pricing</span>
                  {store.pricing.grand_total > 0 && (
                    <span style={{ fontSize: '12px', backgroundColor: '#f5f5f4', color: '#78716c', padding: '1px 8px', borderRadius: '9999px' }}>
                      ₹{store.pricing.grand_total.toLocaleString('en-IN')} total
                    </span>
                  )}
                </div>
                {collapsed.pricing ? <ChevronDown size={16} color="#78716c" /> : <ChevronUp size={16} color="#78716c" />}
              </div>

              {!collapsed.pricing && (
                <div style={{ padding: '20px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                    {[
                      { key: 'cost_per_adult', label: 'Cost per Adult (₹)' },
                      { key: 'cost_per_child', label: 'Cost per Child (₹)' },
                      { key: 'cost_per_infant', label: 'Cost per Infant (₹)' },
                    ].map(({ key, label }) => (
                      <div key={key}>
                        <label style={labelStyle}>{label}</label>
                        <input style={inputStyle} type="number" min="0"
                          value={store.pricing[key as keyof typeof store.pricing] as number}
                          onChange={(e) => store.updatePricing({ [key]: parseFloat(e.target.value) || 0 })} />
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                    <div>
                      <label style={labelStyle}>Single Supplement (₹)</label>
                      <input style={inputStyle} type="number" min="0"
                        value={store.pricing.single_supplement}
                        onChange={(e) => store.updatePricing({ single_supplement: parseFloat(e.target.value) || 0 })} />
                    </div>
                    <div>
                      <label style={labelStyle}>GST %</label>
                      <input style={inputStyle} type="number" min="0" max="28"
                        value={store.pricing.gst_percent}
                        onChange={(e) => store.updatePricing({ gst_percent: parseFloat(e.target.value) || 0 })} />
                    </div>
                    <div>
                      <label style={labelStyle}>Markup %</label>
                      <input style={inputStyle} type="number" min="0"
                        value={store.pricing.markup_percent}
                        onChange={(e) => store.updatePricing({ markup_percent: parseFloat(e.target.value) || 0 })} />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                    <div>
                      <label style={labelStyle}>Discount (₹)</label>
                      <input style={inputStyle} type="number" min="0"
                        value={store.pricing.discount_amount}
                        onChange={(e) => store.updatePricing({ discount_amount: parseFloat(e.target.value) || 0 })} />
                    </div>
                    <div>
                      <label style={labelStyle}>Discount Reason</label>
                      <input style={inputStyle} type="text"
                        value={store.pricing.discount_reason}
                        onChange={(e) => store.updatePricing({ discount_reason: e.target.value })}
                        placeholder="Repeat client, early bird..." />
                    </div>
                  </div>

                  {/* Calculated totals */}
                  <div style={{ backgroundColor: '#fafaf9', border: '1px solid #e7e5e4', borderRadius: '10px', padding: '16px', marginBottom: '16px' }}>
                    <p style={{ fontSize: '12px', fontWeight: 600, color: '#a8a29e', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
                      Calculated Totals
                    </p>
                    {[
                      { label: 'Base Total (before GST)', key: 'base_total' },
                      { label: `GST (${store.pricing.gst_percent}%)`, key: 'gst_total' },
                      { label: 'Grand Total', key: 'grand_total' },
                      { label: 'Advance Amount', key: 'advance_amount' },
                    ].map(({ label, key }) => (
                      <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <label style={{ ...labelStyle, marginBottom: 0, fontSize: '13px' }}>{label}</label>
                        <input
                          style={{ ...inputStyle, width: '160px', textAlign: 'right', fontWeight: key === 'grand_total' ? 600 : 400, fontSize: key === 'grand_total' ? '15px' : '14px' }}
                          type="number" min="0"
                          value={store.pricing[key as keyof typeof store.pricing] as number}
                          onChange={(e) => store.updatePricing({ [key]: parseFloat(e.target.value) || 0 })} />
                      </div>
                    ))}
                    <div style={{ paddingTop: '8px', borderTop: '1px solid #e7e5e4', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', color: '#78716c' }}>Balance Due</span>
                      <span style={{ fontSize: '15px', fontWeight: 600, color: '#1c1917' }}>
                        ₹{Math.max(0, store.pricing.grand_total - store.pricing.advance_amount).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  {/* Payment schedule */}
                  <p style={{ fontSize: '12px', fontWeight: 600, color: '#a8a29e', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
                    Payment Schedule
                  </p>
                  {store.paymentSchedule.map((row, index) => (
                    <div key={index}
                      style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr auto', gap: '8px', marginBottom: '8px', alignItems: 'end' }}>
                      <div>
                        {index === 0 && <label style={labelStyle}>Due Date</label>}
                        <input style={inputStyle} type="date" value={row.due_date}
                          onChange={(e) => {
                            const updated = [...store.paymentSchedule]
                            updated[index] = { ...updated[index], due_date: e.target.value }
                            store.setField('paymentSchedule', updated)
                          }} />
                      </div>
                      <div>
                        {index === 0 && <label style={labelStyle}>Amount (₹)</label>}
                        <input style={inputStyle} type="number" min="0" value={row.amount}
                          onChange={(e) => {
                            const updated = [...store.paymentSchedule]
                            updated[index] = { ...updated[index], amount: parseFloat(e.target.value) || 0 }
                            store.setField('paymentSchedule', updated)
                          }} />
                      </div>
                      <div>
                        {index === 0 && <label style={labelStyle}>Description</label>}
                        <input style={inputStyle} type="text" value={row.description}
                          onChange={(e) => {
                            const updated = [...store.paymentSchedule]
                            updated[index] = { ...updated[index], description: e.target.value }
                            store.setField('paymentSchedule', updated)
                          }}
                          placeholder="Advance payment" />
                      </div>
                      <button onClick={() => store.removePaymentRow(index)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', paddingBottom: '10px' }}>
                        <X size={15} color="#a8a29e" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => store.addPaymentRow({ due_date: '', amount: 0, description: 'Advance', is_paid: false })}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px 12px', backgroundColor: '#fff', border: '1px dashed #d6d3d1', borderRadius: '8px', fontSize: '13px', color: '#44403c', cursor: 'pointer' }}>
                    <Plus size={13} />
                    Add Payment Row
                  </button>
                </div>
              )}
            </div>

            {/* ── SECTION 9: POLICIES ── */}
            <div style={sectionStyle}>
              <div style={sectionHeaderStyle} onClick={() => toggleSection('policies')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={16} color="#78716c" />
                  <span style={{ fontSize: '14px', fontWeight: 600, color: '#1c1917' }}>Policies</span>
                  {(store.tnc_content || store.cancellation_content) && (
                    <span style={{ fontSize: '12px', backgroundColor: '#f0fdf4', color: '#166534', padding: '1px 8px', borderRadius: '9999px' }}>
                      Set
                    </span>
                  )}
                </div>
                {collapsed.policies ? <ChevronDown size={16} color="#78716c" /> : <ChevronUp size={16} color="#78716c" />}
              </div>

              {!collapsed.policies && (
                <div style={{ padding: '20px' }}>
                  {[
                    { key: 'tnc', label: 'Terms & Conditions', policyKey: 'tnc_policy_id', contentKey: 'tnc_content', type: 'terms_and_conditions' },
                    { key: 'cancel', label: 'Cancellation Policy', policyKey: 'cancellation_policy_id', contentKey: 'cancellation_content', type: 'cancellation_policy' },
                  ].map(({ key, label, policyKey, contentKey, type }) => (
                    <div key={key} style={{ marginBottom: '20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <label style={{ ...labelStyle, marginBottom: 0 }}>{label}</label>
                        <select
                          style={{ ...inputStyle, width: '220px', fontSize: '13px' }}
                          value={store[policyKey as keyof typeof store] as string}
                          onChange={(e) => {
                            const policy = policies.find(p => p.id === e.target.value)
                            store.setField(policyKey, e.target.value)
                            if (policy) store.setField(contentKey, policy.content)
                          }}>
                          <option value="">Select from library...</option>
                          {policies.filter(p => p.type === type).map(p => (
                            <option key={p.id} value={p.id}>{p.name}{p.is_default ? ' (Default)' : ''}</option>
                          ))}
                        </select>
                      </div>
                      <textarea
                        style={{ ...inputStyle, resize: 'vertical', minHeight: '120px', fontFamily: 'system-ui', fontSize: '13px', lineHeight: '1.6' }}
                        value={store[contentKey as keyof typeof store] as string}
                        onChange={(e) => store.setField(contentKey, e.target.value)}
                        placeholder={`Enter ${label.toLowerCase()} or select from library above...`} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── SECTION 10: REVIEWS ── */}
            <div style={sectionStyle}>
              <div style={sectionHeaderStyle} onClick={() => toggleSection('reviews')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Star size={16} color="#78716c" />
                  <span style={{ fontSize: '14px', fontWeight: 600, color: '#1c1917' }}>Reviews</span>
                  {store.selected_review_ids.length > 0 && (
                    <span style={{ fontSize: '12px', backgroundColor: '#f5f5f4', color: '#78716c', padding: '1px 8px', borderRadius: '9999px' }}>
                      {store.selected_review_ids.length} selected
                    </span>
                  )}
                </div>
                {collapsed.reviews ? <ChevronDown size={16} color="#78716c" /> : <ChevronUp size={16} color="#78716c" />}
              </div>

              {!collapsed.reviews && (
                <div style={{ padding: '20px' }}>
                  <p style={{ fontSize: '13px', color: '#78716c', marginBottom: '12px' }}>
                    Select reviews to include in the PDF. Choose 2–4 for best presentation.
                  </p>
                  {reviews.length === 0 && (
                    <p style={{ fontSize: '13px', color: '#a8a29e' }}>No visible reviews. Add reviews in the Reviews module.</p>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {reviews.map((review) => {
                      const selected = store.selected_review_ids.includes(review.id)
                      return (
                        <button key={review.id} type="button"
                          onClick={() => store.toggleReview(review.id)}
                          style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px 16px', borderRadius: '10px', border: `1px solid ${selected ? '#1c1917' : '#e7e5e4'}`, backgroundColor: selected ? '#1c1917' : '#fff', cursor: 'pointer', textAlign: 'left' }}>
                          <div style={{ width: '18px', height: '18px', borderRadius: '4px', border: `2px solid ${selected ? '#fff' : '#d6d3d1'}`, backgroundColor: selected ? '#fff' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>
                            {selected && <Check size={11} color="#1c1917" />}
                          </div>
                          <div>
                            <p style={{ fontSize: '13px', fontWeight: 600, color: selected ? '#fff' : '#1c1917', marginBottom: '2px' }}>
                              {review.reviewer_name}
                              {review.reviewer_city && (
                                <span style={{ fontWeight: 400, color: selected ? '#d6d3d1' : '#78716c', marginLeft: '6px' }}>
                                  · {review.reviewer_city}
                                </span>
                              )}
                              <span style={{ marginLeft: '6px', fontSize: '12px' }}>
                                {'★'.repeat(review.rating)}
                              </span>
                            </p>
                            <p style={{ fontSize: '12px', color: selected ? '#d6d3d1' : '#78716c', lineHeight: '1.5' }}>
                              {review.review_text.length > 100
                                ? review.review_text.slice(0, 100) + '...'
                                : review.review_text}
                            </p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Right: Sticky progress sidebar */}
          <div style={{ position: 'sticky', top: '80px' }}>
            <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e7e5e4', padding: '20px' }}>
              <p style={{ fontSize: '12px', fontWeight: 600, color: '#a8a29e', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '14px' }}>
                Package Summary
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                {[
                  { label: 'Package Name', value: store.name || '—', ok: !!store.name },
                  { label: 'Destinations', value: store.destinations.length > 0 ? store.destinations.map(d => d.destination_name).join(' → ') : '—', ok: store.destinations.length > 0 },
                  { label: 'Duration', value: totalNights > 0 ? `${totalNights}N / ${totalDays}D` : '—', ok: totalNights > 0 },
                  { label: 'Guests', value: `${store.adults}A${store.children > 0 ? ` ${store.children}C` : ''}${store.infants > 0 ? ` ${store.infants}I` : ''}`, ok: store.adults > 0 },
                  { label: 'Hotels', value: store.hotels.length > 0 ? `${store.hotels.length} option${store.hotels.length !== 1 ? 's' : ''}` : '—', ok: store.hotels.length > 0 },
                  { label: 'Days Planned', value: store.days.filter(d => d.activities.length > 0).length > 0 ? `${store.days.filter(d => d.activities.length > 0).length}/${store.days.length} days` : '—', ok: store.days.some(d => d.activities.length > 0) },
                  { label: 'Pricing', value: store.pricing.grand_total > 0 ? `₹${store.pricing.grand_total.toLocaleString('en-IN')}` : '—', ok: store.pricing.grand_total > 0 },
                  { label: 'Policies', value: store.tnc_content && store.cancellation_content ? 'Set' : '—', ok: !!(store.tnc_content && store.cancellation_content) },
                ].map(({ label, value, ok }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                    <span style={{ fontSize: '12px', color: '#78716c', flexShrink: 0 }}>{label}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ fontSize: '12px', color: ok ? '#1c1917' : '#a8a29e', textAlign: 'right', fontWeight: ok ? 500 : 400 }}>
                        {value}
                      </span>
                      <span style={{ fontSize: '10px', color: ok ? '#16a34a' : '#d6d3d1' }}>
                        {ok ? '●' : '○'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Status selector */}
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Status</label>
                <select style={inputStyle} value={store.status}
                  onChange={(e) => store.setField('status', e.target.value)}>
                  {STATUSES.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>

              {/* Generate PDF button — placeholder for Phase 3 */}
              <button
                onClick={async () => {
                  if (!store.packageId) return
                  if (store.isDirty) {
                    await autoSave()
                    await new Promise(r => setTimeout(r, 1000))
                  }
                  setPdfGenerating(true)
                  setPdfError('')
                  setPdfUrl('')
                  try {
                    const res = await fetch('/api/pdf/generate', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ packageId: store.packageId }),
                    })
                    const data = await res.json()
                    if (!res.ok || data.error) {
                      setPdfError(data.error || 'PDF generation failed.')
                    } else {
                      setPdfUrl(data.pdf_url)
                    }
                  } catch (err: any) {
                    setPdfError('Network error. Please try again.')
                  } finally {
                    setPdfGenerating(false)
                  }
                }}
                disabled={pdfGenerating}
                style={{
                  width: '100%',
                  padding: '11px',
                  backgroundColor: pdfGenerating ? '#78716c' : '#0D9488',
                  color: '#fff',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: pdfGenerating ? 'not-allowed' : 'pointer',
                  marginBottom: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}>
                {pdfGenerating
                  ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Generating PDF...</>
                  : '⬇ Generate PDF'
                }
              </button>

              {pdfError && (
                <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 12px', marginBottom: '8px' }}>
                  <p style={{ color: '#dc2626', fontSize: '12px' }}>{pdfError}</p>
                </div>
              )}

              {pdfUrl && (
                <a
                  href={pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '10px',
                    backgroundColor: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 500,
                    color: '#166534',
                    textAlign: 'center',
                    textDecoration: 'none',
                    marginBottom: '8px',
                  }}>
                  ✓ PDF Ready — Click to Download
                </a>
              )}

              <button
                onClick={autoSave}
                disabled={store.saving || !store.isDirty}
                style={{ width: '100%', padding: '10px', backgroundColor: store.isDirty ? '#1c1917' : '#f5f5f4', color: store.isDirty ? '#fff' : '#a8a29e', borderRadius: '8px', border: 'none', fontSize: '13px', fontWeight: 500, cursor: store.isDirty ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                {store.saving ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={14} />}
                {store.saving ? 'Saving...' : store.isDirty ? 'Save Now' : 'Saved'}
              </button>
            </div>
          </div>
        </div>
      </main>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  )
}