import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: pkg, error } = await supabase
    .from('packages')
    .select(`
      *,
      package_destinations (
        *,
        destinations (id, name, country, state)
      ),
      package_hotels (
        *,
        hotels (id, name, star_rating),
        room_types (id, name),
        meal_plans (id, name, code)
      ),
      package_days (
        *,
        package_day_activities (*)
      ),
      package_transfers (*),
      package_intercity_transfers (*),
      package_pricing (*),
      package_payment_schedule (*),
      package_inclusions (*),
      package_policies (*),
      package_reviews (*)
    `)
    .eq('id', id)
    .is('archived_at', null)
    .single()

  if (error || !pkg) {
    return NextResponse.json({ error: 'Package not found' }, { status: 404 })
  }

  return NextResponse.json({ data: pkg })
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { section, data } = body

  try {
    switch (section) {
      case 'header': {
        await supabase
          .from('packages')
          .update({
            name: data.name,
            category: data.category,
            status: data.status,
            total_nights: data.total_nights,
            internal_notes: data.internal_notes,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
        break
      }

      case 'guests': {
        await supabase
          .from('packages')
          .update({
            adults: data.adults,
            children: data.children,
            infants: data.infants,
            children_ages: data.children_ages,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
        break
      }

      case 'destinations': {
        // Delete existing legs and re-insert
        await supabase
          .from('package_destinations')
          .delete()
          .eq('package_id', id)

        if (data.destinations?.length > 0) {
          await supabase.from('package_destinations').insert(
            data.destinations.map((d: any) => ({
              package_id: id,
              destination_id: d.destination_id,
              leg_order: d.leg_order,
              nights: d.nights,
            }))
          )
        }

        // Update total nights
        const totalNights = data.destinations.reduce(
          (sum: number, d: any) => sum + (d.nights || 0),
          0
        )
        await supabase
          .from('packages')
          .update({ total_nights: totalNights, updated_at: new Date().toISOString() })
          .eq('id', id)
        break
      }

      case 'hotels': {
        await supabase
          .from('package_hotels')
          .delete()
          .eq('package_id', id)

        if (data.hotels?.length > 0) {
          // Get package_destination IDs
          const { data: pkgDests } = await supabase
            .from('package_destinations')
            .select('id, leg_order')
            .eq('package_id', id)

          await supabase.from('package_hotels').insert(
            data.hotels.map((h: any) => {
              const pkgDest = pkgDests?.find((pd) => pd.leg_order === h.leg_order)
              return {
                package_id: id,
                package_destination_id: pkgDest?.id ?? null,
                hotel_id: h.hotel_id,
                room_type_id: h.room_type_id || null,
                meal_plan_id: h.meal_plan_id || null,
                tier: h.tier,
                room_count: h.room_count,
                occupancy_type: h.occupancy_type,
                check_in_date: h.check_in_date || null,
                check_out_date: h.check_out_date || null,
                notes: h.notes || null,
                sort_order: h.leg_order,
              }
            })
          )
        }
        break
      }

      case 'transfers': {
        await supabase
          .from('package_transfers')
          .delete()
          .eq('package_id', id)

        await supabase
          .from('package_intercity_transfers')
          .delete()
          .eq('package_id', id)

        if (data.transfers?.length > 0) {
          await supabase.from('package_transfers').insert(
            data.transfers.map((t: any, i: number) => ({
              package_id: id,
              transfer_type: t.transfer_type,
              location_name: t.location_name,
              vehicle_id: t.vehicle_id || null,
              is_pickup: t.is_pickup,
              date: t.date || null,
              time: t.time || null,
              flight_train_no: t.flight_train_no || null,
              notes: t.notes || null,
              sort_order: i,
            }))
          )
        }

        if (data.intercityTransfers?.length > 0) {
          await supabase.from('package_intercity_transfers').insert(
            data.intercityTransfers.map((t: any, i: number) => ({
              package_id: id,
              from_destination_id: t.from_destination_id || null,
              to_destination_id: t.to_destination_id || null,
              vehicle_id: t.vehicle_id || null,
              mode: t.mode || 'road',
              distance_km: t.distance_km || null,
              duration_hours: t.duration_hours || null,
              notes: t.notes || null,
              sort_order: i,
            }))
          )
        }
        break
      }

      case 'days': {
        for (const day of data.days) {
          // Upsert day
          const { data: savedDay } = await supabase
            .from('package_days')
            .upsert(
              {
                package_id: id,
                day_number: day.day_number,
                title: day.title || null,
                date: day.date || null,
                vehicle_id: day.vehicle_id || null,
                meals_included: day.meals_included || [],
                notes: day.notes || null,
                ai_description: day.ai_description || null,
              },
              { onConflict: 'package_id,day_number' }
            )
            .select()
            .single()

          if (savedDay) {
            // Delete existing activities for this day
            await supabase
              .from('package_day_activities')
              .delete()
              .eq('day_id', savedDay.id)

            // Re-insert activities
            if (day.activities?.length > 0) {
              await supabase.from('package_day_activities').insert(
                day.activities.map((a: any, i: number) => ({
                  day_id: savedDay.id,
                  activity_id: a.activity_id || null,
                  custom_name: a.custom_name || null,
                  custom_description: a.custom_description || null,
                  sort_order: i,
                  time_slot: a.time_slot || null,
                  duration_hours: a.duration_hours || null,
                  is_optional: a.is_optional || false,
                  notes: a.notes || null,
                }))
              )
            }
          }
        }
        break
      }

      case 'inclusions': {
        await supabase
          .from('package_inclusions')
          .delete()
          .eq('package_id', id)

        if (data.inclusions?.length > 0) {
          await supabase.from('package_inclusions').insert(
            data.inclusions.map((item: any, i: number) => ({
              package_id: id,
              text: item.text,
              type: item.type,
              sort_order: i,
            }))
          )
        }
        break
      }

      case 'pricing': {
        await supabase
          .from('package_pricing')
          .update({
            cost_per_adult: data.cost_per_adult,
            cost_per_child: data.cost_per_child,
            cost_per_infant: data.cost_per_infant,
            single_supplement: data.single_supplement,
            triple_reduction: data.triple_reduction,
            markup_percent: data.markup_percent,
            discount_amount: data.discount_amount,
            discount_reason: data.discount_reason,
            gst_percent: data.gst_percent,
            base_total: data.base_total,
            gst_total: data.gst_total,
            grand_total: data.grand_total,
            advance_amount: data.advance_amount,
            show_cost_breakup: data.show_cost_breakup,
            updated_at: new Date().toISOString(),
          })
          .eq('package_id', id)

        // Sync payment schedule
        await supabase
          .from('package_payment_schedule')
          .delete()
          .eq('package_id', id)

        if (data.paymentSchedule?.length > 0) {
          await supabase.from('package_payment_schedule').insert(
            data.paymentSchedule.map((row: any, i: number) => ({
              package_id: id,
              due_date: row.due_date,
              amount: row.amount,
              description: row.description,
              is_paid: row.is_paid || false,
              sort_order: i,
            }))
          )
        }
        break
      }

      case 'policies': {
        // Upsert T&C
        if (data.tnc_content) {
          await supabase
            .from('package_policies')
            .upsert(
              {
                package_id: id,
                type: 'terms_and_conditions',
                policy_id: data.tnc_policy_id || null,
                content: data.tnc_content,
              },
              { onConflict: 'package_id,type' }
            )
        }
        // Upsert cancellation
        if (data.cancellation_content) {
          await supabase
            .from('package_policies')
            .upsert(
              {
                package_id: id,
                type: 'cancellation_policy',
                policy_id: data.cancellation_policy_id || null,
                content: data.cancellation_content,
              },
              { onConflict: 'package_id,type' }
            )
        }
        break
      }

      case 'reviews': {
        await supabase
          .from('package_reviews')
          .delete()
          .eq('package_id', id)

        if (data.review_ids?.length > 0) {
          await supabase.from('package_reviews').insert(
            data.review_ids.map((reviewId: string, i: number) => ({
              package_id: id,
              review_id: reviewId,
              sort_order: i,
            }))
          )
        }
        break
      }

      default:
        return NextResponse.json({ error: 'Unknown section' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}