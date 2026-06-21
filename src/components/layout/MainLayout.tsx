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

      const channelName = `presence-session-${latestSessionId}`

      // Clean up channel from supabase's internal list synchronously if it exists to prevent React 18 double-subscription issues
      const existing = supabase.getChannels().find(
        (ch) => ch.topic === channelName
      )
      if (existing) {
        supabase.removeChannel(existing)
        if ((supabase as any).realtime && (supabase as any).realtime.channels) {
          (supabase as any).realtime.channels = (supabase as any).realtime.channels.filter(
            (ch: any) => ch !== existing
          )
        }
      }

      const channel = supabase.channel(channelName, {
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
        const ch = channelRef.current
        supabase.removeChannel(ch)
        if ((supabase as any).realtime && (supabase as any).realtime.channels) {
          (supabase as any).realtime.channels = (supabase as any).realtime.channels.filter(
            (c: any) => c !== ch
          )
        }
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

        {/* Footer credit */}
        <footer className="flex-shrink-0 border-t-2 border-brutal-black bg-brutal-black px-6 py-2 text-center">
          <p className="text-xs font-bold text-brutal-yellow/70">
            © 2026 Najwa Azzahra — NIM 240209050 | Media Pembelajaran | PGMI, UIN Ar-Raniry
          </p>
        </footer>
      </div>
    </div>
  )
}
