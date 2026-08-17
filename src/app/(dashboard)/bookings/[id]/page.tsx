'use client'

import TopNav from '@/components/layout/TopNav'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Save, X, Trash2 } from 'lucide-react'
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
  padding: '20px',
  marginBottom: '16px',
}

const sectionTitle = {
  fontSize: '14px',
  fontWeight: 600,
  color: '#1c1917',
  marginBottom: '16px',
  paddingBottom: '10px',
  borderBottom: '1px solid #f5f5f4',
}

export default function BookingDetailPage() {
  const supabase = createClient()
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [lead, setLead] = useState<any>(null)
  const [passengers, setPassengers] = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [newPassengers, setNewPassengers] = useState<any[]>([])
  const [newPayments, setNewPayments] = useState<any[]>([])

  const [form, setForm] = useState({
    status: 'pending',
    destination: '',
    travel_date_from: '',
    travel_date_to: '',
    adults: 1,
    children: 0,
    infants: 0,
    total_amount: 0,
    paid_amount: 0,
    notes: '',
  })

  const [bookingRef, setBookingRef] = useState('')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      if (profile?.role === 'admin') setIsAdmin(true)

      const { data: booking, error } = await supabase
        .from('bookings')
        .select(`
          *,
          leads (client_name, phone, email)
        `)
        .eq('id', id)
        .single()

      if (error || !booking) {
        setNotFound(true)
        setLoading(false)
        return
      }

      setLead(booking.leads)
      setBookingRef(booking.booking_reference)

      setForm({
        status: booking.status ?? 'pending',
        destination: booking.destination ?? '',
        travel_date_from: booking.travel_date_from ?? '',
        travel_date_to: booking.travel_date_to ?? '',
        adults: booking.adults ?? 1,
        children: booking.children ?? 0,
        infants: booking.infants ?? 0,
        total_amount: booking.total_amount ?? 0,
        paid_amount: booking.paid_amount ?? 0,
        notes: booking.notes ?? '',
      })

      // Load passengers
      const { data: paxData } = await supabase
        .from('passengers')
        .select('*')
        .eq('booking_id', id)
        .order('created_at')
      setPassengers(paxData ?? [])

      // Load payments
      const { data: payData } = await supabase
        .from('booking_payments')
        .select('*')
        .eq('booking_id', id)
        .order('due_date')
      setPayments(payData ?? [])

      setLoading(false)
    }
    load()
  }, [id])

  async function handleSave() {
    setSaving(true)
    setError('')
    setSuccess('')

    // Update booking
    const { error: bookingError } = await supabase
      .from('bookings')
      .update({
        status: form.status,
        destination: form.destination,
        travel_date_from: form.travel_date_from || null,
        travel_date_to: form.travel_date_to || null,
        adults: form.adults,
        children: form.children,
        infants: form.infants,
        total_amount: form.total_amount,
        paid_amount: form.paid_amount,
        notes: form.notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (bookingError) {
      setError(bookingError.message)
      setSaving(false)
      return
    }

    // Insert new passengers
    if (newPassengers.filter(p => p.full_name.trim()).length > 0) {
      const { error: paxError } = await supabase
        .from('passengers')
        .insert(
          newPassengers
            .filter(p => p.full_name.trim())
            .map(p => ({
              booking_id: id,
              full_name: p.full_name.trim(),
              date_of_birth: p.date_of_birth || null,
              gender: p.gender || null,
              passenger_type: p.passenger_type || 'adult',
              passport_number: p.passport_number.trim() || null,
              passport_expiry: p.passport_expiry || null,
              nationality: p.nationality.trim() || null,
              phone: p.phone.trim() || null,
              email: p.email.trim() || null,
            }))
        )

      if (paxError) {
        setError('Booking saved but failed to add passengers: ' + paxError.message)
        setSaving(false)
        return
      }

      const { data: updatedPax } = await supabase
        .from('passengers')
        .select('*')
        .eq('booking_id', id)
        .order('created_at')
      setPassengers(updatedPax ?? [])
      setNewPassengers([])
    }

    // Insert new payments
    if (newPayments.filter(p => p.amount > 0).length > 0) {
      const { error: payError } = await supabase
        .from('booking_payments')
        .insert(
          newPayments
            .filter(p => p.amount > 0)
            .map(p => ({
              booking_id: id,
              amount: p.amount,
              due_date: p.due_date,
              description: p.description || null,
              is_paid: p.is_paid || false,
              payment_method: p.payment_method || null,
              reference_number: p.reference_number || null,
            }))
        )

      if (payError) {
        setError('Booking saved but failed to add payments: ' + payError.message)
        setSaving(false)
        return
      }

      const { data: updatedPay } = await supabase
        .from('booking_payments')
        .select('*')
        .eq('booking_id', id)
        .order('due_date')
      setPayments(updatedPay ?? [])
      setNewPayments([])
    }

    setSuccess('Booking saved successfully.')
    setTimeout(() => setSuccess(''), 3000)
    setSaving(false)
  }

  async function togglePaymentPaid(paymentId: string, currentPaid: boolean) {
    const today = new Date().toISOString().split('T')[0]
    await supabase
      .from('booking_payments')
      .update({
        is_paid: !currentPaid,
        paid_date: !currentPaid ? today : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', paymentId)

    const { data } = await supabase
      .from('booking_payments')
      .select('*')
      .eq('booking_id', id)
      .order('due_date')
    setPayments(data ?? [])
  }

  async function deletePassenger(passengerId: string) {
    if (!window.confirm('Remove this passenger?')) return
    await supabase.from('passengers').delete().eq('id', passengerId)
    setPassengers(prev => prev.filter(p => p.id !== passengerId))
  }

  async function deletePayment(paymentId: string) {
    if (!window.confirm('Remove this payment entry?')) return
    await supabase.from('booking_payments').delete().eq('id', paymentId)
    setPayments(prev => prev.filter(p => p.id !== paymentId))
  }

  const totalPaid = payments.filter(p => p.is_paid).reduce((sum, p) => sum + p.amount, 0)
  const totalDue = payments.filter(p => !p.is_paid).reduce((sum, p) => sum + p.amount, 0)
  const today = new Date().toISOString().split('T')[0]

  if (loading) {
    return (
      <>
        <TopNav title="Booking" />
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
        <TopNav title="Booking" />
        <main className="page-container-sm">
          <div style={{ padding: '48px 0', textAlign: 'center' }}>
            <p style={{ color: '#a8a29e', fontSize: '14px' }}>Booking not found.</p>
            <Link href="/bookings" style={{ color: '#1c1917', fontSize: '14px', display: 'block', marginTop: '12px' }}>
              Back to Bookings
            </Link>
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <TopNav title={`Booking — ${bookingRef}`} />
      <main className="page-container-sm">

        <Link href="/bookings"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#78716c', fontSize: '14px', textDecoration: 'none', marginBottom: '24px' }}>
          <ArrowLeft size={15} />
          Back to Bookings
        </Link>

        {/* Booking header */}
        <div style={{ backgroundColor: '#1c1917', borderRadius: '12px', padding: '20px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: '11px', color: '#a8a29e', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Booking Reference</p>
            <p style={{ fontSize: '20px', fontWeight: 700, color: '#fff', fontFamily: 'monospace' }}>{bookingRef}</p>
            {lead && (
              <p style={{ fontSize: '13px', color: '#a8a29e', marginTop: '4px' }}>
                {lead.client_name} · {lead.phone}
              </p>
            )}
          </div>
          <div style={{ textAlign: 'right' }}>
            <select
              value={form.status}
              onChange={(e) => setForm(f => ({ ...f, status: e.target.value }))}
              style={{ padding: '8px 14px', borderRadius: '8px', border: 'none', fontSize: '13px', fontWeight: 600, cursor: 'pointer', backgroundColor: form.status === 'confirmed' ? '#dcfce7' : form.status === 'cancelled' ? '#fee2e2' : '#fef3c7', color: form.status === 'confirmed' ? '#166534' : form.status === 'cancelled' ? '#991b1b' : '#92400e' }}>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
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

        {/* Trip Details */}
        <div style={sectionStyle}>
          <p style={sectionTitle}>Trip Details</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Destination</label>
              <input style={inputStyle} type="text" value={form.destination}
                onChange={(e) => setForm(f => ({ ...f, destination: e.target.value }))} />
            </div>
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
          <div>
            <label style={labelStyle}>Notes</label>
            <textarea style={{ ...inputStyle, resize: 'none' }} rows={2}
              value={form.notes}
              onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Special requests, hotel preferences, dietary requirements..." />
          </div>
        </div>

        {/* Financials */}
        <div style={sectionStyle}>
          <p style={sectionTitle}>Financials</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
            <div>
              <label style={labelStyle}>Total Package Amount (₹)</label>
              <input style={inputStyle} type="number" min="0" value={form.total_amount}
                onChange={(e) => setForm(f => ({ ...f, total_amount: parseFloat(e.target.value) || 0 }))} />
            </div>
            <div>
              <label style={labelStyle}>Amount Paid So Far (₹)</label>
              <input style={inputStyle} type="number" min="0" value={form.paid_amount}
                onChange={(e) => setForm(f => ({ ...f, paid_amount: parseFloat(e.target.value) || 0 }))} />
            </div>
          </div>

          {/* Payment summary */}
          <div style={{ backgroundColor: '#fafaf9', borderRadius: '8px', padding: '14px', marginBottom: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <div>
              <p style={{ fontSize: '11px', color: '#78716c', marginBottom: '4px' }}>Total</p>
              <p style={{ fontSize: '18px', fontWeight: 700, color: '#1c1917' }}>₹{form.total_amount.toLocaleString('en-IN')}</p>
            </div>
            <div>
              <p style={{ fontSize: '11px', color: '#78716c', marginBottom: '4px' }}>Paid</p>
              <p style={{ fontSize: '18px', fontWeight: 700, color: '#166534' }}>₹{form.paid_amount.toLocaleString('en-IN')}</p>
            </div>
            <div>
              <p style={{ fontSize: '11px', color: '#78716c', marginBottom: '4px' }}>Balance</p>
              <p style={{ fontSize: '18px', fontWeight: 700, color: (form.total_amount - form.paid_amount) > 0 ? '#92400e' : '#166534' }}>
                ₹{Math.max(0, form.total_amount - form.paid_amount).toLocaleString('en-IN')}
              </p>
            </div>
          </div>

          {/* Payment schedule */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <p style={{ fontSize: '13px', fontWeight: 600, color: '#44403c' }}>Payment Schedule</p>
            <button
              onClick={() => setNewPayments(prev => [...prev, { amount: 0, due_date: '', description: 'Balance payment', is_paid: false, payment_method: 'upi', reference_number: '' }])}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#1c1917', backgroundColor: '#f5f5f4', border: '1px solid #e7e5e4', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer' }}>
              <Plus size={12} />
              Add Entry
            </button>
          </div>

          {/* Existing payments */}
          {payments.map((payment) => {
            const isOverdue = !payment.is_paid && payment.due_date < today
            return (
              <div key={payment.id}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', backgroundColor: payment.is_paid ? '#f0fdf4' : isOverdue ? '#fef2f2' : '#fafaf9', border: `1px solid ${payment.is_paid ? '#bbf7d0' : isOverdue ? '#fecaca' : '#e7e5e4'}`, borderRadius: '8px', marginBottom: '6px' }}>
                <div>
                  <p style={{ fontSize: '13px', fontWeight: 500, color: '#1c1917' }}>
                    ₹{payment.amount.toLocaleString('en-IN')}
                    {payment.description && <span style={{ color: '#78716c', fontWeight: 400, marginLeft: '8px' }}>· {payment.description}</span>}
                  </p>
                  <p style={{ fontSize: '11px', color: '#78716c', marginTop: '2px' }}>
                    Due: {new Date(payment.due_date).toLocaleDateString('en-IN')}
                    {payment.is_paid && payment.paid_date && ` · Paid: ${new Date(payment.paid_date).toLocaleDateString('en-IN')}`}
                    {isOverdue && <span style={{ color: '#dc2626', fontWeight: 600 }}> · OVERDUE</span>}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button
                    onClick={() => togglePaymentPaid(payment.id, payment.is_paid)}
                    style={{ padding: '5px 12px', borderRadius: '6px', border: `1px solid ${payment.is_paid ? '#bbf7d0' : '#d6d3d1'}`, backgroundColor: payment.is_paid ? '#dcfce7' : '#fff', color: payment.is_paid ? '#166534' : '#78716c', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                    {payment.is_paid ? '✓ Paid' : 'Mark Paid'}
                  </button>
                  <button onClick={() => deletePayment(payment.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: '4px' }}>
                    <Trash2 size={13} color="#a8a29e" />
                  </button>
                </div>
              </div>
            )
          })}

          {/* New payment entries */}
          {newPayments.map((payment, index) => (
            <div key={index}
              style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '14px', marginBottom: '8px', position: 'relative' }}>
              <p style={{ fontSize: '11px', color: '#16a34a', fontWeight: 600, marginBottom: '10px' }}>NEW ENTRY</p>
              <button onClick={() => setNewPayments(prev => prev.filter((_, i) => i !== index))}
                style={{ position: 'absolute', top: '12px', right: '12px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
                <X size={14} color="#a8a29e" />
              </button>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                <div>
                  <label style={labelStyle}>Amount (₹)</label>
                  <input style={inputStyle} type="number" min="0" value={payment.amount}
                    onChange={(e) => setNewPayments(prev => prev.map((p, i) => i === index ? { ...p, amount: parseFloat(e.target.value) || 0 } : p))} />
                </div>
                <div>
                  <label style={labelStyle}>Due Date</label>
                  <input style={inputStyle} type="date" value={payment.due_date}
                    onChange={(e) => setNewPayments(prev => prev.map((p, i) => i === index ? { ...p, due_date: e.target.value } : p))} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={labelStyle}>Description</label>
                  <input style={inputStyle} type="text" value={payment.description}
                    onChange={(e) => setNewPayments(prev => prev.map((p, i) => i === index ? { ...p, description: e.target.value } : p))}
                    placeholder="Advance, Balance..." />
                </div>
                <div>
                  <label style={labelStyle}>Payment Method</label>
                  <select style={inputStyle} value={payment.payment_method}
                    onChange={(e) => setNewPayments(prev => prev.map((p, i) => i === index ? { ...p, payment_method: e.target.value } : p))}>
                    <option value="upi">UPI</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Passengers */}
        <div style={sectionStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', paddingBottom: '10px', borderBottom: '1px solid #f5f5f4' }}>
            <p style={{ fontSize: '14px', fontWeight: 600, color: '#1c1917' }}>
              Passengers ({passengers.length + newPassengers.length})
            </p>
            <button
              onClick={() => setNewPassengers(prev => [...prev, { full_name: '', date_of_birth: '', gender: '', passenger_type: 'adult', passport_number: '', passport_expiry: '', nationality: '', phone: '', email: '' }])}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#1c1917', backgroundColor: '#f5f5f4', border: '1px solid #e7e5e4', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer' }}>
              <Plus size={12} />
              Add Passenger
            </button>
          </div>

          {/* Existing passengers */}
          {passengers.map((pax) => (
            <div key={pax.id}
              style={{ backgroundColor: '#fafaf9', border: '1px solid #e7e5e4', borderRadius: '10px', padding: '14px', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <p style={{ fontSize: '14px', fontWeight: 600, color: '#1c1917' }}>{pax.full_name}</p>
                  <span style={{ fontSize: '11px', backgroundColor: '#f5f5f4', color: '#78716c', padding: '2px 8px', borderRadius: '9999px', textTransform: 'capitalize' }}>
                    {pax.passenger_type}
                  </span>
                </div>
                <button onClick={() => deletePassenger(pax.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: '4px' }}>
                  <Trash2 size={13} color="#a8a29e" />
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', fontSize: '12px', color: '#78716c' }}>
                {pax.date_of_birth && <span>DOB: {new Date(pax.date_of_birth).toLocaleDateString('en-IN')}</span>}
                {pax.passport_number && <span>Passport: {pax.passport_number}</span>}
                {pax.passport_expiry && <span>Expires: {new Date(pax.passport_expiry).toLocaleDateString('en-IN')}</span>}
                {pax.nationality && <span>Nationality: {pax.nationality}</span>}
                {pax.gender && <span>Gender: {pax.gender}</span>}
                {pax.phone && <span>Phone: {pax.phone}</span>}
              </div>
            </div>
          ))}

          {/* New passenger forms */}
          {newPassengers.map((pax, index) => (
            <div key={index}
              style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '16px', marginBottom: '10px', position: 'relative' }}>
              <p style={{ fontSize: '11px', color: '#16a34a', fontWeight: 600, marginBottom: '12px' }}>NEW PASSENGER</p>
              <button onClick={() => setNewPassengers(prev => prev.filter((_, i) => i !== index))}
                style={{ position: 'absolute', top: '12px', right: '12px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
                <X size={15} color="#a8a29e" />
              </button>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px', marginBottom: '10px' }}>
                <div>
                  <label style={labelStyle}>Full Name (as per passport) *</label>
                  <input style={inputStyle} type="text" value={pax.full_name}
                    onChange={(e) => setNewPassengers(prev => prev.map((p, i) => i === index ? { ...p, full_name: e.target.value } : p))}
                    placeholder="SURNAME FIRSTNAME" />
                </div>
                <div>
                  <label style={labelStyle}>Type</label>
                  <select style={inputStyle} value={pax.passenger_type}
                    onChange={(e) => setNewPassengers(prev => prev.map((p, i) => i === index ? { ...p, passenger_type: e.target.value } : p))}>
                    <option value="adult">Adult</option>
                    <option value="child">Child</option>
                    <option value="infant">Infant</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                <div>
                  <label style={labelStyle}>Date of Birth</label>
                  <input style={inputStyle} type="date" value={pax.date_of_birth}
                    onChange={(e) => setNewPassengers(prev => prev.map((p, i) => i === index ? { ...p, date_of_birth: e.target.value } : p))} />
                </div>
                <div>
                  <label style={labelStyle}>Gender</label>
                  <select style={inputStyle} value={pax.gender}
                    onChange={(e) => setNewPassengers(prev => prev.map((p, i) => i === index ? { ...p, gender: e.target.value } : p))}>
                    <option value="">Select...</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Nationality</label>
                  <input style={inputStyle} type="text" value={pax.nationality}
                    onChange={(e) => setNewPassengers(prev => prev.map((p, i) => i === index ? { ...p, nationality: e.target.value } : p))}
                    placeholder="Indian" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={labelStyle}>Passport Number</label>
                  <input style={inputStyle} type="text" value={pax.passport_number}
                    onChange={(e) => setNewPassengers(prev => prev.map((p, i) => i === index ? { ...p, passport_number: e.target.value } : p))}
                    placeholder="A1234567" />
                </div>
                <div>
                  <label style={labelStyle}>Passport Expiry</label>
                  <input style={inputStyle} type="date" value={pax.passport_expiry}
                    onChange={(e) => setNewPassengers(prev => prev.map((p, i) => i === index ? { ...p, passport_expiry: e.target.value } : p))} />
                </div>
              </div>
            </div>
          ))}

          {passengers.length === 0 && newPassengers.length === 0 && (
            <p style={{ fontSize: '13px', color: '#a8a29e', textAlign: 'center', padding: '20px 0' }}>
              No passengers added yet. Click Add Passenger to begin.
            </p>
          )}
        </div>

        {/* Save button */}
        <div style={{ display: 'flex', gap: '12px', paddingBottom: '40px' }}>
          <button onClick={handleSave} disabled={saving}
            style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', backgroundColor: saving ? '#78716c' : '#1c1917', color: '#fff', padding: '12px', borderRadius: '8px', fontSize: '14px', fontWeight: 500, border: 'none', cursor: saving ? 'not-allowed' : 'pointer' }}>
            <Save size={15} />
            {saving ? 'Saving...' : 'Save Booking'}
          </button>
          <Link href="/bookings"
            style={{ padding: '12px 20px', border: '1px solid #d6d3d1', color: '#44403c', borderRadius: '8px', fontSize: '14px', fontWeight: 500, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
            Cancel
          </Link>
        </div>
      </main>
    </>
  )
}