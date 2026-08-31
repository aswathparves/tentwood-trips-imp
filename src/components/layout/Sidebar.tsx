'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { clsx } from 'clsx'
import {
  Users,
  BarChart2,
  ChevronDown,
  ChevronRight,
  Package,
  BookOpen,
  UserCog,
  Lock,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const crmNavigation = [
  {
    name: 'Dashboard',
    href: '/crm/dashboard',
    icon: BarChart2,
    adminOnly: true,
  },
  {
    name: 'All Leads',
    href: '/crm',
    icon: Users,
    adminOnly: false,
  },
  {
    name: 'Bookings',
    href: '/bookings',
    icon: Package,
    adminOnly: false,
  },
  {
    name: 'Team',
    href: '/team',
    icon: UserCog,
    adminOnly: true,
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const supabase = createClient()

  const [crmOpen, setCrmOpen] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    async function loadRole() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      setIsAdmin(profile?.role === 'admin')
    }

    loadRole()
  }, [supabase])

  return (
    <aside className="sidebar bg-stone-900 flex flex-col">
      <div className="px-6 py-5 border-b border-stone-800 shrink-0">
        <h1 className="text-white font-semibold text-lg tracking-tight">
          Tentwood Trips
        </h1>

        <p className="text-stone-500 text-xs mt-0.5">
          Management Platform
        </p>
      </div>

      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <button
          onClick={() => setCrmOpen((open) => !open)}
          style={{ width: '100%' }}
          className="flex items-center justify-between px-3 py-2 rounded-lg text-sm text-stone-300 hover:text-white hover:bg-stone-800 transition-colors mb-1"
        >
          <div className="flex items-center gap-2">
            <BookOpen size={15} />

            <span className="font-semibold text-xs uppercase tracking-wider">
              CRM
            </span>
          </div>

          {crmOpen ? (
            <ChevronDown size={14} />
          ) : (
            <ChevronRight size={14} />
          )}
        </button>

        {crmOpen && (
          <div className="mb-4">
            <div className="space-y-0.5">
              {crmNavigation.map((item) => {
                const isDisabled =
                  item.adminOnly && !isAdmin

                const isActive =
                  !isDisabled &&
                  (item.href === '/crm'
                    ? pathname === '/crm'
                    : pathname === item.href ||
                      pathname.startsWith(
                        item.href + '/'
                      ))

                if (isDisabled) {
                  return (
                    <div
                      key={item.name}
                      title="Admin access required"
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-stone-600 cursor-not-allowed select-none"
                    >
                      <item.icon size={16} />

                      <span className="flex-1">
                        {item.name}
                      </span>

                      <Lock
                        size={12}
                        className="text-stone-700"
                      />
                    </div>
                  )
                }

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={clsx(
                      'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                      isActive
                        ? 'bg-stone-800 text-white'
                        : 'text-stone-400 hover:text-white hover:bg-stone-800'
                    )}
                  >
                    <item.icon size={16} />
                    {item.name}
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </nav>

      <div className="px-6 py-4 border-t border-stone-800 shrink-0">
        <p className="text-stone-600 text-xs">
          Internal use only
        </p>
      </div>
    </aside>
  )
}