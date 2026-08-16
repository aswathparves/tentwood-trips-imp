'use client'

import TopNav from '@/components/layout/TopNav'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Plus, Filter, X, Search } from 'lucide-react'

const temperatureColors: Record<string, { bg: string; text: string }> = {
  cold: { bg: '#dbeafe', text: '#1d4ed8' },
  warm: { bg: '#fef3c7', text: '#92400e' },
  hot: { bg: '#fee2e2', text: '#991b1b' },
}

const statusColors: Record<string, { bg: string; text: string }> = {
  new: { bg: '#f5f5f4', text: '#78716c' },
  contacted: { bg: '#dbeafe', text: '#1d4ed8' },
  follow_up: { bg: '#fef3c7', text: '#92400e' },
  proposal_sent: { bg: '#ede9fe', text: '#5b21b6' },
  booked: { bg: '#dcfce7', text: '#166534' },
  lost: { bg: '#fee2e2', text: '#991b1b' },
}

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

interface Filters {
  search: string
  status: string
  temperature: string
  source: string
  budget: string
  staff: string
  follow_up_today: boolean
  date_from: string
  date_to: string
}

const defaultFilters: Filters = {
  search: '',
  status: '',
  temperature: '',
  source: '',
  budget: '',
  staff: '',
  follow_up_today: false,
  date_from: '',
  date_to: '',
}

export default function CRMPage() {
  const supabase = createClient()
  const [leads, setLeads] = useState<any[]>([])
  const [filteredLeads, setFilteredLeads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [currentUserId, setCurrentUserId] = useState('')
  const [staffList, setStaffList] = useState<any[]>([])
  const [filterOpen, setFilterOpen] = useState(false)
  const [filters, setFilters] = useState<Filters>(defaultFilters)
  const [profile, setProfile] = useState<any>(null)

  const activeFilterCount = Object.entries(filters).filter(([key, val]) => {
    if (key === 'follow_up_today') return val === true
    return val !== ''
  }).length

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      setCurrentUserId(user.id)

      const { data: prof } = await supabase
        .from('profiles')
        .select('role, full_name')
        .eq('id', user.id)
        .single()

      setProfile(prof)
      const admin = prof?.role === 'admin'
      setIsAdmin(admin)

      let query = supabase
        .from('leads')
        .select(`*, profiles!leads_assigned_to_fkey (full_name)`)
        .order('created_at', { ascending: false })

      if (!admin) {
        query = query.eq('assigned_to', user.id)
      }

      const { data } = await query
      setLeads(data ?? [])
      setFilteredLeads(data ?? [])

      if (admin) {
        const { data: staff } = await supabase
          .from('profiles')
          .select('id, full_name')
          .order('full_name')
        setStaffList(staff ?? [])
      }

      setLoading(false)
    }
    load()
  }, [])

  const applyFilters = useCallback(() => {
    let result = [...leads]
    const today = new Date().toISOString().split('T')[0]

    if (filters.search) {
      const s = filters.search.toLowerCase()
      result = result.filter(l =>
        l.client_name?.toLowerCase().includes(s) ||
        l.phone?.includes(s) ||
        l.destination?.toLowerCase().includes(s)
      )
    }

    if (filters.status) result = result.filter(l => l.status === filters.status)
    if (filters.temperature) result = result.filter(l => l.temperature === filters.temperature)
    if (filters.source) result = result.filter(l => l.source === filters.source)
    if (filters.budget) result = result.filter(l => l.budget === filters.budget)
    if (filters.staff) result = result.filter(l => l.assigned_to === filters.staff)
    if (filters.follow_up_today) result = result.filter(l => l.follow_up_date === today)
    if (filters.date_from) result = result.filter(l => l.created_at.split('T')[0] >= filters.date_from)
    if (filters.date_to) result = result.filter(l => l.created_at.split('T')[0] <= filters.date_to)

    setFilteredLeads(result)
  }, [leads, filters])

  useEffect(() => {
    applyFilters()
  }, [applyFilters])

  function resetFilters() {
    setFilters(defaultFilters)
  }

  const today = new Date().toISOString().split('T')[0]
  const hot = leads.filter(l => l.temperature === 'hot').length
  const followUpToday = leads.filter(l => l.follow_up_date === today && l.status !== 'booked' && l.status !== 'lost').length
  const overdue = leads.filter(l => l.follow_up_date && l.follow_up_date < today && l.status !== 'booked' && l.status !== 'lost').length

  const inputStyle = {
    width: '100%',
    padding: '8px 12px',
    borderRadius: '8px',
    border: '1px solid #d6d3d1',
    fontSize: '13px',
    color: '#1c1917',
    outline: 'none',
    backgroundColor: '#fff',
  }

  const labelStyle = {
    display: 'block' as const,
    fontSize: '12px',
    fontWeight: 600 as const,
    color: '#78716c',
    marginBottom: '5px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.04em',
  }

  return (
    <>
      <TopNav title="CRM" />

      {/* Sliding filter panel overlay */}
      {filterOpen && (
        <div
          onClick={() => setFilterOpen(false)}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.3)', zIndex: 40 }}
        />
      )}

      {/* Filter panel */}
      <div style={{
        position: 'fixed',
        top: 0,
        right: filterOpen ? 0 : '-380px',
        width: '380px',
        height: '100vh',
        backgroundColor: '#fff',
        borderLeft: '1px solid #e7e5e4',
        zIndex: 50,
        transition: 'right 0.3s ease',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: filterOpen ? '-4px 0 24px rgba(0,0,0,0.1)' : 'none',
      }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #f5f5f4', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#1c1917' }}>Filters</h2>
            {activeFilterCount > 0 && (
              <p style={{ fontSize: '12px', color: '#0D9488', marginTop: '2px' }}>{activeFilterCount} active filter{activeFilterCount !== 1 ? 's' : ''}</p>
            )}
          </div>
          <button onClick={() => setFilterOpen(false)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: '4px' }}>
            <X size={20} color="#78716c" />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Search */}
          <div>
            <label style={labelStyle}>Search</label>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#a8a29e' }} />
              <input style={{ ...inputStyle, paddingLeft: '32px' }} type="text"
                value={filters.search}
                onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
                placeholder="Name, phone, destination..." />
            </div>
          </div>

          {/* Status */}
          <div>
            <label style={labelStyle}>Status</label>
            <select style={inputStyle} value={filters.status}
              onChange={(e) => setFilters(f => ({ ...f, status: e.target.value }))}>
              <option value="">All Statuses</option>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="follow_up">Follow Up</option>
              <option value="proposal_sent">Proposal Sent</option>
              <option value="booked">Booked</option>
              <option value="lost">Lost</option>
            </select>
          </div>

          {/* Temperature */}
          <div>
            <label style={labelStyle}>Temperature</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[
                { value: '', label: 'All' },
                { value: 'hot', label: '🔥 Hot' },
                { value: 'warm', label: '☀️ Warm' },
                { value: 'cold', label: '❄️ Cold' },
              ].map(opt => (
                <button key={opt.value} type="button"
                  onClick={() => setFilters(f => ({ ...f, temperature: opt.value }))}
                  style={{
                    flex: 1, padding: '7px 4px', borderRadius: '8px', fontSize: '12px',
                    border: `1px solid ${filters.temperature === opt.value ? '#1c1917' : '#e7e5e4'}`,
                    backgroundColor: filters.temperature === opt.value ? '#1c1917' : '#fff',
                    color: filters.temperature === opt.value ? '#fff' : '#44403c',
                    cursor: 'pointer', fontWeight: filters.temperature === opt.value ? 600 : 400,
                  }}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Source */}
          <div>
            <label style={labelStyle}>Source</label>
            <select style={inputStyle} value={filters.source}
              onChange={(e) => setFilters(f => ({ ...f, source: e.target.value }))}>
              <option value="">All Sources</option>
              {Object.entries(sourceLabels).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>

          {/* Budget */}
          <div>
            <label style={labelStyle}>Budget Range</label>
            <select style={inputStyle} value={filters.budget}
              onChange={(e) => setFilters(f => ({ ...f, budget: e.target.value }))}>
              <option value="">All Budgets</option>
              {Object.entries(budgetLabels).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>

          {/* Staff — admin only */}
          {isAdmin && (
            <div>
              <label style={labelStyle}>Assigned Staff</label>
              <select style={inputStyle} value={filters.staff}
                onChange={(e) => setFilters(f => ({ ...f, staff: e.target.value }))}>
                <option value="">All Staff</option>
                {staffList.map(s => (
                  <option key={s.id} value={s.id}>{s.full_name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Date range */}
          <div>
            <label style={labelStyle}>Date Range (Lead Created)</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <p style={{ fontSize: '11px', color: '#a8a29e', marginBottom: '4px' }}>From</p>
                <input style={inputStyle} type="date" value={filters.date_from}
                  onChange={(e) => setFilters(f => ({ ...f, date_from: e.target.value }))} />
              </div>
              <div>
                <p style={{ fontSize: '11px', color: '#a8a29e', marginBottom: '4px' }}>To</p>
                <input style={inputStyle} type="date" value={filters.date_to}
                  onChange={(e) => setFilters(f => ({ ...f, date_to: e.target.value }))} />
              </div>
            </div>
          </div>

          {/* Follow-up today toggle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', backgroundColor: '#fafaf9', borderRadius: '8px', border: '1px solid #e7e5e4' }}>
            <div>
              <p style={{ fontSize: '13px', fontWeight: 500, color: '#1c1917' }}>Follow-up Today Only</p>
              <p style={{ fontSize: '11px', color: '#78716c', marginTop: '2px' }}>Show only leads due today</p>
            </div>
            <button type="button"
              onClick={() => setFilters(f => ({ ...f, follow_up_today: !f.follow_up_today }))}
              style={{ width: '40px', height: '22px', borderRadius: '9999px', backgroundColor: filters.follow_up_today ? '#1c1917' : '#d6d3d1', border: 'none', cursor: 'pointer', position: 'relative', flexShrink: 0 }}>
              <span style={{ position: 'absolute', top: '3px', left: filters.follow_up_today ? '21px' : '3px', width: '16px', height: '16px', backgroundColor: '#fff', borderRadius: '9999px', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
            </button>
          </div>
        </div>

        {/* Filter panel footer */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid #f5f5f4', display: 'flex', gap: '10px' }}>
          <button onClick={resetFilters}
            style={{ flex: 1, padding: '10px', backgroundColor: '#fff', border: '1px solid #d6d3d1', borderRadius: '8px', fontSize: '14px', color: '#44403c', cursor: 'pointer', fontWeight: 500 }}>
            Reset All
          </button>
          <button onClick={() => setFilterOpen(false)}
            style={{ flex: 1, padding: '10px', backgroundColor: '#1c1917', border: 'none', borderRadius: '8px', fontSize: '14px', color: '#fff', cursor: 'pointer', fontWeight: 500 }}>
            Apply
          </button>
        </div>
      </div>

      <main className="page-container">

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#1c1917' }}>
              {isAdmin ? 'All Leads' : 'My Leads'}
            </h1>
            <p style={{ color: '#78716c', fontSize: '14px', marginTop: '2px' }}>
              {filteredLeads.length} of {leads.length} leads
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {isAdmin && (
              <Link href="/crm/dashboard"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', backgroundColor: '#fff', border: '1px solid #e7e5e4', borderRadius: '8px', fontSize: '14px', color: '#44403c', textDecoration: 'none', fontWeight: 500 }}>
                📊 Dashboard
              </Link>
            )}
            <button
              onClick={() => setFilterOpen(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 14px', backgroundColor: activeFilterCount > 0 ? '#1c1917' : '#fff', border: `1px solid ${activeFilterCount > 0 ? '#1c1917' : '#e7e5e4'}`, borderRadius: '8px', fontSize: '14px', color: activeFilterCount > 0 ? '#fff' : '#44403c', cursor: 'pointer', fontWeight: 500 }}>
              <Filter size={15} />
              Filters
              {activeFilterCount > 0 && (
                <span style={{ backgroundColor: '#fff', color: '#1c1917', borderRadius: '9999px', fontSize: '11px', fontWeight: 700, padding: '0 6px', minWidth: '18px', textAlign: 'center' }}>
                  {activeFilterCount}
                </span>
              )}
            </button>
            <Link href="/crm/new"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: '#0D9488', color: '#fff', padding: '8px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: 500, textDecoration: 'none' }}>
              <Plus size={16} />
              New Lead
            </Link>
          </div>
        </div>

        {/* Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
          {[
            { label: 'Total Leads', value: leads.length, bg: '#fff', border: '#e7e5e4', color: '#1c1917' },
            { label: '🔥 Hot Leads', value: hot, bg: '#fef2f2', border: '#fecaca', color: '#991b1b' },
            { label: '📅 Follow-up Today', value: followUpToday, bg: '#eff6ff', border: '#bfdbfe', color: '#1d4ed8' },
            { label: '⚠ Overdue', value: overdue, bg: overdue > 0 ? '#fffbeb' : '#fff', border: overdue > 0 ? '#fde68a' : '#e7e5e4', color: overdue > 0 ? '#92400e' : '#1c1917' },
          ].map(({ label, value, bg, border, color }) => (
            <div key={label} style={{ backgroundColor: bg, border: `1px solid ${border}`, borderRadius: '12px', padding: '14px 18px' }}>
              <p style={{ fontSize: '12px', color: '#78716c', marginBottom: '4px' }}>{label}</p>
              <p style={{ fontSize: '26px', fontWeight: 700, color }}>{value}</p>
            </div>
          ))}
        </div>

        {/* Active filter chips */}
        {activeFilterCount > 0 && (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: '#78716c' }}>Active filters:</span>
            {filters.status && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', backgroundColor: '#f5f5f4', color: '#44403c', padding: '3px 10px', borderRadius: '9999px' }}>
                {filters.status.replace('_', ' ')}
                <button onClick={() => setFilters(f => ({ ...f, status: '' }))} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 0 }}><X size={11} /></button>
              </span>
            )}
            {filters.temperature && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', backgroundColor: '#f5f5f4', color: '#44403c', padding: '3px 10px', borderRadius: '9999px' }}>
                {filters.temperature}
                <button onClick={() => setFilters(f => ({ ...f, temperature: '' }))} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 0 }}><X size={11} /></button>
              </span>
            )}
            {filters.source && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', backgroundColor: '#f5f5f4', color: '#44403c', padding: '3px 10px', borderRadius: '9999px' }}>
                {sourceLabels[filters.source]}
                <button onClick={() => setFilters(f => ({ ...f, source: '' }))} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 0 }}><X size={11} /></button>
              </span>
            )}
            {filters.budget && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', backgroundColor: '#f5f5f4', color: '#44403c', padding: '3px 10px', borderRadius: '9999px' }}>
                {budgetLabels[filters.budget]}
                <button onClick={() => setFilters(f => ({ ...f, budget: '' }))} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 0 }}><X size={11} /></button>
              </span>
            )}
            {filters.follow_up_today && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', backgroundColor: '#f5f5f4', color: '#44403c', padding: '3px 10px', borderRadius: '9999px' }}>
                Follow-up Today
                <button onClick={() => setFilters(f => ({ ...f, follow_up_today: false }))} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 0 }}><X size={11} /></button>
              </span>
            )}
            {filters.search && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', backgroundColor: '#f5f5f4', color: '#44403c', padding: '3px 10px', borderRadius: '9999px' }}>
                "{filters.search}"
                <button onClick={() => setFilters(f => ({ ...f, search: '' }))} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 0 }}><X size={11} /></button>
              </span>
            )}
            <button onClick={resetFilters}
              style={{ fontSize: '12px', color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', padding: '3px 6px' }}>
              Clear all
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && filteredLeads.length === 0 && (
          <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e7e5e4', padding: '48px 24px', textAlign: 'center' }}>
            <p style={{ color: '#78716c', fontSize: '14px', marginBottom: '16px' }}>
              {leads.length === 0 ? 'No leads yet. Log your first lead.' : 'No leads match your filters.'}
            </p>
            {leads.length === 0 && (
              <Link href="/crm/new"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: '#1c1917', color: '#fff', padding: '10px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: 500, textDecoration: 'none' }}>
                <Plus size={16} />
                New Lead
              </Link>
            )}
            {leads.length > 0 && (
              <button onClick={resetFilters}
                style={{ backgroundColor: '#fff', border: '1px solid #d6d3d1', color: '#44403c', padding: '8px 16px', borderRadius: '8px', fontSize: '14px', cursor: 'pointer' }}>
                Clear Filters
              </button>
            )}
          </div>
        )}

        {/* Leads list */}
        {filteredLeads.length > 0 && (
          <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e7e5e4', overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr', gap: '12px', padding: '10px 20px', backgroundColor: '#fafaf9', borderBottom: '1px solid #f5f5f4' }}>
              {['Client', 'Destination', 'Budget', 'Source', 'Temperature', 'Status'].map(h => (
                <p key={h} style={{ fontSize: '11px', fontWeight: 600, color: '#a8a29e', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</p>
              ))}
            </div>

            {filteredLeads.map((lead, i) => {
              const tempStyle = temperatureColors[lead.temperature] ?? temperatureColors.cold
              const statusStyle = statusColors[lead.status] ?? statusColors.new
              const isOverdue = lead.follow_up_date &&
                lead.follow_up_date < today &&
                lead.status !== 'booked' &&
                lead.status !== 'lost'

              return (
                <Link key={lead.id} href={`/crm/${lead.id}`}
                  style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr', gap: '12px', padding: '14px 20px', borderTop: i === 0 ? 'none' : '1px solid #f5f5f4', textDecoration: 'none', backgroundColor: isOverdue ? '#fffbeb' : '#fff', alignItems: 'center' }}>

                  <div>
                    <p style={{ fontSize: '14px', fontWeight: 500, color: '#1c1917' }}>{lead.client_name}</p>
                    <p style={{ fontSize: '12px', color: '#78716c', marginTop: '2px' }}>
                      {lead.phone}
                      {isAdmin && (lead.profiles as any)?.full_name && (
                        <span style={{ marginLeft: '8px', color: '#a8a29e' }}>· {(lead.profiles as any).full_name}</span>
                      )}
                    </p>
                    {isOverdue && (
                      <p style={{ fontSize: '11px', color: '#92400e', fontWeight: 600, marginTop: '2px' }}>⚠ Follow-up overdue</p>
                    )}
                    {lead.follow_up_date === today && !isOverdue && (
                      <p style={{ fontSize: '11px', color: '#1d4ed8', fontWeight: 600, marginTop: '2px' }}>📅 Follow-up today</p>
                    )}
                  </div>

                  <p style={{ fontSize: '13px', color: '#44403c' }}>{lead.destination || '—'}</p>
                  <p style={{ fontSize: '13px', color: '#44403c' }}>{budgetLabels[lead.budget] || '—'}</p>
                  <p style={{ fontSize: '13px', color: '#44403c' }}>{sourceLabels[lead.source] || lead.source}</p>

                  <span style={{ fontSize: '11px', fontWeight: 600, padding: '3px 10px', borderRadius: '9999px', backgroundColor: tempStyle.bg, color: tempStyle.text, textTransform: 'capitalize', width: 'fit-content' }}>
                    {lead.temperature}
                  </span>

                  <span style={{ fontSize: '11px', fontWeight: 600, padding: '3px 10px', borderRadius: '9999px', backgroundColor: statusStyle.bg, color: statusStyle.text, textTransform: 'capitalize', width: 'fit-content' }}>
                    {lead.status.replace('_', ' ')}
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