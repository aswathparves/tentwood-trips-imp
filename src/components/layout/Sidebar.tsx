'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { clsx } from 'clsx'
import {
  LayoutDashboard,
  MapPin,
  Hotel,
  Zap,
  Car,
  Package,
  Star,
  Settings,
  BookOpen,
  ScrollText,
  Users,
  BarChart2,
  ChevronDown,
  ChevronRight,
  FileText,
} from 'lucide-react'

const impNavigation = [
  {
    section: 'Main',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { name: 'Packages', href: '/packages', icon: Package },
    ],
  },
  {
    section: 'Master Data',
    items: [
      { name: 'Destinations', href: '/destinations', icon: MapPin },
      { name: 'Hotels', href: '/hotels', icon: Hotel },
      { name: 'Activities', href: '/activities', icon: Zap },
      { name: 'Vehicles', href: '/vehicles', icon: Car },
    ],
  },
  {
    section: 'Library',
    items: [
      { name: 'Inclusions', href: '/library/inclusions', icon: BookOpen },
      { name: 'Policies', href: '/library/policies', icon: ScrollText },
      { name: 'Reviews', href: '/reviews', icon: Star },
    ],
  },
  {
    section: 'Admin',
    items: [
      { name: 'Settings', href: '/settings', icon: Settings },
    ],
  },
]

const crmNavigation = [
  {
    section: 'CRM',
    items: [
      { name: 'All Leads', href: '/crm', icon: Users },
      { name: 'Dashboard', href: '/crm/dashboard', icon: BarChart2 },
    ],
  },
]

export default function Sidebar() {
  const pathname = usePathname()

  const isImpPath = !pathname.startsWith('/crm')
  const isCrmPath = pathname.startsWith('/crm')

  const [impOpen, setImpOpen] = useState(isImpPath)
  const [crmOpen, setCrmOpen] = useState(isCrmPath)

  return (
    <aside className="sidebar bg-stone-900 flex flex-col">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-stone-800 shrink-0">
        <h1 className="text-white font-semibold text-lg tracking-tight">
          Tentwood Trips
        </h1>
        <p className="text-stone-500 text-xs mt-0.5">Management Platform</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">

        {/* ── IMP MODULE ── */}
        <button
          onClick={() => setImpOpen(o => !o)}
          style={{ width: '100%' }}
          className="flex items-center justify-between px-3 py-2 rounded-lg text-sm text-stone-300 hover:text-white hover:bg-stone-800 transition-colors mb-1"
        >
          <div className="flex items-center gap-2">
            <FileText size={15} />
            <span className="font-semibold text-xs uppercase tracking-wider">
              IMP
            </span>
          </div>
          {impOpen
            ? <ChevronDown size={14} />
            : <ChevronRight size={14} />
          }
        </button>

        {impOpen && (
          <div className="mb-4">
            {impNavigation.map((group) => (
              <div key={group.section} className="mb-4">
                <p className="text-stone-500 text-xs font-medium uppercase tracking-wider px-3 mb-1">
                  {group.section}
                </p>
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const isActive =
                      pathname === item.href ||
                      pathname.startsWith(item.href + '/')
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
            ))}
          </div>
        )}

        {/* Divider */}
        <div className="border-t border-stone-800 my-2" />

        {/* ── CRM MODULE ── */}
        <button
          onClick={() => setCrmOpen(o => !o)}
          style={{ width: '100%' }}
          className="flex items-center justify-between px-3 py-2 rounded-lg text-sm text-stone-300 hover:text-white hover:bg-stone-800 transition-colors mb-1"
        >
          <div className="flex items-center gap-2">
            <Users size={15} />
            <span className="font-semibold text-xs uppercase tracking-wider">
              CRM
            </span>
          </div>
          {crmOpen
            ? <ChevronDown size={14} />
            : <ChevronRight size={14} />
          }
        </button>

        {crmOpen && (
          <div className="mb-4">
            {crmNavigation.map((group) => (
              <div key={group.section}>
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const isActive =
                      pathname === item.href ||
                      (item.href === '/crm' && pathname === '/crm') ||
                      (item.href !== '/crm' && pathname.startsWith(item.href + '/')) ||
                      (item.href !== '/crm' && pathname === item.href)
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
            ))}
          </div>
        )}

      </nav>

      {/* Bottom */}
      <div className="px-6 py-4 border-t border-stone-800 shrink-0">
        <p className="text-stone-600 text-xs">Internal use only</p>
      </div>
    </aside>
  )
}