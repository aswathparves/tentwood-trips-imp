'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  AlertCircle,
  ArrowRight,
  BarChart2,
  CalendarCheck,
  CalendarClock,
  ChevronDown,
  ChevronRight,
  Download,
  IndianRupee,
  MapPin,
  TrendingUp,
  Users,
  Wallet,
  Zap,
} from 'lucide-react'

/* ─── Types ─────────────────────────────────────────────── */

type Lead = {
  id: string
  client_name: string
  status: string
  temperature: string
  source: string | null
  destination: string | null
  budget: number | null
  follow_up_date: string | null
  assigned_to: string | null
  created_at: string
}

type Booking = {
  id: string
  booking_reference: string | null
  status: string
  destination: string | null
  total_amount: number | null
  paid_amount: number | null
  balance_amount: number | null
  assigned_to: string | null
  travel_date_from: string | null
  created_at: string
}

type Profile = {
  id: string
  full_name: string
  role: string
}

type DashboardData = {
  leads: Lead[]
  bookings: Booking[]
  profiles: Profile[]
}

type DateFilter = 'today' | '7days' | '30days' | 'month' | 'custom' | 'all'

/* ─── Constants ──────────────────────────────────────────── */

const PIPELINE_STAGES = [
  { key: 'new',           label: 'New',           color: '#94a3b8' },
  { key: 'contacted',     label: 'Contacted',      color: '#60a5fa' },
  { key: 'follow_up',     label: 'Follow-up',      color: '#fbbf24' },
  { key: 'proposal_sent', label: 'Proposal Sent',  color: '#a78bfa' },
  { key: 'booked',        label: 'Booked',         color: '#34d399' },
  { key: 'lost',          label: 'Lost',           color: '#f87171' },
]

const SOURCE_LABELS: Record<string, string> = {
  instagram:  'Instagram',
  whatsapp:   'WhatsApp',
  phone_call: 'Phone Call',
  google:     'Google',
  referral:   'Referral',
  walk_in:    'Walk-in',
  other:      'Other',
}

/* ─── Helpers ────────────────────────────────────────────── */

const rupee = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

function fmt(n: number) {
  return rupee.format(n)
}

function compact(n: number) {
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(1)}Cr`
  if (n >= 100_000)    return `₹${(n / 100_000).toFixed(1)}L`
  if (n >= 1_000)      return `₹${(n / 1_000).toFixed(0)}K`
  return fmt(n)
}

function normalize(s: string | null | undefined) {
  return (s ?? '').trim().toLowerCase().replace(/\s+/g, '_')
}

function today0() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

function withinRange(
  iso: string,
  filter: DateFilter,
  from = '',
  to = ''
) {
  const d = new Date(iso)
  const start = today0()

  if (filter === 'all') return true

  if (filter === 'today') {
    const end = new Date(start)
    end.setDate(end.getDate() + 1)
    return d >= start && d < end
  }

  if (filter === '7days') {
    start.setDate(start.getDate() - 6)
    return d >= start
  }

  if (filter === '30days') {
    start.setDate(start.getDate() - 29)
    return d >= start
  }

  if (filter === 'month') {
    start.setDate(1)
    return d >= start
  }

  if (filter === 'custom') {
    const date = iso.slice(0, 10)
    return (!from || date >= from) && (!to || date <= to)
  }

  return true
}

function periodLabel(f: DateFilter) {
  return { today: 'Today', '7days': 'Last 7 days', '30days': 'Last 30 days', month: 'This month', custom: 'Custom', all: 'All time' }[f]
}

function fmtDate(s: string | null) {
  if (!s) return '—'
  return new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
}

function initials(name: string) {
  return name.split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?'
}

/* ─── Main Component ─────────────────────────────────────── */

export default function DashboardClient({ data }: { data: DashboardData }) {
  const [dateFilter, setDateFilter] = useState<DateFilter>('30days')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [staffFilter, setStaffFilter] = useState('all')
  const [destinationFilter, setDestinationFilter] = useState('all')

  const destinations = useMemo(() =>
    Array.from(new Set([
      ...data.leads.map(l => l.destination),
      ...data.bookings.map(b => b.destination),
    ].filter(Boolean) as string[])).sort()
  , [data])

  const leads = useMemo(() => data.leads.filter(l => {
    if (!withinRange(l.created_at, dateFilter, customFrom, customTo)) return false
    if (staffFilter !== 'all' && l.assigned_to !== staffFilter) return false
    if (destinationFilter !== 'all' && l.destination !== destinationFilter) return false
    return true
  }), [data.leads, dateFilter, staffFilter, destinationFilter, customFrom, customTo])

  const bookings = useMemo(() => data.bookings.filter(b => {
    if (!withinRange(b.created_at, dateFilter, customFrom, customTo)) return false
    if (staffFilter !== 'all' && b.assigned_to !== staffFilter) return false
    if (destinationFilter !== 'all' && b.destination !== destinationFilter) return false
    return normalize(b.status) !== 'cancelled'
  }), [data.bookings, dateFilter, staffFilter, destinationFilter, customFrom, customTo])

  /* KPIs */
  const totalValue     = bookings.reduce((s, b) => s + Number(b.total_amount  || 0), 0)
  const totalCollected = bookings.reduce((s, b) => s + Number(b.paid_amount   || 0), 0)
  const totalBalance   = Math.max(totalValue - totalCollected, 0)
  const bookedLeads    = leads.filter(l => normalize(l.status) === 'booked').length
  const convRate       = leads.length > 0 ? Math.round((bookedLeads / leads.length) * 100) : 0
  const collRate       = totalValue > 0    ? Math.round((totalCollected / totalValue) * 100) : 0

  /* Follow-ups */
  const tod = today0()
  const followToday   = data.leads.filter(l => {
    if (!l.follow_up_date) return false
    const d = new Date(l.follow_up_date); d.setHours(0,0,0,0)
    if (d.getTime() !== tod.getTime()) return false
    if (staffFilter !== 'all' && l.assigned_to !== staffFilter) return false
    return normalize(l.status) !== 'booked' && normalize(l.status) !== 'lost'
  })
  const followOverdue = data.leads.filter(l => {
    if (!l.follow_up_date) return false
    const d = new Date(l.follow_up_date); d.setHours(0,0,0,0)
    if (d >= tod) return false
    if (staffFilter !== 'all' && l.assigned_to !== staffFilter) return false
    return normalize(l.status) !== 'booked' && normalize(l.status) !== 'lost'
  })

  /* Pipeline */
  const pipeline = PIPELINE_STAGES.map(stage => {
    const count = leads.filter(l => normalize(l.status) === stage.key).length
    return { ...stage, count, pct: leads.length > 0 ? Math.round((count / leads.length) * 100) : 0 }
  })
  const pipelineMax = Math.max(...pipeline.map(s => s.count), 1)

  /* Destinations */
  const destStats = useMemo(() => {
    const map = new Map<string, { leads: number; bookings: number; value: number }>()
    leads.forEach(l => {
      if (!l.destination) return
      const e = map.get(l.destination) || { leads: 0, bookings: 0, value: 0 }
      e.leads++; map.set(l.destination, e)
    })
    bookings.forEach(b => {
      if (!b.destination) return
      const e = map.get(b.destination) || { leads: 0, bookings: 0, value: 0 }
      e.bookings++; e.value += Number(b.total_amount || 0); map.set(b.destination, e)
    })
    return Array.from(map.entries()).map(([destination, s]) => ({ destination, ...s }))
      .sort((a, b) => b.value - a.value || b.leads - a.leads).slice(0, 5)
  }, [leads, bookings])

  /* Sources */
  const sourceStats = useMemo(() => {
    const map = new Map<string, number>()
    leads.forEach(l => {
      const s = l.source || 'other'
      map.set(s, (map.get(s) || 0) + 1)
    })
    return Array.from(map.entries()).map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count).slice(0, 6)
  }, [leads])
  const sourceMax = Math.max(...sourceStats.map(s => s.count), 1)

  /* Staff */
  const staffStats = useMemo(() => data.profiles
    .filter(p => p.role === 'admin' || p.role === 'staff')
    .map(p => {
      const pLeads    = leads.filter(l => l.assigned_to === p.id)
      const pBookings = bookings.filter(b => b.assigned_to === p.id)
      const value     = pBookings.reduce((s, b) => s + Number(b.total_amount || 0), 0)
      const booked    = pLeads.filter(l => normalize(l.status) === 'booked').length
      return {
        ...p,
        leads:      pLeads.length,
        bookings:   pBookings.length,
        value,
        conversion: pLeads.length > 0 ? Math.round((booked / pLeads.length) * 100) : 0,
      }
    })
    .filter(s => s.leads > 0 || s.bookings > 0)
    .sort((a, b) => b.value - a.value || b.leads - a.leads)
    .slice(0, 8)
  , [data.profiles, leads, bookings])

  /* CSV Export */
  function exportCsv() {
    const headers = ['Name','Status','Temperature','Source','Destination','Budget','FollowUp','AssignedTo','CreatedAt']
    const rows = leads.map(l => {
      const staff = data.profiles.find(p => p.id === l.assigned_to)
      return [l.client_name, l.status, l.temperature, l.source||'', l.destination||'', l.budget??'', l.follow_up_date||'', staff?.full_name||'', l.created_at]
    })
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n')
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })),
      download: `tentwood-${new Date().toISOString().slice(0,10)}.csv`,
    })
    document.body.appendChild(a); a.click(); document.body.removeChild(a)
  }

  return (
    <div 
        className="dashboard-page"
        style={{ background: '#f5f4f2', minHeight: '100vh' }}
    >
      <div style={{ maxWidth: 1320, margin: '0 auto', padding: '32px 24px 60px' }}>

        {/* ── Header ───────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 28, gap: 16, flexWrap: 'wrap' }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', color: '#a8a29e', textTransform: 'uppercase', marginBottom: 6 }}>
              Admin Dashboard
            </p>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: '#1c1917', letterSpacing: '-0.025em', lineHeight: 1.1 }}>
              Business overview
            </h1>
          </div>
          <button onClick={exportCsv} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 38, padding: '0 16px', border: '1px solid #d6d3d1', borderRadius: 8, background: '#fff', fontSize: 13, fontWeight: 500, color: '#44403c', cursor: 'pointer' }}>
            <Download size={14} />
            Export CSV
          </button>
        </div>

        {/* ── Filters ──────────────────────────────────── */}
        <div className="dashboard-filters">
          <FilterSelect value={dateFilter} onChange={v => setDateFilter(v as DateFilter)}>
            <option value="today">Today</option>
            <option value="7days">Last 7 days</option>
            <option value="30days">Last 30 days</option>
            <option value="month">This month</option>
            <option value="custom">Custom</option>
            <option value="all">All time</option>
          </FilterSelect>
          {dateFilter === 'custom' && (
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="date"
                value={customFrom}
                onChange={e => setCustomFrom(e.target.value)}
                style={{
                  height: 38,
                  padding: '0 10px',
                  border: '1px solid #d6d3d1',
                  borderRadius: 8,
                  background: '#fff',
                  fontSize: 13,
                }}
              />
              <input
                type="date"
                value={customTo}
                onChange={e => setCustomTo(e.target.value)}
                style={{
                  height: 38,
                  padding: '0 10px',
                  border: '1px solid #d6d3d1',
                  borderRadius: 8,
                  background: '#fff',
                  fontSize: 13,
                }}
              />
            </div>
          )}
          <FilterSelect value={staffFilter} onChange={setStaffFilter}>
            <option value="all">All staff</option>
            {data.profiles.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
          </FilterSelect>
          <FilterSelect value={destinationFilter} onChange={setDestinationFilter}>
            <option value="all">All destinations</option>
            {destinations.map(d => <option key={d} value={d}>{d}</option>)}
          </FilterSelect>
          <span 
            className="dashboard-filter-summary"
            style={{ fontSize: 12, color: '#a8a29e', alignSelf: 'center' }}>
            {periodLabel(dateFilter)} · {leads.length} leads
          </span>
        </div>

        {/* ── KPI Row ───────────────────────────────────── */}
        <div className="dashboard-kpis">
          <KpiTile label="Total leads" value={leads.length.toLocaleString('en-IN')} sub={`${bookedLeads} booked`} icon={<Users size={15} />} />
          <KpiTile label="Active bookings" value={bookings.length.toLocaleString('en-IN')} sub={compact(totalValue) + ' total'} icon={<CalendarCheck size={15} />} accent="#16a34a" />
          <KpiTile label="Booking value" value={compact(totalValue)} sub={fmt(totalValue)} icon={<IndianRupee size={15} />} accent="#0D9488" />
          <KpiTile label="Collected" value={compact(totalCollected)} sub={`${collRate}% of total`} icon={<Wallet size={15} />} accent="#2563eb" />
        </div>

        {/* ── Two-column hero ───────────────────────────── */}
        <div className="dashboard-analytics">
          {/* Revenue card */}
          <div 
            className="dashboard-revenue"
            style={{ background: '#1c1917', borderRadius: 14, padding: '28px 32px', position: 'relative', overflow: 'hidden' }}>
            {/* decorative ring */}
            <div style={{ position: 'absolute', right: -60, top: -60, width: 260, height: 260, border: '1px solid rgba(255,255,255,0.05)', borderRadius: '50%', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', right: 20, bottom: -80, width: 200, height: 200, border: '1px solid rgba(255,255,255,0.04)', borderRadius: '50%', pointerEvents: 'none' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, position: 'relative' }}>
              <div>
                <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', color: '#78716c', textTransform: 'uppercase', marginBottom: 8 }}>Revenue</p>
                <p 
                    className="dashboard-revenue-value"
                    style={{ fontSize: 40, fontWeight: 700, color: '#fff', letterSpacing: '-0.04em', lineHeight: 1 }}>
                  {compact(totalValue)}
                </p>
                <p style={{ fontSize: 13, color: '#78716c', marginTop: 6 }}>{fmt(totalValue)} booking value</p>
              </div>
              <span style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '4px 12px', fontSize: 11, color: '#a8a29e' }}>
                {periodLabel(dateFilter)}
              </span>
            </div>

            <div
                className="dashboard-revenue-stats" 
                style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 24, position: 'relative' }}>
              {[
                { label: 'Collected',   value: compact(totalCollected) },
                { label: 'Outstanding', value: compact(totalBalance) },
                { label: 'Conversion',  value: `${convRate}%` },
              ].map(({ label, value }) => (
                <div key={label} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '12px 14px' }}>
                  <p style={{ fontSize: 11, color: '#78716c', marginBottom: 6 }}>{label}</p>
                  <p style={{ fontSize: 17, fontWeight: 600, color: '#fff', letterSpacing: '-0.02em' }}>{value}</p>
                </div>
              ))}
            </div>

            {/* Collection bar */}
            <div style={{ position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <p style={{ fontSize: 11, color: '#57534e' }}>Collection progress</p>
                <p style={{ fontSize: 11, color: '#a8a29e', fontWeight: 600 }}>{collRate}%</p>
              </div>
              <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.min(collRate, 100)}%`, background: '#34d399', borderRadius: 4, transition: 'width 0.4s ease' }} />
              </div>
            </div>
          </div>

          {/* Attention card */}
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e7e5e4', overflow: 'hidden' }}>
            <div style={{ padding: '18px 20px', borderBottom: '1px solid #f5f5f4' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#1c1917' }}>Needs attention</p>
                {(followOverdue.length + followToday.length) > 0 && (
                  <span style={{ background: '#fef2f2', color: '#dc2626', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10 }}>
                    {followOverdue.length + followToday.length}
                  </span>
                )}
              </div>
            </div>
            <AttentionRow icon={<AlertCircle size={14} />} label="Overdue follow-ups" value={followOverdue.length} danger={followOverdue.length > 0} />
            <AttentionRow icon={<CalendarClock size={14} />} label="Follow-ups today" value={followToday.length} />
            <AttentionRow icon={<IndianRupee size={14} />} label="Outstanding balance" value={compact(totalBalance)} last />
          </div>
        </div>

        {/* ── Pipeline + Sources ────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>

          {/* Pipeline */}
          <Card title="Sales pipeline" icon={<BarChart2 size={14} />} right={`${leads.length} leads`}>
            <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
              {pipeline.map(stage => (
                <div key={stage.key}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: stage.color, display: 'inline-block', flexShrink: 0 }} />
                      <span style={{ fontSize: 13, color: '#44403c' }}>{stage.label}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 11, color: '#a8a29e' }}>{stage.pct}%</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#1c1917', minWidth: 20, textAlign: 'right' }}>{stage.count}</span>
                    </div>
                  </div>
                  <div style={{ height: 5, background: '#f5f5f4', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: stage.count > 0 ? `${Math.max((stage.count / pipelineMax) * 100, 3)}%` : '0%', background: stage.color, borderRadius: 3, transition: 'width 0.4s ease' }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Sources */}
          <Card title="Lead sources" icon={<Zap size={14} />}>
            {sourceStats.length === 0
              ? <Empty label="No source data yet" />
              : (
                <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {sourceStats.map(item => (
                    <div key={item.source}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                        <span style={{ fontSize: 13, color: '#44403c' }}>{SOURCE_LABELS[item.source] ?? item.source}</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#1c1917' }}>{item.count}</span>
                      </div>
                      <div style={{ height: 5, background: '#f5f5f4', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${(item.count / sourceMax) * 100}%`, background: '#0D9488', borderRadius: 3, transition: 'width 0.4s ease' }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
          </Card>
        </div>

        {/* ── Destinations ─────────────────────────────── */}
        <Card title="Top destinations" icon={<MapPin size={14} />} style={{ marginBottom: 16 }}>
          {destStats.length === 0
            ? <Empty label="No destination data yet" />
            : (
              <div style={{ marginTop: 16 }}>
                {destStats.map((item, i) => (
                  <div key={item.destination} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0', borderTop: i === 0 ? 'none' : '1px solid #f5f5f4' }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#d6d3d1', width: 20, textAlign: 'center', flexShrink: 0 }}>{i + 1}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 14, fontWeight: 500, color: '#1c1917', marginBottom: 2 }}>{item.destination}</p>
                      <p style={{ fontSize: 11, color: '#a8a29e' }}>{item.leads} leads · {item.bookings} bookings</p>
                    </div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#1c1917', flexShrink: 0 }}>{compact(item.value)}</p>
                  </div>
                ))}
              </div>
            )}
        </Card>

        {/* ── Team performance ─────────────────────────── */}
        <Card title="Team performance" icon={<TrendingUp size={14} />} style={{ marginBottom: 16 }}>
          {staffStats.length === 0
            ? <Empty label="Assign leads to see team performance" />
            : (
              <div 
                className="dashboard-team-scroll"
                style={{ marginTop: 4, overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
                  <thead>
                    <tr>
                      {['Member', 'Leads', 'Bookings', 'Conversion', 'Booking value'].map(h => (
                        <th key={h} style={{ padding: '10px 12px', textAlign: h === 'Booking value' ? 'right' : 'left', fontSize: 11, fontWeight: 600, color: '#a8a29e', letterSpacing: '0.05em', textTransform: 'uppercase', borderBottom: '1px solid #f5f5f4' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {staffStats.map((s, i) => (
                      <tr key={s.id} style={{ borderBottom: i < staffStats.length - 1 ? '1px solid #f5f5f4' : 'none' }}>
                        <td style={{ padding: '13px 12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Monogram name={s.full_name} />
                            <div>
                              <p style={{ fontSize: 13, fontWeight: 500, color: '#1c1917' }}>{s.full_name}</p>
                              <p style={{ fontSize: 11, color: '#a8a29e', textTransform: 'capitalize' }}>{s.role}</p>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '13px 12px', fontSize: 13, color: '#44403c' }}>{s.leads}</td>
                        <td style={{ padding: '13px 12px', fontSize: 13, color: '#44403c' }}>{s.bookings}</td>
                        <td style={{ padding: '13px 12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 64, height: 4, background: '#f5f5f4', borderRadius: 2, overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${Math.min(s.conversion, 100)}%`, background: '#0D9488', borderRadius: 2 }} />
                            </div>
                            <span style={{ fontSize: 12, color: '#44403c', fontWeight: 500 }}>{s.conversion}%</span>
                          </div>
                        </td>
                        <td style={{ padding: '13px 12px', fontSize: 13, fontWeight: 600, color: '#1c1917', textAlign: 'right' }}>{compact(s.value)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
        </Card>

        {/* ── Follow-ups ────────────────────────────────── */}
        <div className="dashboard-followups">
          <FollowList
            title="Follow-ups today"
            icon={<CalendarCheck size={14} />}
            leads={followToday}
            emptyLabel="No follow-ups scheduled today"
          />
          <FollowList
            title="Overdue follow-ups"
            icon={<AlertCircle size={14} />}
            leads={followOverdue}
            danger
            emptyLabel="No overdue follow-ups"
          />
        </div>

      </div>
    </div>
  )
}

/* ─── Small Components ──────────────────────────────────── */

function FilterSelect({ value, onChange, children }: { value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <div 
        className="dashboard-filter-select"
        style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{ height: 36, padding: '0 32px 0 12px', borderRadius: 8, border: '1px solid #e7e5e4', background: '#fff', fontSize: 13, fontWeight: 500, color: '#44403c', outline: 'none', appearance: 'none', cursor: 'pointer' }}
      >
        {children}
      </select>
      <ChevronDown size={13} style={{ position: 'absolute', right: 10, color: '#a8a29e', pointerEvents: 'none' }} />
    </div>
  )
}

function KpiTile({ label, value, sub, icon, accent = '#44403c' }: { label: string; value: string; sub: string; icon: React.ReactNode; accent?: string }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e7e5e4', borderRadius: 12, padding: '20px 20px 18px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <p style={{ fontSize: 12, color: '#a8a29e', fontWeight: 500 }}>{label}</p>
        <span style={{ color: accent }}>{icon}</span>
      </div>
      <p style={{ fontSize: 26, fontWeight: 700, color: '#1c1917', letterSpacing: '-0.03em', lineHeight: 1 }}>{value}</p>
      <p style={{ fontSize: 11, color: '#a8a29e', marginTop: 6 }}>{sub}</p>
    </div>
  )
}

function Card({ title, icon, right, children, style }: { title: string; icon: React.ReactNode; right?: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e7e5e4', borderRadius: 12, padding: '18px 20px', ...style }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{ color: '#a8a29e' }}>{icon}</span>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#1c1917' }}>{title}</p>
        </div>
        {right && <p style={{ fontSize: 11, color: '#a8a29e' }}>{right}</p>}
      </div>
      {children}
    </div>
  )
}

function AttentionRow({ icon, label, value, danger, last }: { icon: React.ReactNode; label: string; value: number | string; danger?: boolean; last?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', borderBottom: last ? 'none' : '1px solid #f5f5f4' }}>
      <span style={{ color: danger ? '#dc2626' : '#a8a29e' }}>{icon}</span>
      <p style={{ flex: 1, fontSize: 13, color: '#44403c' }}>{label}</p>
      <p style={{ fontSize: 13, fontWeight: 600, color: danger ? '#dc2626' : '#1c1917' }}>{value}</p>
    </div>
  )
}

function Empty({ label }: { label: string }) {
  return (
    <p style={{ fontSize: 13, color: '#a8a29e', textAlign: 'center', padding: '32px 0' }}>{label}</p>
  )
}

function Monogram({ name }: { name: string }) {
  return (
    <span style={{ width: 32, height: 32, borderRadius: '50%', background: '#1c1917', color: '#fff', fontSize: 11, fontWeight: 600, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      {initials(name)}
    </span>
  )
}

function FollowList({ title, icon, leads, danger, emptyLabel }: { title: string; icon: React.ReactNode; leads: Lead[]; danger?: boolean; emptyLabel: string }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e7e5e4', borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px', borderBottom: '1px solid #f5f5f4' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{ color: danger ? '#dc2626' : '#a8a29e' }}>{icon}</span>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#1c1917' }}>{title}</p>
        </div>
        {leads.length > 0 && (
          <span style={{ fontSize: 11, fontWeight: 700, color: danger ? '#dc2626' : '#44403c', background: danger ? '#fef2f2' : '#f5f5f4', padding: '2px 8px', borderRadius: 10 }}>
            {leads.length}
          </span>
        )}
      </div>
      {leads.length === 0
        ? <Empty label={emptyLabel} />
        : (
          <div>
            {leads.slice(0, 6).map((lead, i) => (
              <Link key={lead.id} href={`/crm/${lead.id}`} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 18px', borderTop: i === 0 ? 'none' : '1px solid #f5f5f4', textDecoration: 'none', background: '#fff' }}>
                <Monogram name={lead.client_name} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 500, color: '#1c1917', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lead.client_name}</p>
                  <p style={{ fontSize: 11, color: '#a8a29e' }}>{lead.destination || 'No destination'}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                  <span style={{ fontSize: 11, color: danger ? '#dc2626' : '#78716c' }}>{fmtDate(lead.follow_up_date)}</span>
                  <ChevronRight size={13} color="#d6d3d1" />
                </div>
              </Link>
            ))}
          </div>
        )}
    </div>
  )
}