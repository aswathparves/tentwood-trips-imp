import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

async function requireAdmin() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized', status: 401 }
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role, is_active')
    .eq('id', user.id)
    .single()

  if (error || profile?.role !== 'admin' || !profile.is_active) {
    return { error: 'Forbidden', status: 403 }
  }

  return { user }
}

export async function GET() {
  const auth = await requireAdmin()

  if ('error' in auth) {
    return NextResponse.json(
      { error: auth.error },
      { status: auth.status }
    )
  }

  const admin = createAdminClient()

  const { data: profiles, error } = await admin
    .from('profiles')
    .select('id, full_name, role, phone, is_active, created_at')
    .order('full_name', { ascending: true })

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }

  const userIds = profiles?.map((profile) => profile.id) ?? []
  const emailMap: Record<string, string> = {}

  for (const userId of userIds) {
    const { data, error: userError } =
      await admin.auth.admin.getUserById(userId)

    if (!userError && data.user?.email) {
      emailMap[userId] = data.user.email
    }
  }

  const result = (profiles ?? []).map((profile) => ({
    ...profile,
    email: emailMap[profile.id] ?? '',
  }))

  return NextResponse.json({ profiles: result })
}

export async function POST(request: Request) {
  const auth = await requireAdmin()

  if ('error' in auth) {
    return NextResponse.json(
      { error: auth.error },
      { status: auth.status }
    )
  }

  try {
    const body = await request.json()

    const fullName = String(body.fullName ?? '').trim()
    const email = String(body.email ?? '').trim().toLowerCase()
    const phone = String(body.phone ?? '').trim()
    const role = body.role === 'admin' ? 'admin' : 'staff'

    if (!fullName || !email || !phone) {
      return NextResponse.json(
        { error: 'Name, email and phone are required.' },
        { status: 400 }
      )
    }

    const admin = createAdminClient()

    const { data: invited, error: inviteError } =
      await admin.auth.admin.inviteUserByEmail(email, {
        redirectTo: `${new URL(request.url).origin}/auth/confirm?next=/set-password`,
      })

    if (inviteError) {
      return NextResponse.json(
        { error: inviteError.message },
        { status: 400 }
      )
    }

    if (!invited.user) {
      return NextResponse.json(
        { error: 'User invitation failed.' },
        { status: 500 }
      )
    }

    const { error: profileError } = await admin
      .from('profiles')
      .insert({
        id: invited.user.id,
        full_name: fullName,
        role,
        phone,
        is_active: true,
      })

    if (profileError) {
      await admin.auth.admin.deleteUser(invited.user.id)

      return NextResponse.json(
        { error: profileError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Staff invitation sent successfully.',
    })
  } catch {
    return NextResponse.json(
      { error: 'Invalid request.' },
      { status: 400 }
    )
  }
}

export async function DELETE(request: Request) {
  const auth = await requireAdmin()

  if ('error' in auth) {
    return NextResponse.json(
      { error: auth.error },
      { status: auth.status }
    )
  }

  const targetId = new URL(request.url).searchParams.get('id')

  if (!targetId) {
    return NextResponse.json(
      { error: 'User id is required.' },
      { status: 400 }
    )
  }

  if (targetId === auth.user.id) {
    return NextResponse.json(
      { error: 'You cannot delete your own account.' },
      { status: 400 }
    )
  }

  const admin = createAdminClient()

  const { data: targetProfile, error: profileLookupError } = await admin
    .from('profiles')
    .select('id, full_name, role')
    .eq('id', targetId)
    .single()

  if (profileLookupError || !targetProfile) {
    return NextResponse.json(
      { error: 'Team member not found.' },
      { status: 404 }
    )
  }

  if (targetProfile.role === 'admin') {
    const { count, error: adminCountError } = await admin
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'admin')
      .eq('is_active', true)

    if (adminCountError) {
      return NextResponse.json(
        { error: adminCountError.message },
        { status: 500 }
      )
    }

    if ((count ?? 0) <= 1) {
      return NextResponse.json(
        { error: 'You cannot delete the last active admin.' },
        { status: 400 }
      )
    }
  }

  // Keep existing CRM history intact by removing references before deleting
  // the profile. These columns are nullable by design.
  const referenceTables = [
    { table: 'leads', columns: ['assigned_to', 'created_by'] },
    { table: 'bookings', columns: ['assigned_to', 'created_by'] },
  ] as const

  for (const { table, columns } of referenceTables) {
    for (const column of columns) {
      const { error } = await admin
        .from(table)
        .update({ [column]: null })
        .eq(column, targetId)

      if (error) {
        return NextResponse.json(
          { error: `Could not remove ${targetProfile.full_name}'s references from ${table}.` },
          { status: 500 }
        )
      }
    }
  }

  const { error: authDeleteError } = await admin.auth.admin.deleteUser(targetId)

  if (authDeleteError) {
    return NextResponse.json(
      { error: authDeleteError.message },
      { status: 500 }
    )
  }

  // Normally the profile is removed by the auth-user relationship/trigger.
  // This also handles projects where that cleanup is not configured.
  const { error: profileDeleteError } = await admin
    .from('profiles')
    .delete()
    .eq('id', targetId)

  if (profileDeleteError) {
    return NextResponse.json(
      { error: profileDeleteError.message },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    message: `${targetProfile.full_name || 'Team member'} was deleted successfully.`,
  })
}
