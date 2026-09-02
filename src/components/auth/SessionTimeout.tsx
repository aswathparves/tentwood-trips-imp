'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const TIMEOUT = 4 * 60 * 60 * 1000

export default function SessionTimeout() {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    let key = ''
    let lastWrite = 0

    async function start() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      key = `tentwood:last-activity:${user.id}`
      const now = Date.now()
      const saved = Number(localStorage.getItem(key) || now)

      if (now - saved >= TIMEOUT) {
        await supabase.auth.signOut({ scope: 'local' })
        router.replace('/login?reason=timeout')
        return
      }

      localStorage.setItem(key, String(now))

      const activity = () => {
        const now = Date.now()
        if (now - lastWrite < 30000) return
        lastWrite = now
        localStorage.setItem(key, String(now))
      }

      const events = ['click', 'keydown', 'mousemove', 'scroll', 'touchstart']

      events.forEach(e => window.addEventListener(e, activity, { passive: true }))

      const timer = window.setInterval(async () => {
        const last = Number(localStorage.getItem(key) || 0)

        if (Date.now() - last >= TIMEOUT) {
          clearInterval(timer)
          await supabase.auth.signOut({ scope: 'local' })
          router.replace('/login?reason=timeout')
        }
      }, 60000)

      return () => {
        clearInterval(timer)
        events.forEach(e => window.removeEventListener(e, activity))
      }
    }

    let cleanup: (() => void) | undefined

    start().then(fn => {
      cleanup = fn
    })

    return () => cleanup?.()
  }, [router])

  return null
}