import TopNav from '@/components/layout/TopNav'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Plus, Zap } from 'lucide-react'

const categoryColors: Record<string, string> = {
  sightseeing: '#dbeafe',
  adventure: '#fef3c7',
  cultural: '#ede9fe',
  leisure: '#dcfce7',
  dining: '#fce7f3',
  transfer: '#f3f4f6',
  nature: '#d1fae5',
  shopping: '#ffedd5',
  wellness: '#e0f2fe',
}

const categoryText: Record<string, string> = {
  sightseeing: '#1d4ed8',
  adventure: '#92400e',
  cultural: '#5b21b6',
  leisure: '#166534',
  dining: '#9d174d',
  transfer: '#374151',
  nature: '#065f46',
  shopping: '#9a3412',
  wellness: '#0369a1',
}

export default async function ActivitiesPage() {
  const supabase = await createClient()

  const { data: activities, error } = await supabase
    .from('activities')
    .select(`*, destinations (name, country)`)
    .is('archived_at', null)
    .order('name', { ascending: true })

  return (
    <>
      <TopNav title="Activities" />
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
              Activities
            </h1>
            <p style={{ color: '#78716c', fontSize: '14px', marginTop: '2px' }}>
              {activities?.length ?? 0} activities in your library
            </p>
          </div>
          <Link
            href="/activities/new"
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
            Add Activity
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
              Failed to load activities: {error.message}
            </p>
          </div>
        )}

        {!error && (!activities || activities.length === 0) && (
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: '12px',
              border: '1px solid #e7e5e4',
              padding: '48px 24px',
              textAlign: 'center',
            }}
          >
            <Zap size={32} style={{ color: '#d6d3d1', margin: '0 auto 12px' }} />
            <h3 style={{ color: '#1c1917', fontWeight: 500, marginBottom: '4px' }}>
              No activities yet
            </h3>
            <p style={{ color: '#78716c', fontSize: '14px', marginBottom: '16px' }}>
              Add activities to destinations to use in the day planner.
            </p>
            <Link
              href="/activities/new"
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
              Add Activity
            </Link>
          </div>
        )}

        {activities && activities.length > 0 && (
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: '12px',
              border: '1px solid #e7e5e4',
              overflow: 'hidden',
            }}
          >
            {/* Filter bar */}
            <div
              style={{
                padding: '12px 16px',
                borderBottom: '1px solid #f5f5f4',
                backgroundColor: '#fafaf9',
                display: 'flex',
                gap: '8px',
                flexWrap: 'wrap',
              }}
            >
              <span style={{ fontSize: '12px', color: '#78716c', alignSelf: 'center' }}>
                {activities.length} total
              </span>
            </div>

            <div>
              {activities.map((activity, i) => (
                <Link
                  key={activity.id}
                  href={`/activities/${activity.id}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 20px',
                    borderTop: i === 0 ? 'none' : '1px solid #f5f5f4',
                    textDecoration: 'none',
                    backgroundColor: '#fff',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div>
                      <p style={{ fontSize: '14px', fontWeight: 500, color: '#1c1917' }}>
                        {activity.name}
                      </p>
                      <p style={{ fontSize: '12px', color: '#78716c', marginTop: '2px' }}>
                        {(activity.destinations as any)?.name},{' '}
                        {(activity.destinations as any)?.country}
                        {activity.duration_hours
                          ? ` · ${activity.duration_hours}h`
                          : ''}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {activity.has_entry_fee && (
                      <span
                        style={{
                          fontSize: '11px',
                          backgroundColor: '#fef9c3',
                          color: '#854d0e',
                          padding: '2px 8px',
                          borderRadius: '9999px',
                        }}
                      >
                        Entry Fee
                      </span>
                    )}
                    <span
                      style={{
                        fontSize: '11px',
                        backgroundColor:
                          categoryColors[activity.category] ?? '#f3f4f6',
                        color: categoryText[activity.category] ?? '#374151',
                        padding: '2px 8px',
                        borderRadius: '9999px',
                        textTransform: 'capitalize',
                        fontWeight: 500,
                      }}
                    >
                      {activity.category}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
    </>
  )
}