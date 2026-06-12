import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabaseClient'

// ─── Colors ──────────────────────────────────────────────────────────────────

const COLORS = [
  '#FF6B6B', // Coral Red
  '#FFE135', // Yellow
  '#4ECDC4', // Mint
  '#74C0FC', // Sky Blue
  '#FF9A3C', // Orange
  '#C77DFF', // Purple
  '#4ADE80', // Green
  '#F472B6', // Pink
]

// ─── TeamMaker Component ──────────────────────────────────────────────────────

export default function TeamMaker() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  // State variables
  const [remainingNames, setRemainingNames] = useState<string[]>([])
  const [groups, setGroups] = useState<Record<number, string[]>>({})
  const [numGroups, setNumGroups] = useState(5)
  const [isSpinning, setIsSpinning] = useState(false)
  
  const [inputText, setInputText] = useState('')


  const [saved, setSaved] = useState(false)

  // Refs for tracking animation state
  const rotationRef = useRef(0)
  const isSpinningRef = useRef(false)
  const animFrameRef = useRef<number | null>(null)

  // Reset saved when inputText changes
  useEffect(() => { setSaved(false) }, [inputText])

  // Initialize names on mount and handle RAF cleanup
  useEffect(() => {
    setRemainingNames([])
    setInputText('')
    
    // Draw initial empty wheel
    const timer = setTimeout(() => {
      drawWheel(0)
    }, 100)
    
    return () => {
      clearTimeout(timer)
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Sync ref to current active names list
  const remainingNamesRef = useRef(remainingNames)
  useEffect(() => {
    remainingNamesRef.current = remainingNames
    drawWheel(rotationRef.current)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remainingNames])

  // Draw wheel function
  const drawWheel = (rotation: number) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, 460, 460)

    const list = remainingNamesRef.current.length > 0 ? remainingNamesRef.current : ['(Roda Kosong)']
    const numSegments = list.length
    const anglePerSegment = (2 * Math.PI) / numSegments

    // Draw wheel segments
    for (let i = 0; i < numSegments; i++) {
      const startAngle = rotation + i * anglePerSegment
      const endAngle = rotation + (i + 1) * anglePerSegment
      const midAngle = startAngle + anglePerSegment / 2

      ctx.beginPath()
      ctx.moveTo(230, 230)
      ctx.arc(230, 230, 200, startAngle, endAngle)
      ctx.closePath()

      // Fill Segment
      ctx.fillStyle = remainingNamesRef.current.length > 0 ? COLORS[i % COLORS.length] : '#F3F4F6'
      ctx.fill()

      // Segment Outline
      ctx.lineWidth = 4
      ctx.strokeStyle = '#1A1A2E'
      ctx.stroke()

      // Draw text
      ctx.save()
      ctx.translate(230, 230)
      ctx.rotate(midAngle)
      ctx.textAlign = 'right'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = remainingNamesRef.current.length > 0 ? '#FFFFFF' : '#9CA3AF'
      ctx.font = '900 13px Nunito, sans-serif'
      
      // Rotate text nicely along segment radius
      ctx.fillText(list[i], 175, 0)
      ctx.restore()
    }

    // White Center Circle
    ctx.beginPath()
    ctx.arc(230, 230, 28, 0, 2 * Math.PI)
    ctx.fillStyle = '#FFFFFF'
    ctx.fill()
    ctx.lineWidth = 4
    ctx.strokeStyle = '#1A1A2E'
    ctx.stroke()

    // Draw Center Emoji
    ctx.font = '22px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('🎡', 230, 230)

    // Pointer/Arrow pointing LEFT at 3 o'clock position (right side)
    ctx.beginPath()
    ctx.moveTo(412, 230) // Tip
    ctx.lineTo(438, 212) // Top-right
    ctx.lineTo(438, 248) // Bottom-right
    ctx.closePath()
    ctx.fillStyle = '#1A1A2E'
    ctx.fill()
    ctx.lineWidth = 3
    ctx.strokeStyle = '#1A1A2E'
    ctx.stroke()
  }

  const autoDistribute = () => {
    // Parse names from textarea
    const names = inputText
      .split('\n')
      .map(n => n.trim())
      .filter(n => n.length > 0)
    
    if (names.length === 0) return
    
    // Shuffle names randomly
    const shuffled = [...names].sort(() => Math.random() - 0.5)
    
    // Distribute round-robin
    const newGroups: Record<number, string[]> = {}
    for (let i = 1; i <= numGroups; i++) newGroups[i] = []
    
    shuffled.forEach((name, index) => {
      const groupNum = (index % numGroups) + 1
      newGroups[groupNum].push(name)
    })
    
    setGroups(newGroups)
    setRemainingNames(names) // for the wheel to look populated
    
    // Spin wheel animation
    spinOnce()
    
    // Auto save immediately
    saveGroupsToSupabase(newGroups)
  }

  const spinOnce = () => {
    if (isSpinningRef.current) return
    setIsSpinning(true)
    isSpinningRef.current = true

    const startRot = rotationRef.current
    const additionalRot = (Math.random() * 5 + 5) * Math.PI * 2
    const targetRot = startRot + additionalRot

    const duration = 2000
    let startTime: number | null = null

    const animate = (time: number) => {
      if (!startTime) startTime = time
      const elapsed = time - startTime
      const progress = Math.min(elapsed / duration, 1)

      // easeOutCubic
      const easing = 1 - Math.pow(1 - progress, 3)
      const currentRot = startRot + (targetRot - startRot) * easing
      rotationRef.current = currentRot

      drawWheel(currentRot)

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animate)
      } else {
        setIsSpinning(false)
        isSpinningRef.current = false
      }
    }

    animFrameRef.current = requestAnimationFrame(animate)
  }
  
  const saveGroupsToSupabase = async (groupsToSave: Record<number, string[]>) => {
    try {
      // Get active session
      const { data: sessionData } = await supabase
        .from('sessions')
        .select('id')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      
      const sessionId = sessionData?.id ?? null
      
      if (sessionId) {
        // Query existing groups
        const { data: existingGroups } = await supabase
          .from('groups')
          .select('id, group_number')
          .eq('session_id', sessionId)

        const existingMap = new Map(existingGroups?.map(g => [g.group_number, g.id]) || [])

        // Insert or update
        for (const [groupNumStr, members] of Object.entries(groupsToSave)) {
          const groupNum = parseInt(groupNumStr)
          if ((members as string[]).length === 0) {
             // If empty, update members to empty array instead of skipping, to clear existing members
             if (existingMap.has(groupNum)) {
                await supabase.from('groups').update({ members: [], is_locked: false }).eq('id', existingMap.get(groupNum))
             }
             continue
          }

          if (existingMap.has(groupNum)) {
            await supabase.from('groups').update({ members: members as string[], is_locked: false }).eq('id', existingMap.get(groupNum))
          } else {
            await supabase.from('groups').insert({
              session_id: sessionId,
              group_number: groupNum,
              members: members as string[],
              is_locked: false
            })
          }
        }
      }
      
      setSaved(true)
      
    } catch (err: any) {
      console.error('Save error:', err)
      alert('Gagal menyimpan: ' + err.message)
    }
  }

  const hasGeneratedGroups = Object.keys(groups).length > 0;

  return (
    <div className="min-h-screen bg-[#FFFEF7] font-sans p-6 text-[#1A1A2E]">
      
      {/* Header */}
      <header className="mb-6">
        <h1 className="text-3xl font-black flex items-center gap-2 text-[#1A1A2E]">
          🎡 Spin Wheel — Pembagian Kelompok
        </h1>
        <p className="text-sm text-gray-500 font-bold mt-1">
          Bagi kelompok secara otomatis dan adil dengan roda putar
        </p>
      </header>

      {/* Main Grid */}
      <main className="flex flex-col lg:flex-row gap-6">

        {/* LEFT COLUMN: Spin Wheel */}
        <section className="w-full lg:w-[60%] flex-shrink-0">
          <div className="bg-white border-4 border-[#1A1A2E] shadow-[8px_8px_0px_#1A1A2E] p-6 flex flex-col items-center gap-4">
            
            {/* Canvas Wheel */}
            <div className="relative">
              <canvas
                ref={canvasRef}
                width={460}
                height={460}
                className="transition-transform duration-100"
              />
            </div>

            {/* Counter */}
            <span className="text-sm font-black text-gray-500 flex items-center gap-1.5 mt-1">
              🎡 {remainingNames.length > 0 ? `${remainingNames.length} nama termuat di roda` : 'Roda masih kosong'}
            </span>
          </div>
        </section>

        {/* RIGHT COLUMN: Controls & Results */}
        <section className="w-full lg:w-[40%] flex flex-col gap-5">
          
          {/* Section 1 - Input Nama */}
          <div className="bg-white border-4 border-[#1A1A2E] shadow-[4px_4px_0px_#1A1A2E] p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-black text-[#1A1A2E] flex items-center gap-2">
                📋 Input Nama Siswa
              </h2>
            </div>
            <textarea
              rows={8}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={"Masukkan nama siswa, satu per baris\n\nContoh:\nAhmad Fauzi\nBella Safira\nChandra\n..."}
              style={{ borderRadius: 0 }}
              className="w-full border-4 border-[#1A1A2E] p-3 font-mono text-sm focus:outline-none focus:shadow-brutal resize-none rounded-none mb-4"
            />
            
            <div className="flex flex-col gap-3">
              <div>
                <p className="text-sm font-bold text-[#1A1A2E] mb-2">Jumlah Kelompok:</p>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5, 6].map((num) => {
                    const isSelected = numGroups === num
                    return (
                      <button
                        key={num}
                        onClick={() => {
                          setNumGroups(num)
                        }}
                        className={`h-10 w-10 flex items-center justify-center font-black text-sm transition-all ${
                          isSelected
                            ? 'bg-[#FF6B6B] text-white border-4 border-[#1A1A2E] shadow-[2px_2px_0px_#1A1A2E]'
                            : 'bg-white text-[#1A1A2E] border-4 border-[#1A1A2E] shadow-[1px_1px_0px_#1A1A2E] hover:translate-y-[1px]'
                        }`}
                      >
                        {num}
                      </button>
                    )
                  })}
                </div>
              </div>

              <button
                onClick={autoDistribute}
                disabled={isSpinning || inputText.trim().length === 0}
                className="w-full mt-2 bg-[#1A1A2E] text-[#FFE135] border-4 border-[#1A1A2E] font-black px-6 py-4 shadow-[4px_4px_0px_#1A1A2E] flex items-center justify-center gap-2 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0px_#1A1A2E] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                🔀 Muat & Bagi Otomatis
              </button>
            </div>
          </div>

          {/* Section 2 - Hasil Kelompok (Shows after distribution) */}
          {hasGeneratedGroups && (
            <div className="bg-white border-4 border-[#1A1A2E] shadow-[4px_4px_0px_#1A1A2E] p-5">
              <h2 className="text-lg font-black text-[#1A1A2E] flex items-center gap-2 mb-4 border-b-2 border-gray-100 pb-2">
                🏆 Hasil Kelompok
              </h2>

              {/* Grid of group cards */}
              <div className="grid grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
                {Array.from({ length: numGroups }).map((_, idx) => {
                  const groupNum = idx + 1
                  const assigned = groups[groupNum] || []
                  const groupColor = COLORS[idx % COLORS.length]

                  return (
                    <div
                      key={groupNum}
                      className="border-4 border-[#1A1A2E] bg-white flex flex-col relative"
                      style={{ boxShadow: '4px 4px 0px #1A1A2E' }}
                    >
                      {/* Header */}
                      <div
                        className="border-b-4 border-[#1A1A2E] px-3 py-2 font-black text-sm text-[#1A1A2E] flex items-center justify-between"
                        style={{ backgroundColor: groupColor }}
                      >
                        <span>Kelompok {groupNum}</span>
                        <span style={{ fontSize:'10px', opacity: 0.8 }}>{assigned.length}</span>
                      </div>

                      {/* Members Body */}
                      <div className="p-3 flex-1 min-h-[60px] flex flex-col gap-1 bg-[#FFFFFC]">
                        {assigned.length === 0 ? (
                          <span className="text-gray-400 text-xs font-bold italic">
                            Kosong
                          </span>
                        ) : (
                          assigned.map((name, nameIdx) => (
                            <div
                              key={nameIdx}
                              className="bg-[#FFFEF7] border-2 border-[#1A1A2E] px-2 py-1 text-xs font-black text-[#1A1A2E] shadow-[2px_2px_0px_#1A1A2E]"
                            >
                              {name}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
              
              {saved && (
                <div style={{
                  background: '#4ADE80',
                  border: '4px solid #1A1A2E',
                  boxShadow: '4px 4px 0 #1A1A2E',
                  padding: '16px',
                  textAlign: 'center',
                  fontWeight: 900,
                  fontSize: '16px',
                  color: '#1A1A2E',
                  marginTop: '1rem'
                }}>
                  ✅ Pembagian kelompok selesai & tersimpan otomatis! Siswa sudah bisa memilih kelompok mereka di layar masing-masing.
                </div>
              )}
            </div>
          )}

        </section>
      </main>
    </div>
  )
}
