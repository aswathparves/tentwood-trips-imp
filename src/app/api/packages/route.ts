import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('packages')
    .select(`
      id,
      name,
      package_code,
      category,
      status,
      total_nights,
      total_days,
      adults,
      children,
      infants,
      created_at,
      updated_at,
      assigned_to,
      profiles!packages_assigned_to_fkey (full_name),
      package_destinations (
        id,
        leg_order,
        nights,
        destinations (name, country)
      )
    `)
    .is('archived_at', null)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}

export async function POST(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()

  // Generate package code
  const { data: codeData } = await supabase
    .rpc('generate_package_code', { category: body.category ?? 'custom' })

  const { data: pkg, error } = await supabase
    .from('packages')
    .insert({
      name: body.name ?? 'Untitled Package',
      package_code: codeData ?? `TT-PKG-${Date.now()}`,
      category: body.category ?? 'custom',
      status: 'draft',
      total_nights: body.total_nights ?? 1,
      adults: body.adults ?? 2,
      children: body.children ?? 0,
      infants: body.infants ?? 0,
      children_ages: body.children_ages ?? [],
      internal_notes: body.internal_notes ?? '',
      created_by: user.id,
      assigned_to: user.id,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Create default pricing record
  await supabase.from('package_pricing').insert({
    package_id: pkg.id,
    cost_per_adult: 0,
    cost_per_child: 0,
    cost_per_infant: 0,
    single_supplement: 0,
    triple_reduction: 0,
    markup_percent: 0,
    discount_amount: 0,
    gst_percent: 5,
    base_total: 0,
    gst_total: 0,
    grand_total: 0,
    advance_amount: 0,
  })

  return NextResponse.json({ data: pkg }, { status: 201 })
}