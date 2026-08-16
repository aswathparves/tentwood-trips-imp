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

const statusColors: Record<string, { bg: string; text: string }> = {
  new: { bg: '#f5f5f4', text: '#78716c' },
  contacted: { bg: '#dbeafe', text: '#1d4ed8' },
  follow_up: { bg: '#fef3c7', text: '#92400e' },
  proposal_sent: { bg: '#ede9fe', text: '#5b21b6' },
  booked: { bg: '#dcfce7', text: '#166534' },
  lost: { bg: '#fee2e2', text: '#991b1b' },
}

export default function LeadDetailPage() {
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
  const [staffList, setStaffList] = useState<any[]>([])

  const [form, setForm] = useState({
    client_name: '',
    phone: '',
    email: '',
    source: 'phone_call',
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

  const [assignedStaffName, setAssignedStaffName] = useState('')
  const [createdAt, setCreatedAt] = useState('')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      const admin = profile?.role === 'admin'
      setIsAdmin(admin)

      if (admin) {
        const { data: staff } = await supabase
          .from('profiles')
          .select('id, full_name, role')
          .order('full_name')
        setStaffList(staff ?? [])
      }

      const { data: lead, error } = await supabase
        .from('leads')
        .select(`
          *,
          profiles!leads_assigned_to_fkey (full_name)
        `)
        .eq('id', id)
        .single()

      if (error || !lead) {
        setNotFound(true)
        setLoading(false)
        return
      }

      setAssignedStaffName((lead.profiles as any)?.full_name ?? '')
      setCreatedAt(new Date(lead.created_at).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      }))

      setForm({
        client_name: lead.client_name ?? '',
        phone: lead.phone ?? '',
        email: lead.email ?? '',
        source: lead.source ?? 'phone_call',
        destination: lead.destination ?? '',
        travel_date_from: lead.travel_date_from ?? '',
        travel_date_to: lead.travel_date_to ?? '',
        adults: lead.adults ?? 1,
        children: lead.children ?? 0,
        budget: lead.budget ?? '',
        temperature: lead.temperature ?? 'cold',
        status: lead.status ?? 'new',
        assigned_to: lead.assigned_to ?? '',
        notes: lead.notes ?? '',
        follow_up_date: lead.follow_up_date ?? '',
      })

      setLoading(false)
    }
    load()
  }, [id])

  async function handleSave() {
    if (!form.client_name.trim() || !form.phone.trim()) {
      setError('Client name and phone are required.')
      return
    }
    setSaving(true)
    setError('')
    setSuccess('')

    const { error } = await supabase
      .from('leads')
      .update({
        client_name: form.client_name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || null,
        source: form.source,
        destination: form.destination.trim() || null,
        travel_date_from: form.travel_date_from || null,
        travel_date_to: form.travel_date_to || null,
        adults: form.adults,
        children: form.children,
        budget: form.budget || null,
        temperature: form.temperature,
        status: form.status,
        assigned_to: form.assigned_to || null,
        notes: form.notes.trim() || null,
        follow_up_date: form.follow_up_date || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) {
      setError(error.message)
    } else {
      setSuccess('Lead updated successfully.')
      setTimeout(() => setSuccess(''), 3000)
    }
    setSaving(false)
  }

  async function handleDelete() {
    if (!isAdmin) return
    if (!window.confirm(`Delete lead for "${form.client_name}"? This cannot be undone.`)) return

    await supabase.from('leads').delete().eq('id', id)
    router.push('/crm')
    router.refresh()
  }

  if (loading) {
    return (
      <>
        <TopNav title="Lead" />
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
        <TopNav title="Lead" />
        <main className="page-container-sm">
          <div style={{ padding: '48px 0', textAlign: 'center' }}>
            <p style={{ color: '#a8a29e', fontSize: '14px' }}>Lead not found.</p>
            <Link href="/crm" style={{ color: '#1c1917', fontSize: '14px', display: 'block', marginTop: '12px' }}>
              Back to CRM
            </Link>
          </div>
        </main>
      </>
    )
  }

  const statusStyle = statusColors[form.status] ?? statusColors.new

  return (
    <>
      <TopNav title={form.client_name} />
      <main className="page-container-sm">

        <Link href="/crm"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#78716c', fontSize: '14px', textDecoration: 'none', marginBottom: '24px' }}>
          <ArrowLeft size={15} />
          Back to CRM
        </Link>

        <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e7e5e4', padding: '24px' }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
            <div>
              <h1 style={{ fontSize: '18px', fontWeight: 600, color: '#1c1917' }}>
                {form.client_name}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '12px', color: '#78716c' }}>
                  Logged {createdAt}
                </span>
                {assignedStaffName && (
                  <span style={{ fontSize: '12px', color: '#78716c' }}>
                    · Assigned to {assignedStaffName}
                  </span>
                )}
                <span style={{
                  fontSize: '11px', fontWeight: 600,
                  padding: '2px 10px', borderRadius: '9999px',
                  backgroundColor: statusStyle.bg, color: statusStyle.text,
                  textTransform: 'capitalize',
                }}>
                  {form.status.replace('_', ' ')}
                </span>
              </div>
            </div>

            {isAdmin && (
              <button onClick={handleDelete}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', backgroundColor: '#fff', border: '1px solid #fca5a5', borderRadius: '8px', color: '#dc2626', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>
                <Trash2 size={14} />
                Delete
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

          {/* Quick status + temperature update */}
          <div style={{ backgroundColor: '#fafaf9', border: '1px solid #e7e5e4', borderRadius: '10px', padding: '16px', marginBottom: '20px' }}>
            <p style={{ fontSize: '12px', fontWeight: 600, color: '#a8a29e', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
              Quick Update
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
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
                        fontSize: '12px', fontWeight: form.temperature === opt.value ? 600 : 400,
                        cursor: 'pointer',
                      }}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ marginTop: '12px' }}>
              <label style={labelStyle}>Follow-up Date</label>
              <input style={{ ...inputStyle, maxWidth: '200px' }} type="date"
                value={form.follow_up_date}
                onChange={(e) => setForm(f => ({ ...f, follow_up_date: e.target.value }))} />
            </div>
          </div>

          {/* Client Info */}
          <p style={{ fontSize: '12px', fontWeight: 600, color: '#a8a29e', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
            Client Information
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={labelStyle}>Client Name</label>
              <input style={inputStyle} type="text" value={form.client_name}
                onChange={(e) => setForm(f => ({ ...f, client_name: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>Phone</label>
              <input style={inputStyle} type="text" value={form.phone}
                onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div>
              <label style={labelStyle}>Email</label>
              <input style={inputStyle} type="email" value={form.email}
                onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>Source</label>
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

          {/* Trip Details */}
          <div style={{ borderTop: '1px solid #f5f5f4', paddingTop: '20px', marginBottom: '20px' }}>
            <p style={{ fontSize: '12px', fontWeight: 600, color: '#a8a29e', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
              Trip Details
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={labelStyle}>Destination</label>
                <input style={inputStyle} type="text" value={form.destination}
                  onChange={(e) => setForm(f => ({ ...f, destination: e.target.value }))} />
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
                <label style={labelStyle}>Travel From</label>
                <input style={inputStyle} type="date" value={form.travel_date_from}
                  onChange={(e) => setForm(f => ({ ...f, travel_date_from: e.target.value }))} />
              </div>
              <div>
                <label style={labelStyle}>Travel To</label>
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

          {/* Assignment — admin only */}
          {isAdmin && (
            <div style={{ borderTop: '1px solid #f5f5f4', paddingTop: '20px', marginBottom: '20px' }}>
              <p style={{ fontSize: '12px', fontWeight: 600, color: '#a8a29e', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
                Assignment
              </p>
              <div>
                <label style={labelStyle}>Assigned To</label>
                <select style={inputStyle} value={form.assigned_to}
                  onChange={(e) => setForm(f => ({ ...f, assigned_to: e.target.value }))}>
                  <option value="">Select staff...</option>
                  {staffList.map(s => (
                    <option key={s.id} value={s.id}>{s.full_name} ({s.role})</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Notes */}
          <div style={{ borderTop: '1px solid #f5f5f4', paddingTop: '20px', marginBottom: '24px' }}>
            <label style={labelStyle}>Notes</label>
            <textarea style={{ ...inputStyle, resize: 'none' }} rows={4}
              value={form.notes}
              onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Add notes about this lead..." />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={handleSave} disabled={saving}
              style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', backgroundColor: saving ? '#78716c' : '#1c1917', color: '#fff', padding: '11px', borderRadius: '8px', fontSize: '14px', fontWeight: 500, border: 'none', cursor: saving ? 'not-allowed' : 'pointer' }}>
              <Save size={15} />
              {saving ? 'Saving...' : 'Save Changes'}
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