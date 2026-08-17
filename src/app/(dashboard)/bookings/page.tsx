import TopNav from '@/components/layout/TopNav'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

const statusColors: Record<string, { bg: string; text: string }> = {
  pending: { bg: '#fef3c7', text: '#92400e' },
  confirmed: { bg: '#dcfce7', text: '#166534' },
  cancelled: { bg: '#fee2e2', text: '#991b1b' },
}

export default async function BookingsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user?.id ?? '')
    .single()

  const isAdmin = profile?.role === 'admin'

  let query = supabase
    .from('bookings')
    .select(`
      *,
      leads (client_name, phone),
      profiles!bookings_assigned_to_fkey (full_name)
    `)
    .order('created_at', { ascending: false })

  if (!isAdmin) {
    query = query.eq('assigned_to', user?.id)
  }

  const { data: bookings, error } = await query

  const total = bookings?.length ?? 0
  const confirmed = bookings?.filter(b => b.status === 'confirmed').length ?? 0
  const pending = bookings?.filter(b => b.status === 'pending').length ?? 0
  const totalRevenue = bookings?.reduce((sum, b) => sum + (b.total_amount || 0), 0) ?? 0
  const totalPaid = bookings?.reduce((sum, b) => sum + (b.paid_amount || 0), 0) ?? 0
  const totalBalance = bookings?.reduce((sum, b) => sum + (b.balance_amount || 0), 0) ?? 0

  return (
    <>
      <TopNav title="Bookings" />
      <main className="page-container">

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#1c1917' }}>Bookings</h1>
            <p style={{ color: '#78716c', fontSize: '14px', marginTop: '2px' }}>
              {isAdmin ? 'All bookings across team' : 'Your bookings'}
            </p>
          </div>
        </div>

        {/* Summary cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
          {[
            { label: 'Total Bookings', value: total, sub: `${confirmed} confirmed · ${pending} pending`, bg: '#fff', border: '#e7e5e4', color: '#1c1917' },
            { label: 'Total Revenue', value: `₹${totalRevenue.toLocaleString('en-IN')}`, sub: `₹${totalPaid.toLocaleString('en-IN')} received`, bg: '#f0fdf4', border: '#bbf7d0', color: '#166534' },
            { label: 'Balance Due', value: `₹${totalBalance.toLocaleString('en-IN')}`, sub: 'Across all bookings', bg: totalBalance > 0 ? '#fffbeb' : '#fff', border: totalBalance > 0 ? '#fde68a' : '#e7e5e4', color: totalBalance > 0 ? '#92400e' : '#1c1917' },
          ].map(({ label, value, sub, bg, border, color }) => (
            <div key={label} style={{ backgroundColor: bg, border: `1px solid ${border}`, borderRadius: '12px', padding: '16px 20px' }}>
              <p style={{ fontSize: '12px', color: '#78716c', marginBottom: '6px' }}>{label}</p>
              <p style={{ fontSize: '24px', fontWeight: 700, color, marginBottom: '4px' }}>{value}</p>
              <p style={{ fontSize: '11px', color: '#a8a29e' }}>{sub}</p>
            </div>
          ))}
        </div>

        {error && (
          <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px' }}>
            <p style={{ color: '#dc2626', fontSize: '14px' }}>Failed to load bookings: {error.message}</p>
          </div>
        )}

        {!error && (!bookings || bookings.length === 0) && (
          <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e7e5e4', padding: '64px 24px', textAlign: 'center' }}>
            <p style={{ color: '#78716c', fontSize: '14px' }}>
              No bookings yet. Bookings are created automatically when a lead is marked as Booked.
            </p>
          </div>
        )}

        {bookings && bookings.length > 0 && (
          <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e7e5e4', overflow: 'hidden' }}>

            {/* Table header */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 1fr', gap: '12px', padding: '10px 20px', backgroundColor: '#fafaf9', borderBottom: '1px solid #f5f5f4' }}>
              {['Client', 'Destination', 'Travel Dates', 'Amount', 'Balance', 'Status'].map(h => (
                <p key={h} style={{ fontSize: '11px', fontWeight: 600, color: '#a8a29e', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</p>
              ))}
            </div>

            {bookings.map((booking, i) => {
              const statusStyle = statusColors[booking.status] ?? statusColors.pending
              const isBalanceDue = booking.balance_amount > 0
              const today = new Date().toISOString().split('T')[0]
              const travelSoon = booking.travel_date_from &&
                booking.travel_date_from <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] &&
                booking.travel_date_from >= today

              return (
                <Link key={booking.id} href={`/bookings/${booking.id}`}
                  style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 1fr', gap: '12px', padding: '14px 20px', borderTop: i === 0 ? 'none' : '1px solid #f5f5f4', textDecoration: 'none', backgroundColor: travelSoon ? '#f0fdf4' : '#fff', alignItems: 'center' }}>

                  <div>
                    <p style={{ fontSize: '14px', fontWeight: 500, color: '#1c1917' }}>
                      {(booking.leads as any)?.client_name || 'Unknown'}
                    </p>
                    <p style={{ fontSize: '12px', color: '#78716c', marginTop: '2px' }}>
                      {booking.booking_reference}
                    </p>
                    {isAdmin && (booking.profiles as any)?.full_name && (
                      <p style={{ fontSize: '11px', color: '#a8a29e', marginTop: '1px' }}>
                        {(booking.profiles as any).full_name}
                      </p>
                    )}
                    {travelSoon && (
                      <p style={{ fontSize: '11px', color: '#166534', fontWeight: 600, marginTop: '2px' }}>
                        ✈ Travel soon
                      </p>
                    )}
                  </div>

                  <p style={{ fontSize: '13px', color: '#44403c' }}>{booking.destination}</p>

                  <div>
                    <p style={{ fontSize: '13px', color: '#44403c' }}>
                      {booking.travel_date_from
                        ? new Date(booking.travel_date_from).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                        : '—'}
                      {' → '}
                      {booking.travel_date_to
                        ? new Date(booking.travel_date_to).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                        : '—'}
                    </p>
                    <p style={{ fontSize: '11px', color: '#a8a29e', marginTop: '2px' }}>
                      {booking.total_nights} nights · {booking.adults + booking.children} pax
                    </p>
                  </div>

                  <p style={{ fontSize: '13px', fontWeight: 500, color: '#1c1917' }}>
                    ₹{(booking.total_amount || 0).toLocaleString('en-IN')}
                  </p>

                  <p style={{ fontSize: '13px', fontWeight: 500, color: isBalanceDue ? '#92400e' : '#166534' }}>
                    {isBalanceDue
                      ? `₹${(booking.balance_amount || 0).toLocaleString('en-IN')} due`
                      : '✓ Paid'}
                  </p>

                  <span style={{ fontSize: '11px', fontWeight: 600, padding: '3px 10px', borderRadius: '9999px', backgroundColor: statusStyle.bg, color: statusStyle.text, textTransform: 'capitalize', width: 'fit-content' }}>
                    {booking.status}
                  </span>
                </Link>
              )
            })}
          </div>
        )}
      </main>
    </>
  )
}