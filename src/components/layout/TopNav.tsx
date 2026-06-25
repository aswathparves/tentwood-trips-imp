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
      <h2 className="text-stone-900 font-medium text-sm">{title}</h2>
      <button
        onClick={handleLogout}
        className="flex items-center gap-2 text-stone-500 hover:text-stone-900 text-sm transition-colors"
      >
        <LogOut size={15} />
        Sign out
      </button>
    </header>
  )
}