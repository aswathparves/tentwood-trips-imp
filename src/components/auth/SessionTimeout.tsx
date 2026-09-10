'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const TIMEOUT = 4 * 60 * 60 * 1000
const CHECK_INTERVAL = 60 * 1000
const WRITE_INTERVAL = 30 * 1000

export default function SessionTimeout() {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    let userId: string | null = null
    let activityKey: string | null = null
    let lastWrite = 0
    let timer: number | null = null
    let stopped = false
    let timedOut = false

    const events = [
      'click',
      'keydown',
      'mousemove',
      'scroll',
      'touchstart',
    ]

    function clearTimer() {
      if (timer !== null) {
        window.clearInterval(timer)
        timer = null
      }
    }

    function removeActivityKey() {
      if (activityKey) {
        localStorage.removeItem(activityKey)
      }
    }

    function cleanup() {
      clearTimer()

      events.forEach(event => {
        window.removeEventListener(event, activity)
      })
    }

    function activity() {
      if (!userId || !activityKey || stopped || timedOut) return

      const now = Date.now()

      if (now - lastWrite < WRITE_INTERVAL) return

      lastWrite = now
      localStorage.setItem(activityKey, String(now))
    }

    async function handleTimeout() {
      if (timedOut || stopped) return

      timedOut = true
      clearTimer()

      // Remove the stale activity timestamp BEFORE redirecting.
      removeActivityKey()

      // Only clear this browser's Supabase session.
      await supabase.auth.signOut({ scope: 'local' })

      if (!stopped) {
        router.replace('/login?reason=timeout')
      }
    }

    async function startForUser(id: string) {
      cleanup()

      userId = id
      activityKey = `tentwood:last-activity:${id}`
      lastWrite = 0
      timedOut = false

      const now = Date.now()
      const savedValue = localStorage.getItem(activityKey)
      const saved = savedValue ? Number(savedValue) : 0

      /*
       * If there is no activity timestamp, this is a fresh login.
       * Start a completely new 4-hour inactivity window.
       */
      if (!saved || Number.isNaN(saved)) {
        localStorage.setItem(activityKey, String(now))
      } else if (now - saved >= TIMEOUT) {
        await handleTimeout()
        return
      } else {
        /*
         * User has a valid existing activity timestamp.
         * Refresh it because they have successfully authenticated.
         */
        localStorage.setItem(activityKey, String(now))
      }

      if (stopped || timedOut) return

      events.forEach(event => {
        window.addEventListener(event, activity, { passive: true })
      })

      timer = window.setInterval(async () => {
        if (!userId || !activityKey || stopped || timedOut) return

        const lastValue = localStorage.getItem(activityKey)
        const last = lastValue ? Number(lastValue) : 0

        if (!last || Number.isNaN(last)) {
          localStorage.setItem(activityKey, String(Date.now()))
          return
        }

        if (Date.now() - last >= TIMEOUT) {
          await handleTimeout()
        }
      }, CHECK_INTERVAL)
    }

    async function initialize() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (stopped) return

      if (user) {
        await startForUser(user.id)
      }
    }

    initialize()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (stopped) return

      if (event === 'SIGNED_OUT') {
        cleanup()

        if (activityKey) {
          localStorage.removeItem(activityKey)
        }

        userId = null
        activityKey = null
        lastWrite = 0
        timedOut = false

        return
      }

      if (
        event === 'SIGNED_IN' ||
        event === 'INITIAL_SESSION' ||
        event === 'TOKEN_REFRESHED'
      ) {
        if (session?.user) {
          await startForUser(session.user.id)
        }
      }
    })

    return () => {
      stopped = true
      cleanup()
      subscription.unsubscribe()
    }
  }, [router])

  return null
}