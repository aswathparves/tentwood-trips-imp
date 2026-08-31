'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'

interface TopNavProps {
  title: string
}

export default function TopNav({ title }: TopNavProps) {
  const supabase = createClient()
  const router = useRouter()

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

      <button
        onClick={handleLogout}
        className="flex items-center gap-2 text-stone-500 hover:text-stone-900 text-sm transition-colors shrink-0"
      >
        <LogOut size={15} />
        <span className="hidden sm:inline">Sign out</span>
      </button>
    </header>
  )
}