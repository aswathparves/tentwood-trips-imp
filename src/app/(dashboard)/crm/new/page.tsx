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

const DMC_LIST = [
  'Baligo', 'Travclan', 'Tatabye', 'IDMC', 'ACT',
  'Travino', 'Great Deal', 'Indo China', 'Tourale',
  'TBO', 'JE', 'Lotus', 'Alburaq', 'Andaman Experts',
  'Others',
]

export default function NewLeadPage() {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [staffList, setStaffList] = useState<any[]>([])
  const [isAdmin, setIsAdmin] = useState(false)

  const [form, setForm] = useState({
    client_name: '',
    phone: '',
    email: '',
    region: '',
    source: 'phone_call',
    dmc: '',
    dmc_custom: '',
    destination: '',
    travel_date_from: '',
    travel_date_to: '',
    adults: 1,
    children: 0,
    budget: '',
    temperature: 'cold',
    status: 'new',
    assigned_to: '',
    notes: '',
    follow_up_date: '',
  })

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('role, full_name')
        .eq('id', user.id)
        .single()

      setCurrentUser({ ...user, ...profile })
      setIsAdmin(profile?.role === 'admin')
      setForm(f => ({ ...f, assigned_to: user.id }))

      if (profile?.role === 'admin') {
        const { data: staff } = await supabase
          .from('profiles')
          .select('id, full_name, role')
          .order('full_name')
        setStaffList(staff ?? [])
      }
    }
    load()
  }, [])

  async function handleSubmit() {
    if (!form.client_name.trim()) {
      setError('Client name is required.')
      return
    }
    if (!form.phone.trim()) {
      setError('Phone number is required.')
      return
    }
    if (!form.assigned_to) {
      setError('Please assign this lead to a staff member.')
      return
    }

    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()

    const finalDmc = form.dmc === 'Others' ? form.dmc_custom.trim() || 'Others' : form.dmc

    const { error } = await supabase.from('leads').insert({
      client_name: form.client_name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim() || null,
      region: form.region.trim() || null,
      source: form.source,
      dmc: finalDmc || null,
      destination: form.destination.trim() || null,
      travel_date_from: form.travel_date_from || null,
      travel_date_to: form.travel_date_to || null,
      adults: form.adults,
      children: form.children,
      budget: form.budget || null,
      temperature: form.temperature,
      status: form.status,
      assigned_to: form.assigned_to,
      notes: form.notes.trim() || null,
      follow_up_date: form.follow_up_date || null,
      created_by: user?.id,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/crm')
    router.refresh()
  }

  return (
    <>
      <TopNav title="New Lead" />
      <main className="page-container-sm">

        <Link href="/crm"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#78716c', fontSize: '14px', textDecoration: 'none', marginBottom: '24px' }}>
          <ArrowLeft size={15} />
          Back to CRM
        </Link>

        <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e7e5e4', padding: '24px' }}>
          <h1 style={{ fontSize: '18px', fontWeight: 600, color: '#1c1917', marginBottom: '24px' }}>
            Log New Lead
          </h1>

          {error && (
            <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px' }}>
              <p style={{ color: '#dc2626', fontSize: '14px' }}>{error}</p>
            </div>
          )}

          {/* Client Info */}
          <p style={{ fontSize: '12px', fontWeight: 600, color: '#a8a29e', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
            Client Information
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={labelStyle}>Client Name <span style={{ color: '#ef4444' }}>*</span></label>
              <input style={inputStyle} type="text" value={form.client_name}
                onChange={(e) => setForm(f => ({ ...f, client_name: e.target.value }))}
                placeholder="Rajesh Kumar" />
            </div>
            <div>
              <label style={labelStyle}>Phone <span style={{ color: '#ef4444' }}>*</span></label>
              <input style={inputStyle} type="text" value={form.phone}
                onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="+91 98765 43210" />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div>
              <label style={labelStyle}>Email <span style={{ color: '#a8a29e', fontWeight: 400 }}>(optional)</span></label>
              <input style={inputStyle} type="email" value={form.email}
                onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="rajesh@email.com" />
            </div>
            <div>
              <label style={labelStyle}>Region <span style={{ color: '#a8a29e', fontWeight: 400 }}>(optional)</span></label>
              <input style={inputStyle} type="text" value={form.region}
              onChange={(e) => setForm(f => ({ ...f, region: e.target.value }))}
              placeholder="e.g. North India, APAC, Europe" />
            </div>
            <div>
              <label style={labelStyle}>Lead Source</label>
              <select style={inputStyle} value={form.source}
                onChange={(e) => setForm(f => ({ ...f, source: e.target.value }))}>
                <option value="phone_call">📞 Phone Call</option>
                <option value="whatsapp">💬 WhatsApp</option>
                <option value="instagram">📸 Instagram</option>
                <option value="google">🔍 Google</option>
                <option value="referral">🤝 Referral</option>
                <option value="walk_in">🚶 Walk-in</option>
                <option value="other">📌 Other</option>
              </select>
            </div>
          </div>

          {/* DMC */}
          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>DMC</label>
            <select style={inputStyle} value={form.dmc}
              onChange={(e) => setForm(f => ({ ...f, dmc: e.target.value, dmc_custom: '' }))}>
              <option value="">Select DMC...</option>
              {DMC_LIST.map(dmc => (
                <option key={dmc} value={dmc}>{dmc}</option>
              ))}
            </select>
            {form.dmc === 'Others' && (
              <input
                style={{ ...inputStyle, marginTop: '8px' }}
                type="text"
                value={form.dmc_custom}
                onChange={(e) => setForm(f => ({ ...f, dmc_custom: e.target.value }))}
                placeholder="Enter DMC name..." />
            )}
          </div>

          {/* Trip Details */}
          <div style={{ borderTop: '1px solid #f5f5f4', paddingTop: '20px', marginBottom: '20px' }}>
            <p style={{ fontSize: '12px', fontWeight: 600, color: '#a8a29e', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
              Trip Details
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={labelStyle}>Destination Interested In</label>
                <input style={inputStyle} type="text" value={form.destination}
                  onChange={(e) => setForm(f => ({ ...f, destination: e.target.value }))}
                  placeholder="Phu Quoc, Kashmir, Maldives..." />
              </div>
              <div>
                <label style={labelStyle}>Budget Range</label>
                <select style={inputStyle} value={form.budget}
                  onChange={(e) => setForm(f => ({ ...f, budget: e.target.value }))}>
                  <option value="">Select budget...</option>
                  <option value="under_25k">Under ₹25,000</option>
                  <option value="25k_50k">₹25,000 – ₹50,000</option>
                  <option value="50k_1l">₹50,000 – ₹1,00,000</option>
                  <option value="1l_2l">₹1,00,000 – ₹2,00,000</option>
                  <option value="2l_5l">₹2,00,000 – ₹5,00,000</option>
                  <option value="above_5l">Above ₹5,00,000</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={labelStyle}>Travel From Date</label>
                <input style={inputStyle} type="date" value={form.travel_date_from}
                  onChange={(e) => setForm(f => ({ ...f, travel_date_from: e.target.value }))} />
              </div>
              <div>
                <label style={labelStyle}>Travel To Date</label>
                <input style={inputStyle} type="date" value={form.travel_date_to}
                  onChange={(e) => setForm(f => ({ ...f, travel_date_to: e.target.value }))} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Adults</label>
                <input style={inputStyle} type="number" min="1" value={form.adults}
                  onChange={(e) => setForm(f => ({ ...f, adults: parseInt(e.target.value) || 1 }))} />
              </div>
              <div>
                <label style={labelStyle}>Children</label>
                <input style={inputStyle} type="number" min="0" value={form.children}
                  onChange={(e) => setForm(f => ({ ...f, children: parseInt(e.target.value) || 0 }))} />
              </div>
            </div>
          </div>

          {/* Lead Classification */}
          <div style={{ borderTop: '1px solid #f5f5f4', paddingTop: '20px', marginBottom: '20px' }}>
            <p style={{ fontSize: '12px', fontWeight: 600, color: '#a8a29e', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
              Lead Classification
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={labelStyle}>Temperature</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[
                    { value: 'cold', label: '❄️ Cold', bg: '#dbeafe', active: '#1d4ed8' },
                    { value: 'warm', label: '☀️ Warm', bg: '#fef3c7', active: '#92400e' },
                    { value: 'hot', label: '🔥 Hot', bg: '#fee2e2', active: '#991b1b' },
                  ].map(opt => (
                    <button key={opt.value} type="button"
                      onClick={() => setForm(f => ({ ...f, temperature: opt.value }))}
                      style={{
                        flex: 1, padding: '8px', borderRadius: '8px',
                        border: `2px solid ${form.temperature === opt.value ? opt.active : '#e7e5e4'}`,
                        backgroundColor: form.temperature === opt.value ? opt.bg : '#fff',
                        color: form.temperature === opt.value ? opt.active : '#78716c',
                        fontSize: '13px', fontWeight: form.temperature === opt.value ? 600 : 400,
                        cursor: 'pointer',
                      }}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={labelStyle}>Status</label>
                <select style={inputStyle} value={form.status}
                  onChange={(e) => setForm(f => ({ ...f, status: e.target.value }))}>
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="follow_up">Follow Up</option>
                  <option value="proposal_sent">Proposal Sent</option>
                  <option value="booked">Booked</option>
                  <option value="lost">Lost</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Follow-up Date</label>
                <input style={inputStyle} type="date" value={form.follow_up_date}
                  onChange={(e) => setForm(f => ({ ...f, follow_up_date: e.target.value }))} />
              </div>

              {isAdmin && (
                <div>
                  <label style={labelStyle}>Assign To</label>
                  <select style={inputStyle} value={form.assigned_to}
                    onChange={(e) => setForm(f => ({ ...f, assigned_to: e.target.value }))}>
                    <option value="">Select staff...</option>
                    {staffList.map(s => (
                      <option key={s.id} value={s.id}>{s.full_name} ({s.role})</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          <div style={{ borderTop: '1px solid #f5f5f4', paddingTop: '20px', marginBottom: '24px' }}>
            <label style={labelStyle}>Notes</label>
            <textarea style={{ ...inputStyle, resize: 'none' }} rows={3}
              value={form.notes}
              onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="What did the client ask for? Any special requirements..." />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={handleSubmit} disabled={loading}
              style={{ flex: 1, backgroundColor: loading ? '#78716c' : '#1c1917', color: '#fff', padding: '11px', borderRadius: '8px', fontSize: '14px', fontWeight: 500, border: 'none', cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? 'Saving...' : 'Save Lead'}
            </button>
            <Link href="/crm"
              style={{ padding: '11px 20px', border: '1px solid #d6d3d1', color: '#44403c', borderRadius: '8px', fontSize: '14px', fontWeight: 500, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
              Cancel
            </Link>
          </div>
        </div>
      </main>
    </>
  )
}