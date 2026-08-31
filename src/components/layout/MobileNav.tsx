'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BarChart2,
  Users,
  Package,
  MoreHorizontal,
} from 'lucide-react'
import { clsx } from 'clsx'

const navigation = [
  {
    name: 'Home',
    href: '/crm/dashboard',
    icon: BarChart2,
  },
  {
    name: 'Leads',
    href: '/crm',
    icon: Users,
  },
  {
    name: 'Bookings',
    href: '/bookings',
    icon: Package,
  },
]

export default function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="mobile-nav">
      <div className="mobile-nav-inner">
        {navigation.map((item) => {
          const isActive =
            item.href === '/crm'
              ? pathname === '/crm'
              : pathname === item.href || pathname.startsWith(item.href + '/')

          const Icon = item.icon

          return (
            <Link
              key={item.name}
              href={item.href}
              className={clsx(
                'mobile-nav-item',
                isActive && 'mobile-nav-item-active'
              )}
            >
              <Icon size={20} strokeWidth={isActive ? 2.2 : 1.8} />
              <span>{item.name}</span>
            </Link>
          )
        })}

        <button
          type="button"
          className="mobile-nav-item"
          onClick={() => {
            window.dispatchEvent(new CustomEvent('open-mobile-menu'))
          }}
        >
          <MoreHorizontal size={20} strokeWidth={1.8} />
          <span>More</span>
        </button>
      </div>
    </nav>
  )
}