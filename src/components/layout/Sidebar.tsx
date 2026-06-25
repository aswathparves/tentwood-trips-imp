'use client'

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
} from 'lucide-react'

const navigation = [
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
      { name: 'Settings', href: '/settings/branding', icon: Settings },
    ],
  },
]

export default function Sidebar() {
  const pathname = usePathname()

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
      <nav className="flex-1 px-3 py-4">
        {navigation.map((group) => (
          <div key={group.section} className="mb-6">
            <p className="text-stone-500 text-xs font-medium uppercase tracking-wider px-3 mb-2">
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
      </nav>

      {/* Bottom */}
      <div className="px-6 py-4 border-t border-stone-800 shrink-0">
        <p className="text-stone-600 text-xs">Internal use only</p>
      </div>
    </aside>
  )
}