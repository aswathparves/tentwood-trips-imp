import TopNav from '@/components/layout/TopNav'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Users, TrendingUp, Calendar, Target } from 'lucide-react'

const budgetLabels: Record<string, string> = {
  under_25k: 'Under ₹25K',
  '25k_50k': '₹25K–50K',
  '50k_1l': '₹50K–1L',
  '1l_2l': '₹1L–2L',
  '2l_5l': '₹2L–5L',
  above_5l: 'Above ₹5L',
}

const sourceLabels: Record<string, string> = {
  instagram: '📸 Instagram',
  whatsapp: '💬 WhatsApp',
  phone_call: '📞 Phone Call',
  google: '🔍 Google',
  referral: '🤝 Referral',
  walk_in: '🚶 Walk-in',
  other: '📌 Other',
}

export default async function CRMDashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user?.id ?? '')
    .single()

  if (profile?.role !== 'admin') {
    redirect('/crm')
  }

  const { data: leads } = await supabase
    .from('leads')
    .select(`
      *,
      profiles!leads_assigned_to_fkey (full_name)
    `)
    .order('created_at', { ascending: false })

  const allLeads = leads ?? []

  const today = new Date().toISOString().split('T')[0]
  const thisWeekStart = new Date()
  thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay())
  const thisMonthStart = new Date()
  thisMonthStart.setDate(1)

  const todayLeads = allLeads.filter(l =>
    l.created_at.split('T')[0] === today
  )
  const weekLeads = allLeads.filter(l =>
    new Date(l.created_at) >= thisWeekStart
  )
  const monthLeads = allLeads.filter(l =>
    new Date(l.created_at) >= thisMonthStart
  )

  const hot = allLeads.filter(l => l.temperature === 'hot')
  const warm = allLeads.filter(l => l.temperature === 'warm')
  const cold = allLeads.filter(l => l.temperature === 'cold')

  const booked = allLeads.filter(l => l.status === 'booked')
  const lost = allLeads.filter(l => l.status === 'lost')
  const conversionRate = allLeads.length > 0
    ? ((booked.length / allLeads.length) * 100).toFixed(1)
    : '0.0'

  const followUpOverdue = allLeads.filter(l =>
    l.follow_up_date &&
    l.follow_up_date < today &&
    l.status !== 'booked' &&
    l.status !== 'lost'
  )

  const followUpToday = allLeads.filter(l =>
    l.follow_up_date === today &&
    l.status !== 'booked' &&
    l.status !== 'lost'
  )

  // By status
  const statusCounts = ['new', 'contacted', 'follow_up', 'proposal_sent', 'booked', 'lost'].map(s => ({
    status: s,
    count: allLeads.filter(l => l.status === s).length,
  }))

  // By source
  const sourceCounts = Object.keys(sourceLabels).map(s => ({
    source: s,
    label: sourceLabels[s],
    count: allLeads.filter(l => l.source === s).length,
  })).filter(s => s.count > 0).sort((a, b) => b.count - a.count)

  // By budget
  const budgetCounts = Object.keys(budgetLabels).map(b => ({
    budget: b,
    label: budgetLabels[b],
    count: allLeads.filter(l => l.budget === b).length,
  })).filter(b => b.count > 0).sort((a, b) => b.count - a.count)

  // By destination
  const destinationMap: Record<string, number> = {}
  allLeads.forEach(l => {
    if (l.destination) {
      destinationMap[l.destination] = (destinationMap[l.destination] || 0) + 1
    }
  })
  const destinationCounts = Object.entries(destinationMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)

  // By staff
  const staffMap: Record<string, { name: string; count: number; booked: number }> = {}
  allLeads.forEach(l => {
    const name = (l.profiles as any)?.full_name ?? 'Unassigned'
    if (!staffMap[name]) staffMap[name] = { name, count: 0, booked: 0 }
    staffMap[name].count++
    if (l.status === 'booked') staffMap[name].booked++
  })
  const staffCounts = Object.values(staffMap).sort((a, b) => b.count - a.count)

  const maxStaff = Math.max(...staffCounts.map(s => s.count), 1)
  const maxSource = Math.max(...sourceCounts.map(s => s.count), 1)
  const maxBudget = Math.max(...budgetCounts.map(b => b.count), 1)
  const maxDest = Math.max(...destinationCounts.map(d => d[1]), 1)

  const statusColors: Record<string, { bg: string; text: string }> = {
    new: { bg: '#f5f5f4', text: '#78716c' },
    contacted: { bg: '#dbeafe', text: '#1d4ed8' },
    follow_up: { bg: '#fef3c7', text: '#92400e' },
    proposal_sent: { bg: '#ede9fe', text: '#5b21b6' },
    booked: { bg: '#dcfce7', text: '#166534' },
    lost: { bg: '#fee2e2', text: '#991b1b' },
  }

  return (
    <>
      <TopNav title="CRM Dashboard" />
      <main className="page-container">

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#1c1917' }}>CRM Dashboard</h1>
            <p style={{ color: '#78716c', fontSize: '14px', marginTop: '2px' }}>
              Full pipeline overview — all staff
            </p>
          </div>
          <Link href="/crm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: '#1c1917', color: '#fff', padding: '8px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: 500, textDecoration: 'none' }}>
            View All Leads
          </Link>
        </div>

        {/* Top KPI cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
          {[
            { label: 'Total Leads', value: allLeads.length, sub: `${todayLeads.length} today`, icon: '👥', bg: '#fff', border: '#e7e5e4', color: '#1c1917' },
            { label: 'This Week', value: weekLeads.length, sub: `${monthLeads.length} this month`, icon: '📅', bg: '#eff6ff', border: '#bfdbfe', color: '#1d4ed8' },
            { label: 'Conversion Rate', value: `${conversionRate}%`, sub: `${booked.length} booked`, icon: '🎯', bg: '#f0fdf4', border: '#bbf7d0', color: '#166534' },
            { label: 'Overdue Follow-ups', value: followUpOverdue.length, sub: `${followUpToday.length} due today`, icon: '⚠️', bg: followUpOverdue.length > 0 ? '#fffbeb' : '#fff', border: followUpOverdue.length > 0 ? '#fde68a' : '#e7e5e4', color: followUpOverdue.length > 0 ? '#92400e' : '#1c1917' },
          ].map(({ label, value, sub, icon, bg, border, color }) => (
            <div key={label} style={{ backgroundColor: bg, border: `1px solid ${border}`, borderRadius: '12px', padding: '16px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <p style={{ fontSize: '12px', color: '#78716c' }}>{label}</p>
                <span style={{ fontSize: '20px' }}>{icon}</span>
              </div>
              <p style={{ fontSize: '28px', fontWeight: 700, color, marginBottom: '4px' }}>{value}</p>
              <p style={{ fontSize: '11px', color: '#a8a29e' }}>{sub}</p>
            </div>
          ))}
        </div>

        {/* Temperature + Status row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>

          {/* Temperature breakdown */}
          <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e7e5e4', padding: '20px' }}>
            <p style={{ fontSize: '14px', fontWeight: 600, color: '#1c1917', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={16} color="#78716c" />
              Lead Temperature
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { label: '🔥 Hot', count: hot.length, bg: '#fee2e2', fill: '#ef4444', text: '#991b1b' },
                { label: '☀️ Warm', count: warm.length, bg: '#fef3c7', fill: '#f59e0b', text: '#92400e' },
                { label: '❄️ Cold', count: cold.length, bg: '#dbeafe', fill: '#3b82f6', text: '#1d4ed8' },
              ].map(({ label, count, bg, fill, text }) => (
                <div key={label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '13px', color: text, fontWeight: 500 }}>{label}</span>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: text }}>{count}</span>
                  </div>
                  <div style={{ height: '8px', backgroundColor: '#f5f5f4', borderRadius: '9999px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${allLeads.length > 0 ? (count / allLeads.length) * 100 : 0}%`, backgroundColor: fill, borderRadius: '9999px', transition: 'width 0.3s' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Status breakdown */}
          <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e7e5e4', padding: '20px' }}>
            <p style={{ fontSize: '14px', fontWeight: 600, color: '#1c1917', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Target size={16} color="#78716c" />
              Pipeline Status
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {statusCounts.map(({ status, count }) => {
                const style = statusColors[status] ?? statusColors.new
                return (
                  <div key={status} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: style.bg, borderRadius: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 500, color: style.text, textTransform: 'capitalize' }}>
                      {status.replace('_', ' ')}
                    </span>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: style.text }}>{count}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Staff performance */}
        <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e7e5e4', padding: '20px', marginBottom: '16px' }}>
          <p style={{ fontSize: '14px', fontWeight: 600, color: '#1c1917', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={16} color="#78716c" />
            Staff Performance
          </p>
          {staffCounts.length === 0 ? (
            <p style={{ fontSize: '13px', color: '#a8a29e' }}>No leads assigned yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {staffCounts.map(({ name, count, booked }) => (
                <div key={name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '13px', color: '#1c1917', fontWeight: 500 }}>{name}</span>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <span style={{ fontSize: '12px', color: '#78716c' }}>{count} leads</span>
                      <span style={{ fontSize: '12px', color: '#166534', fontWeight: 600 }}>{booked} booked</span>
                    </div>
                  </div>
                  <div style={{ height: '8px', backgroundColor: '#f5f5f4', borderRadius: '9999px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(count / maxStaff) * 100}%`, backgroundColor: '#1c1917', borderRadius: '9999px' }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Source + Budget row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>

          {/* By source */}
          <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e7e5e4', padding: '20px' }}>
            <p style={{ fontSize: '14px', fontWeight: 600, color: '#1c1917', marginBottom: '16px' }}>
              Leads by Source
            </p>
            {sourceCounts.length === 0 ? (
              <p style={{ fontSize: '13px', color: '#a8a29e' }}>No data yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {sourceCounts.map(({ source, label, count }) => (
                  <div key={source}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '13px', color: '#44403c' }}>{label}</span>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#1c1917' }}>{count}</span>
                    </div>
                    <div style={{ height: '6px', backgroundColor: '#f5f5f4', borderRadius: '9999px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${(count / maxSource) * 100}%`, backgroundColor: '#0D9488', borderRadius: '9999px' }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* By budget */}
          <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e7e5e4', padding: '20px' }}>
            <p style={{ fontSize: '14px', fontWeight: 600, color: '#1c1917', marginBottom: '16px' }}>
              Leads by Budget
            </p>
            {budgetCounts.length === 0 ? (
              <p style={{ fontSize: '13px', color: '#a8a29e' }}>No data yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {budgetCounts.map(({ budget, label, count }) => (
                  <div key={budget}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '13px', color: '#44403c' }}>{label}</span>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#1c1917' }}>{count}</span>
                    </div>
                    <div style={{ height: '6px', backgroundColor: '#f5f5f4', borderRadius: '9999px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${(count / maxBudget) * 100}%`, backgroundColor: '#2DD4BF', borderRadius: '9999px' }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Top destinations */}
        <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e7e5e4', padding: '20px', marginBottom: '16px' }}>
          <p style={{ fontSize: '14px', fontWeight: 600, color: '#1c1917', marginBottom: '16px' }}>
            Top Destinations Enquired
          </p>
          {destinationCounts.length === 0 ? (
            <p style={{ fontSize: '13px', color: '#a8a29e' }}>No destination data yet.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
              {destinationCounts.map(([dest, count]) => (
                <div key={dest} style={{ backgroundColor: '#fafaf9', border: '1px solid #e7e5e4', borderRadius: '8px', padding: '12px 16px' }}>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: '#1c1917', marginBottom: '4px' }}>{dest}</p>
                  <p style={{ fontSize: '22px', fontWeight: 700, color: '#0D9488' }}>{count}</p>
                  <div style={{ height: '4px', backgroundColor: '#e7e5e4', borderRadius: '9999px', marginTop: '8px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(count / maxDest) * 100}%`, backgroundColor: '#0D9488', borderRadius: '9999px' }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Follow-ups due today */}
        {followUpToday.length > 0 && (
          <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
            <p style={{ fontSize: '14px', fontWeight: 600, color: '#92400e', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={16} />
              Follow-ups Due Today ({followUpToday.length})
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {followUpToday.map(lead => (
                <Link key={lead.id} href={`/crm/${lead.id}`}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #fde68a', textDecoration: 'none' }}>
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: '#1c1917' }}>{lead.client_name}</p>
                    <p style={{ fontSize: '12px', color: '#78716c' }}>
                      {lead.phone} · {lead.destination || 'No destination'} · {(lead.profiles as any)?.full_name}
                    </p>
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: '#92400e', backgroundColor: '#fef3c7', padding: '3px 10px', borderRadius: '9999px' }}>
                    {lead.temperature}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Overdue follow-ups */}
        {followUpOverdue.length > 0 && (
          <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '20px' }}>
            <p style={{ fontSize: '14px', fontWeight: 600, color: '#991b1b', marginBottom: '12px' }}>
              ⚠ Overdue Follow-ups ({followUpOverdue.length})
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {followUpOverdue.slice(0, 5).map(lead => (
                <Link key={lead.id} href={`/crm/${lead.id}`}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #fecaca', textDecoration: 'none' }}>
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: '#1c1917' }}>{lead.client_name}</p>
                    <p style={{ fontSize: '12px', color: '#78716c' }}>
                      Due {new Date(lead.follow_up_date).toLocaleDateString('en-IN')} · {(lead.profiles as any)?.full_name}
                    </p>
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: '#991b1b', backgroundColor: '#fee2e2', padding: '3px 10px', borderRadius: '9999px' }}>
                    Overdue
                  </span>
                </Link>
              ))}
              {followUpOverdue.length > 5 && (
                <Link href="/crm" style={{ fontSize: '13px', color: '#991b1b', textDecoration: 'none', textAlign: 'center', paddingTop: '4px' }}>
                  +{followUpOverdue.length - 5} more overdue
                </Link>
              )}
            </div>
          </div>
        )}

      </main>
    </>
  )
}