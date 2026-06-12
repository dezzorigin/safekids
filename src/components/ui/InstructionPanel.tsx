import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RotateCcw, Mic, MicOff, MessageSquare } from 'lucide-react'
import { useSimulationStore } from '@/store/useSimulationStore'
import type { CommandType } from '@/store/useSimulationStore'
import Badge from './Badge'

export default function InstructionPanel() {
  const inputValue    = useSimulationStore((s) => s.inputValue)
  const setInputValue = useSimulationStore((s) => s.setInputValue)
  const setTrapActive = useSimulationStore((s) => s.setTrapActive)
  const [isListening, setIsListening] = useState(false)
  const [micNotSupported, setMicNotSupported] = useState(false)
  const inputRef  = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef(false)

  const isMoving        = useSimulationStore((s) => s.isMoving)
  const status          = useSimulationStore((s) => s.status)
  const instructions    = useSimulationStore((s) => s.instructions)
  const enqueueCommands = useSimulationStore((s) => s.enqueueCommands)
  const resetSimulation = useSimulationStore((s) => s.resetSimulation)
  const addInstruction  = useSimulationStore((s) => s.addInstruction)

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [instructions])

  // Speech Recognition
  const startVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setMicNotSupported(true)
      setTimeout(() => setMicNotSupported(false), 3000)
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
      const bestResult = results[0]
      const confidence = bestResult ? bestResult.confidence : 0

      const rawTranscript = results.map((r) => r.transcript).join(' ')
      const transcript = rawTranscript.toLowerCase().trim().replace(/[^a-z0-9\s]/gi, '')

      setInputValue(transcript)
      setIsListening(false)

      if (confidence < 0.7 || debounceRef.current) return
      debounceRef.current = true

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
          setInputValue('')
          debounceRef.current = false
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
        setInputValue('')
        inputRef.current?.focus()
        debounceRef.current = false
      }, 500)
    }

    recognition.onerror = (event: any) => {
      console.error('Voice error:', event.error)
      setIsListening(false)
      if (event.error === 'not-allowed') {
        setMicNotSupported(true)
        setTimeout(() => setMicNotSupported(false), 3000)
      }
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognition.start()
  }

  const onInstruction = (val: string) => {
    if (!val.trim() || isMoving || status === 'success') return
    const cmd = val.toLowerCase().trim()

    const isTrap = cmd.includes('fly') || cmd.includes('jump in') || cmd.includes('roll over')
    if (isTrap) {
      setTrapActive(true)
      addInstruction({
        text: val,
        action: `Jebakan! Kata "${val}" tidak berguna untuk evakuasi. 🛑`,
        success: false,
      })
      setInputValue('')
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
    addInstruction({ text: val, action, success })
    setInputValue('')
    inputRef.current?.focus()
  }

  const handleSubmit = () => {
    if (!inputValue.trim()) return
    onInstruction(inputValue.trim())
    setInputValue('')
  }

  const formatTime = (ts: number) => {
    const d = new Date(ts)
    return `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}:${d.getSeconds().toString().padStart(2,'0')}`
  }

  const isDisabled = isMoving || status === 'success'

  return (
    <>
      <div
        className="absolute bottom-6 right-6 z-50 pointer-events-auto flex flex-col overflow-hidden"
        style={{
          width: '320px',
          background: '#1A1A2E',
          border: '4px solid #FFE135',
          borderRadius: '12px',
          boxShadow: '4px 4px 0px #FFE135',
          fontFamily: 'Nunito, sans-serif',
        }}
      >
        {/* ── Header ─────────────────────────────────────── */}
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{
            borderBottom: '2px solid #FFE135',
            background: '#1A1A2E',
          }}
        >
          <div className="flex items-center gap-2">
            <span style={{ fontSize: '1.2rem' }}>📋</span>
            <h3 className="text-sm font-black" style={{ color: '#ffffff' }}>
              Panel Instruksi
            </h3>
          </div>
          <Badge variant={status === 'success' ? 'active' : status === 'failed' ? 'warning' : 'muted'} dot>
            {status === 'playing' ? 'PLAYING' : status.toUpperCase()}
          </Badge>
        </div>

        {/* ── Log Area ─────────────────────────────────────────── */}
        <div
          ref={scrollRef}
          className="flex flex-col-reverse gap-3 overflow-y-auto p-4"
          style={{
            height: '14rem',
            background: 'rgba(255,255,255,0.02)',
          }}
        >
          <AnimatePresence initial={false}>
            {instructions.map((log) => {
              return (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, scale: 0.9, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className="flex gap-2"
                >
                  <div className="shrink-0 pt-1">
                    <MessageSquare size={16} color="#FFE135" />
                  </div>
                  <div 
                    className="flex-1 flex flex-col gap-1 p-2.5"
                    style={{ 
                      background: '#FFE135', 
                      border: '2px solid #1A1A2E',
                      borderRadius: '12px',
                      borderTopLeftRadius: '2px',
                      boxShadow: '3px 3px 0px #1A1A2E',
                      color: '#1A1A2E',
                    }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-black text-[14px]">
                        "{log.text}"
                      </span>
                      <span style={{ fontSize: '0.65rem', fontWeight: 800, opacity: 0.6 }}>
                        {formatTime(log.timestamp)}
                      </span>
                    </div>
                    <span className="font-bold text-[13px] opacity-80 flex items-center gap-1">
                      {log.success ? '✅' : '❌'} {log.action}
                    </span>
                  </div>
                </motion.div>
              )
            })}
            {instructions.length === 0 && (
              <div className="text-center font-bold mt-auto mb-auto flex flex-col items-center justify-center h-full" style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>
                <span className="text-2xl mb-2">💬</span>
                <span>Belum ada instruksi.</span>
                <span>Coba bicara atau ketik!</span>
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Mic Button Area ─────────────────────────────────────────────── */}
        <div className="flex flex-col items-center justify-center p-4 bg-[#1A1A2E]">
          <div style={{ position: 'relative' }}>
            {isListening && (
              <div style={{
                position: 'absolute',
                inset: '-8px',
                borderRadius: '50%',
                border: '4px solid rgba(255,0,0,0.5)',
                animation: 'micPulseLarge 1s ease-out infinite',
                pointerEvents: 'none',
              }} />
            )}
            
            {micNotSupported && (
              <div style={{
                position: 'absolute',
                bottom: '100%',
                left: '50%',
                transform: 'translateX(-50%)',
                background: '#1A1A2E',
                border: '2px solid #FF6B6B',
                color: '#FF6B6B',
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '4px 8px',
                borderRadius: '6px',
                whiteSpace: 'nowrap',
                marginBottom: '8px',
                zIndex: 20,
                boxShadow: '2px 2px 0px #FF6B6B',
              }}>
                Mic tidak didukung browser ini
              </div>
            )}

            <button
              onClick={() => {
                if (isListening) setIsListening(false)
                else startVoiceInput()
              }}
              disabled={isDisabled}
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                border: '4px solid #1A1A2E',
                background: isListening ? '#FF0000' : '#FF6B6B',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                boxShadow: '4px 4px 0px #1A1A2E',
                opacity: isDisabled ? 0.4 : 1,
              }}
              className={!isDisabled ? "hover:-translate-y-1 hover:shadow-[4px_6px_0px_#1A1A2E] active:translate-y-1 active:shadow-[2px_2px_0px_#1A1A2E]" : ""}
              aria-label="Voice Input"
            >
              {isListening ? <MicOff size={32} color="#fff" /> : <Mic size={32} color="#fff" />}
            </button>
          </div>
          <span 
            className="font-black mt-3" 
            style={{ 
              color: isListening ? '#FF6B6B' : '#ffffff', 
              fontSize: '14px' 
            }}
          >
            {isListening ? '🔴 Mendengarkan...' : 'Tekan & Bicara!'}
          </span>
        </div>

        {/* ── Input ───────────────────────────────────────────────────────── */}
        <div
          className="flex gap-2 px-4 pb-4 z-50 pointer-events-auto"
          style={{ background: '#1A1A2E' }}
        >
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSubmit()
            }}
            placeholder={
              status === 'success' ? 'Berhasil! 🌟' :
              isListening ? 'Mendengarkan...' :
              '✏️ Atau ketik instruksi di sini...'
            }
            style={{
              flex: 1,
              border: '4px solid #1A1A2E',
              background: '#ffffff',
              color: '#1A1A2E',
              borderRadius: '8px',
              padding: '0.6rem 0.75rem',
              fontSize: '14px',
              fontWeight: 800,
              outline: 'none',
              transition: 'all 0.2s',
              pointerEvents: 'auto',
              position: 'relative',
              zIndex: 50
            }}
            className="disabled:opacity-50 transition-all placeholder:text-gray-500"
          />
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleSubmit()
            }}
            style={{
              background: '#74C0FC',
              border: '4px solid #1A1A2E',
              borderRadius: '8px',
              padding: '0 1rem',
              color: '#1A1A2E',
              boxShadow: '3px 3px 0px #1A1A2E',
              transition: 'all 0.1s',
              pointerEvents: 'auto',
              position: 'relative', 
              zIndex: 50,
              cursor: 'pointer'
            }}
            className="hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0px_#1A1A2E]"
            aria-label="Execute"
          >
            ✈️
          </button>
        </div>

        {/* ── Reset Button ─────────────────────────────── */}
        <div className="px-4 pb-4 bg-[#1A1A2E]">
          <button
            onClick={resetSimulation}
            className="w-full flex items-center justify-center gap-2 font-black"
            style={{ 
              background: 'transparent',
              color: '#FFE135', 
              border: '2px solid #FFE135',
              padding: '0.6rem',
              borderRadius: '8px',
              fontSize: '14px',
              transition: 'all 0.2s',
              cursor: 'pointer'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#FFE135'; e.currentTarget.style.color = '#1A1A2E' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#FFE135' }}
          >
            <RotateCcw size={18} strokeWidth={3} />
            Ulangi Simulasi
          </button>
        </div>
      </div>

      <style>{`
        @keyframes micPulseLarge {
          0% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(1.8); opacity: 0; }
        }
      `}</style>
    </>
  )
}
