import TopNav from '@/components/layout/TopNav'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Plus, Hotel } from 'lucide-react'

export default async function HotelsPage() {
  const supabase = await createClient()

  const { data: hotels, error } = await supabase
    .from('hotels')
    .select(`
      *,
      destinations (name, country)
    `)
    .is('archived_at', null)
    .order('name', { ascending: true })

  return (
    <>
      <TopNav title="Hotels" />
      <main className="page-container">

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
              Hotels
            </h1>
            <p style={{ color: '#78716c', fontSize: '14px', marginTop: '2px' }}>
              {hotels?.length ?? 0} hotels in your library
            </p>
          </div>
          <Link
            href="/hotels/new"
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
            Add Hotel
          </Link>
        </div>

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
              Failed to load hotels: {error.message}
            </p>
          </div>
        )}

        {!error && (!hotels || hotels.length === 0) && (
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: '12px',
              border: '1px solid #e7e5e4',
              padding: '48px 24px',
              textAlign: 'center',
            }}
          >
            <Hotel
              size={32}
              style={{ color: '#d6d3d1', margin: '0 auto 12px' }}
            />
            <h3
              style={{
                color: '#1c1917',
                fontWeight: 500,
                marginBottom: '4px',
              }}
            >
              No hotels yet
            </h3>
            <p
              style={{
                color: '#78716c',
                fontSize: '14px',
                marginBottom: '16px',
              }}
            >
              Add hotels to destinations before building packages.
            </p>
            <Link
              href="/hotels/new"
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
              Add Hotel
            </Link>
          </div>
        )}

        {hotels && hotels.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '16px',
            }}
          >
            {hotels.map((hotel) => (
              <Link
                key={hotel.id}
                href={`/hotels/${hotel.id}`}
                style={{
                  backgroundColor: '#fff',
                  borderRadius: '12px',
                  border: '1px solid #e7e5e4',
                  overflow: 'hidden',
                  textDecoration: 'none',
                  display: 'block',
                }}
              >
                {/* Star rating bar */}
                <div
                  style={{
                    padding: '12px 16px',
                    backgroundColor: '#fafaf9',
                    borderBottom: '1px solid #f5f5f4',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', gap: '2px' }}>
                    {Array.from({ length: parseInt(hotel.star_rating) }).map(
                      (_, i) => (
                        <span key={i} style={{ color: '#f59e0b', fontSize: '14px' }}>
                          ★
                        </span>
                      )
                    )}
                  </div>
                  <span
                    style={{
                      fontSize: '11px',
                      color: '#78716c',
                      backgroundColor: '#f5f5f4',
                      padding: '2px 8px',
                      borderRadius: '9999px',
                    }}
                  >
                    {hotel.star_rating} Star
                  </span>
                </div>

                <div style={{ padding: '16px' }}>
                  <h3
                    style={{
                      fontWeight: 600,
                      color: '#1c1917',
                      fontSize: '15px',
                      marginBottom: '4px',
                    }}
                  >
                    {hotel.name}
                  </h3>
                  <p style={{ color: '#78716c', fontSize: '13px' }}>
                    {(hotel.destinations as any)?.name},{' '}
                    {(hotel.destinations as any)?.country}
                  </p>

                  {hotel.amenities && hotel.amenities.length > 0 && (
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '4px',
                        marginTop: '12px',
                      }}
                    >
                      {hotel.amenities.slice(0, 4).map((a: string) => (
                        <span
                          key={a}
                          style={{
                            fontSize: '11px',
                            backgroundColor: '#f5f5f4',
                            color: '#57534e',
                            padding: '2px 8px',
                            borderRadius: '9999px',
                          }}
                        >
                          {a}
                        </span>
                      ))}
                      {hotel.amenities.length > 4 && (
                        <span
                          style={{
                            fontSize: '11px',
                            backgroundColor: '#f5f5f4',
                            color: '#57534e',
                            padding: '2px 8px',
                            borderRadius: '9999px',
                          }}
                        >
                          +{hotel.amenities.length - 4} more
                        </span>
                      )}
                    </div>
                  )}

                  <div
                    style={{
                      marginTop: '12px',
                      paddingTop: '12px',
                      borderTop: '1px solid #f5f5f4',
                      display: 'flex',
                      gap: '16px',
                    }}
                  >
                    <span style={{ fontSize: '12px', color: '#a8a29e' }}>
                      Check-in: {hotel.check_in_time}
                    </span>
                    <span style={{ fontSize: '12px', color: '#a8a29e' }}>
                      Check-out: {hotel.check_out_time}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  )
}