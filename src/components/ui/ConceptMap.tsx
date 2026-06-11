import { useState, useEffect, useRef } from 'react'

// ─── Constants ────────────────────────────────────────────────────────────────

const SIM_W              = 900
const SIM_H              = 560
const HOME_STIFFNESS     = 0.06
const REPULSION_RADIUS   = 120
const REPULSION_STRENGTH = 800
const DAMPING            = 0.82
const MAX_DISPLACEMENT   = 80

// ─── Types ────────────────────────────────────────────────────────────────────

interface NodeDef {
  id: string
  label: string
  homeX: number
  homeY: number
  fill: string
  textColor: string
  borderColor: string
  width: number
  height: number
  tooltip?: string
}

interface PhysicsState {
  x: number       // current X (= homeX + displacement)
  y: number       // current Y
  vx: number
  vy: number
}

interface Edge {
  from: string
  to: string
  color: string
}

// ─── Tooltips ─────────────────────────────────────────────────────────────────

const TOOLTIPS: Record<string, string> = {
  beside:     'Stand beside the wall!',
  between:    'Walk between the buildings.',
  behind:     'Stay behind the teacher.',
  nextto:     'Go next to the exit door.',
  infrontof:  'Line up in front of the school.',
  turnleft:   'Turn left at the corner!',
  turnright:  'Turn right toward the field.',
  gostraight: 'Go straight to the safe zone.',
  goback:     'Go back to your position.',
  earthquake: 'Drop! Cover! Hold On!',
  flood:      'Move to higher ground now!',
  tsunami:    'Run to high ground immediately!',
}

// ─── Node definitions (shifted homeY up by -100px) ───────────────────

const NODE_DEFS: NodeDef[] = [
  {
    id: 'root', label: 'Giving &\nFollowing\nInstructions',
    homeX: 450, homeY: 80, width: 170, height: 68,
    fill: '#FF6B6B', textColor: 'white', borderColor: '#1A1A2E',
  },
  {
    id: 'instructions', label: 'Instructions',
    homeX: 270, homeY: 205, width: 130, height: 40,
    fill: '#FF9A3C', textColor: 'white', borderColor: '#1A1A2E',
  },
  {
    id: 'evacuation', label: 'Evacuation',
    homeX: 680, homeY: 205, width: 130, height: 40,
    fill: '#C77DFF', textColor: 'white', borderColor: '#1A1A2E',
  },
  {
    id: 'preposition', label: 'Preposition',
    homeX: 160, homeY: 320, width: 125, height: 40,
    fill: '#74C0FC', textColor: '#1A1A2E', borderColor: '#1A1A2E',
  },
  {
    id: 'direction', label: 'Direction',
    homeX: 420, homeY: 320, width: 115, height: 40,
    fill: '#4ECDC4', textColor: '#1A1A2E', borderColor: '#1A1A2E',
  },
  // Preposition leaves
  {
    id: 'beside', label: '🔊 beside',
    homeX: 55, homeY: 435, width: 88, height: 34,
    fill: '#E8F4FD', textColor: '#1A1A2E', borderColor: '#74C0FC',
    tooltip: TOOLTIPS.beside,
  },
  {
    id: 'between', label: '🔊 between',
    homeX: 155, homeY: 435, width: 88, height: 34,
    fill: '#E8F4FD', textColor: '#1A1A2E', borderColor: '#74C0FC',
    tooltip: TOOLTIPS.between,
  },
  {
    id: 'behind', label: '🔊 behind',
    homeX: 255, homeY: 435, width: 88, height: 34,
    fill: '#E8F4FD', textColor: '#1A1A2E', borderColor: '#74C0FC',
    tooltip: TOOLTIPS.behind,
  },
  {
    id: 'nextto', label: '🔊 next to',
    homeX: 90, homeY: 520, width: 88, height: 34,
    fill: '#E8F4FD', textColor: '#1A1A2E', borderColor: '#74C0FC',
    tooltip: TOOLTIPS.nextto,
  },
  {
    id: 'infrontof', label: '🔊 in front of',
    homeX: 205, homeY: 520, width: 105, height: 34,
    fill: '#E8F4FD', textColor: '#1A1A2E', borderColor: '#74C0FC',
    tooltip: TOOLTIPS.infrontof,
  },
  // Direction leaves
  {
    id: 'turnleft', label: '🔊 turn left',
    homeX: 355, homeY: 435, width: 92, height: 34,
    fill: '#E8FFFE', textColor: '#1A1A2E', borderColor: '#4ECDC4',
    tooltip: TOOLTIPS.turnleft,
  },
  {
    id: 'turnright', label: '🔊 turn right',
    homeX: 458, homeY: 435, width: 96, height: 34,
    fill: '#E8FFFE', textColor: '#1A1A2E', borderColor: '#4ECDC4',
    tooltip: TOOLTIPS.turnright,
  },
  {
    id: 'gostraight', label: '🔊 go straight',
    homeX: 563, homeY: 435, width: 100, height: 34,
    fill: '#E8FFFE', textColor: '#1A1A2E', borderColor: '#4ECDC4',
    tooltip: TOOLTIPS.gostraight,
  },
  {
    id: 'goback', label: '🔊 go back',
    homeX: 455, homeY: 520, width: 88, height: 34,
    fill: '#E8FFFE', textColor: '#1A1A2E', borderColor: '#4ECDC4',
    tooltip: TOOLTIPS.goback,
  },
  // Evacuation leaves
  {
    id: 'earthquake', label: '🌍 EarthQuake',
    homeX: 590, homeY: 360, width: 110, height: 34,
    fill: '#F3E8FF', textColor: '#1A1A2E', borderColor: '#C77DFF',
    tooltip: TOOLTIPS.earthquake,
  },
  {
    id: 'flood', label: '🌊 Flood',
    homeX: 713, homeY: 360, width: 80, height: 34,
    fill: '#F3E8FF', textColor: '#1A1A2E', borderColor: '#C77DFF',
    tooltip: TOOLTIPS.flood,
  },
  {
    id: 'tsunami', label: '🌊 Tsunami',
    homeX: 815, homeY: 360, width: 92, height: 34,
    fill: '#F3E8FF', textColor: '#1A1A2E', borderColor: '#C77DFF',
    tooltip: TOOLTIPS.tsunami,
  },
]

const EDGES: Edge[] = [
  { from: 'root',         to: 'instructions',  color: '#FF9A3C' },
  { from: 'root',         to: 'evacuation',    color: '#C77DFF' },
  { from: 'instructions', to: 'preposition',   color: '#74C0FC' },
  { from: 'instructions', to: 'direction',     color: '#4ECDC4' },
  { from: 'preposition',  to: 'beside',        color: '#74C0FC' },
  { from: 'preposition',  to: 'between',       color: '#74C0FC' },
  { from: 'preposition',  to: 'behind',        color: '#74C0FC' },
  { from: 'preposition',  to: 'nextto',        color: '#74C0FC' },
  { from: 'preposition',  to: 'infrontof',     color: '#74C0FC' },
  { from: 'direction',    to: 'turnleft',      color: '#4ECDC4' },
  { from: 'direction',    to: 'turnright',     color: '#4ECDC4' },
  { from: 'direction',    to: 'gostraight',    color: '#4ECDC4' },
  { from: 'direction',    to: 'goback',        color: '#4ECDC4' },
  { from: 'evacuation',   to: 'earthquake',    color: '#C77DFF' },
  { from: 'evacuation',   to: 'flood',         color: '#C77DFF' },
  { from: 'evacuation',   to: 'tsunami',       color: '#C77DFF' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

const defCx = (d: NodeDef) => d.homeX + d.width / 2
const defCy = (d: NodeDef) => d.homeY + d.height / 2

// ─── Tooltip state ───────────────────────────────────────────────────────────

interface TooltipState { text: string; svgX: number; svgY: number }

// ─── Component ────────────────────────────────────────────────────────────────

export default function ConceptMap() {
  const svgRef     = useRef<SVGSVGElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const cardRef    = useRef<HTMLDivElement>(null)
  const rafRef     = useRef<number | null>(null)

  // Mouse position in SVG viewBox coordinates
  const mouseRef = useRef({ x: -9999, y: -9999 })

  // Tooltip
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)

  // Active floating card state
  const [activeNode, setActiveNode] = useState<{ id: string; label: string; sentence: string } | null>(null)

  // Sync ref for the animation loop to access the current activeNode
  const activeNodeRef = useRef(activeNode)
  useEffect(() => {
    activeNodeRef.current = activeNode
  }, [activeNode])

  // Physics loop control
  const physicsEnabled = useRef(false)

  // ── Physics state (mutable ref, initialized to y - 400 on mount) ─────────────────
  const physRef = useRef<Record<string, PhysicsState>>(
    Object.fromEntries(
      NODE_DEFS.map(d => [
        d.id,
        {
          x: d.homeX,
          y: d.homeY - 400, // Starts above home position
          vx: 0,
          vy: 0,
        },
      ])
    )
  )

  // ── DOM refs for direct mutation ──────────────────────────────────
  const groupRefs  = useRef<Record<string, SVGGElement | null>>({})
  const shadowRefs = useRef<Record<string, SVGRectElement | null>>({})
  const mainRefs   = useRef<Record<string, SVGRectElement | null>>({})
  const pathRefs   = useRef<Record<string, SVGPathElement | null>>({})

  // ── Convert client coords → SVG viewBox coords ───────────────────
  const toSVG = (clientX: number, clientY: number) => {
    const svg = svgRef.current
    if (!svg) return { x: -9999, y: -9999 }
    const rect = svg.getBoundingClientRect()
    const scaleX = SIM_W / rect.width
    const scaleY = SIM_H / rect.height
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top)  * scaleY,
    }
  }

  // ── Physics + DOM update loop ─────────────────────────────────────
  const tick = () => {
    if (!physicsEnabled.current) {
      rafRef.current = requestAnimationFrame(tick)
      return
    }

    const phys = physRef.current
    const mx   = mouseRef.current.x
    const my   = mouseRef.current.y

    // Build current absolute centres (for edge drawing)
    const centres: Record<string, { x: number; y: number }> = {}

    for (const def of NODE_DEFS) {
      const p = phys[def.id]

      // 1. Home spring
      const hcx = def.homeX + def.width  / 2
      const hcy = def.homeY + def.height / 2
      const pcx = p.x + def.width  / 2
      const pcy = p.y + def.height / 2

      let ax = (hcx - pcx) * HOME_STIFFNESS
      let ay = (hcy - pcy) * HOME_STIFFNESS

      // 2. Mouse repulsion (from node centre)
      const dx   = pcx - mx
      const dy   = pcy - my
      const dist = Math.sqrt(dx * dx + dy * dy)

      if (dist < REPULSION_RADIUS && dist > 0.1) {
        const force = REPULSION_STRENGTH / (dist * dist)
        ax += (dx / dist) * force
        ay += (dy / dist) * force
      }

      // 3. Integrate with damping
      p.vx = (p.vx + ax) * DAMPING
      p.vy = (p.vy + ay) * DAMPING
      p.x  += p.vx
      p.y  += p.vy

      // 4. Clamp displacement (keep within MAX_DISPLACEMENT of home)
      p.x = Math.max(def.homeX - MAX_DISPLACEMENT, Math.min(def.homeX + MAX_DISPLACEMENT, p.x))
      p.y = Math.max(def.homeY - MAX_DISPLACEMENT, Math.min(def.homeY + MAX_DISPLACEMENT, p.y))

      // Store absolute centre for edge drawing
      centres[def.id] = { x: p.x + def.width / 2, y: p.y + def.height / 2 }

      // 5. Move the DOM group via transform (no React re-render)
      const g = groupRefs.current[def.id]
      if (g) {
        const tx = p.x - def.homeX
        const ty = p.y - def.homeY
        g.setAttribute('transform', `translate(${tx.toFixed(2)},${ty.toFixed(2)})`)
      }
    }

    // 6. Update edge paths
    for (const edge of EDGES) {
      const key  = `${edge.from}-${edge.to}`
      const pathEl = pathRefs.current[key]
      if (!pathEl) continue
      const ac = centres[edge.from]
      const bc = centres[edge.to]
      if (!ac || !bc) continue
      const qx = (ac.x + bc.x) / 2
      const qy = (ac.y + bc.y) / 2 - 25
      pathEl.setAttribute('d', `M ${ac.x.toFixed(1)},${ac.y.toFixed(1)} Q ${qx.toFixed(1)},${qy.toFixed(1)} ${bc.x.toFixed(1)},${bc.y.toFixed(1)}`)
    }

    // 7. Update active card position dynamically above the node
    const currentActive = activeNodeRef.current
    if (currentActive) {
      const cardEl = cardRef.current
      const svg = svgRef.current
      if (cardEl && svg) {
        const rect = svg.getBoundingClientRect()
        const scaleX = rect.width / SIM_W
        const scaleY = rect.height / SIM_H

        const p = phys[currentActive.id]
        if (p) {
          const nodeDef = NODE_DEFS.find(d => d.id === currentActive.id)!
          const screenX = rect.left + (p.x + nodeDef.width / 2) * scaleX
          const screenY = rect.top + p.y * scaleY
          cardEl.style.left = `${screenX}px`
          cardEl.style.top = `${screenY - 12}px`
        }
      }
    }

    rafRef.current = requestAnimationFrame(tick)
  }

  // Preload voices and trigger list load on mount
  useEffect(() => {
    window.speechSynthesis.getVoices()
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.getVoices()
    }
  }, [])

  // Start loop on mount and handle physics delay
  useEffect(() => {
    rafRef.current = requestAnimationFrame(tick)

    const timer = setTimeout(() => {
      // Align physics state with home positions to transition seamlessly from CSS drop-in
      for (const def of NODE_DEFS) {
        physRef.current[def.id].y = def.homeY
      }
      physicsEnabled.current = true
    }, 1500)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      clearTimeout(timer)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Trigger re-render on window resize to update card position
  const [, setWindowWidth] = useState(0)
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Close active card on outside window scroll/resize to prevent detaching
  useEffect(() => {
    if (!activeNode) return
    const handleClose = () => setActiveNode(null)
    window.addEventListener('scroll', handleClose)
    window.addEventListener('resize', handleClose)
    return () => {
      window.removeEventListener('scroll', handleClose)
      window.removeEventListener('resize', handleClose)
    }
  }, [activeNode])

  // ── SVG mouse tracking ────────────────────────────────────────────
  const onSVGMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const pos = toSVG(e.clientX, e.clientY)
    mouseRef.current = pos
  }

  const onSVGMouseLeave = () => {
    mouseRef.current = { x: -9999, y: -9999 }
    setTooltip(null)
  }

  // ── Robust Speech Synthesis helper ───────────────────────────────
  const speak = (text: string) => {
    const raw = text.replace(/🔊|🌍|🌊/g, '').trim()
    // Cancel any ongoing speech first
    window.speechSynthesis.cancel()

    // Small delay needed for cancel to register
    setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(raw)
      utterance.lang = 'en-US'
      utterance.rate = 0.85      // slightly slower, clearer for kids
      utterance.pitch = 1.1      // slightly higher, friendlier
      utterance.volume = 1

      // Fallback: if voices not loaded yet, wait for them
      const voices = window.speechSynthesis.getVoices()
      if (voices.length > 0) {
        // Prefer a clear English voice
        const preferred = voices.find(v =>
          v.lang === 'en-US' && v.name.includes('Google')
        ) || voices.find(v =>
          v.lang === 'en-US'
        ) || voices[0]
        utterance.voice = preferred
      }

      window.speechSynthesis.speak(utterance)
    }, 100)
  }

  const handleClick = (def: NodeDef) => {
    if (!def.tooltip) return
    speak(def.label)

    setActiveNode({
      id: def.id,
      label: def.label,
      sentence: def.tooltip,
    })
  }

  // ── Hover tooltip ────────────────────────────────────────────────
  const handleNodeEnter = (def: NodeDef) => {
    if (!def.tooltip || activeNode) return // Don't show tooltip if card is active
    const p = physRef.current[def.id]
    setTooltip({
      text: def.tooltip,
      svgX: p.x + def.width  / 2,
      svgY: p.y,
    })
  }

  // Calculate initial card coordinates relative to the viewport (fixed position)
  const getCardCoords = () => {
    if (!activeNode || !svgRef.current) return null
    const rect = svgRef.current.getBoundingClientRect()
    const scaleX = rect.width / SIM_W
    const scaleY = rect.height / SIM_H

    const p = physRef.current[activeNode.id]
    if (!p) return null

    const nodeDef = NODE_DEFS.find(d => d.id === activeNode.id)!

    const screenX = rect.left + (p.x + nodeDef.width / 2) * scaleX
    const screenY = rect.top + p.y * scaleY

    return { x: screenX, y: screenY }
  }

  // ─── Render ───────────────────────────────────────────────────────

  // Convert SVG viewBox coords to CSS % for the tooltip overlay
  const tooltipLeft = tooltip ? `${(tooltip.svgX / SIM_W) * 100}%` : '0'
  const tooltipTop  = tooltip ? `${(tooltip.svgY / SIM_H) * 100}%` : '0'

  return (
    <div
      ref={wrapperRef}
      className="relative w-full select-none"
      style={{ cursor: 'default', paddingTop: '0px' }}
    >

      {/* ── Tooltip overlay ─────────────────────────────────────────── */}
      {tooltip && (
        <div
          className="pointer-events-none absolute z-50 -translate-x-1/2 -translate-y-full"
          style={{ left: tooltipLeft, top: tooltipTop }}
        >
          <div
            className="rounded px-3 py-2 text-xs font-bold text-white whitespace-nowrap"
            style={{ background: '#1A1A2E', boxShadow: '2px 2px 0 rgba(0,0,0,0.4)' }}
          >
            {tooltip.text}
          </div>
          <div
            className="mx-auto"
            style={{
              width: 0, height: 0,
              borderLeft: '5px solid transparent',
              borderRight: '5px solid transparent',
              borderTop: '6px solid #1A1A2E',
            }}
          />
        </div>
      )}

      {/* ── SVG ─────────────────────────────────────────────────────── */}
      <svg
        ref={svgRef}
        viewBox={`0 0 ${SIM_W} ${SIM_H}`}
        width="100%"
        height="auto"
        style={{ display: 'block', overflow: 'visible', cursor: 'default' }}
        onMouseMove={onSVGMouseMove}
        onMouseLeave={onSVGMouseLeave}
        onClick={() => setActiveNode(null)}
      >
        {/* ── Edges (drawn first, updated imperatively) ── */}
        {EDGES.map(edge => {
          const aDef = NODE_DEFS.find(d => d.id === edge.from)!
          const bDef = NODE_DEFS.find(d => d.id === edge.to)!
          const ax = defCx(aDef), ay = defCy(aDef)
          const bx = defCx(bDef), by = defCy(bDef)
          const qx = (ax + bx) / 2
          const qy = (ay + by) / 2 - 25
          const key = `${edge.from}-${edge.to}`
          return (
            <path
              key={key}
              ref={el => { pathRefs.current[key] = el }}
              d={`M ${ax},${ay} Q ${qx},${qy} ${bx},${by}`}
              stroke={edge.color}
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
              opacity="0.9"
            />
          )
        })}

        {/* ── Nodes (positioned at homeX,homeY; transform applied imperatively) ── */}
        {NODE_DEFS.map(def => {
          const lines = def.label.split('\n')
          const lineH = 15
          const totalTextH = lines.length * lineH
          const baseTY = def.homeY + def.height / 2 - totalTextH / 2 + lineH * 0.7

          const getAnimationDetails = (id: string) => {
            if (id === 'root') {
              return {
                name: 'rootPop',
                duration: '0.6s',
                delay: '300ms',
              }
            }
            if (['instructions', 'evacuation', 'preposition', 'direction'].includes(id)) {
              const delayMs = (id === 'instructions' || id === 'evacuation') ? '450ms' : '600ms'
              return {
                name: 'branchSlide',
                duration: '0.5s',
                delay: delayMs,
              }
            }
            // Leaf nodes
            const delayMs = ['nextto', 'infrontof', 'goback'].includes(id) ? '850ms' : '700ms'
            return {
              name: 'leafPop',
              duration: '0.4s',
              delay: delayMs,
            }
          }

          const anim = getAnimationDetails(def.id)
          const transformOriginX = def.homeX + def.width / 2
          const transformOriginY = def.homeY + def.height / 2

          return (
            <g
              key={def.id}
              ref={el => { groupRefs.current[def.id] = el }}
              style={{
                cursor: def.tooltip ? 'pointer' : 'default',
                animation: `${anim.name} ${anim.duration} cubic-bezier(0.34, 1.56, 0.64, 1) both`,
                animationDelay: anim.delay,
                transformOrigin: `${transformOriginX}px ${transformOriginY}px`,
              }}
              onMouseEnter={() => handleNodeEnter(def)}
              onMouseLeave={() => setTooltip(null)}
              onClick={(e) => {
                e.stopPropagation()
                handleClick(def)
              }}
            >
              {/* Drop shadow */}
              <rect
                ref={el => { shadowRefs.current[def.id] = el }}
                x={def.homeX + 3}
                y={def.homeY + 3}
                width={def.width}
                height={def.height}
                fill="#1A1A2E"
                rx="3"
                opacity="0.22"
              />
              {/* Main fill rect */}
              <rect
                ref={el => { mainRefs.current[def.id] = el }}
                x={def.homeX}
                y={def.homeY}
                width={def.width}
                height={def.height}
                fill={def.fill}
                stroke={def.borderColor}
                strokeWidth={def.id === 'root' ? 3.5 : 2.5}
                rx="3"
              />
              {/* Label */}
              {lines.map((line, i) => (
                <text
                  key={i}
                  x={def.homeX + def.width / 2}
                  y={baseTY + i * lineH}
                  textAnchor="middle"
                  dominantBaseline="auto"
                  fontSize={def.id === 'root' ? 12.5 : 11}
                  fontWeight={def.tooltip ? '700' : '900'}
                  fontFamily="Nunito, sans-serif"
                  fill={def.textColor}
                  style={{ pointerEvents: 'none' }}
                >
                  {line}
                </text>
              ))}
            </g>
          )
        })}
      </svg>

      {/* ── Floating Mini Card Overlay ── */}
      {activeNode && (() => {
        const coords = getCardCoords()
        const initialLeft = coords ? `${coords.x}px` : '0px'
        const initialTop = coords ? `${coords.y - 12}px` : '0px'
        const cleanLabel = activeNode.label.replace(/🔊|🌍|🌊/g, '').trim()
        return (
          <div
            ref={cardRef}
            style={{
              position: 'fixed',
              left: initialLeft,
              top: initialTop,
              transform: 'translate(-50%, -100%)',
              zIndex: 50,
              animation: 'cardPopIn 0.2s ease-out',
              boxShadow: '6px 6px 0px #1A1A2E',
              padding: '1rem 1.25rem',
              minWidth: '220px',
              maxWidth: '280px',
              backgroundColor: '#ffffff',
              borderWidth: '4px',
              borderColor: '#1A1A2E',
              borderStyle: 'solid',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-4">
              <span className="font-black text-[#1A1A2E] text-base flex items-center gap-1.5">
                🔊 {cleanLabel}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setActiveNode(null)
                }}
                className="text-gray-500 hover:text-black font-black text-sm p-1 leading-none"
              >
                ✕
              </button>
            </div>

            {/* Divider */}
            <hr className="border-[#1A1A2E] border-t-2 my-2" />

            {/* Sentence */}
            <p className="italic text-sm text-[#1A1A2E] my-3 leading-relaxed">
              "{activeNode.sentence}"
            </p>

            {/* Divider */}
            <hr className="border-[#1A1A2E] border-t-2 my-2" />

            {/* Pronounce Button */}
            <div className="mt-2 flex justify-end">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  speak(activeNode.label)
                }}
                className="bg-[#FF6B6B] text-white font-bold border-2 border-black px-3 py-1 shadow-[2px_2px_0px_#1A1A2E] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#1A1A2E] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all text-xs"
              >
                ▶ Pronounce
              </button>
            </div>
          </div>
        )
      })()}

      {/* ── Legend ──────────────────────────────────────────────────── */}
      <div className="mt-3 flex flex-wrap items-center justify-center gap-4 text-xs font-bold text-[#1A1A2E]">
        {[
          { color: '#74C0FC', label: 'Preposition' },
          { color: '#4ECDC4', label: 'Direction' },
          { color: '#C77DFF', label: 'Evacuation' },
          { color: '#FF9A3C', label: 'Instructions' },
        ].map(({ color, label }) => (
          <span key={label} className="flex items-center gap-1.5">
            <span
              className="inline-block h-3 w-3 border-2 border-[#1A1A2E] rounded-sm"
              style={{ background: color }}
            />
            {label}
          </span>
        ))}
        <span className="ml-3 text-[#1A1A2E]/40">
          🖱️ Hover to repel nodes · 🔊 Click leaves to view &amp; pronounce
        </span>
      </div>
    </div>
  )
}
