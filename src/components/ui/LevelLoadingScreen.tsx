import { useEffect, useState } from 'react'
import { useSimulationStore } from '@/store/useSimulationStore'

// ─── Level Loading Config ─────────────────────────────────────────────────────

interface LevelLoadingConfig {
  levelName: string
  emoji: string
  tips: string
  accentColor: string
}

const LEVEL_LOADING_CONFIG: Record<string, LevelLoadingConfig> = {
  earthquake: {
    levelName: 'GEMPA BUMI',
    emoji: '🏚️',
    tips: '💡 Gunakan rute TERPENDEK. Setiap langkah boros = nyawa terbuang!',
    accentColor: '#FF6B6B',
  },
  flood: {
    levelName: 'BANJIR',
    emoji: '🌊',
    tips: '💡 Air terus naik! Hindari rumah terendam dan pohon — lewati jalan tercepat!',
    accentColor: '#74C0FC',
  },
  tsunami: {
    levelName: 'TSUNAMI',
    emoji: '🌊🏃',
    tips: '💡 Jangan gunakan langkah boros! Gunakanlah jalan tercepat untuk menyelamatkan diri.',
    accentColor: '#4ECDC4',
  },
}

export default function LevelLoadingScreen() {
  const currentLevel = useSimulationStore((s) => s.currentLevel)
  const setLoading = useSimulationStore((s) => s.setLoading)
  const [progress, setProgress] = useState(0)
  const [done, setDone] = useState(false)

  const config = currentLevel ? LEVEL_LOADING_CONFIG[currentLevel] : null

  useEffect(() => {
    if (!config) return

    const MIN_DURATION = 3500 // 3.5 seconds minimum
    const startTime = Date.now()

    let rafId: number
    const animateProgress = () => {
      const elapsed = Date.now() - startTime
      const pct = Math.min(100, (elapsed / MIN_DURATION) * 100)
      setProgress(pct)
      if (elapsed < MIN_DURATION) {
        rafId = requestAnimationFrame(animateProgress)
      }
    }
    rafId = requestAnimationFrame(animateProgress)

    // Resolve loading purely based on timer
    const timer = setTimeout(() => {
      setDone(true)
      setLoading(false)
    }, MIN_DURATION)

    return () => {
      clearTimeout(timer)
      cancelAnimationFrame(rafId)
    }
  }, [config, setLoading])

  if (done || !config) return null

  const { levelName, emoji, tips, accentColor } = config

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 40,
        background: '#1A1A2E',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Nunito, sans-serif',
      }}
    >
      {/* Card */}
      <div
        style={{
          background: '#1A1A2E',
          border: `4px solid ${accentColor}`,
          padding: '2.5rem 2rem',
          maxWidth: '420px',
          width: '90vw',
          textAlign: 'center',
          boxShadow: `4px 4px 0px ${accentColor}`,
        }}
      >
        {/* Emoji */}
        <div
          style={{
            fontSize: '4.5rem',
            marginBottom: '1rem',
            display: 'inline-block',
            animation: 'loadingBounce 1.5s ease-in-out infinite',
          }}
        >
          {emoji}
        </div>

        {/* Level Name */}
        <h2
          style={{
            color: '#ffffff',
            fontWeight: 900,
            fontSize: '2.2rem',
            letterSpacing: '0.05em',
            marginBottom: '0.4rem',
            textShadow: `0 0 20px ${accentColor}80, 0 0 40px ${accentColor}40`,
          }}
        >
          {levelName}
        </h2>

        {/* Subtitle */}
        <p
          style={{
            color: `${accentColor}cc`,
            fontSize: '0.9rem',
            fontWeight: 700,
            marginBottom: '1.5rem',
          }}
        >
          Menyiapkan area simulasi...
        </p>

        {/* Tips box */}
        <div
          style={{
            background: 'rgba(0,0,0,0.4)',
            border: `2px solid ${accentColor}80`,
            padding: '0.875rem 1rem',
            marginBottom: '1.5rem',
            textAlign: 'left',
          }}
        >
          <p
            style={{
              color: `${accentColor}dd`,
              fontSize: '0.8rem',
              fontWeight: 700,
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            {tips}
          </p>
        </div>

        {/* Progress bar */}
        <div
          style={{
            background: 'rgba(255,255,255,0.1)',
            height: '8px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${progress}%`,
              background: `linear-gradient(90deg, ${accentColor}88, ${accentColor})`,
              transition: 'width 0.1s linear',
              boxShadow: `0 0 8px ${accentColor}cc`,
            }}
          />
        </div>
        <p
          style={{
            color: 'rgba(255,255,255,0.35)',
            fontSize: '0.7rem',
            marginTop: '0.5rem',
            fontWeight: 600,
          }}
        >
          {Math.round(progress)}%
        </p>
      </div>

      <style>{`
        @keyframes loadingBounce {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-12px) scale(1.05); }
        }
      `}</style>
    </div>
  )
}
