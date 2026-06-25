'use client'

import TopNav from '@/components/layout/TopNav'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, X, Save, Star } from 'lucide-react'

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

export default function ReviewsPage() {
  const supabase = createClient()
  const [reviews, setReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [destinations, setDestinations] = useState<any[]>([])

  const [form, setForm] = useState({
    reviewer_name: '',
    reviewer_city: '',
    destination_id: '',
    rating: 5,
    review_text: '',
    travel_month: '',
    is_visible: true,
  })

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles').select('role').eq('id', user.id).single()
        if (profile?.role === 'admin') setIsAdmin(true)
      }
      const { data: dests } = await supabase
        .from('destinations').select('id, name').is('archived_at', null).order('name')
      setDestinations(dests ?? [])
      await fetchReviews()
    }
    load()
  }, [])

  async function fetchReviews() {
    const { data } = await supabase
      .from('reviews')
      .select('*, destinations(name)')
      .order('created_at', { ascending: false })
    setReviews(data ?? [])
    setLoading(false)
  }

  function resetForm() {
    setForm({ reviewer_name: '', reviewer_city: '', destination_id: '', rating: 5, review_text: '', travel_month: '', is_visible: true })
    setEditingId(null)
    setShowForm(false)
    setError('')
  }

  function startEdit(review: any) {
    setForm({
      reviewer_name: review.reviewer_name,
      reviewer_city: review.reviewer_city ?? '',
      destination_id: review.destination_id ?? '',
      rating: review.rating,
      review_text: review.review_text,
      travel_month: review.travel_month ?? '',
      is_visible: review.is_visible,
    })
    setEditingId(review.id)
    setShowForm(true)
  }

  async function handleSave() {
    if (!form.reviewer_name.trim() || !form.review_text.trim()) {
      setError('Reviewer name and review text are required.')
      return
    }
    setSaving(true)
    setError('')

    const payload = {
      reviewer_name: form.reviewer_name.trim(),
      reviewer_city: form.reviewer_city.trim() || null,
      destination_id: form.destination_id || null,
      rating: form.rating,
      review_text: form.review_text.trim(),
      travel_month: form.travel_month.trim() || null,
      is_visible: form.is_visible,
    }

    if (editingId) {
      const { error } = await supabase.from('reviews').update(payload).eq('id', editingId)
      if (error) { setError(error.message); setSaving(false); return }
    } else {
      const { data: { user } } = await supabase.auth.getUser()
      const { error } = await supabase.from('reviews').insert({ ...payload, created_by: user?.id })
      if (error) { setError(error.message); setSaving(false); return }
    }

    await fetchReviews()
    resetForm()
    setSaving(false)
  }

  async function toggleVisibility(id: string, current: boolean) {
    await supabase.from('reviews').update({ is_visible: !current }).eq('id', id)
    await fetchReviews()
  }

  async function handleDelete(id: string) {
    if (!isAdmin) return
    if (!window.confirm('Delete this review permanently?')) return
    await supabase.from('reviews').delete().eq('id', id)
    await fetchReviews()
  }

  return (
    <>
      <TopNav title="Reviews" />
      <main className="page-container">

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#1c1917' }}>Reviews</h1>
            <p style={{ color: '#78716c', fontSize: '14px', marginTop: '2px' }}>
              {reviews.length} reviews · {reviews.filter(r => r.is_visible).length} visible in PDFs
            </p>
          </div>
          <button
            onClick={() => { setShowForm(true); setEditingId(null) }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: '#1c1917', color: '#fff', padding: '8px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: 500, border: 'none', cursor: 'pointer' }}>
            <Plus size={16} />
            Add Review
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e7e5e4', padding: '24px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#1c1917' }}>
                {editingId ? 'Edit Review' : 'New Review'}
              </h2>
              <button onClick={resetForm} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
                <X size={18} color="#78716c" />
              </button>
            </div>

            {error && (
              <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px' }}>
                <p style={{ color: '#dc2626', fontSize: '14px' }}>{error}</p>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={labelStyle}>Reviewer Name <span style={{ color: '#ef4444' }}>*</span></label>
                <input style={inputStyle} type="text" value={form.reviewer_name}
                  onChange={(e) => setForm((f) => ({ ...f, reviewer_name: e.target.value }))}
                  placeholder="Teju Ashwini" />
              </div>
              <div>
                <label style={labelStyle}>Reviewer City</label>
                <input style={inputStyle} type="text" value={form.reviewer_city}
                  onChange={(e) => setForm((f) => ({ ...f, reviewer_city: e.target.value }))}
                  placeholder="Chennai" />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={labelStyle}>Destination</label>
                <select style={inputStyle} value={form.destination_id}
                  onChange={(e) => setForm((f) => ({ ...f, destination_id: e.target.value }))}>
                  <option value="">General (not destination-specific)</option>
                  {destinations.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Travel Month</label>
                <input style={inputStyle} type="text" value={form.travel_month}
                  onChange={(e) => setForm((f) => ({ ...f, travel_month: e.target.value }))}
                  placeholder="December 2024" />
              </div>
            </div>

            {/* Star rating */}
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Rating</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} type="button"
                    onClick={() => setForm((f) => ({ ...f, rating: star }))}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '24px', color: star <= form.rating ? '#f59e0b' : '#e7e5e4', padding: '0 2px' }}>
                    ★
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Review Text <span style={{ color: '#ef4444' }}>*</span></label>
              <textarea style={{ ...inputStyle, resize: 'none' }} value={form.review_text}
                onChange={(e) => setForm((f) => ({ ...f, review_text: e.target.value }))}
                rows={3}
                placeholder="A huge thank you to Tentwood for organising our trip..." />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <button type="button"
                onClick={() => setForm((f) => ({ ...f, is_visible: !f.is_visible }))}
                style={{ width: '40px', height: '22px', borderRadius: '9999px', backgroundColor: form.is_visible ? '#1c1917' : '#d6d3d1', border: 'none', cursor: 'pointer', position: 'relative', flexShrink: 0 }}>
                <span style={{ position: 'absolute', top: '3px', left: form.is_visible ? '21px' : '3px', width: '16px', height: '16px', backgroundColor: '#fff', borderRadius: '9999px', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
              </button>
              <label style={{ fontSize: '14px', color: '#44403c' }}>
                Visible — available to include in PDFs
              </label>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={handleSave} disabled={saving}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: saving ? '#78716c' : '#1c1917', color: '#fff', padding: '8px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: 500, border: 'none', cursor: saving ? 'not-allowed' : 'pointer' }}>
                <Save size={14} />
                {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Add Review'}
              </button>
              <button onClick={resetForm}
                style={{ padding: '8px 16px', border: '1px solid #d6d3d1', color: '#44403c', borderRadius: '8px', fontSize: '14px', backgroundColor: '#fff', cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Reviews list */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <p style={{ color: '#a8a29e', fontSize: '14px' }}>Loading...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e7e5e4', padding: '48px 24px', textAlign: 'center' }}>
            <Star size={32} style={{ color: '#d6d3d1', margin: '0 auto 12px' }} />
            <p style={{ color: '#78716c', fontSize: '14px' }}>No reviews yet. Add your first review.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {reviews.map((review) => (
              <div key={review.id}
                style={{ backgroundColor: '#fff', borderRadius: '12px', border: `1px solid ${review.is_visible ? '#e7e5e4' : '#f5f5f4'}`, padding: '16px 20px', opacity: review.is_visible ? 1 : 0.6 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                      <p style={{ fontSize: '14px', fontWeight: 600, color: '#1c1917' }}>
                        {review.reviewer_name}
                      </p>
                      {review.reviewer_city && (
                        <span style={{ fontSize: '12px', color: '#78716c' }}>
                          · {review.reviewer_city}
                        </span>
                      )}
                      <div style={{ display: 'flex', gap: '1px' }}>
                        {[1, 2, 3, 4, 5].map((s) => (
                          <span key={s} style={{ fontSize: '12px', color: s <= review.rating ? '#f59e0b' : '#e7e5e4' }}>★</span>
                        ))}
                      </div>
                    </div>
                    <p style={{ fontSize: '13px', color: '#44403c', lineHeight: '1.6' }}>
                      {review.review_text}
                    </p>
                    <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                      {(review.destinations as any)?.name && (
                        <span style={{ fontSize: '11px', color: '#78716c', backgroundColor: '#f5f5f4', padding: '2px 8px', borderRadius: '9999px' }}>
                          {(review.destinations as any).name}
                        </span>
                      )}
                      {review.travel_month && (
                        <span style={{ fontSize: '11px', color: '#78716c' }}>{review.travel_month}</span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                    <button onClick={() => toggleVisibility(review.id, review.is_visible)}
                      style={{ padding: '5px 10px', backgroundColor: review.is_visible ? '#f0fdf4' : '#f5f5f4', border: `1px solid ${review.is_visible ? '#bbf7d0' : '#e7e5e4'}`, borderRadius: '6px', fontSize: '11px', color: review.is_visible ? '#16a34a' : '#78716c', cursor: 'pointer', fontWeight: 500 }}>
                      {review.is_visible ? 'Visible' : 'Hidden'}
                    </button>
                    <button onClick={() => startEdit(review)}
                      style={{ padding: '5px 10px', backgroundColor: '#f5f5f4', border: '1px solid #e7e5e4', borderRadius: '6px', fontSize: '11px', color: '#44403c', cursor: 'pointer' }}>
                      Edit
                    </button>
                    {isAdmin && (
                      <button onClick={() => handleDelete(review.id)}
                        style={{ padding: '5px 10px', backgroundColor: '#fff', border: '1px solid #fca5a5', borderRadius: '6px', fontSize: '11px', color: '#dc2626', cursor: 'pointer' }}>
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  )
}