import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { capturePackageSnapshot } from '@/lib/pdf/snapshot'
import { generatePDFHTML } from '@/lib/pdf/template'
import { htmlToPdf } from '@/lib/pdf/generator'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { packageId } = await request.json()

    if (!packageId) {
      return NextResponse.json(
        { error: 'packageId required' },
        { status: 400 }
      )
    }

    // Use regular client to verify the user is authenticated
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Use admin client to bypass RLS for all DB operations
    const adminSupabase = createAdminClient()

    // Get branding
    const { data: branding } = await adminSupabase
      .from('branding_settings')
      .select('*')
      .single()

    // Capture snapshot using admin client
    const { data: pkg, error: pkgError } = await adminSupabase
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

    if (pkgError || !pkg) {
      return NextResponse.json(
        { error: 'Package not found' },
        { status: 404 }
      )
    }

    // Flatten reviews
    const packageData = {
      ...pkg,
      reviews: pkg.package_reviews?.map((pr: any) => pr.reviews).filter(Boolean) || [],
    }

    // Fetch activities for template
    const { data: allActivities } = await adminSupabase
      .from('activities')
      .select('id, name, duration_hours')
      .is('archived_at', null)

    // Generate HTML
    const htmlContent = generatePDFHTML(packageData, branding, allActivities || [])

    // Convert to PDF
    const pdfBuffer = await htmlToPdf(htmlContent)

    // Upload to Supabase Storage
    const fileName = `${pkg.package_code}_${Date.now()}.pdf`
    const { error: uploadError } = await adminSupabase.storage
      .from('pdfs')
      .upload(fileName, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: false,
      })

    if (uploadError) {
      throw uploadError
    }

    // Get public URL
    const { data: publicUrl } = adminSupabase.storage
      .from('pdfs')
      .getPublicUrl(fileName)

    // Get current version count
    const { count } = await adminSupabase
      .from('package_versions')
      .select('*', { count: 'exact', head: true })
      .eq('package_id', packageId)

    // Save version record
    await adminSupabase
      .from('package_versions')
      .insert({
        package_id: packageId,
        version_number: (count || 0) + 1,
        pdf_url: publicUrl.publicUrl,
        pdf_file_name: fileName,
        snapshot_data: packageData,
        created_by: user.id,
      })

    // Update package pdf status
    await adminSupabase
      .from('packages')
      .update({
        pdf_status: 'generated',
        last_pdf_generated_at: new Date().toISOString(),
      })
      .eq('id', packageId)

    return NextResponse.json({
      success: true,
      pdf_url: publicUrl.publicUrl,
      file_name: fileName,
    })
  } catch (error: any) {
    console.error('PDF generation error:', error)
    return NextResponse.json(
      { error: error.message || 'PDF generation failed' },
      { status: 500 }
    )
  }
}