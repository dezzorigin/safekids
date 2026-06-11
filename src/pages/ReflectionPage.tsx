import { useState, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabaseClient'
import { PhysicsWordCloud, CloudWord } from '@/components/ui/PhysicsWordCloud'

// ─── Types ────────────────────────────────────────────────────────────────────

type ReflectionPhase = 'q1' | 'q2' | 'submitted'

// ─── Constants ────────────────────────────────────────────────────────────────

const DECORATIVE_SQUARES = [
  { color: '#FF6B6B', top: '10%', left: '8%',  delay: '0s' },
  { color: '#FFE135', top: '25%', right: '10%', delay: '0.5s' },
  { color: '#4ECDC4', bottom: '15%', left: '12%', delay: '1s' },
  { color: '#74C0FC', bottom: '30%', right: '8%', delay: '1.5s' },
  { color: '#C77DFF', top: '15%', left: '85%',  delay: '2s' },
  { color: '#FF9A3C', bottom: '5%', right: '45%', delay: '2.5s' },
]

const BRUTAL_COLORS = ['#FF6B6B', '#FFE135', '#4ECDC4', '#74C0FC', '#C77DFF', '#FF9A3C']

const TEMPLATE_WORDS_ROW1 = ['W', 'GOKIL', 'EPIC', 'SULTAN', 'GASKEUN', 'MANTAP']
const TEMPLATE_WORDS_ROW2 = ['PAHAM', 'MINDBLOWN', 'WORTH IT', 'LOCKED IN', 'KEREN', 'NO CAP']

// Initial demo words
const DEMO_WORDS: CloudWord[] = [
  { word: 'SERU',  count: 3, color: '#FF6B6B' },
  { word: 'KEREN', count: 2, color: '#FFE135' },
  { word: 'ASIK',  count: 2, color: '#4ECDC4' },
  { word: 'SUSAH', count: 1, color: '#74C0FC' },
  { word: 'SUKA',  count: 1, color: '#FF9A3C' },
]

// ─── Component ────────────────────────────────────────────────────────────────

export default function ReflectionPage() {
  const [phase, setPhase] = useState<ReflectionPhase>('q1')
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [q1, setQ1] = useState('')
  const [q2, setQ2] = useState('')
  const [justSent, setJustSent] = useState(false)
  const [lastSentWord, setLastSentWord] = useState('')
  const [flashedWord, setFlashedWord] = useState('')

  const [cloudWords, setCloudWords] = useState<CloudWord[]>(() => {
    return [...DEMO_WORDS].sort((a, b) => b.count - a.count)
  })

  // ── Core word submission ────────────────────────────────────────────────────
  const submitWordToCloud = useCallback((rawWord: string) => {
    const normalized = rawWord.trim().toUpperCase()
    if (!normalized) return

    console.log('Reflection submitted:', { q1Text: q1, q2Word: normalized })

    const chosenColor = BRUTAL_COLORS[Math.floor(Math.random() * BRUTAL_COLORS.length)]

    setCloudWords(prev => {
      const existingIdx = prev.findIndex(w => w.word === normalized)
      let updated: CloudWord[]
      if (existingIdx >= 0) {
        updated = prev.map(w =>
          w.word === normalized ? { ...w, count: w.count + 1 } : w
        )
      } else {
        updated = [...prev, { word: normalized, count: 1, color: chosenColor }]
      }
      return updated.sort((a, b) => b.count - a.count)
    })

    setLastSentWord(normalized)
    setJustSent(true)
    setTimeout(() => setJustSent(false), 1000)
  }, [q1])

  const { studentGroup } = useAuth()

  const submitReflection = async () => {
    const normalized = q2.trim().toUpperCase()
    if (!normalized) return

    const { data: sessionData } = await supabase
      .from('sessions')
      .select('id')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    // Save to DB
    const { error } = await supabase
      .from('reflections')
      .insert({
        group_number: Number(studentGroup ?? 0),
        q1_answer: q1,
        q2_word: normalized,
        submitted_at: new Date().toISOString(),
        session_id: sessionData?.id ?? null
      })

    if (error) {
      console.error('Reflection save error:', error)
    } else {
      console.log('✅ Reflection saved!')
    }

    // Update word cloud locally
    submitWordToCloud(normalized)
    setQ2('')
    setJustSent(true)
    setLastSentWord(normalized)
    setTimeout(() => setJustSent(false), 1000)
    const channel = supabase.channel('reflection-channel')
    await channel.send({
      type: 'broadcast',
      event: 'word_submit',
      payload: { 
        word: normalized, 
        group_number: studentGroup 
      }
    })
    
    // Stay on the same phase to allow multiple submissions
    // setPhase('submitted' as any)
  }

  const handleNextQ = () => {
    if (!q1.trim()) return
    setIsTransitioning(true)
    setTimeout(() => {
      setPhase('q2')
      setIsTransitioning(false)
    }, 400)
  }

  const getPreviewFontSize = (len: number) => {
    if (len <= 4) return 'text-6xl md:text-7xl'
    if (len <= 8) return 'text-4xl md:text-5xl'
    return 'text-2xl md:text-3xl'
  }

  const isDark = phase === 'q2'

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-300 relative overflow-hidden ${isDark ? 'bg-[#1A1A2E]' : 'bg-[#FFFEF7]'}`}>
      <style>{`
        @keyframes rotateSquare {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .animate-rotate-square {
          animation: rotateSquare 6s linear infinite;
        }
        @keyframes slideOutLeft {
          to { opacity: 0; transform: translateX(-60px); }
        }
        @keyframes slideInFromRight {
          from { opacity: 0; transform: translateX(60px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-slide-out-left {
          animation: slideOutLeft 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }
        .animate-slide-in-right {
          animation: slideInFromRight 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }
        @keyframes toastPop {
          0%   { opacity: 0; transform: translateY(8px) scale(0.9); }
          20%  { opacity: 1; transform: translateY(0) scale(1.05); }
          80%  { opacity: 1; transform: translateY(0) scale(1); }
          100% { opacity: 0; transform: translateY(-4px) scale(0.95); }
        }
        .animate-toast-pop {
          animation: toastPop 1s ease-out forwards;
        }
        .word-chip {
          background: transparent;
          border: 2px solid rgba(255,225,53,0.4);
          color: rgba(255,225,53,0.7);
          font-weight: 900;
          font-size: 0.75rem;
          padding: 6px 12px;
          cursor: pointer;
          transition: all 0.15s;
          border-radius: 0;
          font-family: inherit;
        }
        .word-chip:hover {
          background: rgba(255,225,53,0.15);
          border-color: #FFE135;
          color: #FFE135;
          transform: translateY(-2px);
        }
        .word-chip:active {
          transform: translateY(0px);
        }
      `}</style>

      {/* Floating decorative squares */}
      {DECORATIVE_SQUARES.map((conf, index) => (
        <div
          key={index}
          style={{
            position: 'absolute',
            top: conf.top,
            bottom: (conf as any).bottom,
            left: conf.left,
            right: (conf as any).right,
            backgroundColor: conf.color,
            animationDelay: conf.delay,
            borderRadius: 0,
          }}
          className={`w-12 h-12 border-3 ${isDark ? 'border-[#FFE135]' : 'border-[#1A1A2E]'} animate-rotate-square hidden sm:block pointer-events-none select-none shadow-[2px_2px_0px_rgba(0,0,0,0.15)] z-0`}
        />
      ))}

      {/* ── SEQUENTIAL FORM FLOW AREA ── */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 relative z-10 w-full">

        {/* PHASE Q1 */}
        {phase === 'q1' && (
          <div
            className={`max-w-[600px] w-full bg-white border-4 border-[#1A1A2E] shadow-[8px_8px_0px_#1A1A2E] p-8 flex flex-col text-left transition-all ${
              isTransitioning ? 'animate-slide-out-left' : ''
            }`}
            style={{ borderRadius: 0 }}
          >
            <div className="flex justify-between items-center mb-6">
              <span className="bg-[#C77DFF] text-white font-black text-xs px-3 py-1 border-2 border-[#1A1A2E]" style={{ borderRadius: 0 }}>
                1 / 2
              </span>
            </div>

            <div className="text-6xl mb-4 select-none">📝</div>

            <h2 className="font-black text-2xl md:text-3xl text-[#1A1A2E] mb-4">
              Apa pelajaran yang kamu dapat hari ini?
            </h2>

            <textarea
              rows={5}
              value={q1}
              onChange={(e) => setQ1(e.target.value)}
              placeholder="Ceritakan pengalamanmu..."
              style={{ fontSize: '16px', borderRadius: 0 }}
              className="w-full p-4 border-4 border-[#1A1A2E] shadow-[4px_4px_0px_#1A1A2E] focus:outline-none focus:shadow-[6px_6px_0px_#1A1A2E] resize-none font-bold text-[#1A1A2E] transition-all"
              required
            />

            <button
              onClick={handleNextQ}
              disabled={!q1.trim()}
              style={{ borderRadius: 0 }}
              className="bg-[#C77DFF] text-white font-black text-lg border-4 border-[#1A1A2E] shadow-[4px_4px_0px_#1A1A2E] px-10 py-4 w-full mt-6 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#1A1A2E] active:translate-x-1 active:translate-y-1 active:shadow-[1px_1px_0px_#1A1A2E] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Lanjut →
            </button>
          </div>
        )}

        {/* PHASE Q2 */}
        {phase === 'q2' && (
          <div
            className="max-w-[600px] w-full bg-[#1A1A2E] border-4 border-[#FFE135] shadow-[8px_8px_0px_#FFE135] p-8 flex flex-col text-left text-white animate-slide-in-right"
            style={{ borderRadius: 0, position: 'relative' }}
          >
            {/* Toast */}
            {justSent && (
              <div
                className="animate-toast-pop"
                style={{
                  position: 'absolute',
                  bottom: '12px',
                  right: '12px',
                  background: '#FFE135',
                  border: '2px solid #1A1A2E',
                  boxShadow: '3px 3px 0 #1A1A2E',
                  padding: '6px 12px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  pointerEvents: 'none',
                  zIndex: 20,
                  borderRadius: 0,
                }}
              >
                <span className="font-black text-sm text-[#1A1A2E]">🚀 {lastSentWord} terkirim!</span>
              </div>
            )}

            <div className="flex justify-between items-center mb-6">
              <span className="bg-[#FFE135] text-[#1A1A2E] font-black text-xs px-3 py-1 border-2 border-[#FFE135]" style={{ borderRadius: 0 }}>
                2 / 2
              </span>
            </div>

            <div className="text-6xl animate-pulse mb-4 select-none">✨</div>

            <h2 className="font-black text-3xl text-[#FFE135] mb-1">
              Satu kata untuk kelas hari ini?
            </h2>
            <p className="text-sm text-white/60 mb-4 font-bold">
              Kata ini akan terbang ke layar guru! 🚀
            </p>

            {/* Word Template Chips */}
            <p className="text-xs font-black mb-2" style={{ color: 'rgba(255,225,53,0.6)' }}>
              Atau pilih kata:
            </p>
            <div className="flex flex-wrap gap-2 mb-2">
              {TEMPLATE_WORDS_ROW1.map((word) => (
                <button
                  key={word}
                  className="word-chip"
                  style={flashedWord === word ? {
                    background: '#FFE135',
                    color: '#1A1A2E',
                    transform: 'scale(0.95)',
                    transition: 'all 0.1s',
                    borderColor: '#FFE135',
                  } : {}}
                  onClick={() => {
                    setFlashedWord(word)
                    setTimeout(() => setFlashedWord(''), 300)
                    setQ2(word)
                  }}
                >
                  {word}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              {TEMPLATE_WORDS_ROW2.map((word) => (
                <button
                  key={word}
                  className="word-chip"
                  style={flashedWord === word ? {
                    background: '#FFE135',
                    color: '#1A1A2E',
                    transform: 'scale(0.95)',
                    transition: 'all 0.1s',
                    borderColor: '#FFE135',
                  } : {}}
                  onClick={() => {
                    setFlashedWord(word)
                    setTimeout(() => setFlashedWord(''), 300)
                    setQ2(word)
                  }}
                >
                  {word}
                </button>
              ))}
            </div>

            <input
              type="text"
              value={q2}
              onChange={(e) => setQ2(e.target.value.toUpperCase())}
              placeholder="KETIK DI SINI"
              maxLength={12}
              style={{ letterSpacing: '0.15em', borderRadius: 0 }}
              className="w-full pb-2 text-center font-black text-4xl md:text-5xl text-[#FFE135] bg-transparent border-t-0 border-x-0 border-b-4 border-[#FFE135] outline-none placeholder:text-[#FFE135]/30 focus:border-[#FFE135]"
              required
            />

            {/* Live Word Preview */}
            {q2.trim() && (
              <div className="flex justify-center mt-6">
                <div
                  style={{
                    color: BRUTAL_COLORS[q2.length % BRUTAL_COLORS.length],
                    borderRadius: 0,
                  }}
                  className={`font-black ${getPreviewFontSize(q2.length)} border-4 border-[#FFE135] px-6 py-3 inline-block shadow-[3px_3px_0px_#FFE135] bg-[#1A1A2E]/80`}
                >
                  {q2}
                </div>
              </div>
            )}

            <button
              onClick={submitReflection}
              disabled={!q2.trim()}
              style={{ borderRadius: 0 }}
              className="bg-[#FFE135] text-[#1A1A2E] font-black text-xl border-4 border-[#1A1A2E] shadow-[6px_6px_0px_#FFE135] px-12 py-5 w-full mt-8 hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-1 active:translate-y-1 active:shadow-[2px_2px_0px_#FFE135] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              🚀 Kirim ke Layar Guru!
            </button>
          </div>
        )}
      </div>

      {/* ── SECTION 2: GRAVITY WORD CLOUD ── */}
      <div className="bg-[#1A1A2E] border-t-4 border-[#FFE135] px-8 py-8 relative z-10">
        <div className="max-w-4xl mx-auto w-full text-center">
          <h2 className="font-black text-2xl text-[#FFE135] tracking-wide">
            🌟 Word Cloud Kelas
          </h2>
          <p className="text-sm text-white/50 font-bold mt-1">
            Kata-kata dari semua kelompok akan muncul di sini
          </p>

          <div className="mt-6">
            <PhysicsWordCloud words={cloudWords} height="380px" emptyMessage="Belum ada kata terkirim. Kirim refleksimu untuk memulai!" />
          </div>
        </div>
      </div>
    </div>
  )
}
