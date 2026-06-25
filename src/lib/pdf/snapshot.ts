import { createClient } from '@/lib/supabase/server'

export async function capturePackageSnapshot(packageId: string) {
  const supabase = await createClient()

  // Fetch complete package with all relations
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
      package_reviews (
        *,
        reviews (
          id,
          reviewer_name,
          reviewer_city,
          rating,
          review_text,
          created_at
        )
      )
    `)
    .eq('id', packageId)
    .single()

  if (error || !pkg) {
    throw new Error('Package not found')
  }

  // Flatten reviews for easier access in template
  const reviewsFlattened = pkg.package_reviews?.map((pr: any) => pr.reviews).filter(Boolean) || []

  return {
    ...pkg,
    reviews: reviewsFlattened,
  }
}