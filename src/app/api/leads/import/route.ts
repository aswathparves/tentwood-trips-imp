import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const VALID_SOURCES = [
  'instagram',
  'whatsapp',
  'phone_call',
  'google',
  'referral',
  'walk_in',
  'other',
]

const VALID_TEMPERATURES = ['cold', 'warm', 'hot']

const VALID_STATUSES = [
  'new',
  'contacted',
  'follow_up',
  'proposal_sent',
  'booked',
  'lost',
]

const VALID_BUDGETS = [
  'under_25k',
  '25k_50k',
  '50k_1l',
  '1l_2l',
  '2l_5l',
  'above_5l',
]

function clean(value: unknown) {
  const result = String(value ?? '').trim()
  return result || null
}

function cleanNumber(value: unknown, fallback: number | null = null) {
  if (value === '' || value === null || value === undefined) {
    return fallback
  }

  const number = Number(value)

  return Number.isFinite(number) ? number : fallback
}

function cleanDate(value: unknown) {
  const valueString = clean(value)

  if (!valueString) return null

  if (/^\d{4}-\d{2}-\d{2}$/.test(valueString)) {
    return valueString
  }

  const match = valueString.match(
    /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/
  )

  if (match) {
    const [, day, month, year] = match

    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  }

  const date = new Date(valueString)

  if (Number.isNaN(date.getTime())) return null

  return date.toISOString().split('T')[0]
}

function normalizeEnum(
  value: unknown,
  allowed: string[],
  fallback: string
) {
  const normalized = clean(value)?.toLowerCase()

  return normalized && allowed.includes(normalized)
    ? normalized
    : fallback
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { data: profile, error: profileError } =
      await supabase
        .from('profiles')
        .select('role, is_active')
        .eq('id', user.id)
        .single()

    if (
      profileError ||
      !profile ||
      !profile.is_active
    ) {
      return NextResponse.json(
        { error: 'User profile not found or inactive.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const rows = Array.isArray(body.rows)
      ? body.rows
      : []

    if (!rows.length) {
      return NextResponse.json(
        { error: 'No rows to import.' },
        { status: 400 }
      )
    }

    if (rows.length > 500) {
      return NextResponse.json(
        { error: 'Maximum 500 leads per import.' },
        { status: 400 }
      )
    }

    const errors: {
      row: number
      message: string
    }[] = []

    const leads = rows.map(
      (row: Record<string, unknown>, index: number) => {
        const clientName = clean(row.client_name)
        const phone = clean(row.phone)

        if (!clientName) {
          errors.push({
            row: index + 2,
            message: 'Client name is required.',
          })
        }

        if (!phone) {
          errors.push({
            row: index + 2,
            message: 'Phone is required.',
          })
        }

        const assignedTo =
          profile.role === 'admin'
            ? clean(row.assigned_to)
            : user.id

        return {
          client_name: clientName,
          phone: phone,
          email: clean(row.email),
          source: normalizeEnum(
            row.source,
            VALID_SOURCES,
            'phone_call'
          ),
          destination: clean(row.destination),
          travel_date_from: cleanDate(
            row.travel_date_from
          ),
          travel_date_to: cleanDate(
            row.travel_date_to
          ),
          adults: cleanNumber(row.adults, 1),
          children: cleanNumber(row.children, 0),
          budget: clean(row.budget)
            ? normalizeEnum(
                row.budget,
                VALID_BUDGETS,
                'under_25k'
              )
            : null,
          temperature: normalizeEnum(
            row.temperature,
            VALID_TEMPERATURES,
            'cold'
          ),
          status: normalizeEnum(
            row.status,
            VALID_STATUSES,
            'new'
          ),
          assigned_to: assignedTo,
          notes: clean(row.notes),
          follow_up_date: cleanDate(
            row.follow_up_date
          ),
          created_by: user.id,
          dmc: clean(row.dmc),
          dmc_custom: clean(row.dmc_custom),
          serial_number: cleanNumber(
            row.serial_number
          ),
          region: clean(row.region),
        }
      }
    )

    if (errors.length) {
      return NextResponse.json(
        {
          error: 'Some rows are invalid.',
          errors,
        },
        { status: 400 }
      )
    }

    if (profile.role === 'admin') {
      for (const lead of leads) {
        if (!lead.assigned_to) {
          lead.assigned_to = null
        }
      }
    }

    const { data, error } = await supabase
      .from('leads')
      .insert(leads)
      .select('id')

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      imported: data?.length ?? 0,
    })
  } catch {
    return NextResponse.json(
      { error: 'Invalid import request.' },
      { status: 400 }
    )
  }
}