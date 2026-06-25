import TopNav from '@/components/layout/TopNav'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Plus, MapPin } from 'lucide-react'

export default async function DestinationsPage() {
  const supabase = await createClient()

  const { data: destinations, error } = await supabase
    .from('destinations')
    .select('*')
    .is('archived_at', null)
    .order('name', { ascending: true })

  return (
    <>
      <TopNav title="Destinations" />
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
            <h1
              style={{
                fontSize: '20px',
                fontWeight: 600,
                color: '#1c1917',
              }}
            >
              Destinations
            </h1>
            <p
              style={{
                color: '#78716c',
                fontSize: '14px',
                marginTop: '2px',
              }}
            >
              {destinations?.length ?? 0} destinations in your library
            </p>
          </div>
          <Link
            href="/destinations/new"
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
            Add Destination
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
              Failed to load destinations: {error.message}
            </p>
          </div>
        )}

        {!error && (!destinations || destinations.length === 0) && (
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: '12px',
              border: '1px solid #e7e5e4',
              padding: '48px 24px',
              textAlign: 'center',
            }}
          >
            <MapPin
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
              No destinations yet
            </h3>
            <p
              style={{
                color: '#78716c',
                fontSize: '14px',
                marginBottom: '16px',
              }}
            >
              Add your first destination to start building packages.
            </p>
            <Link
              href="/destinations/new"
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
              Add Destination
            </Link>
          </div>
        )}

        {destinations && destinations.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '16px',
            }}
          >
            {destinations.map((dest) => (
              <Link
                key={dest.id}
                href={`/destinations/${dest.id}`}
                style={{
                  backgroundColor: '#fff',
                  borderRadius: '12px',
                  border: '1px solid #e7e5e4',
                  overflow: 'hidden',
                  textDecoration: 'none',
                  display: 'block',
                }}
              >
                <div
                  style={{
                    height: '176px',
                    backgroundColor: '#f5f5f4',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {dest.hero_image_url ? (
                    <img
                      src={dest.hero_image_url}
                      alt={dest.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <MapPin size={24} style={{ color: '#d6d3d1' }} />
                    </div>
                  )}
                  {dest.is_international && (
                    <span
                      style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        backgroundColor: '#1c1917',
                        color: '#fff',
                        fontSize: '11px',
                        padding: '2px 8px',
                        borderRadius: '9999px',
                      }}
                    >
                      International
                    </span>
                  )}
                </div>

                <div style={{ padding: '16px' }}>
                  <h3
                    style={{
                      fontWeight: 500,
                      color: '#1c1917',
                      fontSize: '14px',
                    }}
                  >
                    {dest.name}
                  </h3>
                  <p
                    style={{
                      color: '#78716c',
                      fontSize: '13px',
                      marginTop: '2px',
                    }}
                  >
                    {dest.state ? `${dest.state}, ` : ''}
                    {dest.country}
                  </p>
                  {dest.best_time && (
                    <p
                      style={{
                        color: '#a8a29e',
                        fontSize: '12px',
                        marginTop: '8px',
                      }}
                    >
                      Best time: {dest.best_time}
                    </p>
                  )}
                  {dest.tags && dest.tags.length > 0 && (
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '4px',
                        marginTop: '12px',
                      }}
                    >
                      {dest.tags.slice(0, 3).map((tag: string) => (
                        <span
                          key={tag}
                          style={{
                            fontSize: '11px',
                            backgroundColor: '#f5f5f4',
                            color: '#57534e',
                            padding: '2px 8px',
                            borderRadius: '9999px',
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  )
}