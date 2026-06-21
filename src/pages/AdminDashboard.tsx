import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/context/AuthContext'
import { PhysicsWordCloud, CloudWord } from '@/components/ui/PhysicsWordCloud'

// ─── Types ────────────────────────────────────────────────────────────────────

interface QuizResult {
  id: string
  group_number: number
  score: number
  answers: any
  percentage: number
  completed_at: string
}

interface Reflection {
  id: string
  group_number: number
  q1_answer: string
  q2_word: string
  submitted_at: string
}

type TabId = 'overview' | 'groups' | 'tracker' | 'scores' | 'wordcloud' | 'settings'

const TABS = [
  { id: 'overview' as TabId,  icon: '📊', label: 'Overview' },
  { id: 'groups' as TabId,    icon: '👥', label: 'Kelompok' },
  { id: 'tracker' as TabId,   icon: '📍', label: 'Live Tracker' },
  { id: 'scores' as TabId,    icon: '🏆', label: 'Skor Quiz' },
  { id: 'wordcloud' as TabId, icon: '✨', label: 'Word Cloud' },
  { id: 'settings' as TabId,  icon: '⚙️', label: 'Pengaturan' },
]

const GROUP_COLORS = [
  { bg: '#74C0FC', text: '#1A1A2E', border: '#74C0FC' }, // 1 sky
  { bg: '#FF6B6B', text: '#fff',    border: '#FF6B6B' }, // 2 coral
  { bg: '#4ECDC4', text: '#1A1A2E', border: '#4ECDC4' }, // 3 mint
  { bg: '#FFE135', text: '#1A1A2E', border: '#FFE135' }, // 4 yellow
  { bg: '#C77DFF', text: '#fff',    border: '#C77DFF' }, // 5 lavender
]

const WORD_COLORS = ['#FF6B6B', '#74C0FC', '#4ECDC4', '#FFE135', '#C77DFF', '#FF9A3C', '#86efac']

const PAGE_NAMES: Record<string, string> = {
  '/mission': '🎒 Misi',
  '/teammaker': '🎡 Spin Wheel',
  '/simulator': '🚨 Evacuation 3D',
  '/evaluation': '🎮 Quiz',
  '/reflection': '✨ Refleksi',
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ icon, label, value, color, live, labelColor }: {
  icon: string; label: string; value: string | number; color: string; live?: boolean; labelColor?: string;
}) {
  return (
    <div className={`bg-white border-4 border-[#1A1A2E] shadow-[4px_4px_0px_#1A1A2E] flex flex-col`}>
      <div style={{ background: color }} className="px-4 py-2 flex items-center gap-2 border-b-4 border-[#1A1A2E]">
        <span className="text-lg">{icon}</span>
        <span className={`text-xs font-black uppercase tracking-wider ${labelColor || 'text-[#1A1A2E]'}`}>
          {label}
        </span>
        {live && (
          <span className="ml-auto flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#4ade80] shadow-[0_0_6px_#4ade80] animate-pulse" />
          </span>
        )}
      </div>
      <div className="p-6 text-5xl font-black text-[#1A1A2E] leading-none">
        {value}
      </div>
    </div>
  )
}

// ─── AdminDashboard ───────────────────────────────────────────────────────────

class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: any}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-[#FF6B6B] bg-[#1A1A2E] min-h-screen font-mono">
          <h1>💥 Something went wrong in AdminDashboard.</h1>
          <pre>{String(this.state.error)}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  
  if (!user) return <Navigate to="/admin/login" replace />

  const [activeTab, setActiveTab] = useState<TabId>('overview')
  const [sessionId, setSessionId] = useState<string | null>(null)

  // Data state
  const [quizResults, setQuizResults] = useState<QuizResult[]>([])

  // Global realtime states
  const [presenceData, setPresenceData] = useState<any[]>([])

  const [reflectionData, setReflectionData] = useState<any[]>([])
  const [groupsData, setGroupsData] = useState<any[]>([])
  const [showResetDialog, setShowResetDialog] = useState(false)









  const presenceChannelRef = useRef<any>(null)

  useEffect(() => {
    if (!sessionId) return
    
    const channelName = `presence-session-${sessionId}`
    
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
    
    // Create new channel with new sessionId
    const channel = supabase.channel(channelName)
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        const activeGroups: any[] = []
        for (const key in state) {
          if (state[key] && state[key].length > 0) {
            const presenceObj = state[key][0] as any
            activeGroups.push(presenceObj)
          }
        }
        setPresenceData(activeGroups)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          console.log('[PRESENCE] Teacher joined channel:', `presence-session-${sessionId}`)
        }
      })
    
    presenceChannelRef.current = channel
    
    return () => {
      supabase.removeChannel(channel)
      if ((supabase as any).realtime && (supabase as any).realtime.channels) {
        (supabase as any).realtime.channels = (supabase as any).realtime.channels.filter(
          (ch: any) => ch !== channel
        )
      }
    }
  }, [sessionId])

  const channelsRef = useRef<any[]>([])

  // Groups tab local
  const [groupsLocked, setGroupsLocked] = useState(false)
  const [resetConfirm, setResetConfirm] = useState(false)

  // Word cloud simplified state
  const [cloudWords, setCloudWords] = useState<CloudWord[]>([])

  // Settings
  const [sessionActive, setSessionActive] = useState(true)

  const dateStr = new Date().toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })

  // ── Session init ─────────────────────────────────────────────────────────────
  useEffect(() => {
    async function initSession() {
      if (!user) return
      const { data: existing } = await supabase
        .from('sessions')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (existing) {
        setSessionId(existing.id)
        setGroupsLocked(existing.groups_locked ?? false)
      } else {
        const { data: created } = await supabase
          .from('sessions')
          .insert({ teacher_id: user.id, is_active: true })
          .select()
          .single()
        if (created) setSessionId(created.id)
      }
    }
    initSession()
  }, [user])

  // ── Word cloud builder ────────────────────────────────────────────────────────
  const buildWordCloud = useCallback((refls: Reflection[]) => {
    const wordMap: Record<string, number> = {}
    refls.forEach(r => {
      if (!r.q2_word) return
      const w = r.q2_word.trim().toUpperCase()
      if (w) wordMap[w] = (wordMap[w] ?? 0) + 1
    })
    const entries = Object.entries(wordMap).sort(([, a], [, b]) => b - a)
    const newWords = entries.map(([word, count], i) => {
      const color = WORD_COLORS[i % WORD_COLORS.length]
      return { word, count, color }
    })
    setCloudWords(newWords)
  }, [])

  const fetchPresence = useCallback(async () => {
    if (!sessionId) return
    const { data } = await supabase.from('student_presence').select('*').eq('session_id', sessionId).order('group_number')
    if (data) setPresenceData(data)
  }, [sessionId])

  const fetchQuiz = useCallback(async () => {
    if (!sessionId) return
    const { data } = await supabase.from('quiz_results').select('*').eq('session_id', sessionId).order('score', { ascending: false })
    if (data) setQuizResults(data)
  }, [sessionId])

  const fetchReflections = useCallback(async () => {
    if (!sessionId) return
    const { data } = await supabase.from('reflections').select('*').eq('session_id', sessionId)
    if (data) {
      setReflectionData(data)
      buildWordCloud(data)
    }
  }, [sessionId, buildWordCloud])

  const fetchGroups = useCallback(async () => {
    if (!sessionId) return
    const { data } = await supabase.from('groups').select('*').eq('session_id', sessionId).order('group_number')
    if (data) setGroupsData(data)
  }, [sessionId])

  // ── Initial data fetch ────────────────────────────────────────────────────────
  useEffect(() => {
    console.log('[RT INIT] sessionId at subscription time:', sessionId)
    if (!sessionId) return

    // fetchPresence() replaced by realtime channel
    fetchQuiz()
    fetchReflections()
    fetchGroups()

    // --- POLLING FALLBACK ---
    const quizInterval = setInterval(() => {
      fetchQuiz()
    }, 3000)

    const refInterval = setInterval(() => {
      fetchReflections()
    }, 3000)

    // ── Realtime subscriptions ───────────────────────────────────────────────
    channelsRef.current.forEach(ch => supabase.removeChannel(ch))
    channelsRef.current = []

    console.log('[RT] Subscribing with sessionId:', sessionId)

    const ch2 = (() => {
      console.log('[RT] Setting up channel for quiz_results')
      return supabase
        .channel('quiz-watch-' + Date.now())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'quiz_results' }, (payload) => {
          console.log('[RT] Event received (quiz_results):', payload)
          console.log('[RT] Fetching data after event...')
          fetchQuiz()
        })
        .subscribe((status) => {
          console.log('[RT] Channel status (quiz_results):', status)
        })
    })()

    const ch3 = (() => {
      console.log('[RT] Setting up channel for reflections')
      return supabase
        .channel('reflection-watch-' + Date.now())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'reflections' }, (payload) => {
          console.log('[RT] Event received (reflections):', payload)
          console.log('[RT] Fetching data after event...')
          fetchReflections()
        })
        .subscribe((status) => {
          console.log('[RT] Channel status (reflections):', status)
        })
    })()

    const ch4 = supabase
      .channel('groups-watch-' + Date.now())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'groups' }, () => {
        fetchGroups()
      })
      .subscribe()

    const trackingChannel = supabase
      .channel('tracking-channel-' + Date.now())
      .on('broadcast', { event: 'simulation_update' }, () => {})
      .subscribe()

    const reflBroadcastChannel = supabase
      .channel('reflection-channel-' + Date.now())
      .on('broadcast', { event: 'word_submit' }, (payload) => {
        const { word } = payload.payload as { word: string }
        if (!word) return
        const fakeRefl: Reflection = {
          id: Date.now().toString(), group_number: 0,
          q1_answer: '', q2_word: word.trim().toUpperCase(),
          submitted_at: new Date().toISOString(), session_id: sessionId,
        } as any
        setReflectionData((prev: any[]) => {
          const updated = [...prev, fakeRefl]
          if (typeof buildWordCloud === 'function') buildWordCloud(updated)
          return updated
        })
      })
      .subscribe()

    channelsRef.current = [ch2, ch3, ch4, trackingChannel, reflBroadcastChannel]

    return () => {
      clearInterval(quizInterval)
      clearInterval(refInterval)
      channelsRef.current.forEach(ch => supabase.removeChannel(ch))
      channelsRef.current = []
    }
  }, [sessionId, buildWordCloud])

  // ── Group lock / reset ────────────────────────────────────────────────────────
  async function handleLockGroups() {
    if (!sessionId) return
    await supabase.from('sessions').update({ groups_locked: true }).eq('id', sessionId)
    await supabase.from('groups').update({ is_locked: true }).eq('session_id', sessionId)
    setGroupsLocked(true)
  }

  async function handleResetGroups() {
    if (!resetConfirm) { setResetConfirm(true); return }
    if (!sessionId) return
    await supabase.from('groups').update({ members: [] }).eq('session_id', sessionId)
    await supabase.from('sessions').update({ groups_locked: false }).eq('id', sessionId)
    setGroupsData([])
    setGroupsLocked(false)
    setResetConfirm(false)
  }

  async function handleToggleSession() {
    if (!sessionId) return
    const next = !sessionActive
    await supabase.from('sessions').update({ is_active: next }).eq('id', sessionId)
    setSessionActive(next)
  }

      async function handleExportPdf() {
    if (!sessionId) return

    try {
      const doc = new jsPDF()
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      
      const addFooter = (pageNumber: number) => {
        doc.setDrawColor(255, 214, 0)
        doc.setLineWidth(0.5)
        doc.line(14, pageHeight - 15, pageWidth - 14, pageHeight - 15)
        doc.setFontSize(10)
        doc.setTextColor(136, 136, 136)
        doc.text("SafeKids — PGMI, UIN Ar-Raniry 2026", 14, pageHeight - 10)
        doc.text(`Halaman ${pageNumber}`, pageWidth - 14, pageHeight - 10, { align: "right" })
      }

      // --- PAGE 1: COVER ---
      doc.setFillColor(255, 214, 0)
      doc.rect(0, 0, pageWidth, pageHeight / 2, 'F')
      
      doc.setTextColor(26, 26, 26)
      doc.setFont("helvetica", "bold")
      doc.setFontSize(36)
      doc.text("SafeKids", pageWidth / 2, pageHeight / 4, { align: "center" })
      
      doc.setFontSize(16)
      doc.text("Media Pembelajaran — Laporan Hasil Sesi", pageWidth / 2, (pageHeight / 4) + 15, { align: "center" })
      
      doc.setTextColor(26, 26, 26)
      doc.setFontSize(12)
      doc.setFont("helvetica", "normal")
      doc.text(`Tanggal: ${new Date().toLocaleString('id-ID')}`, pageWidth / 2, (pageHeight / 2) + 20, { align: "center" })
      doc.text(`Session ID: ${sessionId}`, pageWidth / 2, (pageHeight / 2) + 30, { align: "center" })
      
      addFooter(1)

      // --- PAGE 2: PAPAN SKOR QUIZ ---
      doc.addPage()
      doc.setFillColor(255, 214, 0)
      doc.rect(14, 14, pageWidth - 28, 12, 'F')
      doc.setTextColor(26, 26, 26)
      doc.setFont("helvetica", "bold")
      doc.setFontSize(14)
      doc.text("🏆 PAPAN SKOR QUIZ", 16, 22)

      const tableBody = quizResults.map((result, idx) => {
        const members = groupsData.find(g => g.group_number === result.group_number)?.members?.join(', ') || '—'
        return [
          String(idx + 1),
          String(result.group_number),
          members,
          String(result.score),
          `${result.percentage ?? 0}%`,
          new Date(result.completed_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
        ]
      })

      autoTable(doc, {
        startY: 32,
        head: [['RANK', 'KELOMPOK', 'ANGGOTA', 'SKOR', '%', 'WAKTU']],
        body: tableBody,
        theme: 'grid',
        headStyles: { fillColor: [26, 26, 26], textColor: [255, 214, 0], fontStyle: 'bold' },
        styles: { font: 'helvetica', textColor: [26, 26, 26], lineColor: [255, 214, 0], lineWidth: 0.1 },
        alternateRowStyles: { fillColor: [255, 249, 224] },
        didParseCell: (data) => {
          if (data.section === 'body' && data.row.index === 0) {
            data.cell.styles.textColor = [255, 214, 0]
            data.cell.styles.fontStyle = 'bold'
            data.cell.styles.fillColor = [26, 26, 26] // To make yellow text visible
          } else if (data.section === 'body' && data.row.index === 1) {
            data.cell.styles.fontStyle = 'bold'
            data.cell.styles.fillColor = [240, 240, 240] // Light gray
          } else if (data.section === 'body' && data.row.index === 2) {
            data.cell.styles.fontStyle = 'bold'
            data.cell.styles.fillColor = [255, 235, 204] // Light orange
          }
        }
      })
      
      addFooter(2)

      // --- PAGE 3: DATA KELOMPOK ---
      doc.addPage()
      doc.setFillColor(255, 214, 0)
      doc.rect(14, 14, pageWidth - 28, 12, 'F')
      doc.setTextColor(26, 26, 26)
      doc.setFont("helvetica", "bold")
      doc.setFontSize(14)
      doc.text("👥 DATA KELOMPOK", 16, 22)

      let yPos = 36
      groupsData.forEach(g => {
        if (yPos > pageHeight - 30) {
          doc.addPage()
          addFooter((doc.internal as any).getNumberOfPages())
          yPos = 20
        }
        doc.setFont("helvetica", "bold")
        doc.setFontSize(12)
        doc.text(`Kelompok ${g.group_number}`, 14, yPos)
        
        doc.setFont("helvetica", "normal")
        doc.setFontSize(10)
        const members = g.members?.join(', ') || '—'
        const splitMembers = doc.splitTextToSize(members, pageWidth - 28)
        doc.text(splitMembers, 14, yPos + 6)
        
        yPos += (splitMembers.length * 5) + 8
        
        doc.setDrawColor(200, 200, 200)
        doc.setLineWidth(0.2)
        doc.line(14, yPos - 3, pageWidth - 14, yPos - 3)
        yPos += 4
      })

      addFooter((doc.internal as any).getNumberOfPages())

      // --- PAGE 4: REFLEKSI SISWA ---
      doc.addPage()
      doc.setFillColor(255, 214, 0)
      doc.rect(14, 14, pageWidth - 28, 12, 'F')
      doc.setTextColor(26, 26, 26)
      doc.setFont("helvetica", "bold")
      doc.setFontSize(14)
      doc.text("✨ REFLEKSI DIGITAL SISWA", 16, 22)

      const reflectionsByGroup: Record<number, string[]> = {}
      reflectionData.forEach(r => {
        const gn = r.group_number ?? 0
        if (!reflectionsByGroup[gn]) reflectionsByGroup[gn] = []
        if (r.q2_word) reflectionsByGroup[gn].push(r.q2_word)
      })

      yPos = 36
      Object.entries(reflectionsByGroup).sort((a,b) => parseInt(a[0]) - parseInt(b[0])).forEach(([groupNum, words]) => {
        if (yPos > pageHeight - 30) {
          doc.addPage()
          addFooter((doc.internal as any).getNumberOfPages())
          yPos = 20
        }
        
        doc.setFont("helvetica", "bold")
        doc.setFontSize(12)
        doc.text(`Kelompok ${groupNum}`, 14, yPos)
        yPos += 6
        
        doc.setFont("helvetica", "normal")
        doc.setFontSize(10)
        
        words.forEach(w => {
           if (yPos > pageHeight - 25) {
             doc.addPage()
             addFooter((doc.internal as any).getNumberOfPages())
             yPos = 20
           }
           const splitW = doc.splitTextToSize(`• ${w}`, pageWidth - 32)
           doc.text(splitW, 18, yPos)
           yPos += splitW.length * 5
        })
        yPos += 4
      })

      if (Object.keys(reflectionsByGroup).length === 0) {
        doc.setFont("helvetica", "normal")
        doc.setFontSize(10)
        doc.text("Belum ada refleksi.", 14, yPos)
      }

      addFooter((doc.internal as any).getNumberOfPages())

      doc.save(`Hasil_Sesi_SafeKids_${new Date().toISOString().split('T')[0]}.pdf`)
    } catch (err) {
      console.error("Failed to generate PDF", err)
      alert("Gagal mengexport file: " + String(err))
    }
  }

  async function handleResetSession() {
    if (!sessionId) return
    setShowResetDialog(true)
  }

  async function executeReset() {
    setShowResetDialog(false)
    if (!sessionId) return
    
    // 1-4. Delete existing data IN ORDER
    await Promise.all([
      supabase.from('student_presence').delete().eq('session_id', sessionId),
      supabase.from('quiz_results').delete().eq('session_id', sessionId),
      supabase.from('reflections').delete().eq('session_id', sessionId),
      supabase.from('groups').delete().eq('session_id', sessionId),
    ])

    // 5. Deactivate old session
    await supabase.from('sessions').update({ is_active: false }).eq('id', sessionId)

    // 6. Create new session
    const { data: created } = await supabase
      .from('sessions')
      .insert({ teacher_id: user?.id, is_active: true })
      .select()
      .single()

    // 7. Update local state
    if (created) setSessionId(created.id)
    setGroupsData([]); setPresenceData([]); setQuizResults([]); setReflectionData([]); setCloudWords([])
  }

  async function handleLogout() {
    await signOut()
    navigate('/')
  }

  // ─── Render ───────────────────────────────────────────────────────────────────

  // Escape key closes the reset dialog
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowResetDialog(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <ErrorBoundary>
      <div className="p-6 bg-[#FFFEF7] min-h-[calc(100vh-64px)]">
        {/* Tab selector bar at top */}
        <div style={{
          display: 'flex', gap: '8px',
          marginBottom: '1.5rem',
          borderBottom: '4px solid #1A1A2E',
          paddingBottom: '0',
          flexWrap: 'wrap'
        }}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: activeTab === tab.id 
                  ? '#1A1A2E' : 'transparent',
                color: activeTab === tab.id 
                  ? '#FFE135' : '#1A1A2E',
                border: '4px solid #1A1A2E',
                borderBottom: 'none',
                fontWeight: 900,
                fontSize: '13px',
                padding: '8px 16px',
                cursor: 'pointer',
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* ── TAB: OVERVIEW ──────────────────────────────────────────────────── */}
          {activeTab === 'overview' && (
            <div>
              {/* Header */}
              <div className="mb-8">
                <h1 className="text-3xl font-black text-[#1A1A2E] m-0 leading-tight">
                  📊 Dashboard Guru
                </h1>
                <p className="text-sm text-[#1A1A2E]/50 mt-2 font-bold">
                  {dateStr}
                </p>
              </div>

              {/* Stat cards */}
              <div className="grid grid-cols-2 gap-6 mb-8">
                <StatCard icon="👥" label="Kelompok Terdaftar" value={presenceData.length} color="#4ECDC4" />
                <StatCard
                  icon="📍"
                  label="Kelompok Aktif"
                  value={presenceData.filter(p => new Date(p.last_seen) > new Date(Date.now() - 30000)).length}
                  color="#74C0FC"
                  live
                />
                <StatCard
                  icon="🏆"
                  label="Rata-rata Skor"
                  value={`${
                    quizResults.length > 0
                      ? Math.round(quizResults.reduce((sum, q) => sum + (q.percentage ?? 0), 0) / quizResults.length)
                      : 0
                  }%`}
                  color="#FFE135"
                />
                <StatCard icon="✨" label="Kata Terkirim" value={reflectionData.length} color="#C77DFF" labelColor="text-white" />
              </div>

              {/* Quick actions */}
              <div className="mb-8">
                <div className="text-xs font-black text-[#1A1A2E]/40 uppercase tracking-widest mb-3">
                  Aksi Cepat
                </div>
                <div className="flex gap-4 flex-wrap">
                  <button
                    onClick={() => setActiveTab('groups')}
                    className="bg-[#FFE135] text-[#1A1A2E] border-4 border-[#1A1A2E] shadow-[4px_4px_0px_#1A1A2E] font-black px-6 py-3 hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0px_#1A1A2E] active:translate-y-1 active:translate-x-1 active:shadow-[0px_0px_0px_#1A1A2E] transition-all"
                  >
                    🎡 Buka Spin Wheel
                  </button>
                  <button
                    onClick={() => setActiveTab('tracker')}
                    className="bg-[#FF6B6B] text-white border-4 border-[#1A1A2E] shadow-[4px_4px_0px_#1A1A2E] font-black px-6 py-3 hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0px_#1A1A2E] active:translate-y-1 active:translate-x-1 active:shadow-[0px_0px_0px_#1A1A2E] transition-all"
                  >
                    📍 Live Tracker
                  </button>
                  <button
                    onClick={() => setActiveTab('wordcloud')}
                    className="bg-[#C77DFF] text-white border-4 border-[#1A1A2E] shadow-[4px_4px_0px_#1A1A2E] font-black px-6 py-3 hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0px_#1A1A2E] active:translate-y-1 active:translate-x-1 active:shadow-[0px_0px_0px_#1A1A2E] transition-all"
                  >
                    ✨ Word Cloud
                  </button>
                </div>
              </div>

              {/* Session info card */}
              <div className="bg-[#1A1A2E] text-white border-4 border-[#FFE135] shadow-[4px_4px_0px_#FFE135] p-6">
                <div className="text-xs font-black text-[#FFE135]/60 uppercase tracking-widest mb-4">
                  Info Sesi
                </div>
                <div className="grid grid-cols-2 gap-6">
                  {[
                    { label: 'Session ID', value: sessionId ? sessionId.slice(0, 8) + '...' : '–' },
                    { label: 'Status', value: sessionActive ? '🟢 Aktif' : '🔴 Nonaktif' },
                    { label: 'Guru', value: user?.email ?? '–' },
                    { label: 'Kelompok Terdaftar', value: `${presenceData.length} / 5` },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <div className="text-xs font-black text-[#FFE135]/60 uppercase">{label}</div>
                      <div className="text-base font-bold text-white mt-1">{value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── TAB: KELOMPOK ──────────────────────────────────────────────────── */}
          {activeTab === 'groups' && (
            <div>
              <div className="mb-6 flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-black text-[#1A1A2E] m-0">👥 Manajemen Kelompok</h2>
                  <p className="text-sm font-bold text-[#1A1A2E]/50 mt-1">Data kelompok dari Spin Wheel</p>
                </div>
                <button onClick={fetchGroups} className="bg-white text-[#1A1A2E] font-black text-xs px-3 py-1.5 border-2 border-[#1A1A2E] shadow-[2px_2px_0px_#1A1A2E] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all">🔄 Refresh</button>
              </div>

              {/* Controls */}
              <div className="flex gap-3 mb-6 flex-wrap items-center">
                <button
                  onClick={() => navigate('/teammaker')}
                  className="bg-[#FFE135] text-[#1A1A2E] border-4 border-[#1A1A2E] shadow-[4px_4px_0px_#1A1A2E] font-black px-5 py-2.5 hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0px_#1A1A2E] active:translate-y-1 active:translate-x-1 active:shadow-[0px_0px_0px_#1A1A2E] transition-all"
                >
                  🎡 Buka Spin Wheel
                </button>

                <button
                  onClick={handleLockGroups}
                  disabled={groupsLocked}
                  className={`border-4 border-[#1A1A2E] shadow-[4px_4px_0px_#1A1A2E] font-black px-5 py-2.5 transition-all ${
                    groupsLocked 
                      ? 'bg-gray-300 text-gray-500 shadow-none translate-y-1 translate-x-1 cursor-not-allowed' 
                      : 'bg-[#4ECDC4] text-[#1A1A2E] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0px_#1A1A2E] active:translate-y-1 active:translate-x-1 active:shadow-[0px_0px_0px_#1A1A2E]'
                  }`}
                >
                  {groupsLocked ? '🔒 Sudah Dikunci' : '🔒 Kunci Semua'}
                </button>

                <button
                  onClick={handleResetGroups}
                  disabled={groupsLocked}
                  className={`border-4 border-[#1A1A2E] font-black px-5 py-2.5 transition-all ${
                    groupsLocked 
                      ? 'bg-gray-300 text-gray-500 shadow-none translate-y-1 translate-x-1 cursor-not-allowed'
                      : resetConfirm
                        ? 'bg-[#FF6B6B] text-white shadow-[4px_4px_0px_#1A1A2E] animate-pulse'
                        : 'bg-white text-[#FF6B6B] shadow-[4px_4px_0px_#1A1A2E] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0px_#1A1A2E] active:translate-y-1 active:translate-x-1 active:shadow-[0px_0px_0px_#1A1A2E]'
                  }`}
                >
                  {resetConfirm ? '⚠️ Konfirmasi reset?' : '🔄 Reset Semua'}
                </button>
                {resetConfirm && (
                  <button
                    onClick={() => setResetConfirm(false)}
                    className="bg-white text-[#1A1A2E] border-4 border-[#1A1A2E] shadow-[4px_4px_0px_#1A1A2E] font-black px-4 py-2.5 hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0px_#1A1A2E] active:translate-y-1 active:translate-x-1 active:shadow-[0px_0px_0px_#1A1A2E] transition-all"
                  >
                    Batal
                  </button>
                )}
              </div>

              {/* Group cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1,2,3,4,5].map(groupNum => {
                  const groupInfo = groupsData.find(
                    g => g.group_number === groupNum
                  )
                  const members: string[] = groupInfo?.members ?? []
                  
                  return (
                    <div key={groupNum} style={{
                      border: `4px solid ${GROUP_COLORS[groupNum-1].border}`,
                      boxShadow: `4px 4px 0 ${GROUP_COLORS[groupNum-1].border}`,
                      background: 'white'
                    }}>
                      <div style={{
                        background: GROUP_COLORS[groupNum-1].bg,
                        padding: '10px 16px',
                        fontWeight: 900, fontSize: '16px',
                        color: GROUP_COLORS[groupNum-1].text
                      }}>
                        Kelompok {groupNum}
                        <span style={{
                          float:'right', fontSize:'12px',
                          opacity: 0.8
                        }}>
                          {members.length} anggota
                        </span>
                      </div>
                      <div style={{padding: '12px', minHeight: '60px'}}>
                        {members.length === 0 ? (
                          <span style={{color:'#999', fontStyle:'italic',
                            fontSize:'13px'}}>
                            Belum ada anggota
                          </span>
                        ) : (
                          <div style={{display:'flex', flexWrap:'wrap', gap:'6px'}}>
                            {members.map((name: string) => (
                              <span key={name} style={{
                                background: '#f5f5f5',
                                border: '2px solid #1A1A2E',
                                padding: '4px 10px',
                                fontSize: '13px',
                                fontWeight: 700
                              }}>
                                {name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── TAB: LIVE TRACKER ──────────────────────────────────────────────── */}
          {activeTab === 'tracker' && (
            <div>
              <div className="mb-6 flex justify-between items-start">
                <div>
                  <h2 style={{fontWeight:900, fontSize:'1.5rem', marginBottom:'0.25rem'}}>📍 Live Tracker — Posisi Kelompok</h2>
                  <p style={{fontSize:'12px', color:'#666', marginBottom:'0'}}>Real-time · {presenceData.length} kelompok terdeteksi</p>
                </div>
                <button onClick={fetchPresence} className="bg-white text-[#1A1A2E] font-black text-xs px-3 py-1.5 border-2 border-[#1A1A2E] shadow-[2px_2px_0px_#1A1A2E] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all">🔄 Refresh</button>
              </div>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem'
              }}>
                {[1,2,3,4,5].map(groupNum => {
                  const presence = presenceData.find(
                    p => Number(p.group_number) === groupNum
                  )
                  const isOnline = presence &&
                    new Date(presence.last_seen) > 
                    new Date(Date.now() - 60000)  // 60 seconds

                  return (
                    <div key={groupNum} style={{
                      background: 'white',
                      border: `4px solid ${GROUP_COLORS[groupNum-1]?.bg || '#1A1A2E'}`,
                      boxShadow: `4px 4px 0 ${GROUP_COLORS[groupNum-1]?.bg || '#1A1A2E'}`,
                      minHeight: '140px'
                    }}>
                      <div style={{
                        background: GROUP_COLORS[groupNum-1]?.bg || '#1A1A2E',
                        padding: '10px 14px',
                        fontWeight: 900,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <span style={{color: '#1A1A2E'}}>
                          Kelompok {groupNum}
                        </span>
                        <span style={{
                          width: 10, height: 10,
                          borderRadius: '50%',
                          display: 'inline-block',
                          background: isOnline ? '#16a34a' : '#ccc',
                        }} />
                      </div>
                      
                      <div style={{padding: '14px'}}>
                        <div style={{
                          fontWeight: 900,
                          fontSize: '18px',
                          color: '#1A1A2E',
                          marginBottom: '4px'
                        }}>
                          {presence
                            ? (PAGE_NAMES[presence.current_page] 
                               || presence.current_page)
                            : '—'
                          }
                        </div>
                        <div style={{
                          fontSize: '11px',
                          color: '#888'
                        }}>
                          {isOnline ? '● Online'
                            : presence
                              ? `${new Date(presence.last_seen)
                                  .toLocaleTimeString('id-ID')}`
                              : 'Belum bergabung'
                          }
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── TAB: SKOR QUIZ ─────────────────────────────────────────────────── */}
          {activeTab === 'scores' && (
            <div>
              <div className="mb-6 flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-black text-[#1A1A2E] m-0">🏆 Papan Skor</h2>
                  <p className="text-sm font-bold text-[#1A1A2E]/50 mt-1">Diperbarui secara real-time</p>
                </div>
                <button onClick={fetchQuiz} className="bg-white text-[#1A1A2E] font-black text-xs px-3 py-1.5 border-2 border-[#1A1A2E] shadow-[2px_2px_0px_#1A1A2E] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all">🔄 Refresh</button>
              </div>

              {quizResults.length === 0 ? (
                <div className="bg-white border-4 border-[#1A1A2E] shadow-[4px_4px_0px_#1A1A2E] p-12 text-center">
                  <div className="text-5xl mb-4">🎮</div>
                  <div className="text-[#1A1A2E] font-black text-xl">Belum ada hasil quiz</div>
                  <div className="text-[#1A1A2E]/50 font-bold text-sm mt-2">Hasil akan muncul setelah kelompok menyelesaikan quiz</div>
                </div>
              ) : (
                <div className="bg-white border-4 border-[#1A1A2E] shadow-[4px_4px_0px_#1A1A2E] overflow-hidden">
                  {/* Table header */}
                  <div className="grid grid-cols-[60px_1fr_1fr_100px_80px_100px] px-4 py-3 bg-[#1A1A2E] text-[#FFE135] font-black text-xs uppercase tracking-widest border-b-4 border-[#1A1A2E] gap-2">
                    <span>Rank</span>
                    <span>Kelompok</span>
                    <span>Anggota</span>
                    <span>Skor</span>
                    <span>%</span>
                    <span>Waktu</span>
                  </div>

                  {quizResults.map((result, idx) => {
                    const rank = idx + 1
                    const col = GROUP_COLORS[Math.max(0, (result.group_number ?? 1) - 1)] ?? GROUP_COLORS[0]
                    
                    let rowClasses = "grid grid-cols-[60px_1fr_1fr_100px_80px_100px] px-4 py-3 items-center border-b-2 border-[#1A1A2E] last:border-b-0 gap-2 "
                    if (rank === 1) rowClasses += "bg-[#FFE135]/30 font-black"
                    else if (rank === 2) rowClasses += "bg-white font-bold"
                    else if (rank === 3) rowClasses += "bg-[#FF9A3C]/20 font-bold"
                    else rowClasses += "bg-gray-50 font-bold"

                    const rankIcon = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`
                    const members = groupsData.find(g => g.group_number === result.group_number)?.members?.join(', ') || '—'

                    return (
                      <div key={result.id} className={rowClasses}>
                        <span className="text-xl font-black text-[#1A1A2E]">{rankIcon}</span>
                        <span style={{ color: col.bg }} className="font-black text-lg">
                          Kelompok {result.group_number}
                        </span>
                        <span className="text-xs font-bold text-[#1A1A2E]/80 truncate" title={members}>
                          {members}
                        </span>
                        <span className="font-black text-xl text-[#1A1A2E]">
                          {result.score}
                        </span>
                        <span className="font-black text-base text-[#4ECDC4]">
                          {result.percentage?.toFixed(0) ?? 0}%
                        </span>
                        <span className="text-xs font-bold text-[#1A1A2E]/60">
                          {new Date(result.completed_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── TAB: WORD CLOUD ────────────────────────────────────────────────── */}
          {activeTab === 'wordcloud' && (
            <div>
              <div className="mb-6 flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-black text-[#1A1A2E] m-0">✨ Magic Word Cloud — Live dari Siswa</h2>
                  <p className="text-sm font-bold text-[#1A1A2E]/50 mt-1">{cloudWords.length} kata unik · real-time dari siswa</p>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={fetchReflections} className="bg-white text-[#1A1A2E] font-black text-xs px-3 py-1.5 border-2 border-[#1A1A2E] shadow-[2px_2px_0px_#1A1A2E] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all">🔄 Refresh</button>
                  <button
                    onClick={() => window.open('/reflection', '_blank')}
                    className="bg-white text-[#1A1A2E] border-4 border-[#1A1A2E] shadow-[4px_4px_0px_#1A1A2E] font-black px-4 py-2 hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0px_#1A1A2E] active:translate-y-1 active:translate-x-1 active:shadow-[0px_0px_0px_#1A1A2E] transition-all"
                  >
                    🖥️ Mode Proyektor
                  </button>
                </div>
              </div>

              {/* Reused Word Cloud Component */}
              <PhysicsWordCloud words={cloudWords} height="500px" emptyMessage="Menunggu refleksi siswa..." />

              {/* Top words */}
              {cloudWords.length > 0 && (
                <div className="mt-6">
                  <div className="text-xs font-black text-[#1A1A2E]/40 uppercase tracking-widest mb-3">
                    Top Kata
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {cloudWords.slice(0, 12).map((w, i) => (
                      <span key={w.word} style={{ background: w.color }} className="text-[#1A1A2E] font-black text-sm px-3 py-1.5 border-2 border-[#1A1A2E] shadow-[2px_2px_0px_#1A1A2E]">
                        {i === 0 ? '👑 ' : ''}{w.word}
                        <span className="opacity-70 ml-1 font-bold">×{w.count}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── TAB: PENGATURAN ────────────────────────────────────────────────── */}
          {activeTab === 'settings' && (
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-black text-[#1A1A2E] m-0">
                  ⚙️ Pengaturan Sesi
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Session controls */}
                <div className="bg-white border-4 border-[#1A1A2E] shadow-[4px_4px_0px_#1A1A2E] p-6 flex flex-col">
                  <div className="text-xs font-black text-[#1A1A2E]/40 uppercase tracking-widest mb-4">
                    Kontrol Sesi
                  </div>

                  <div className="flex flex-col gap-4">
                    {/* Session active toggle */}
                    <div className="flex justify-between items-center p-4 bg-gray-50 border-2 border-[#1A1A2E]">
                      <div>
                        <div className="text-sm font-black text-[#1A1A2E]">Sesi Aktif</div>
                        <div className="text-xs font-bold text-[#1A1A2E]/50 mt-1">
                          {sessionActive ? 'Siswa dapat masuk' : 'Sesi ditutup'}
                        </div>
                      </div>
                      <button
                        onClick={handleToggleSession}
                        className={`font-black px-4 py-2 border-2 border-[#1A1A2E] shadow-[2px_2px_0px_#1A1A2E] transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none ${
                          sessionActive ? 'bg-[#4ade80] text-[#1A1A2E]' : 'bg-gray-200 text-gray-500'
                        }`}
                      >
                        {sessionActive ? '🟢 ON' : '🔴 OFF'}
                      </button>
                    </div>

                    <button
                      onClick={handleResetSession}
                      className="bg-[#FF6B6B] text-white border-2 border-[#1A1A2E] shadow-[2px_2px_0px_#1A1A2E] font-black px-4 py-3 hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all flex items-center justify-center gap-2"
                    >
                      🔄 Reset Sesi
                    </button>

                    <button
                      onClick={handleExportPdf}
                      className="bg-white text-[#1A1A2E] border-2 border-[#1A1A2E] shadow-[2px_2px_0px_#1A1A2E] font-black px-4 py-3 hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all flex items-center justify-center gap-2"
                    >
                      📊 Export Hasil (.pdf)
                    </button>
                  </div>
                </div>

                {/* Account info */}
                <div className="bg-[#FFE135] border-4 border-[#1A1A2E] shadow-[4px_4px_0px_#1A1A2E] p-6 flex flex-col">
                  <div className="text-xs font-black text-[#1A1A2E]/60 uppercase tracking-widest mb-4">
                    Info Akun
                  </div>

                  <div className="flex flex-col gap-4">
                    <div className="p-4 bg-white border-2 border-[#1A1A2E] shadow-[2px_2px_0px_#1A1A2E]">
                      <div className="text-xs font-black text-[#1A1A2E]/40 mb-1">EMAIL</div>
                      <div className="text-base font-black text-[#1A1A2E]">{user?.email ?? '–'}</div>
                    </div>

                    <div className="p-4 bg-white border-2 border-[#1A1A2E] shadow-[2px_2px_0px_#1A1A2E]">
                      <div className="text-xs font-black text-[#1A1A2E]/40 mb-1">SESSION ID</div>
                      <div className="text-sm font-bold text-[#1A1A2E]/60 font-mono break-all">
                        {sessionId ?? '–'}
                      </div>
                    </div>

                    <button
                      onClick={handleLogout}
                      className="bg-[#FF6B6B] text-white border-2 border-[#1A1A2E] shadow-[2px_2px_0px_#1A1A2E] font-black px-4 py-3 mt-auto hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all"
                    >
                      🚪 Logout
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
      </div>

      {/* ─── Custom Reset Confirmation Dialog ──────────────────────── */}
      {showResetDialog && (
        <div
          onClick={() => setShowResetDialog(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            animation: 'fadeInOverlay 0.15s ease-out',
          }}
        >
          <style>{`
            @keyframes fadeInOverlay {
              from { opacity: 0; }
              to   { opacity: 1; }
            }
            @keyframes popInModal {
              from { opacity: 0; transform: scale(0.8); }
              to   { opacity: 1; transform: scale(1); }
            }
          `}</style>

          {/* Card — stop propagation so clicking inside doesn't close */}
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#FFFFFF',
              border: '3px solid #FFD600',
              borderRadius: '16px',
              padding: '32px',
              maxWidth: '400px',
              width: '90%',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              animation: 'popInModal 0.2s ease-out',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '48px', lineHeight: 1 }}>⚠️</div>

            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1A1A1A', margin: 0 }}>
              Reset Sesi?
            </h2>

            <p style={{ fontSize: '14px', color: '#555', margin: 0, lineHeight: 1.6 }}>
              Semua data kelompok, skor quiz, dan refleksi akan dihapus permanen.
              Tindakan ini <strong>tidak bisa dibatalkan</strong>.
            </p>

            <div style={{ display: 'flex', gap: '12px', marginTop: '8px', width: '100%' }}>
              <button
                onClick={() => setShowResetDialog(false)}
                style={{
                  flex: 1,
                  padding: '10px 24px',
                  borderRadius: '8px',
                  border: '2px solid #1A1A1A',
                  background: 'transparent',
                  color: '#1A1A1A',
                  fontWeight: 600,
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#f5f5f5')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                Batal
              </button>

              <button
                onClick={executeReset}
                style={{
                  flex: 1,
                  padding: '10px 24px',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#FF4444',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#cc0000')}
                onMouseLeave={e => (e.currentTarget.style.background = '#FF4444')}
              >
                🗑️ Ya, Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </ErrorBoundary>
  )
}