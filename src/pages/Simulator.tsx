import { Suspense, useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Canvas, useThree } from '@react-three/fiber'
import { OrthographicCamera, PerspectiveCamera, OrbitControls } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import MapGrid from '@/components/3d/MapGrid'
import Avatar from '@/components/3d/Avatar'
import InstructionPanel from '@/components/ui/InstructionPanel'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { useSimulationStore } from '@/store/useSimulationStore'
import { supabase } from '@/lib/supabaseClient'

// ─── Vocabulary Data ──────────────────────────────────────────────────────────

const VOCABULARY_WORDS = [
  { word: 'Forward',   emoji: '➡️',  correct: true  },
  { word: 'Backward',  emoji: '⬅️',  correct: true  },
  { word: 'Turn Right',emoji: '↪️',  correct: true  },
  { word: 'Turn Left', emoji: '↩️',  correct: true  },
  { word: 'Fly',       emoji: '🕊️',  correct: false },
  { word: 'Jump in',   emoji: '🕳️',  correct: false },
  { word: 'Roll Over', emoji: '🔄',  correct: false },
]

function speakWord(word: string) {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(word)
    u.lang = 'en-US'
    const voices = window.speechSynthesis.getVoices()
    const enVoice = voices.find(v => v.lang.startsWith('en') || v.lang.includes('US'))
    if (enVoice) u.voice = enVoice
    window.speechSynthesis.speak(u)
  }
}

function playBuzzSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(120, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.25)
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.25)
  } catch (_) { /* browsers may block without gesture */ }
}

// ─── Level Selector Data ──────────────────────────────────────────────────────

const CARDS_DATA = [
  {
    id: 'earthquake' as const,
    levelText: 'LEVEL 1',
    title: 'Gempa Bumi',
    description: 'Hindari reruntuhan bangunan dan capai zona aman sebelum gempa susulan tiba!',
    stats: ['📐 Grid 10×10', '🎯 1 Goal', '🧱 18 Reruntuhan'],
    bgGradient: 'linear-gradient(135deg, #FF6B6B 0%, #c0392b 100%)',
    previewEmoji: '🏚️💥🧱',
    bgPatternClass: 'cracks-pattern',
    ctaText: '🌍 Mulai Gempa Bumi →',
  },
  {
    id: 'flood' as const,
    levelText: 'LEVEL 2',
    title: 'Banjir',
    description: 'Cari dataran tinggi sambil melewati genangan air yang terus naik!',
    stats: ['📐 Grid 10×10', '🎯 1 Goal', '💧 No fire'],
    bgGradient: 'linear-gradient(135deg, #74C0FC 0%, #1971c2 100%)',
    previewEmoji: '🌊🏠💧',
    bgPatternClass: 'water-pattern',
    ctaText: '🌊 Mulai Banjir →',
  },
  {
    id: 'tsunami' as const,
    levelText: 'LEVEL 3',
    title: 'Tsunami',
    description: 'Lari secepat mungkin ke Escape Building sebelum gelombang tsunami menerjang!',
    stats: ['📐 Grid 12×12', '🎯 2 Goals', '⚡ Hardest'],
    bgGradient: 'linear-gradient(135deg, #4ECDC4 0%, #087f5b 100%)',
    previewEmoji: '🌊🏃🏢',
    bgPatternClass: 'tsunami-pattern',
    ctaText: '🌊 Mulai Tsunami →',
  },
]

// ─── Camera Shake (Earthquake) ────────────────────────────────────────────────

interface ShakeState {
  active: boolean
  startTime: number
  duration: number
  amplitude: number
}

function CameraShaker({ shakeState }: { shakeState: React.MutableRefObject<ShakeState> }) {
  const { camera } = useThree()
  const basePos = useRef<{ x: number; y: number; z: number } | null>(null)

  useFrame(() => {
    if (!shakeState.current.active) return

    if (!basePos.current) {
      basePos.current = { x: camera.position.x, y: camera.position.y, z: camera.position.z }
    }

    const elapsed = (Date.now() - shakeState.current.startTime) / 1000
    if (elapsed >= shakeState.current.duration) {
      shakeState.current.active = false
      if (basePos.current) {
        camera.position.x = basePos.current.x
        camera.position.y = basePos.current.y
        camera.position.z = basePos.current.z
      }
      basePos.current = null
      return
    }

    const amp = shakeState.current.amplitude * (1 - elapsed / shakeState.current.duration)
    camera.position.x = (basePos.current?.x ?? camera.position.x) + (Math.random() - 0.5) * amp
    camera.position.y = (basePos.current?.y ?? camera.position.y) + (Math.random() - 0.5) * amp * 0.3
  })

  return null
}

// ─── Earthquake Loading Screen ────────────────────────────────────────────────

function EarthquakeLoadingScreen() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const start = Date.now()
    const duration = 3000
    const raf = () => {
      const elapsed = Date.now() - start
      setProgress(Math.min(100, (elapsed / duration) * 100))
      if (elapsed < duration) requestAnimationFrame(raf)
    }
    requestAnimationFrame(raf)
  }, [])

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      zIndex: 40,
      background: 'radial-gradient(ellipse at center, #2d0a0a 0%, #1a1a1a 60%, #0d0d0d 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    }}>
      {/* Dust particles background */}
      {Array.from({ length: 12 }, (_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            width: `${8 + (i % 5) * 6}px`,
            height: `${8 + (i % 5) * 6}px`,
            background: `rgba(${140 + i * 5}, ${100 + i * 3}, 80, 0.3)`,
            borderRadius: '50%',
            left: `${(i * 8.3) % 100}%`,
            bottom: '-20px',
            animation: `dustRise ${2.5 + (i % 3) * 0.8}s ease-in ${(i * 0.2)}s infinite`,
          }}
        />
      ))}

      {/* Card */}
      <div style={{
        background: 'rgba(26,10,10,0.92)',
        border: '3px solid rgba(239,68,68,0.6)',
        borderRadius: '20px',
        padding: '2.5rem 2rem',
        maxWidth: '400px',
        width: '90vw',
        textAlign: 'center',
        boxShadow: '0 0 60px rgba(239,68,68,0.2), 0 0 120px rgba(239,68,68,0.1)',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Shaking building */}
        <div style={{
          fontSize: '4.5rem',
          marginBottom: '1rem',
          display: 'inline-block',
          animation: 'buildingShake 0.3s ease-in-out infinite',
        }}>
          🏚️
        </div>

        <h2 style={{
          color: '#ffffff',
          fontWeight: 900,
          fontSize: '2.2rem',
          letterSpacing: '0.05em',
          marginBottom: '0.4rem',
          textShadow: '0 0 20px rgba(239,68,68,0.8), 0 0 40px rgba(239,68,68,0.4)',
        }}>
          GEMPA BUMI
        </h2>

        <p style={{
          color: 'rgba(255,200,150,0.85)',
          fontSize: '0.9rem',
          fontWeight: 600,
          marginBottom: '1.5rem',
        }}>
          Cari rute tercepat ke zona aman!
        </p>

        {/* Tips box */}
        <div style={{
          background: 'rgba(0,0,0,0.5)',
          border: '2px solid rgba(251,146,60,0.6)',
          borderRadius: '10px',
          padding: '0.875rem 1rem',
          marginBottom: '1.5rem',
          textAlign: 'left',
        }}>
          <p style={{ color: 'rgba(255,200,100,0.9)', fontSize: '0.8rem', fontWeight: 700, lineHeight: 1.6, margin: 0 }}>
            💡 Gunakan rute <strong style={{ color: '#fbbf24' }}>TERPENDEK</strong>. Setiap langkah boros = nyawa terbuang!
          </p>
        </div>

        {/* Progress bar */}
        <div style={{
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '999px',
          height: '8px',
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            width: `${progress}%`,
            background: 'linear-gradient(90deg, #ef4444, #f97316, #fbbf24)',
            borderRadius: '999px',
            transition: 'width 0.1s linear',
            boxShadow: '0 0 8px rgba(249,115,22,0.8)',
          }} />
        </div>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem', marginTop: '0.5rem', fontWeight: 600 }}>
          Menyiapkan area simulasi...
        </p>
      </div>

      <style>{`
        @keyframes buildingShake {
          0%, 100% { transform: translate(0,0) rotate(0deg); }
          20% { transform: translate(-3px, 2px) rotate(-2deg); }
          40% { transform: translate(3px, -2px) rotate(2deg); }
          60% { transform: translate(-2px, 3px) rotate(-1deg); }
          80% { transform: translate(2px, -1px) rotate(1deg); }
        }
        @keyframes dustRise {
          0% { transform: translateY(0) scale(1); opacity: 0.4; }
          50% { opacity: 0.25; }
          100% { transform: translateY(-60vh) scale(1.8); opacity: 0; }
        }
      `}</style>
    </div>
  )
}

// ─── Flood Loading Screen ─────────────────────────────────────────────────────

function FloodLoadingScreen() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const start = Date.now()
    const duration = 3000
    const raf = () => {
      const elapsed = Date.now() - start
      setProgress(Math.min(100, (elapsed / duration) * 100))
      if (elapsed < duration) requestAnimationFrame(raf)
    }
    requestAnimationFrame(raf)
  }, [])

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      zIndex: 40,
      background: 'linear-gradient(160deg, #0a1628 0%, #1a3a5c 60%, #0d2540 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    }}>
      {/* Rain particle divs behind card */}
      {Array.from({ length: 20 }, (_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            width: '2px',
            height: `${14 + (i % 5) * 8}px`,
            background: `rgba(200, 220, 255, ${0.3 + (i % 4) * 0.12})`,
            left: `${(i * 5.1) % 100}%`,
            top: '-20px',
            borderRadius: '999px',
            animation: `floodRainDrop ${0.7 + (i % 4) * 0.25}s linear ${(i * 0.13)}s infinite`,
            transform: 'rotate(10deg)',
          }}
        />
      ))}

      {/* Card */}
      <div style={{
        background: 'rgba(10, 22, 40, 0.92)',
        border: '3px solid rgba(79, 195, 247, 0.6)',
        borderRadius: '20px',
        padding: '2.5rem 2rem',
        maxWidth: '420px',
        width: '90vw',
        textAlign: 'center',
        boxShadow: '0 0 60px rgba(79,195,247,0.2), 0 0 120px rgba(30,95,122,0.3)',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Animated wave emoji */}
        <div style={{
          fontSize: '4.5rem',
          marginBottom: '1rem',
          display: 'inline-block',
          animation: 'floodWaveBobLoad 1.8s ease-in-out infinite',
        }}>
          🌊
        </div>

        <h2 style={{
          color: '#ffffff',
          fontWeight: 900,
          fontSize: '2.5rem',
          letterSpacing: '0.08em',
          marginBottom: '0.4rem',
          textShadow: '0 0 20px rgba(79,195,247,0.9), 0 0 50px rgba(30,95,122,0.6)',
        }}>
          BANJIR
        </h2>

        <p style={{
          color: 'rgba(179, 229, 252, 0.85)',
          fontSize: '0.92rem',
          fontWeight: 600,
          marginBottom: '1.5rem',
        }}>
          Cari jalan ke dataran tinggi!
        </p>

        {/* Tips box */}
        <div style={{
          background: 'rgba(0,0,0,0.4)',
          border: '2px solid rgba(79,195,247,0.5)',
          borderRadius: '10px',
          padding: '0.875rem 1rem',
          marginBottom: '1.5rem',
          textAlign: 'left',
        }}>
          <p style={{ color: 'rgba(179,229,252,0.9)', fontSize: '0.8rem', fontWeight: 700, lineHeight: 1.6, margin: 0 }}>
            {'💡 Air terus naik! Hindari '}
            <strong style={{ color: '#4fc3f7' }}>rumah terendam</strong>
            {' dan pohon — lewati jalan tercepat!'}
          </p>
        </div>

        {/* Blue gradient progress bar */}
        <div style={{
          background: 'rgba(255,255,255,0.08)',
          borderRadius: '999px',
          height: '8px',
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            width: `${progress}%`,
            background: 'linear-gradient(90deg, #1e5f7a, #4fc3f7, #81d4fa)',
            borderRadius: '999px',
            transition: 'width 0.1s linear',
            boxShadow: '0 0 8px rgba(79,195,247,0.8)',
          }} />
        </div>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.7rem', marginTop: '0.5rem', fontWeight: 600 }}>
          Menyiapkan area banjir...
        </p>
      </div>

      <style>{`
        @keyframes floodWaveBobLoad {
          0%, 100% { transform: translateY(0) rotate(-5deg); }
          50% { transform: translateY(-12px) rotate(5deg); }
        }
        @keyframes floodRainDrop {
          0% { transform: rotate(10deg) translateY(0); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: rotate(10deg) translateY(110vh); opacity: 0; }
        }
      `}</style>
    </div>
  )
}

// ─── Earthquake Vocabulary HUD ────────────────────────────────────────────────

function EarthquakeVocabHUD() {
  const setInputValue = useSimulationStore((s) => s.setInputValue)
  const [flashWord, setFlashWord] = useState<string | null>(null)
  const [redFlashCount, setRedFlashCount] = useState(0)

  const triggerRedFlash = useCallback(() => {
    playBuzzSound()
    let count = 0
    const interval = setInterval(() => {
      setRedFlashCount(c => c + 1)
      count++
      if (count >= 6) clearInterval(interval) // 3 on + 3 off cycles
    }, 200)
  }, [])

  const handleWordClick = useCallback((item: typeof VOCABULARY_WORDS[0]) => {
    setInputValue(item.word)
    if (item.correct) {
      speakWord(item.word)
      setFlashWord(item.word)
      setTimeout(() => setFlashWord(null), 600)
    } else {
      triggerRedFlash()
    }
  }, [setInputValue, triggerRedFlash])

  const isRedFlashing = redFlashCount % 2 === 1 && redFlashCount > 0

  return (
    <>
      {/* Red flash overlay */}
      {isRedFlashing && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(255,0,0,0.4)',
            pointerEvents: 'none',
            zIndex: 50,
          }}
        />
      )}

      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: '#1a1a2e',
          border: '3px solid #FFD600',
          borderRadius: '16px',
          padding: '12px 20px',
          boxShadow: '0 4px 20px rgba(255,214,0,0.3)',
          flexWrap: 'wrap',
          justifyContent: 'center',
          maxWidth: '95vw',
        }}>
          {/* Label pill */}
          <span style={{
            fontSize: '11px',
            fontWeight: 900,
            background: '#FFD600',
            color: '#1a1a2e',
            padding: '4px 12px',
            borderRadius: '999px',
            letterSpacing: '0.5px',
            marginRight: '4px',
            whiteSpace: 'nowrap',
          }}>
            ENGLISH VOCABULARY 📖
          </span>

          {VOCABULARY_WORDS.map((item) => {
            const isFlashing = flashWord === item.word

            const baseStyle: React.CSSProperties = {
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '6px 12px',
              borderRadius: '10px',
              border: '2px solid',
              fontSize: '13px',
              fontWeight: 700,
              letterSpacing: '0.5px',
              cursor: 'pointer',
              transition: 'all 0.18s cubic-bezier(0.34,1.56,0.64,1)',
              userSelect: 'none',
              color: '#fff',
            }

            const correctStyle: React.CSSProperties = {
              ...baseStyle,
              background: isFlashing
                ? 'linear-gradient(135deg, #16a34a, #22c55e)'
                : 'linear-gradient(135deg, #1e3a5f, #2d6a9f)',
              borderColor: isFlashing ? '#22c55e' : '#4a9eff',
              boxShadow: isFlashing
                ? '0 0 14px rgba(34,197,94,0.8)'
                : '0 2px 8px rgba(74,158,255,0.2)',
              animation: 'vocabPulse 2.5s ease-in-out infinite',
            }

            const wrongStyle: React.CSSProperties = {
              ...baseStyle,
              background: 'linear-gradient(135deg, #5f1e1e, #9f2d2d)',
              borderColor: '#ff4a4a',
              boxShadow: '0 2px 8px rgba(255,74,74,0.2)',
            }

            return (
              <button
                key={item.word}
                style={item.correct ? correctStyle : wrongStyle}
                onClick={() => handleWordClick(item)}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLButtonElement
                  el.style.transform = 'scale(1.08)'
                  el.style.boxShadow = item.correct
                    ? '0 0 16px rgba(74,158,255,0.6)'
                    : '0 0 16px rgba(255,74,74,0.6)'
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLButtonElement
                  el.style.transform = 'scale(1)'
                  el.style.boxShadow = item.correct
                    ? (isFlashing ? '0 0 14px rgba(34,197,94,0.8)' : '0 2px 8px rgba(74,158,255,0.2)')
                    : '0 2px 8px rgba(255,74,74,0.2)'
                }}
              >
                <span style={{ fontSize: '11px' }}>{item.correct ? '✅' : '❌'}</span>
                <span>{item.emoji}</span>
                <span>{item.word}</span>
              </button>
            )
          })}
        </div>

        <style>{`
          @keyframes vocabPulse {
            0%, 100% { box-shadow: 0 2px 8px rgba(74,158,255,0.2); }
            50% { box-shadow: 0 0 14px rgba(74,158,255,0.5); }
          }
        `}</style>
      </div>
    </>
  )
}

// ─── Standard Vocabulary HUD (Tsunami only) ──────────────────────────────────

const STD_VOCAB_WORDS = [
  { word: 'Forward',   emoji: '➡️', bg: 'bg-emerald-100 hover:bg-emerald-200 text-emerald-950 border-emerald-400' },
  { word: 'Backward',  emoji: '⬅️', bg: 'bg-emerald-100 hover:bg-emerald-200 text-emerald-950 border-emerald-400' },
  { word: 'Turn Right',emoji: '↪️', bg: 'bg-emerald-100 hover:bg-emerald-200 text-emerald-950 border-emerald-400' },
  { word: 'Turn Left', emoji: '↩️', bg: 'bg-emerald-100 hover:bg-emerald-200 text-emerald-950 border-emerald-400' },
  { word: 'Fly',       emoji: '🕊️', bg: 'bg-rose-100 hover:bg-rose-200 text-rose-950 border-rose-400' },
  { word: 'Jump in',   emoji: '🕳️', bg: 'bg-rose-100 hover:bg-rose-200 text-rose-950 border-rose-400' },
  { word: 'Roll Over', emoji: '🔄', bg: 'bg-rose-100 hover:bg-rose-200 text-rose-950 border-rose-400' },
]

function StandardVocabHUD() {
  const setInputValue = useSimulationStore((s) => s.setInputValue)
  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1.5 pointer-events-auto">
      <div className="flex items-center gap-2 rounded-xl border-4 border-black bg-white p-2.5 shadow-brutal flex-wrap justify-center max-w-[95vw] md:max-w-none">
        <span className="text-xs font-black text-black bg-yellow-200 px-2 py-1 rounded border-2 border-black mr-1 shadow-brutal-sm">
          ENGLISH VOCABULARY 📖
        </span>
        {STD_VOCAB_WORDS.map((item) => (
          <button
            key={item.word}
            onClick={() => { speakWord(item.word); setInputValue(item.word) }}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border-2 border-black text-xs font-black shadow-brutal-sm transition-all duration-100 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none hover:-translate-y-[1px] ${item.bg}`}
          >
            <span>{item.emoji}</span>
            <span>{item.word}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Flood Vocabulary HUD ─────────────────────────────────────────────────────

const FLOOD_VOCABULARY_WORDS = [
  { word: 'Forward',    emoji: '➡️',  correct: true  },
  { word: 'Backward',   emoji: '⬅️',  correct: true  },
  { word: 'Turn Right', emoji: '↪️',  correct: true  },
  { word: 'Turn Left',  emoji: '↩️',  correct: true  },
  { word: 'Fly',        emoji: '🕊️',  correct: false },
  { word: 'Jump in',    emoji: '🕳️',  correct: false },
  { word: 'Roll Over',  emoji: '🔄',  correct: false },
]

function FloodVocabHUD() {
  const setInputValue = useSimulationStore((s) => s.setInputValue)
  const [flashWord, setFlashWord] = useState<string | null>(null)
  const [redFlashCount, setRedFlashCount] = useState(0)

  const triggerRedFlash = useCallback(() => {
    playBuzzSound()
    let count = 0
    const interval = setInterval(() => {
      setRedFlashCount(c => c + 1)
      count++
      if (count >= 6) clearInterval(interval)
    }, 200)
  }, [])

  const handleWordClick = useCallback((item: typeof FLOOD_VOCABULARY_WORDS[0]) => {
    setInputValue(item.word)
    if (item.correct) {
      speakWord(item.word)
      setFlashWord(item.word)
      setTimeout(() => setFlashWord(null), 600)
    } else {
      triggerRedFlash()
    }
  }, [setInputValue, triggerRedFlash])

  const isRedFlashing = redFlashCount % 2 === 1 && redFlashCount > 0

  return (
    <>
      {isRedFlashing && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(255,0,0,0.4)',
          pointerEvents: 'none', zIndex: 50,
        }} />
      )}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          background: '#0a1628',
          border: '3px solid #4fc3f7',
          borderRadius: '16px',
          padding: '12px 20px',
          boxShadow: '0 4px 20px rgba(79,195,247,0.35)',
          flexWrap: 'wrap', justifyContent: 'center', maxWidth: '95vw',
        }}>
          <span style={{
            fontSize: '11px', fontWeight: 900,
            background: 'linear-gradient(135deg, #1e5f7a, #4fc3f7)',
            color: '#fff', padding: '4px 12px', borderRadius: '999px',
            letterSpacing: '0.5px', marginRight: '4px', whiteSpace: 'nowrap',
          }}>
            ENGLISH VOCABULARY 💧
          </span>
          {FLOOD_VOCABULARY_WORDS.map((item) => {
            const isFlashing = flashWord === item.word
            const baseStyle: React.CSSProperties = {
              display: 'flex', alignItems: 'center', gap: '5px',
              padding: '6px 12px', borderRadius: '10px', border: '2px solid',
              fontSize: '13px', fontWeight: 700, letterSpacing: '0.5px',
              cursor: 'pointer', userSelect: 'none', color: '#fff',
              transition: 'all 0.18s cubic-bezier(0.34,1.56,0.64,1)',
            }
            const correctStyle: React.CSSProperties = {
              ...baseStyle,
              background: isFlashing
                ? 'linear-gradient(135deg, #16a34a, #22c55e)'
                : 'linear-gradient(135deg, #0f3460, #1e5f7a)',
              borderColor: isFlashing ? '#22c55e' : '#4fc3f7',
              boxShadow: isFlashing ? '0 0 14px rgba(34,197,94,0.8)' : '0 2px 8px rgba(79,195,247,0.25)',
            }
            const wrongStyle: React.CSSProperties = {
              ...baseStyle,
              background: 'linear-gradient(135deg, #5f1e1e, #9f2d2d)',
              borderColor: '#ff4a4a',
              boxShadow: '0 2px 8px rgba(255,74,74,0.2)',
            }
            return (
              <button
                key={item.word}
                style={item.correct ? correctStyle : wrongStyle}
                onClick={() => handleWordClick(item)}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLButtonElement
                  el.style.transform = 'scale(1.08)'
                  el.style.boxShadow = item.correct ? '0 0 16px rgba(79,195,247,0.7)' : '0 0 16px rgba(255,74,74,0.6)'
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLButtonElement
                  el.style.transform = 'scale(1)'
                  el.style.boxShadow = item.correct
                    ? (isFlashing ? '0 0 14px rgba(34,197,94,0.8)' : '0 2px 8px rgba(79,195,247,0.25)')
                    : '0 2px 8px rgba(255,74,74,0.2)'
                }}
              >
                <span style={{ fontSize: '11px' }}>{item.correct ? '✅' : '❌'}</span>
                <span>{item.emoji}</span>
                <span>{item.word}</span>
              </button>
            )
          })}
        </div>
      </div>
    </>
  )
}

// ─── Flood Win Modal ──────────────────────────────────────────────────────────

const FLOOD_OPTIMAL_STEPS = 14

function FloodWinModal({ steps, onRetry, onMenu }: {
  steps: number
  onRetry: () => void
  onMenu: () => void
}) {
  const efficiency = Math.max(0, Math.round((FLOOD_OPTIMAL_STEPS / Math.max(steps, FLOOD_OPTIMAL_STEPS)) * 100))

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 60,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(10, 22, 40, 0.85)', backdropFilter: 'blur(6px)',
      animation: 'floodWinFadeIn 0.5s ease-out',
    }}>
      <div style={{
        background: 'linear-gradient(160deg, #0a1628 0%, #1a3a5c 100%)',
        border: '3px solid #4fc3f7', borderRadius: '24px',
        padding: '2.5rem 2rem', maxWidth: '420px', width: '90vw',
        textAlign: 'center',
        boxShadow: '0 0 80px rgba(79,195,247,0.35), 0 20px 60px rgba(0,0,0,0.5)',
      }}>
        <div style={{ fontSize: '4rem', marginBottom: '0.75rem', animation: 'floodWaveBobLoad 2s ease-in-out infinite' }}>
          🏔️
        </div>
        <h2 style={{
          color: '#ffffff', fontWeight: 900, fontSize: '1.6rem', marginBottom: '0.4rem',
          textShadow: '0 0 20px rgba(79,195,247,0.8)',
        }}>
          SELAMAT! 🏆
        </h2>
        <p style={{ color: 'rgba(179,229,252,0.9)', fontSize: '0.95rem', fontWeight: 600, marginBottom: '1.5rem' }}>
          Kamu berhasil mencapai dataran tinggi!
        </p>

        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '1.75rem',
        }}>
          {[
            { label: 'Langkah Kamu', value: steps, color: '#4fc3f7' },
            { label: 'Optimal', value: FLOOD_OPTIMAL_STEPS, color: '#22c55e' },
            { label: 'Efisiensi', value: `${efficiency}%`, color: efficiency >= 100 ? '#fbbf24' : efficiency >= 70 ? '#4ade80' : '#f87171' },
          ].map(s => (
            <div key={s.label} style={{
              background: 'rgba(255,255,255,0.05)', border: `1px solid ${s.color}40`,
              borderRadius: '12px', padding: '12px 8px',
            }}>
              <div style={{ color: s.color, fontWeight: 900, fontSize: '1.5rem' }}>{s.value}</div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.65rem', fontWeight: 700, marginTop: '4px', letterSpacing: '0.5px' }}>
                {s.label.toUpperCase()}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={onRetry}
            style={{
              background: 'linear-gradient(135deg, #1e5f7a, #4fc3f7)', color: '#fff',
              border: 'none', borderRadius: '12px', padding: '12px 24px',
              fontWeight: 900, fontSize: '14px', cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(79,195,247,0.4)', transition: 'all 0.2s', letterSpacing: '0.5px',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)' }}
          >
            🔁 Coba Lagi
          </button>
          <button
            onClick={onMenu}
            style={{
              background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.8)',
              border: '2px solid rgba(255,255,255,0.2)', borderRadius: '12px',
              padding: '12px 24px', fontWeight: 700, fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.15)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.08)' }}
          >
            ← Kembali ke Menu
          </button>
        </div>
      </div>

      <style>{`
        @keyframes floodWinFadeIn { from { opacity: 0; transform: scale(0.92); } to { opacity: 1; transform: scale(1); } }
      `}</style>
    </div>
  )
}

// ─── Simulator Page ───────────────────────────────────────────────────────────

export default function Simulator() {
  const navigate    = useNavigate()
  const x           = useSimulationStore((s) => s.x)
  const z           = useSimulationStore((s) => s.z)
  const status      = useSimulationStore((s) => s.status)
  const instructions = useSimulationStore((s) => s.instructions)
  const currentLevel = useSimulationStore((s) => s.currentLevel)
  const setLevel    = useSimulationStore((s) => s.setLevel)
  const isMoving    = useSimulationStore((s) => s.isMoving)
  const commandQueue = useSimulationStore((s) => s.commandQueue)
  const moveForward  = useSimulationStore((s) => s.moveForward)
  const moveBackward = useSimulationStore((s) => s.moveBackward)
  const turnLeft     = useSimulationStore((s) => s.turnLeft)
  const turnRight    = useSimulationStore((s) => s.turnRight)
  const shiftCommand = useSimulationStore((s) => s.shiftCommand)
  const isLoading   = useSimulationStore((s) => s.isLoading)
  const isTrapActive = useSimulationStore((s) => s.isTrapActive)
  const setTrapActive = useSimulationStore((s) => s.setTrapActive)
  const steps       = useSimulationStore((s) => s.steps)

  // Level carousel
  const [showLevelSelector, setShowLevelSelector] = useState(true)
  const [activeIndex, setActiveIndex] = useState(1)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [dragOffset, setDragOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const dragStartRef = useRef<{ x: number; time: number } | null>(null)

  // Camera shake ref (for earthquake)
  const shakeStateRef = useRef<ShakeState>({
    active: false, startTime: 0, duration: 0, amplitude: 0,
  })

  const isEarthquake = currentLevel === 'earthquake'
  const isFlood = currentLevel === 'flood'

  const EXTENDED_CARDS = [
    { ...CARDS_DATA[CARDS_DATA.length - 1], originalIndex: 2, isClone: true, key: 'clone-last' },
    ...CARDS_DATA.map((c, i) => ({ ...c, originalIndex: i, isClone: false, key: `real-${i}` })),
    { ...CARDS_DATA[0], originalIndex: 0, isClone: true, key: 'clone-first' },
  ]

  const handleNext = () => {
    if (isTransitioning) return
    setIsTransitioning(true)
    setActiveIndex(prev => prev + 1)
  }

  const handlePrev = () => {
    if (isTransitioning) return
    setIsTransitioning(true)
    setActiveIndex(prev => prev - 1)
  }

  useEffect(() => {
    if (isTransitioning) {
      const t = setTimeout(() => {
        setIsTransitioning(false)
        if (activeIndex === EXTENDED_CARDS.length - 1) setActiveIndex(1)
        else if (activeIndex === 0) setActiveIndex(EXTENDED_CARDS.length - 2)
      }, 500)
      return () => clearTimeout(t)
    }
  }, [activeIndex, isTransitioning])

  const startDrag  = (clientX: number) => {
    if (isTransitioning) return
    setIsDragging(true)
    dragStartRef.current = { x: clientX, time: Date.now() }
  }
  const moveDrag   = (clientX: number) => {
    if (!isDragging || !dragStartRef.current) return
    setDragOffset(clientX - dragStartRef.current.x)
  }
  const endDrag    = () => {
    if (!isDragging || !dragStartRef.current) return
    setIsDragging(false)
    const diff = dragOffset
    const velocity = Math.abs(diff / (Date.now() - dragStartRef.current.time))
    setDragOffset(0)
    dragStartRef.current = null
    if (diff < -80 || (diff < -20 && velocity > 0.3)) handleNext()
    else if (diff > 80 || (diff > 20 && velocity > 0.3)) handlePrev()
    else setIsTransitioning(true)
  }

  const handleTouchStart = (e: React.TouchEvent) => startDrag(e.touches[0].clientX)
  const handleTouchMove  = (e: React.TouchEvent) => moveDrag(e.touches[0].clientX)
  const handleTouchEnd   = () => endDrag()
  const handleMouseDown  = (e: React.MouseEvent) => startDrag(e.clientX)
  const handleMouseMove  = (e: React.MouseEvent) => moveDrag(e.clientX)
  const handleMouseUp    = () => endDrag()
  const handleMouseLeave = () => { if (isDragging) endDrag() }

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  const handleSelectLevel = (index: number) => {
    const levels: ('earthquake' | 'flood' | 'tsunami')[] = ['earthquake', 'flood', 'tsunami']
    const chosen = levels[index]
    setLevel(chosen)
    setShowLevelSelector(false)

    // Trigger earthquake camera shake on level start
    if (chosen === 'earthquake') {
      setTimeout(() => {
        shakeStateRef.current = { active: true, startTime: Date.now(), duration: 2.0, amplitude: 0.35 }
        // Schedule micro-shake every 8s
        const microShake = setInterval(() => {
          shakeStateRef.current = { active: true, startTime: Date.now(), duration: 0.5, amplitude: 0.1 }
        }, 8000)
        // Store it so we can clear if needed (not critical for demo)
        return () => clearInterval(microShake)
      }, 300)
    }
  }

  useEffect(() => {
    if (!showLevelSelector) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') handlePrev()
      else if (e.key === 'ArrowRight') handleNext()
      else if (e.key === 'Enter') handleSelectLevel(EXTENDED_CARDS[activeIndex].originalIndex)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showLevelSelector, activeIndex, isTransitioning])

  // Broadcast channel
  useEffect(() => {
    const channel = supabase.channel('tracking-channel')
    channel.subscribe((subStatus) => {
      console.log('Simulator broadcast sender status:', subStatus)
    })
    channelRef.current = channel
    return () => { supabase.removeChannel(channel) }
  }, [])

  useEffect(() => {
    if (channelRef.current) {
      const lastCommand = instructions.length > 0 ? instructions[0].text : ''
      channelRef.current.send({
        type: 'broadcast',
        event: 'simulation_update',
        payload: { group_id: 'group-a', x, z, status, last_command: lastCommand, updated_at: new Date().toISOString() },
      })
    }
  }, [x, z, status, instructions])

  // Process command queue
  useEffect(() => {
    if (!isMoving && commandQueue.length > 0) {
      const nextCmd = commandQueue[0]
      const timer = setTimeout(() => {
        if (nextCmd === 'forward')  moveForward()
        if (nextCmd === 'backward') moveBackward()
        if (nextCmd === 'left')     turnLeft()
        if (nextCmd === 'right')    turnRight()
        shiftCommand()
      }, 200)
      return () => clearTimeout(timer)
    }
  }, [isMoving, commandQueue, moveForward, moveBackward, turnLeft, turnRight, shiftCommand])

  return (
    <div className="relative h-full w-full overflow-hidden bg-sky-50">

      {/* ── Level Selector Overlay ─────────────────────────── */}
      {showLevelSelector && (
        <div
          style={{ background: 'radial-gradient(ellipse at 30% 50%, #2d1b69 0%, #1A1A2E 60%)' }}
          className="fixed inset-0 z-[100] w-screen h-screen overflow-hidden flex flex-col justify-between"
        >
          {/* Back button */}
          <button
            onClick={() => navigate('/tutorial')}
            style={{
              position: 'fixed', top: '1.5rem', left: '1.5rem',
              background: 'transparent', border: '3px solid rgba(255,255,255,0.4)',
              color: 'rgba(255,255,255,0.7)', fontWeight: 900, fontSize: '14px',
              padding: '8px 16px', cursor: 'pointer', letterSpacing: '0.05em',
              transition: 'all 0.2s', zIndex: 101,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.borderColor = 'white'; e.currentTarget.style.color = 'white' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)' }}
          >
            ← Kembali
          </button>

          <div className="absolute inset-0 bg-glow-layer pointer-events-none" />

          <style>{`
            @keyframes quakeShake {
              0%, 100% { transform: translate(0,0) rotate(0deg); }
              20% { transform: translate(-3px,2px) rotate(-1deg); }
              40% { transform: translate(3px,-2px) rotate(1deg); }
              60% { transform: translate(-2px,3px) rotate(-0.5deg); }
              80% { transform: translate(2px,-1px) rotate(0.5deg); }
            }
            @keyframes floodRise { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
            @keyframes tsunamiRun { 0%, 100% { transform: translateX(0); } 50% { transform: translateX(6px); } }
            @keyframes bgGlowPulse { 0%, 100% { opacity: 0.45; } 50% { opacity: 0.8; } }
            .bg-glow-layer {
              background: radial-gradient(ellipse at 70% 60%, #1e114a 0%, transparent 65%);
              animation: bgGlowPulse 8s ease-in-out infinite;
            }
            .cracks-pattern {
              background-image: repeating-linear-gradient(45deg, rgba(0,0,0,0.08) 0px, rgba(0,0,0,0.08) 1px, transparent 1px, transparent 15px),
                repeating-linear-gradient(-45deg, rgba(0,0,0,0.08) 0px, rgba(0,0,0,0.08) 1px, transparent 1px, transparent 15px);
            }
            .water-pattern { background-image: repeating-linear-gradient(0deg, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.06) 4px, transparent 4px, transparent 16px); }
            .tsunami-pattern { background-image: repeating-linear-gradient(30deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 2px, transparent 2px, transparent 12px); }
          `}</style>

          {/* Title */}
          <div className="flex flex-col items-center justify-center pt-8 text-center z-10">
            <h1 className="font-black text-2xl text-[#FFE135]">🚨 EVACUATION 3D</h1>
            <p className="text-sm text-white/50 tracking-widest uppercase mt-1">Pilih Level Bencana</p>
          </div>

          {/* Carousel */}
          <div
            className="w-full overflow-hidden flex items-center justify-center relative h-[65vh]"
            onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}
            onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseLeave}
          >
            {/* Nav arrows */}
            {[{ side: 'left', onClick: handlePrev, label: '←' }, { side: 'right', onClick: handleNext, label: '→' }].map(a => (
              <button
                key={a.side}
                onClick={a.onClick}
                style={{
                  position: 'fixed', [a.side]: '2rem', top: '50%', transform: 'translateY(-50%)',
                  backgroundColor: 'white', border: '4px solid #1A1A2E', width: '56px', height: '56px',
                  fontWeight: 900, boxShadow: '4px 4px 0 #1A1A2E', transition: 'all 0.2s',
                }}
                className="z-20 flex items-center justify-center text-2xl hover:scale-105 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none text-[#1A1A2E] rounded-md"
              >
                {a.label}
              </button>
            ))}

            {/* Slides */}
            <div className="relative w-full h-full flex items-center justify-center">
              {EXTENDED_CARDS.map((card, index) => {
                const offset = index - activeIndex
                const absOffset = Math.abs(offset)
                let scale = 1.05, blur = 0, brightness = 1, zIndex = 10
                if (absOffset === 1) { scale = 0.82; blur = 1; brightness = 0.6; zIndex = 5 }
                else if (absOffset >= 2) { scale = 0.65; blur = 2; brightness = 0.4; zIndex = 1 }

                return (
                  <div
                    key={card.key}
                    onClick={() => { if (offset !== 0 && !isTransitioning && !isDragging) { if (offset > 0) handleNext(); else handlePrev() } }}
                    style={{
                      width: '420px', height: '100%', position: 'absolute', left: '50%', top: '50%',
                      transform: `translate(-50%, -50%) translateX(calc(${offset * 85}% + ${dragOffset}px)) scale(${scale})`,
                      filter: `blur(${blur}px) brightness(${brightness})`,
                      background: card.bgGradient,
                      border: offset === 0 ? '4px solid #FFE135' : '4px solid rgba(255,255,255,0.2)',
                      boxShadow: offset === 0 ? '8px 8px 0px #FF6B6B' : 'none',
                      transition: isDragging ? 'none' : (isTransitioning ? 'all 0.5s cubic-bezier(0.23, 1, 0.32, 1)' : 'none'),
                      zIndex,
                    }}
                    className={`max-w-[90vw] rounded-2xl flex flex-col overflow-hidden select-none ${offset === 0 ? 'cursor-default' : 'cursor-pointer'}`}
                  >
                    <div className={`h-[55%] w-full flex items-center justify-center relative ${card.bgPatternClass}`}>
                      <div
                        style={{
                          animation: offset === 0 ? (
                            card.id === 'earthquake' ? 'quakeShake 0.5s ease-in-out infinite' :
                            card.id === 'flood' ? 'floodRise 2s ease-in-out infinite' :
                            'tsunamiRun 0.8s ease-in-out infinite'
                          ) : 'none'
                        }}
                        className="text-7xl select-none"
                      >
                        {card.previewEmoji}
                      </div>
                    </div>
                    <div className="h-[45%] bg-black/30 px-6 py-5 flex flex-col justify-between">
                      <div>
                        <span className="bg-[#FFE135] text-[#1A1A2E] font-black text-xs px-3 py-1 border-2 border-white inline-block">{card.levelText}</span>
                        <h3 className="font-black text-3xl text-white mt-2">{card.title}</h3>
                        <p className="text-sm text-white/80 mt-2 leading-snug">{card.description}</p>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs text-white/60 mt-3 items-center">
                        {card.stats.map((stat, i) => (
                          <span key={i} className="flex items-center">
                            {i > 0 && <span className="mr-2 text-white/30">•</span>}
                            <span>{stat}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Bottom CTA + dots */}
          <div className="flex flex-col items-center gap-6 pb-8 z-10 w-full max-w-[90vw] mx-auto">
            <button
              onClick={() => handleSelectLevel(EXTENDED_CARDS[activeIndex].originalIndex)}
              style={{
                backgroundColor: '#FFE135', color: '#1A1A2E', fontWeight: 900, fontSize: '1.125rem',
                border: '4px solid white', boxShadow: '6px 6px 0px rgba(255,255,255,0.3)',
                paddingLeft: '3rem', paddingRight: '3rem', paddingTop: '1rem', paddingBottom: '1rem', transition: 'all 0.2s',
              }}
              className="hover:-translate-y-0.5 hover:shadow-[8px_8px_0px_rgba(255,255,255,0.4)] active:translate-y-0 active:shadow-[4px_4px_0px_rgba(255,255,255,0.2)] rounded-xl uppercase tracking-wider"
            >
              {EXTENDED_CARDS[activeIndex].ctaText}
            </button>
            <div className="flex gap-2.5 items-center">
              {[0, 1, 2].map((idx) => {
                const cur = EXTENDED_CARDS[activeIndex].originalIndex
                return (
                  <button
                    key={idx}
                    onClick={() => { if (!isTransitioning && idx !== cur) { setIsTransitioning(true); setActiveIndex(idx + 1) } }}
                    className={`transition-all duration-300 ${idx === cur ? 'bg-[#FFE135] w-8 h-3 rounded-full' : 'bg-white/30 w-3 h-3 rounded-full hover:bg-white/50'}`}
                  />
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── 3D Canvas ─────────────────────────────────────── */}
      {currentLevel && !showLevelSelector && (
        <Canvas shadows>
          <Suspense fallback={null}>
            {/* PerspectiveCamera for earthquake + flood (orbit); Orthographic for tsunami */}
            {(isEarthquake || isFlood) ? (
              <PerspectiveCamera
                makeDefault
                position={[8, 10, 12]}
                fov={45}
                near={0.1}
                far={200}
              />
            ) : (
              <OrthographicCamera
                makeDefault
                position={[10, 10, 10]}
                zoom={40}
                near={-100}
                far={100}
                onUpdate={c => c.lookAt(0, 0, 0)}
              />
            )}

            <OrbitControls
              enablePan={true}
              enableZoom={true}
              minZoom={(isEarthquake || isFlood) ? undefined : 20}
              maxZoom={(isEarthquake || isFlood) ? undefined : 100}
              minDistance={(isEarthquake || isFlood) ? 5 : undefined}
              maxDistance={(isEarthquake || isFlood) ? 30 : undefined}
              maxPolarAngle={Math.PI / 2 - 0.05}
            />

            {/* Lighting — tsunami only (earthquake+flood lighting live in MapGrid) */}
            {!isEarthquake && !isFlood && (
              <>
                <ambientLight intensity={0.7} />
                <directionalLight castShadow position={[5, 10, 5]} intensity={1.2}
                  shadow-mapSize-width={1024} shadow-mapSize-height={1024}
                  shadow-camera-near={0.1} shadow-camera-far={50}
                  shadow-camera-left={-15} shadow-camera-right={15}
                  shadow-camera-top={15} shadow-camera-bottom={-15}
                />
                <directionalLight position={[-5, 5, -5]} intensity={0.6} />
              </>
            )}

            {/* Camera shake for earthquake */}
            {isEarthquake && <CameraShaker shakeState={shakeStateRef} />}

            <MapGrid />
            <Avatar />
          </Suspense>
        </Canvas>
      )}

      {/* ── Vocabulary HUD ────────────────────────────────── */}
      {currentLevel && !showLevelSelector && (
        isEarthquake ? <EarthquakeVocabHUD />
        : isFlood    ? <FloodVocabHUD />
        : <StandardVocabHUD />
      )}

      {/* ── Trap Overlay ──────────────────────────────────── */}
      {currentLevel && !showLevelSelector && isTrapActive && (
        <div
          className="absolute inset-0 bg-red-600/50 pointer-events-none z-30 animate-red-flash"
          onAnimationEnd={() => setTrapActive(false)}
        />
      )}

      {/* ── Loading Screen ────────────────────────────────── */}
      {currentLevel && !showLevelSelector && isLoading && (
        isEarthquake ? (
          <EarthquakeLoadingScreen />
        ) : isFlood ? (
          <FloodLoadingScreen />
        ) : (
          <div className="absolute inset-0 z-40 bg-yellow-100 flex flex-col items-center justify-center pointer-events-auto">
            <div className="flex flex-col items-center justify-center p-8 bg-white border-4 border-black rounded-2xl shadow-brutal max-w-lg mx-4 text-center">
              <div className="text-6xl animate-bounce mb-5">🏃‍♂️💨</div>
              <h2 className="text-2xl font-black text-black mb-2 animate-pulse">Menyiapkan Simulasi Area...</h2>
              <p className="text-sm font-bold text-slate-500 mb-6">Harap tunggu sebentar</p>
              <div className="bg-yellow-50 border-4 border-black rounded-xl p-5 shadow-brutal-sm text-left">
                <p className="text-base font-black text-amber-950 flex items-start gap-2.5 leading-relaxed">
                  <span className="text-2xl animate-pulse">💡</span>
                  <span>Tips: Jangan gunakan langkah boros tidak berguna! Gunakanlah jalan tercepat untuk menyelamatkan diri.</span>
                </p>
              </div>
            </div>
          </div>
        )
      )}

      {/* ── Flood Win Modal ───────────────────────────────── */}
      {isFlood && !showLevelSelector && status === 'success' && (
        <FloodWinModal
          steps={steps}
          onRetry={() => { useSimulationStore.getState().resetSimulation() }}
          onMenu={() => setShowLevelSelector(true)}
        />
      )}

      {/* ── Instruction Panel ─────────────────────────────── */}
      {currentLevel && !showLevelSelector && <InstructionPanel />}

      {/* ── Fallback Suspense Spinner ─────────────────────── */}
      {currentLevel && !showLevelSelector && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center -z-10">
          <LoadingSpinner size="lg" label="Memuat Simulator..." />
        </div>
      )}
    </div>
  )
}
