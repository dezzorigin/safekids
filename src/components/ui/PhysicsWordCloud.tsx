import { useEffect, useRef, useState, useCallback } from 'react'

export interface CloudWord {
  word: string
  count: number
  color: string
}

interface WordPhysics {
  word: string
  count: number
  color: string
  x: number
  y: number
  targetX: number
  targetY: number
  vx: number
  vy: number
  rotation: number
  fontSize: number
  isNewRank1: boolean
}

// Fixed target positions by rank (1-based)
const RANK_TARGETS: { x: number; y: number }[] = [
  { x: 50, y: 45 }, // rank 1 — CENTER
  { x: 30, y: 30 }, // rank 2
  { x: 70, y: 35 }, // rank 3
  { x: 20, y: 60 }, // rank 4
  { x: 75, y: 58 }, // rank 5
  { x: 45, y: 70 }, // rank 6
  { x: 15, y: 40 }, // rank 7
  { x: 80, y: 45 }, // rank 8
  { x: 50, y: 20 }, // rank 9
]

const calcFontSize = (count: number) => Math.min(14 + count * 8, 52)

function randomEdgePos(): { x: number; y: number } {
  const edge = Math.floor(Math.random() * 4)
  switch (edge) {
    case 0: return { x: Math.random() * 100, y: 0 }       // top
    case 1: return { x: Math.random() * 100, y: 100 }     // bottom
    case 2: return { x: 0, y: Math.random() * 100 }       // left
    default: return { x: 100, y: Math.random() * 100 }    // right
  }
}

function getTargetForRank(rank: number): { x: number; y: number } {
  if (rank <= RANK_TARGETS.length) return RANK_TARGETS[rank - 1]
  return {
    x: 5 + Math.random() * 90,
    y: 5 + Math.random() * 85,
  }
}

function buildPhysicsWord(
  word: string,
  count: number,
  color: string,
  rank: number,
  existingWord?: WordPhysics
): WordPhysics {
  const target = getTargetForRank(rank)
  const fontSize = calcFontSize(count)

  if (existingWord) {
    return {
      ...existingWord,
      count,
      fontSize,
      targetX: target.x,
      targetY: target.y,
    }
  }

  const edge = randomEdgePos()
  return {
    word,
    count,
    color,
    x: edge.x,
    y: edge.y,
    targetX: target.x,
    targetY: target.y,
    vx: 0,
    vy: 0,
    rotation: Math.random() * 10 - 5,
    fontSize,
    isNewRank1: false,
  }
}

function recalcRanks(words: WordPhysics[]): WordPhysics[] {
  const sorted = [...words].sort((a, b) => b.count - a.count)
  return sorted.map((w, i) => {
    const rank = i + 1
    const target = getTargetForRank(rank)
    return { ...w, targetX: target.x, targetY: target.y, fontSize: calcFontSize(w.count) }
  })
}

interface PhysicsWordCloudProps {
  words: CloudWord[]
  height?: string
  emptyMessage?: string
}

export function PhysicsWordCloud({ words, height = '380px', emptyMessage = 'Belum ada kata terkirim.' }: PhysicsWordCloudProps) {
  const [cloudWords, setCloudWords] = useState<WordPhysics[]>([])
  const physicsRef = useRef<WordPhysics[]>([])
  const rafRef = useRef<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const wordElemsRef = useRef<Map<string, HTMLDivElement>>(new Map())

  // Sync incoming words to physics state
  useEffect(() => {
    setCloudWords(prev => {
      // Map incoming words to physics words
      let updated: WordPhysics[] = words.map((w, i) => {
        const existing = prev.find(p => p.word === w.word)
        return buildPhysicsWord(w.word, w.count, w.color, i + 1, existing)
      })
      // Any words in prev that are not in incoming? Keep them or remove them?
      // Since `words` is the source of truth, we only keep what's in `words`.
      return recalcRanks(updated)
    })
  }, [words])

  useEffect(() => {
    physicsRef.current = cloudWords
  }, [cloudWords])

  // RAF animation loop
  useEffect(() => {
    const loop = () => {
      if (document.hidden) {
        rafRef.current = requestAnimationFrame(loop)
        return
      }

      const currentWords = physicsRef.current

      // Spring + damping
      for (const w of currentWords) {
        const dx = w.targetX - w.x
        const dy = w.targetY - w.y
        w.vx += dx * 0.04
        w.vy += dy * 0.04
        w.vx *= 0.85
        w.vy *= 0.85
        w.x += w.vx
        w.y += w.vy
      }

      // Simple collision nudge
      for (let i = 0; i < currentWords.length; i++) {
        for (let j = i + 1; j < currentWords.length; j++) {
          const a = currentWords[i]
          const b = currentWords[j]
          const minDist = (a.fontSize + b.fontSize) * 0.55
          const dx = a.x - b.x
          const dy = a.y - b.y
          const dist = Math.sqrt(dx * dx + dy * dy) || 0.001
          // Work in % space; minDist in px ≈ minDist/380*100 in % (assuming 380px roughly)
          const h = containerRef.current?.clientHeight || 380
          const minDistPct = (minDist / h) * 100
          if (dist < minDistPct) {
            const pushX = (dx / dist) * 0.02
            const pushY = (dy / dist) * 0.02
            a.vx += pushX
            a.vy += pushY
            b.vx -= pushX
            b.vy -= pushY
          }
        }
      }

      // Write positions directly to DOM
      for (const w of currentWords) {
        const el = wordElemsRef.current.get(w.word)
        if (el) {
          el.style.left = `${w.x}%`
          el.style.top = `${w.y}%`
        }
      }

      rafRef.current = requestAnimationFrame(loop)
    }

    rafRef.current = requestAnimationFrame(loop)
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  const registerWordEl = useCallback((word: string, el: HTMLDivElement | null) => {
    if (el) wordElemsRef.current.set(word, el)
    else wordElemsRef.current.delete(word)
  }, [])

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        height,
        overflow: 'hidden',
        background: '#1A1A2E',
        border: '4px solid #FFE135',
        borderRadius: 0,
      }}
    >
      <style>{`
        @keyframes wordFloat {
          0%, 100% { transform: translate(-50%, -50%) rotate(var(--rot, 0deg)) translateY(0px); }
          50%       { transform: translate(-50%, -50%) rotate(var(--rot, 0deg)) translateY(-5px); }
        }
        .physics-word {
          position: absolute;
          transform: translate(-50%, -50%);
          font-weight: 900;
          color: #1A1A2E;
          border: 3px solid #1A1A2E;
          padding: 6px 14px;
          white-space: nowrap;
          cursor: default;
          user-select: none;
          transition: font-size 0.5s ease, box-shadow 0.3s ease;
          box-shadow: 3px 3px 0 #1A1A2E;
          pointer-events: none;
          animation: wordFloat 3s ease-in-out infinite;
        }
      `}</style>
      
      {cloudWords.length === 0 ? (
        <p className="text-white/30 font-bold text-sm select-none absolute inset-0 flex items-center justify-center">
          {emptyMessage}
        </p>
      ) : (
        cloudWords.map((item) => (
          <div
            key={item.word}
            ref={(el) => registerWordEl(item.word, el)}
            className="physics-word"
            style={{
              left: `${item.x}%`,
              top: `${item.y}%`,
              backgroundColor: item.color,
              fontSize: `${item.fontSize}px`,
              // @ts-ignore
              '--rot': `${item.rotation.toFixed(1)}deg`,
            }}
          >
            {item.word}
          </div>
        ))
      )}
    </div>
  )
}
