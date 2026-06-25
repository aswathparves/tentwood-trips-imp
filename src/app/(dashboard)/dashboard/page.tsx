import TopNav from '@/components/layout/TopNav'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { count: totalPackages } = await supabase
    .from('packages')
    .select('*', { count: 'exact', head: true })
    .is('archived_at', null)

  const { count: activeQuotes } = await supabase
    .from('packages')
    .select('*', { count: 'exact', head: true })
    .in('status', ['draft', 'review', 'approved', 'sent'])

  const { count: booked } = await supabase
    .from('packages')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'booked')

  const { count: pdfsGenerated } = await supabase
    .from('generated_pdfs')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'completed')

  const { data: recentPackages } = await supabase
    .from('packages')
    .select('id, name, package_code, status, category, created_at')
    .is('archived_at', null)
    .order('created_at', { ascending: false })
    .limit(5)

  const statusColors: Record<string, string> = {
    draft: 'bg-stone-100 text-stone-600',
    review: 'bg-yellow-100 text-yellow-700',
    approved: 'bg-blue-100 text-blue-700',
    sent: 'bg-purple-100 text-purple-700',
    booked: 'bg-green-100 text-green-700',
    completed: 'bg-emerald-100 text-emerald-700',
    cancelled: 'bg-red-100 text-red-700',
  }

  return (
    <>
      <TopNav title="Dashboard" />
      <main className="page-container">

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '16px',
            marginBottom: '32px',
          }}
        >
          {[
            { label: 'Total Packages', value: totalPackages ?? 0 },
            { label: 'Active Quotes', value: activeQuotes ?? 0 },
            { label: 'Confirmed Bookings', value: booked ?? 0 },
            { label: 'PDFs Generated', value: pdfsGenerated ?? 0 },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                backgroundColor: '#fff',
                borderRadius: '12px',
                border: '1px solid #e7e5e4',
                padding: '20px',
              }}
            >
              <p
                style={{
                  color: '#78716c',
                  fontSize: '11px',
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                {stat.label}
              </p>
              <p
                style={{
                  fontSize: '30px',
                  fontWeight: 600,
                  color: '#1c1917',
                  marginTop: '8px',
                }}
              >
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        <div
          style={{
            backgroundColor: '#fff',
            borderRadius: '12px',
            border: '1px solid #e7e5e4',
          }}
        >
          <div
            style={{
              padding: '16px 24px',
              borderBottom: '1px solid #f5f5f4',
            }}
          >
            <h3
              style={{
                color: '#1c1917',
                fontWeight: 500,
                fontSize: '14px',
              }}
            >
              Recent Packages
            </h3>
          </div>

          {!recentPackages || recentPackages.length === 0 ? (
            <div style={{ padding: '48px 24px', textAlign: 'center' }}>
              <p style={{ color: '#a8a29e', fontSize: '14px' }}>
                No packages yet. Create your first package to get started.
              </p>
            </div>
          ) : (
            <div>
              {recentPackages.map((pkg, i) => (
                <div
                  key={pkg.id}
                  style={{
                    padding: '16px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderTop: i === 0 ? 'none' : '1px solid #f5f5f4',
                  }}
                >
                  <div>
                    <p
                      style={{
                        color: '#1c1917',
                        fontSize: '14px',
                        fontWeight: 500,
                      }}
                    >
                      {pkg.name}
                    </p>
                    <p
                      style={{
                        color: '#a8a29e',
                        fontSize: '12px',
                        marginTop: '2px',
                      }}
                    >
                      {pkg.package_code} · {pkg.category}
                    </p>
                  </div>
                  <span
                    className={
                      statusColors[pkg.status] ??
                      'bg-stone-100 text-stone-600'
                    }
                    style={{
                      fontSize: '12px',
                      padding: '2px 10px',
                      borderRadius: '9999px',
                      fontWeight: 500,
                      textTransform: 'capitalize',
                    }}
                  >
                    {pkg.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  )
}