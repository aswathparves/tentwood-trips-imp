'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { LogOut } from 'lucide-react'

interface TopNavProps {
  title: string
}

export default function TopNav({ title }: TopNavProps) {
  const supabase = createClient()
  const router = useRouter()

  const [userName, setUserName] = useState('')

  useEffect(() => {
    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single()

      setUserName(profile?.full_name || user.email?.split('@')[0] || '')
    }

    loadProfile()
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="topnav bg-white border-b border-stone-200 flex items-center justify-between px-6">
      <div className="min-w-0">
        <h2 className="text-stone-900 font-medium text-sm truncate">
          {title}
        </h2>
      </div>

      <div className="flex items-center gap-4 shrink-0">
        {userName && (
          <span className="text-stone-700 text-sm font-medium truncate max-w-[140px] sm:max-w-none">
            {userName}
          </span>
        )}

        <button
          onClick={handleLogout}
          aria-label="Sign out"
          className="flex items-center gap-2 text-stone-500 hover:text-stone-900 text-sm transition-colors"
        >
          <LogOut size={15} />
          <span className="hidden sm:inline">Sign out</span>
        </button>
      </div>
    </header>
  )
}