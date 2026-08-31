'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BarChart2,
  Users,
  Package,
  UserCog,
} from 'lucide-react'
import { clsx } from 'clsx'
import { createClient } from '@/lib/supabase/client'

const adminNavigation = [
  {
    name: 'Dashboard',
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
  {
    name: 'Team',
    href: '/team',
    icon: UserCog,
  },
]

const staffNavigation = [
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
  const supabase = createClient()

  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadRole() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setLoading(false)
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      setIsAdmin(profile?.role === 'admin')
      setLoading(false)
    }

    loadRole()
  }, [supabase])

  if (loading) {
    return null
  }

  const navigation = isAdmin
    ? adminNavigation
    : staffNavigation

  return (
    <nav className="mobile-nav">
      <div
        className={clsx(
          'mobile-nav-inner',
          !isAdmin && 'mobile-nav-inner-staff'
        )}
      >
        {navigation.map((item) => {
          const isActive =
            item.href === '/crm'
              ? pathname === '/crm'
              : pathname === item.href ||
                pathname.startsWith(item.href + '/')

          const Icon = item.icon

          return (
            <Link
              key={item.name}
              href={item.href}
              className={clsx(
                'mobile-nav-item',
                isActive &&
                  'mobile-nav-item-active'
              )}
            >
              <Icon
                size={20}
                strokeWidth={
                  isActive ? 2.2 : 1.8
                }
              />

              <span>{item.name}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}