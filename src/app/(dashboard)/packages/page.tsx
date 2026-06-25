import TopNav from '@/components/layout/TopNav'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, Package, MapPin } from 'lucide-react'

const statusColors: Record<string, { bg: string; color: string }> = {
  draft:     { bg: '#f5f5f4', color: '#78716c' },
  review:    { bg: '#fef9c3', color: '#854d0e' },
  approved:  { bg: '#dbeafe', color: '#1d4ed8' },
  sent:      { bg: '#ede9fe', color: '#5b21b6' },
  booked:    { bg: '#dcfce7', color: '#166534' },
  completed: { bg: '#d1fae5', color: '#065f46' },
  cancelled: { bg: '#fee2e2', color: '#991b1b' },
}

const categoryEmoji: Record<string, string> = {
  honeymoon:     '💑',
  family:        '👨‍👩‍👧',
  group:         '👥',
  corporate:     '💼',
  adventure:     '🏔️',
  pilgrimage:    '🛕',
  international: '✈️',
  weekend:       '🌅',
  custom:        '📦',
}

export default async function PackagesPage() {
  const supabase = await createClient()

  const { data: packages, error } = await supabase
    .from('packages')
    .select(`
      id,
      name,
      package_code,
      category,
      status,
      total_nights,
      adults,
      children,
      infants,
      created_at,
      updated_at,
      package_destinations (
        leg_order,
        nights,
        destinations (name, country)
      )
    `)
    .is('archived_at', null)
    .order('created_at', { ascending: false })

  return (
    <>
      <TopNav title="Packages" />
      <main className="page-container">

        {/* Header row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '24px',
          }}
        >
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#1c1917' }}>
              Packages
            </h1>
            <p style={{ color: '#78716c', fontSize: '14px', marginTop: '2px' }}>
              {packages?.length ?? 0} packages in your workspace
            </p>
          </div>
          <Link
            href="/packages/new"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#1c1917',
              color: '#fff',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 500,
              textDecoration: 'none',
            }}
          >
            <Plus size={16} />
            New Package
          </Link>
        </div>

        {/* Error state */}
        {error && (
          <div
            style={{
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              padding: '12px 16px',
              marginBottom: '16px',
            }}
          >
            <p style={{ color: '#dc2626', fontSize: '14px' }}>
              Failed to load packages: {error.message}
            </p>
          </div>
        )}

        {/* Empty state */}
        {!error && (!packages || packages.length === 0) && (
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: '12px',
              border: '1px solid #e7e5e4',
              padding: '64px 24px',
              textAlign: 'center',
            }}
          >
            <Package size={36} style={{ color: '#d6d3d1', margin: '0 auto 16px' }} />
            <h3
              style={{
                color: '#1c1917',
                fontWeight: 500,
                marginBottom: '6px',
                fontSize: '16px',
              }}
            >
              No packages yet
            </h3>
            <p
              style={{
                color: '#78716c',
                fontSize: '14px',
                marginBottom: '20px',
              }}
            >
              Create your first package to start building itineraries.
            </p>
            <Link
              href="/packages/new"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#1c1917',
                color: '#fff',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 500,
                textDecoration: 'none',
              }}
            >
              <Plus size={16} />
              New Package
            </Link>
          </div>
        )}

        {/* Package list */}
        {packages && packages.length > 0 && (
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: '12px',
              border: '1px solid #e7e5e4',
              overflow: 'hidden',
            }}
          >
            {/* Table header */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr 1fr 1fr 120px',
                padding: '10px 20px',
                borderBottom: '1px solid #f5f5f4',
                backgroundColor: '#fafaf9',
              }}
            >
              {['Package', 'Destinations', 'Guests', 'Updated', 'Status'].map((h) => (
                <p
                  key={h}
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: '#a8a29e',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  {h}
                </p>
              ))}
            </div>

            {/* Rows */}
            {packages.map((pkg, i) => {
              const statusStyle = statusColors[pkg.status] ?? statusColors.draft
              const emoji = categoryEmoji[pkg.category] ?? '📦'

              // Sort destination legs
              const legs = [...(pkg.package_destinations ?? [])].sort(
                (a, b) => a.leg_order - b.leg_order
              )
              const destSummary = legs
                .map((d: any) => d.destinations?.name)
                .filter(Boolean)
                .join(' → ')
              const totalNights = legs.reduce((s: number, d: any) => s + (d.nights ?? 0), 0)

              const guestParts = [`${pkg.adults}A`]
              if (pkg.children > 0) guestParts.push(`${pkg.children}C`)
              if (pkg.infants > 0) guestParts.push(`${pkg.infants}I`)

              const updatedDate = new Date(pkg.updated_at ?? pkg.created_at).toLocaleDateString(
                'en-IN',
                { day: 'numeric', month: 'short', year: 'numeric' }
              )

              return (
                <Link
                  key={pkg.id}
                  href={`/packages/${pkg.id}`}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1fr 1fr 1fr 120px',
                    padding: '14px 20px',
                    borderTop: i === 0 ? 'none' : '1px solid #f5f5f4',
                    textDecoration: 'none',
                    alignItems: 'center',
                    transition: 'background-color 0.1s',
                  }}
                  className="hover:bg-stone-50"
                >
                  {/* Package name + code */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '14px' }}>{emoji}</span>
                      <p
                        style={{
                          fontSize: '14px',
                          fontWeight: 500,
                          color: '#1c1917',
                        }}
                      >
                        {pkg.name || 'Untitled Package'}
                      </p>
                    </div>
                    <p
                      style={{
                        fontSize: '11px',
                        color: '#a8a29e',
                        marginTop: '2px',
                        fontFamily: 'monospace',
                      }}
                    >
                      {pkg.package_code}
                    </p>
                  </div>

                  {/* Destinations */}
                  <div>
                    {destSummary ? (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <MapPin size={11} style={{ color: '#a8a29e', flexShrink: 0 }} />
                          <p style={{ fontSize: '13px', color: '#44403c' }}>
                            {destSummary}
                          </p>
                        </div>
                        {totalNights > 0 && (
                          <p style={{ fontSize: '11px', color: '#a8a29e', marginTop: '2px' }}>
                            {totalNights}N / {totalNights + 1}D
                          </p>
                        )}
                      </>
                    ) : (
                      <p style={{ fontSize: '13px', color: '#d6d3d1' }}>—</p>
                    )}
                  </div>

                  {/* Guests */}
                  <p style={{ fontSize: '13px', color: '#44403c' }}>
                    {guestParts.join(' · ')}
                  </p>

                  {/* Updated date */}
                  <p style={{ fontSize: '13px', color: '#78716c' }}>{updatedDate}</p>

                  {/* Status badge */}
                  <span
                    style={{
                      display: 'inline-block',
                      backgroundColor: statusStyle.bg,
                      color: statusStyle.color,
                      fontSize: '12px',
                      fontWeight: 500,
                      padding: '3px 10px',
                      borderRadius: '9999px',
                      textTransform: 'capitalize',
                      width: 'fit-content',
                    }}
                  >
                    {pkg.status}
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
