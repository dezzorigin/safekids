import React, { useState, useEffect, useRef } from 'react'

const TEAM_MEMBERS = [
  {
    name: 'Nanda Blauliadka',
    role: 'Lead Developer & Architect',
    avatar: '👨‍💻',
    bgGradient: 'linear-gradient(135deg, #1A1A2E 0%, #2d1b69 100%)',
    description: 'Arsitek utama yang merancang sistem portal microteaching.',
  },
  {
    name: 'Sarah Amalia',
    role: 'Instructional Designer',
    avatar: '👩‍🏫',
    bgGradient: 'linear-gradient(135deg, #FF6B6B 0%, #c0392b 100%)',
    description: 'Penyusun kurikulum dan materi bahasa Inggris mitigasi bencana.',
  },
  {
    name: 'Rizky Pratama',
    role: 'UI/UX & 3D Artist',
    avatar: '🎨',
    bgGradient: 'linear-gradient(135deg, #4ECDC4 0%, #087f5b 100%)',
    description: 'Merancang antarmuka interaktif dan pemodelan 3D simulator.',
  }
]

export default function MastermindsCarousel() {
  const [activeIndex, setActiveIndex] = useState(1)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [dragOffset, setDragOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const dragStartRef = useRef<{ x: number; time: number } | null>(null)

  const EXTENDED_CARDS = [
    { ...TEAM_MEMBERS[2], originalIndex: 2, key: 'clone-last' },
    ...TEAM_MEMBERS.map((m, i) => ({ ...m, originalIndex: i, key: `real-${i}` })),
    { ...TEAM_MEMBERS[0], originalIndex: 0, key: 'clone-first' }
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
      const timer = setTimeout(() => {
        setIsTransitioning(false)
        if (activeIndex === EXTENDED_CARDS.length - 1) {
          setActiveIndex(1)
        } else if (activeIndex === 0) {
          setActiveIndex(EXTENDED_CARDS.length - 2)
        }
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [activeIndex, isTransitioning])

  const startDrag = (clientX: number) => {
    if (isTransitioning) return
    setIsDragging(true)
    dragStartRef.current = { x: clientX, time: Date.now() }
  }

  const moveDrag = (clientX: number) => {
    if (!isDragging || !dragStartRef.current) return
    const diff = clientX - dragStartRef.current.x
    setDragOffset(diff)
  }

  const endDrag = () => {
    if (!isDragging || !dragStartRef.current) return
    setIsDragging(false)
    const diff = dragOffset
    const timeDiff = Date.now() - dragStartRef.current.time
    const velocity = Math.abs(diff / timeDiff)

    setDragOffset(0)
    dragStartRef.current = null

    if (diff < -80 || (diff < -20 && velocity > 0.3)) {
      handleNext()
    } else if (diff > 80 || (diff > 20 && velocity > 0.3)) {
      handlePrev()
    } else {
      setIsTransitioning(true)
    }
  }

  const handleTouchStart = (e: React.TouchEvent) => startDrag(e.touches[0].clientX)
  const handleTouchMove = (e: React.TouchEvent) => moveDrag(e.touches[0].clientX)
  const handleTouchEnd = () => endDrag()

  const handleMouseDown = (e: React.MouseEvent) => startDrag(e.clientX)
  const handleMouseMove = (e: React.MouseEvent) => moveDrag(e.clientX)
  const handleMouseUp = () => endDrag()
  const handleMouseLeave = () => { if (isDragging) endDrag() }

  return (
    <div className="w-full relative overflow-hidden py-12 bg-transparent select-none">
      <div className="text-center mb-10">
        <h2 className="text-4xl font-black text-brutal-black">🧠 The Masterminds</h2>
        <p className="mt-2 text-sm font-bold tracking-widest uppercase text-brutal-black/50">
          Tim di Balik Layar JAK PLUENG!
        </p>
      </div>

      <div 
        className="w-full flex justify-center items-center relative h-[450px]"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        {EXTENDED_CARDS.map((card, index) => {
          const offset = index - activeIndex
          const absOffset = Math.abs(offset)

          let scale = 1.05
          let blur = 0
          let brightness = 1
          let zIndex = 10

          if (absOffset === 1) {
            scale = 0.82
            blur = 1
            brightness = 0.6
            zIndex = 5
          } else if (absOffset >= 2) {
            scale = 0.65
            blur = 2
            brightness = 0.4
            zIndex = 1
          }

          return (
            <div
              key={card.key + index}
              onClick={() => {
                if (offset !== 0 && !isTransitioning && !isDragging) {
                  if (offset > 0) handleNext()
                  else handlePrev()
                }
              }}
              style={{
                width: '320px',
                height: '400px',
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: `translate(-50%, -50%) translateX(calc(${offset * 110}% + ${dragOffset}px)) scale(${scale})`,
                filter: `blur(${blur}px) brightness(${brightness})`,
                background: card.bgGradient,
                border: offset === 0 ? '4px solid #FFE135' : '4px solid rgba(255,255,255,0.2)',
                boxShadow: offset === 0 ? '8px 8px 0px #1A1A2E' : 'none',
                transition: isDragging ? 'none' : (isTransitioning ? 'all 0.5s cubic-bezier(0.23, 1, 0.32, 1)' : 'none'),
                zIndex: zIndex,
              }}
              className={`rounded-xl flex flex-col items-center justify-between overflow-hidden p-6 text-center ${
                offset === 0 ? 'cursor-default' : 'cursor-pointer'
              }`}
            >
              <div className="w-24 h-24 rounded-full border-4 border-white bg-white/20 flex items-center justify-center text-5xl mb-4 shadow-brutal-sm">
                {card.avatar}
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-black text-white">{card.name}</h3>
                <p className="text-sm font-bold text-[#FFE135] uppercase tracking-wider mt-1">{card.role}</p>
                <p className="text-sm text-white/80 mt-4 leading-relaxed">{card.description}</p>
              </div>
              <button className="mt-4 w-full bg-white text-brutal-black border-2 border-brutal-black font-black py-3 hover:-translate-y-1 hover:shadow-brutal active:translate-y-0 active:shadow-none transition-all">
                LIHAT DETAIL
              </button>
            </div>
          )
        })}
      </div>

      <div className="flex justify-center gap-2 mt-6">
        {[0, 1, 2].map((idx) => {
          const currentOriginalIndex = EXTENDED_CARDS[activeIndex].originalIndex
          return (
            <button
              key={idx}
              onClick={() => {
                if (!isTransitioning && idx !== currentOriginalIndex) {
                  setIsTransitioning(true)
                  // mapping from original index back to array index (1, 2, 3)
                  setActiveIndex(idx + 1)
                }
              }}
              className={`transition-all duration-300 ${
                idx === currentOriginalIndex
                  ? 'bg-brutal-black w-8 h-3 rounded-full'
                  : 'bg-brutal-black/20 w-3 h-3 rounded-full hover:bg-brutal-black/40'
              }`}
            />
          )
        })}
      </div>
    </div>
  )
}
