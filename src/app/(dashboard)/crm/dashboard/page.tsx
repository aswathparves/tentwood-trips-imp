import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/login')
  }

  const isAdmin = profile.role === 'admin'

  let leadsQuery = supabase
    .from('leads')
    .select(
      'id, client_name, status, temperature, source, destination, budget, follow_up_date, assigned_to, created_at'
    )

  let bookingsQuery = supabase
    .from('bookings')
    .select(
      'id, booking_reference, status, destination, total_amount, paid_amount, balance_amount, assigned_to, travel_date_from, created_at'
    )

  const profilesQuery = supabase
    .from('profiles')
    .select('id, full_name, role')
    .eq('is_active', true)
    .order('full_name', { ascending: true })

  if (!isAdmin) {
    leadsQuery = leadsQuery.eq('assigned_to', user.id)
    bookingsQuery = bookingsQuery.eq('assigned_to', user.id)
  }

  const [
    { data: leads, error: leadsError },
    { data: bookings, error: bookingsError },
    { data: profiles, error: profilesError },
  ] = await Promise.all([
    leadsQuery,
    bookingsQuery,
    profilesQuery,
  ])

  if (leadsError) {
    throw new Error(`Failed to load dashboard leads: ${leadsError.message}`)
  }

  if (bookingsError) {
    throw new Error(
      `Failed to load dashboard bookings: ${bookingsError.message}`
    )
  }

  if (profilesError) {
    throw new Error(
      `Failed to load dashboard team: ${profilesError.message}`
    )
  }

  return (
    <DashboardClient
      data={{
        leads: leads ?? [],
        bookings: bookings ?? [],
        profiles: profiles ?? [],
      }}
    />
  )
}