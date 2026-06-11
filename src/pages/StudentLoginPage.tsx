import { useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

// ─── Floating Squares Config ─────────────────────────────────────────────────

const DECORATIONS = [
  { style: { top: '8%', left: '6%', width: '60px', height: '60px', backgroundColor: '#FF6B6B', animationDelay: '0s', animationDuration: '7s' } },
  { style: { top: '12%', right: '8%', width: '50px', height: '50px', backgroundColor: '#FFE135', animationDelay: '-2s', animationDuration: '6s' } },
  { style: { top: '45%', left: '3%', width: '45px', height: '45px', backgroundColor: '#4ECDC4', animationDelay: '-4s', animationDuration: '9s' } },
  { style: { top: '45%', right: '4%', width: '55px', height: '55px', backgroundColor: '#C77DFF', animationDelay: '-1s', animationDuration: '8s' } },
  { style: { bottom: '15%', left: '8%', width: '50px', height: '50px', backgroundColor: '#FF9A3C', animationDelay: '-3s', animationDuration: '10s' } },
  { style: { bottom: '12%', right: '6%', width: '65px', height: '65px', backgroundColor: '#74C0FC', animationDelay: '-5s', animationDuration: '8s' } },
]

// ─── Pastel Smoke Puff Colors ────────────────────────────────────────────────

const PUFF_COLORS = [
  'rgba(255,107,107,0.12)',
  'rgba(255,225,53,0.15)',
  'rgba(78,205,196,0.12)',
  'rgba(116,192,252,0.12)',
  'rgba(199,125,255,0.10)',
  'rgba(255,154,60,0.12)',
]

import { useCurtain } from '@/context/CurtainContext'

export default function StudentLoginPage() {
  const navigate = useNavigate()
  const { triggerCurtain, triggerInitialOpen } = useCurtain()
  const hasTriggeredRef = useRef(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Phase transition timeline
  useEffect(() => {
    // Open curtains after tiny delay (100ms)
    const openTimer = setTimeout(() => {
      triggerInitialOpen()
    }, 100)

    // Schedule the close+navigate at t=4500ms
    timerRef.current = setTimeout(() => {
      if (!hasTriggeredRef.current) {
        hasTriggeredRef.current = true
        triggerCurtain(() => navigate('/student/group'))
      }
    }, 4500)

    return () => {
      clearTimeout(openTimer)
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [navigate, triggerCurtain, triggerInitialOpen])

  const handleScreenClick = () => {
    if (hasTriggeredRef.current) return
    hasTriggeredRef.current = true

    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }
    triggerCurtain(() => navigate('/student/group'))
  }

  // Generate 12 pastel smoke particles
  const smokePuffs = useMemo(() => {
    return Array.from({ length: 12 }).map((_, i) => {
      const size = Math.floor(Math.random() * 300) + 200 // 200-500px size
      const left = Math.floor(Math.random() * 100) // 0-100% position
      const top = Math.floor(Math.random() * 100)
      const duration = Math.floor(Math.random() * 8) + 8 // 8-15s duration
      const delay = -(Math.random() * 12) // staggered initial timeline offset
      return {
        id: i,
        style: {
          position: 'absolute' as const,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${PUFF_COLORS[i % PUFF_COLORS.length]} 0%, transparent 70%)`,
          width: `${size}px`,
          height: `${size}px`,
          left: `${left}%`,
          top: `${top}%`,
          animation: `smokeDrift ${duration}s ease-in-out infinite alternate`,
          animationDelay: `${delay}s`,
          pointerEvents: 'none' as const,
        },
      }
    })
  }, [])

  return (
    <div
      onClick={handleScreenClick}
      className="splash-wrapper cursor-pointer select-none"
    >
      {/* ── Localized Keyframe Animations ── */}
      <style>{`
        .splash-wrapper {
          position: relative;
          width: 100vw;
          height: 100vh;
          background: #FFFEF7;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          font-family: 'Nunito', sans-serif;
          color: #1A1A2E;
        }

        @keyframes smokeDrift {
          0%   { transform: translate(0, 0) scale(1); opacity: 0.3; }
          50%  { transform: translate(30px, -20px) scale(1.1); opacity: 0.6; }
          100% { transform: translate(-20px, 10px) scale(0.95); opacity: 0.2; }
        }

        @keyframes shimmer {
          0%, 100% { text-shadow: 4px 4px 0px #FF6B6B, 8px 8px 0px rgba(255,107,107,0.25); }
          50% { text-shadow: 4px 4px 0px #FF9A3C, 8px 8px 0px rgba(255,154,60,0.35), 0 0 40px rgba(255,225,53,0.2); }
        }

        @keyframes floatRotate {
          0%   { transform: rotate(-8deg) translateY(0px); }
          100% { transform: rotate(12deg) translateY(-16px); }
        }

        @keyframes loadBarFill {
          0%   { width: 0%; }
          30%  { width: 25%; }
          60%  { width: 55%; }
          85%  { width: 80%; }
          95%  { width: 92%; }
          100% { width: 100%; }
        }

        @keyframes loadBarStripe {
          0%   { background-position: 0px 0; }
          100% { background-position: 80px 0; }
        }

        @keyframes dots {
          0%, 33%   { content: '.'; }
          34%, 66%  { content: '..'; }
          67%, 100% { content: '...'; }
        }

        .badge-item {
          font-family: 'Nunito', sans-serif;
          font-weight: 900;
          font-size: 11px;
          letter-spacing: 0.3em;
          color: rgba(26, 26, 46, 0.7);
          border: 1px solid rgba(26, 26, 46, 0.3);
          padding: 6px 16px;
          display: inline-block;
          text-transform: uppercase;
        }

        .title-item {
          font-family: 'Nunito', sans-serif;
          font-weight: 900;
          font-size: clamp(64px, 12vw, 120px);
          color: #1A1A2E;
          letter-spacing: -2px;
          line-height: 1;
          margin: 16px 0 8px 0;
          animation: shimmer 3s ease-in-out infinite;
        }

        .meaning-item {
          font-size: 14px;
          color: rgba(26, 26, 46, 0.5);
          font-style: italic;
          letter-spacing: 0.15em;
        }

        .divider-item {
          width: 60px;
          height: 3px;
          background: linear-gradient(90deg, #FF6B6B, #FFE135, #4ECDC4);
          margin: 24px auto;
        }

        .tagline-item {
          font-size: 18px;
          font-weight: 700;
          color: #1A1A2E;
        }

        .subtagline-item {
          font-size: 12px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: rgba(26, 26, 46, 0.4);
          margin-top: 6px;
        }

        .loader-container {
          width: 280px;
          height: 20px;
          border: 3px solid #1A1A2E;
          box-shadow: 3px 3px 0px #1A1A2E;
          background: white;
          margin: 32px auto 0;
          position: relative;
          overflow: hidden;
        }

        .loader-bar {
          height: 100%;
          background: repeating-linear-gradient(
            90deg,
            #FF6B6B 0px, #FF6B6B 20px,
            #FFE135 20px, #FFE135 40px,
            #4ECDC4 40px, #4ECDC4 60px,
            #74C0FC 60px, #74C0FC 80px
          );
          background-size: 80px 100%;
          width: 0%;
          animation: loadBarFill 3.5s ease-out forwards,
                     loadBarStripe 0.5s linear infinite;
          animation-delay: 1.5s, 1.5s;
        }

        .loader-text {
          font-size: 11px;
          color: rgba(26, 26, 46, 0.35);
          letter-spacing: 0.15em;
          margin-top: 8px;
          text-align: center;
        }

        .dots-loader::after {
          content: '.';
          animation: dots 1.5s steps(3, end) infinite;
          display: inline-block;
          width: 12px;
          text-align: left;
        }

        .floating-square {
          position: absolute;
          border: 3px solid #1A1A2E;
          box-shadow: 3px 3px 0px #1A1A2E;
          animation: floatRotate 8s ease-in-out infinite alternate;
        }

        .skip-prompt {
          position: absolute;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%);
          color: rgba(26, 26, 46, 0.25);
          font-size: 11px;
          letter-spacing: 0.1em;
          pointer-events: none;
        }
      `}</style>

      {/* LAYER 1: Smoke Drifting Particles */}
      {smokePuffs.map((puff) => (
        <div key={puff.id} style={puff.style} />
      ))}

      {/* LAYER 2: Floating Squares Decorations */}
      {DECORATIONS.map((dec, idx) => (
        <div
          key={idx}
          className="floating-square"
          style={{
            ...dec.style,
            animationDuration: dec.style.animationDuration,
            animationDelay: dec.style.animationDelay,
          }}
        />
      ))}

      {/* LAYER 3: Main Portal Content (Always visible behind curtain) */}
      <div
        className="relative z-10 flex flex-col items-center justify-center text-center px-4 max-w-2xl"
        style={{
          opacity: 1,
          pointerEvents: 'auto',
        }}
      >
        {/* 1. Top Badge */}
        <div className="badge-item">
          🌊 LIDM 2025 · MICROTEACHING PORTAL
        </div>

        {/* 2. Brand Title */}
        <h1 className="title-item">
          JAK PLUENG!
        </h1>

        {/* 3. Acehnese Translation */}
        <div className="meaning-item">
          [ lari · run · scamper ]
        </div>

        {/* 4. Color Stripe Divider */}
        <div className="divider-item" />

        {/* 5. Tagline */}
        <div className="tagline-item">
          Portal Microteaching Bahasa Inggris
        </div>

        {/* 6. Sub Tagline */}
        <div className="subtagline-item">
          Giving &amp; Following Instructions · Konteks Bencana Alam
        </div>

        {/* 7. Chunky Progress Bar */}
        <div className="loader-container">
          <div className="loader-bar" />
        </div>
        <div className="loader-text">
          Memuat sesi<span className="dots-loader" />
        </div>

      </div>

      {/* Skip click prompt */}
      <div className="skip-prompt">
        Ketuk layar untuk masuk langsung
      </div>

    </div>
  )
}
