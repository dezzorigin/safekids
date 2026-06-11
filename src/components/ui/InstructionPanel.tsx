import { useState, useRef, useEffect, KeyboardEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, RotateCcw, AlertCircle, CheckCircle2, Mic, MicOff, TerminalSquare,
         ArrowUp, ArrowDown, CornerUpLeft, CornerUpRight } from 'lucide-react'
import { useSimulationStore } from '@/store/useSimulationStore'
import type { CommandType } from '@/store/useSimulationStore'
import Button from './Button'
import Badge from './Badge'

// ─── Win Modal (Earthquake) ───────────────────────────────────────────────────

const OPTIMAL_STEPS = 16

function WinModal({ steps, onRetry, onMenu }: {
  steps: number
  onRetry: () => void
  onMenu: () => void
}) {
  const efficiency = Math.round((OPTIMAL_STEPS / Math.max(steps, OPTIMAL_STEPS)) * 100)
  const effColor = efficiency >= 90 ? '#22c55e' : efficiency >= 65 ? '#fbbf24' : '#f97316'

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      background: 'rgba(0,0,0,0.75)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      animation: 'winFadeIn 0.4s ease-out',
    }}>
      {/* Confetti layer */}
      <ConfettiBurst />

      <div style={{
        background: '#1a1a2e',
        border: '4px solid #22c55e',
        borderRadius: '16px',
        padding: '2.5rem 2rem',
        maxWidth: '420px',
        width: '90vw',
        textAlign: 'center',
        boxShadow: '0 0 60px rgba(34,197,94,0.35)',
        position: 'relative',
        zIndex: 1,
        animation: 'winCardPop 0.5s cubic-bezier(0.34,1.56,0.64,1)',
      }}>
        <div style={{ fontSize: '4rem', marginBottom: '0.5rem' }}>🎉</div>
        <h2 style={{
          color: '#ffffff',
          fontWeight: 900,
          fontSize: '1.8rem',
          marginBottom: '0.5rem',
          textShadow: '0 0 20px rgba(34,197,94,0.6)',
        }}>
          SELAMAT!
        </h2>
        <p style={{ color: '#4ade80', fontWeight: 700, fontSize: '1rem', marginBottom: '1.5rem' }}>
          Kamu berhasil evakuasi! 🏃
        </p>

        {/* Stats */}
        <div style={{
          background: 'rgba(255,255,255,0.06)',
          border: '2px solid rgba(34,197,94,0.3)',
          borderRadius: '12px',
          padding: '1rem',
          marginBottom: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.6rem',
        }}>
          <StatRow label="Langkah Kamu" value={`${steps} langkah`} color="#ffffff" />
          <StatRow label="Langkah Optimal" value={`${OPTIMAL_STEPS} langkah`} color="#fbbf24" />
          <div style={{
            borderTop: '1px solid rgba(255,255,255,0.1)',
            paddingTop: '0.6rem',
            marginTop: '0.2rem',
          }}>
            <StatRow
              label="Efisiensi"
              value={`${efficiency}%`}
              color={effColor}
              bold
            />
          </div>
        </div>

        {/* Efficiency bar */}
        <div style={{
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '999px',
          height: '10px',
          marginBottom: '1.5rem',
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            width: `${efficiency}%`,
            background: `linear-gradient(90deg, ${effColor}, ${effColor}88)`,
            borderRadius: '999px',
            transition: 'width 1s ease',
          }} />
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={onRetry}
            style={{
              flex: 1,
              background: '#1a1a2e',
              color: '#fbbf24',
              border: '3px solid #fbbf24',
              borderRadius: '10px',
              padding: '0.75rem',
              fontWeight: 900,
              fontSize: '0.95rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#fbbf24'; e.currentTarget.style.color = '#1a1a2e' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#1a1a2e'; e.currentTarget.style.color = '#fbbf24' }}
          >
            🔄 Coba Lagi
          </button>
          <button
            onClick={onMenu}
            style={{
              flex: 1,
              background: '#22c55e',
              color: '#fff',
              border: '3px solid #22c55e',
              borderRadius: '10px',
              padding: '0.75rem',
              fontWeight: 900,
              fontSize: '0.95rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.opacity = '0.85' }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
          >
            🏠 Kembali ke Menu
          </button>
        </div>
      </div>

      <style>{`
        @keyframes winFadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes winCardPop { from { transform: scale(0.7); opacity: 0 } to { transform: scale(1); opacity: 1 } }
        @keyframes confettiFall {
          0% { transform: translateY(-10px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  )
}

function StatRow({ label, value, color, bold }: { label: string; value: string; color: string; bold?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem', fontWeight: 600 }}>{label}</span>
      <span style={{ color, fontWeight: bold ? 900 : 700, fontSize: bold ? '1.1rem' : '0.95rem' }}>{value}</span>
    </div>
  )
}

const CONF_COLORS = ['#FF6B6B', '#FFE135', '#4ECDC4', '#74C0FC', '#C77DFF', '#FF9A3C', '#22c55e']
const CONFETTI_PIECES = Array.from({ length: 22 }, (_, i) => ({
  id: i,
  color: CONF_COLORS[i % CONF_COLORS.length],
  left: `${(i * 4.5) % 100}%`,
  delay: `${(i * 0.07).toFixed(2)}s`,
  duration: `${2.2 + (i % 5) * 0.3}s`,
}))

function ConfettiBurst() {
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
      {CONFETTI_PIECES.map(c => (
        <div
          key={c.id}
          style={{
            position: 'absolute',
            top: '-20px',
            left: c.left,
            width: '10px',
            height: '10px',
            backgroundColor: c.color,
            animation: `confettiFall ${c.duration} linear ${c.delay} infinite`,
            borderRadius: Math.random() > 0.5 ? '50%' : '0',
          }}
        />
      ))}
    </div>
  )
}

// ─── White Flash Overlay ──────────────────────────────────────────────────────

function WhiteFlash({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 600)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9998,
      background: 'white',
      pointerEvents: 'none',
      animation: 'flashFade 0.6s ease-out forwards',
    }}>
      <style>{`@keyframes flashFade { from { opacity: 1 } to { opacity: 0 } }`}</style>
    </div>
  )
}

// ─── InstructionPanel ─────────────────────────────────────────────────────────

export default function InstructionPanel() {
  const input        = useSimulationStore((s) => s.inputValue)
  const setInput     = useSimulationStore((s) => s.setInputValue)
  const setTrapActive = useSimulationStore((s) => s.setTrapActive)
  const [isListening, setIsListening] = useState(false)
  const [showWhiteFlash, setShowWhiteFlash] = useState(false)
  const [showWinModal, setShowWinModal] = useState(false)
  const inputRef  = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const isMoving        = useSimulationStore((s) => s.isMoving)
  const status          = useSimulationStore((s) => s.status)
  const steps           = useSimulationStore((s) => s.steps)
  const instructions    = useSimulationStore((s) => s.instructions)
  const enqueueCommands = useSimulationStore((s) => s.enqueueCommands)
  const resetSimulation = useSimulationStore((s) => s.resetSimulation)
  const addInstruction  = useSimulationStore((s) => s.addInstruction)
  const currentLevel    = useSimulationStore((s) => s.currentLevel)

  const isEarthquake = currentLevel === 'earthquake'

  // Show win sequence when status → success (earthquake only)
  const prevStatusRef = useRef(status)
  useEffect(() => {
    if (isEarthquake && prevStatusRef.current !== 'success' && status === 'success') {
      setShowWhiteFlash(true)
    }
    prevStatusRef.current = status
  }, [status, isEarthquake])

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [instructions])

  // Speech Recognition — fresh instance each click for reliability
  const startVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Browser tidak mendukung voice input. Gunakan Chrome.')
      return
    }

    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    const recognition = new SR()
    recognition.lang = 'id-ID'
    recognition.interimResults = false
    recognition.maxAlternatives = 3
    recognition.continuous = false

    recognition.onstart = () => {
      setIsListening(true)
    }

    recognition.onresult = (event: any) => {
      const results = Array.from(event.results[0]) as SpeechRecognitionAlternative[]
      const transcript = results
        .map((r: SpeechRecognitionAlternative) => r.transcript.toLowerCase().trim())
        .join(' ')

      setInput(transcript)
      setIsListening(false)

      // Auto-submit after voice input
      setTimeout(() => {
        const cmd = transcript.toLowerCase().trim()
        const isTrap = cmd.includes('fly') || cmd.includes('jump in') || cmd.includes('roll over')
        if (isTrap) {
          setTrapActive(true)
          addInstruction({
            text: transcript,
            action: `Jebakan! Kata "${transcript}" tidak berguna untuk evakuasi. 🛑`,
            success: false,
          })
          setInput('')
          return
        }
        const match = cmd.match(/\d+/)
        const stepCount = match ? parseInt(match[0], 10) : 1
        const commandsToQueue: CommandType[] = []
        let action = 'Oops! Tidak dimengerti.'
        let success = false
        if (cmd.includes('maju') || cmd.includes('forward') || cmd.includes('straight')) {
          for (let i = 0; i < stepCount; i++) commandsToQueue.push('forward')
          action = `Maju ${stepCount} langkah 🏃`
          success = true
        } else if (cmd.includes('mundur') || cmd.includes('back') || cmd.includes('backward')) {
          for (let i = 0; i < stepCount; i++) commandsToQueue.push('backward')
          action = `Mundur ${stepCount} langkah 🚶`
          success = true
        } else if (cmd.includes('kiri') || cmd.includes('left')) {
          for (let i = 0; i < stepCount; i++) commandsToQueue.push('left')
          action = `Belok Kiri ${stepCount}x ↩️`
          success = true
        } else if (cmd.includes('kanan') || cmd.includes('right')) {
          for (let i = 0; i < stepCount; i++) commandsToQueue.push('right')
          action = `Belok Kanan ${stepCount}x ↪️`
          success = true
        }
        if (commandsToQueue.length > 0) enqueueCommands(commandsToQueue)
        addInstruction({ text: transcript, action, success })
        setInput('')
        inputRef.current?.focus()
      }, 500)
    }

    recognition.onerror = (event: any) => {
      console.error('Voice error:', event.error)
      setIsListening(false)
      if (event.error === 'not-allowed') {
        alert('Izinkan akses mikrofon di browser untuk menggunakan fitur ini.')
      }
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognition.start()
  }

  const handleExecute = () => {
    if (!input.trim() || isMoving || status === 'success') return
    const cmd = input.toLowerCase().trim()

    const isTrap = cmd.includes('fly') || cmd.includes('jump in') || cmd.includes('roll over')
    if (isTrap) {
      setTrapActive(true)
      addInstruction({
        text: input,
        action: `Jebakan! Kata "${input}" tidak berguna untuk evakuasi. 🛑`,
        success: false,
      })
      setInput('')
      return
    }

    let action = 'Oops! Tidak dimengerti.'
    let success = false
    const match = cmd.match(/\d+/)
    const stepCount = match ? parseInt(match[0], 10) : 1
    const commandsToQueue: CommandType[] = []

    if (cmd.includes('maju') || cmd.includes('forward') || cmd.includes('straight')) {
      for (let i = 0; i < stepCount; i++) commandsToQueue.push('forward')
      action = `Maju ${stepCount} langkah 🏃`
      success = true
    } else if (cmd.includes('mundur') || cmd.includes('back') || cmd.includes('backward')) {
      for (let i = 0; i < stepCount; i++) commandsToQueue.push('backward')
      action = `Mundur ${stepCount} langkah 🚶`
      success = true
    } else if (cmd.includes('kiri') || cmd.includes('left')) {
      for (let i = 0; i < stepCount; i++) commandsToQueue.push('left')
      action = `Belok Kiri ${stepCount}x ↩️`
      success = true
    } else if (cmd.includes('kanan') || cmd.includes('right')) {
      for (let i = 0; i < stepCount; i++) commandsToQueue.push('right')
      action = `Belok Kanan ${stepCount}x ↪️`
      success = true
    }

    if (commandsToQueue.length > 0) enqueueCommands(commandsToQueue)
    addInstruction({ text: input, action, success })
    setInput('')
    inputRef.current?.focus()
  }

  const handleManualAction = (type: CommandType, label: string) => {
    enqueueCommands([type])
    addInstruction({ text: `Tombol: ${label}`, action: label, success: true })
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleExecute()
  }

  // Show only last 5 for earthquake
  const displayedInstructions = isEarthquake ? instructions.slice(0, 5) : instructions

  const formatTime = (ts: number) => {
    const d = new Date(ts)
    return `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}:${d.getSeconds().toString().padStart(2,'0')}`
  }

  // Panel width: 320px for earthquake
  const panelWidth = isEarthquake ? '320px' : '22rem'
  const headerBg = isEarthquake ? '#ffffff' : '#bae6fd'
  const headerBorder = isEarthquake ? '#FFD600' : '#000000'

  return (
    <>
      {/* ── Win Flash & Modal ─────────────────────────────── */}
      {showWhiteFlash && (
        <WhiteFlash onDone={() => { setShowWhiteFlash(false); setShowWinModal(true) }} />
      )}
      {showWinModal && isEarthquake && (
        <WinModal
          steps={steps}
          onRetry={() => { setShowWinModal(false); resetSimulation() }}
          onMenu={() => { setShowWinModal(false); window.location.reload() }}
        />
      )}

      <div
        className="absolute bottom-6 right-6 z-10 flex flex-col overflow-hidden rounded-xl border-4 border-black bg-white shadow-brutal"
        style={{ width: panelWidth }}
      >
        {/* ── Header ─────────────────────────────────────── */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{
            borderBottom: `4px solid ${headerBorder}`,
            background: headerBg,
          }}
        >
          <div className="flex items-center gap-2">
            <TerminalSquare size={18} style={{ color: isEarthquake ? '#1a1a1a' : '#000' }} />
            <h3 className="text-sm font-black" style={{ color: isEarthquake ? '#1a1a1a' : '#000' }}>
              Panel Instruksi
            </h3>
          </div>
          <Badge variant={status === 'success' ? 'active' : status === 'failed' ? 'warning' : 'muted'} dot>
            {status.toUpperCase()}
          </Badge>
        </div>

        {/* ── Manual Controls (non-earthquake only) ───────── */}
        {!isEarthquake && (
          <div className="grid grid-cols-4 gap-3 border-b-4 border-black p-4 bg-gray-100">
            <Button variant="secondary" size="sm" disabled={isMoving || status === 'success'}
              onClick={() => handleManualAction('forward', 'Maju')} className="col-span-1 !h-12" aria-label="Move Forward">
              <ArrowUp size={20} />
            </Button>
            <Button variant="secondary" size="sm" disabled={isMoving || status === 'success'}
              onClick={() => handleManualAction('backward', 'Mundur')} className="col-span-1 !h-12" aria-label="Move Backward">
              <ArrowDown size={20} />
            </Button>
            <Button variant="secondary" size="sm" disabled={isMoving || status === 'success'}
              onClick={() => handleManualAction('left', 'Kiri')} className="col-span-1 !h-12" aria-label="Turn Left">
              <CornerUpLeft size={20} />
            </Button>
            <Button variant="secondary" size="sm" disabled={isMoving || status === 'success'}
              onClick={() => handleManualAction('right', 'Kanan')} className="col-span-1 !h-12" aria-label="Turn Right">
              <CornerUpRight size={20} />
            </Button>
          </div>
        )}

        {/* ── Log ─────────────────────────────────────────── */}
        <div
          ref={scrollRef}
          className="flex flex-col-reverse gap-2 overflow-y-auto p-4"
          style={{
            height: isEarthquake ? '9rem' : '11rem',
            background: '#ffffff',
          }}
        >
          <AnimatePresence initial={false}>
            {displayedInstructions.map((log) => {
              // Color coding for earthquake
              const textColor = isEarthquake
                ? (log.success ? '#16a34a' : '#dc2626')
                : (log.success ? '#0284c7' : '#94a3b8')
              const borderColor = isEarthquake
                ? '#FFD600'
                : '#000000'
              const bgColor = '#ffffff'
              const borderStyle: React.CSSProperties = isEarthquake
                ? { borderLeft: '4px solid #FFD600', borderTop: 'none', borderRight: 'none', borderBottom: 'none' }
                : { border: `2px solid ${borderColor}` }

              return (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex flex-col gap-1 rounded-lg p-2.5 text-xs"
                  style={isEarthquake ? { ...borderStyle, background: bgColor } : { borderColor, background: bgColor, border: `2px solid ${borderColor}`, borderRadius: '8px' }}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-black truncate" style={{ color: '#1a1a1a' }}>
                      "{log.text}"
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      {isEarthquake && (
                        <span style={{ color: 'rgba(0,0,0,0.4)', fontSize: '0.65rem' }}>
                          {formatTime(log.timestamp)}
                        </span>
                      )}
                      {log.success
                        ? <CheckCircle2 size={13} className="text-emerald-500" />
                        : <AlertCircle size={13} className="text-red-500" />
                      }
                    </div>
                  </div>
                  <span className="font-semibold" style={{ color: textColor }}>
                    &gt; {log.action}
                  </span>
                </motion.div>
              )
            })}
            {displayedInstructions.length === 0 && (
              <div className="text-center text-xs font-bold mt-auto mb-auto" style={{ color: isEarthquake ? '#666666' : '#94a3b8' }}>
                Belum ada instruksi.<br />
                {isEarthquake ? 'Ketik "maju", "mundur", "belok kanan", atau "belok kiri".' : 'Coba ketik "maju 2" atau "belok kiri".'}
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Input ───────────────────────────────────────────────────────── */}
        <div
          className="flex gap-2 border-t-4 border-black p-3"
          style={{ background: '#ffffff' }}
        >
          {/* Mic button with pulsing ring when recording */}
          <div style={{ position: 'relative', flexShrink: 0 }} title="Gunakan Chrome untuk voice input">
            {isListening && (
              <div style={{
                position: 'absolute',
                inset: '-6px',
                borderRadius: '50%',
                border: '3px solid #ef4444',
                animation: 'micPulse 0.9s ease-in-out infinite',
                pointerEvents: 'none',
              }} />
            )}
            <button
              onClick={() => {
                if (isListening) {
                  setIsListening(false)
                } else {
                  startVoiceInput()
                }
              }}
              disabled={isMoving || status === 'success'}
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                border: `2px solid ${isListening ? '#ef4444' : '#FFD600'}`,
                background: isListening ? '#ef4444' : '#f8f8f8',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '16px',
                transition: 'all 0.2s',
              }}
              aria-label="Voice Input"
            >
              {isListening ? <MicOff size={16} color="#fff" /> : <Mic size={16} color="#1a1a1a" />}
            </button>
          </div>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isMoving || status === 'success'}
            placeholder={
              status === 'success' ? 'Berhasil! 🌟' :
              isListening ? '🔴 Mendengarkan...' :
              isEarthquake ? 'Ketik: maju / belok kanan...' :
              'Ketik instruksi...'
            }
            style={{
              flex: 1,
              border: `2px solid ${isListening ? '#ef4444' : '#FFD600'}`,
              background: isListening ? 'rgba(239,68,68,0.05)' : '#ffffff',
              color: '#1a1a1a',
              borderRadius: '10px',
              padding: '0.5rem 0.75rem',
              fontSize: '0.875rem',
              fontWeight: 700,
              outline: 'none',
              transition: 'all 0.2s',
            }}
            className="disabled:opacity-50 transition-all"
          />
          <Button
            variant="primary"
            onClick={handleExecute}
            disabled={!input.trim() || isMoving || status === 'success'}
            aria-label="Execute"
            className="!px-4"
          >
            <Send size={18} />
          </Button>
        </div>

        {/* ── Reset Button ─────────────────────────────── */}
        {status !== 'idle' && (
          <div
            className="border-t-4 border-black p-3"
            style={{ background: '#ffffff' }}
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={resetSimulation}
              className="w-full"
              style={{ color: '#1a1a1a' }}
              leftIcon={<RotateCcw size={16} />}
            >
              Ulangi Simulasi 🔄
            </Button>
          </div>
        )}
      </div>
    </>
  )
}
