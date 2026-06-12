import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import Sidebar from './Sidebar'
import TopNavigation from './TopNavigation'
import { useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabaseClient'

// ─── Props ────────────────────────────────────────────────────────────────────

interface MainLayoutProps {
  children: ReactNode
}

// ─── MainLayout ───────────────────────────────────────────────────────────────

export default function MainLayout({ children }: MainLayoutProps) {
  const location = useLocation()
  const { studentGroup } = useAuth()

  const channelRef = useRef<any>(null)
  const [isChannelReady, setIsChannelReady] = useState(false)

  // 1. Setup the channel once per group session
  useEffect(() => {
    if (!studentGroup) return
    
    let isSubscribed = true
    setIsChannelReady(false)

    const setupPresence = async () => {
      // Get latest active session
      const { data: session } = await supabase
        .from('sessions')
        .select('id')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (!session || !isSubscribed) return
      
      const latestSessionId = session.id
      console.log('[PRESENCE] Student joining channel:', `presence-session-${latestSessionId}`)

      const channel = supabase.channel(`presence-session-${latestSessionId}`, {
        config: {
          presence: {
            key: `group-${studentGroup}`
          }
        }
      })

      channel
        .on('presence', { event: 'sync' }, () => {
          // Just keeping sync active
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED' && isSubscribed) {
            setIsChannelReady(true)
          }
        })

      channelRef.current = channel
    }

    setupPresence()

    return () => {
      isSubscribed = false
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
        setIsChannelReady(false)
      }
    }
  }, [studentGroup])

  // 2. Update track data whenever location changes
  useEffect(() => {
    if (!studentGroup || !isChannelReady || !channelRef.current) return

    channelRef.current.track({
      group_number: Number(studentGroup),
      current_page: location.pathname,
      last_seen: new Date().toISOString(),
    })
  }, [location.pathname, studentGroup, isChannelReady])

  return (
    <div className="flex h-screen overflow-hidden bg-[#FFFEF7]">
      {/* ── Sidebar (fixed height, scrollable internally) ─────── */}
      <Sidebar />

      {/* ── Main area ─────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top navigation bar */}
        <TopNavigation />

        {/* Page content */}
        <main
          id="main-content"
          className="flex-1 min-w-0 overflow-y-auto bg-[#FFFEF7] p-0"
        >
          {children}
        </main>
      </div>
    </div>
  )
}
