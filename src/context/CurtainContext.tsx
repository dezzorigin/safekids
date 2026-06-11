import { createContext, useContext, useState, useCallback } from 'react'

type CurtainPhase = 'idle' | 'closed' | 'opening' | 'open' | 'closing' | 'closed-nav'

type CurtainContextType = {
  triggerCurtain: (onMidpoint: () => void) => void
  triggerInitialOpen: () => void
}

const CurtainContext = createContext<CurtainContextType>({
  triggerCurtain: () => {},
  triggerInitialOpen: () => {}
})

export function CurtainProvider({ children }: { children: React.ReactNode }) {
  const [phase, setPhase] = useState<CurtainPhase>('idle')

  const triggerInitialOpen = useCallback(() => {
    setPhase('closed')
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setPhase('opening')
        setTimeout(() => setPhase('open'), 950)
      })
    })
  }, [])

  const triggerCurtain = useCallback((onMidpoint: () => void) => {
    // Step 1: Close
    setPhase('closing')
    
    // Step 2: Wait for close animation (700ms) + buffer (100ms)
    const closedTimer = setTimeout(() => {
      setPhase('closed')  // instant, no transition
      
      // Step 3: Wait 1 frame for 'closed' to render, THEN navigate
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          onMidpoint()  // navigate() called here, behind closed curtain
          
          // Step 4: Open on new page after brief pause
          setTimeout(() => {
            setPhase('opening')
            
            // Step 5: Cleanup
            setTimeout(() => {
              setPhase('idle')
            }, 1000)
          }, 150)  // small pause so new page renders first
        })
      })
    }, 800)  // 700ms animation + 100ms buffer
    
    return () => clearTimeout(closedTimer)
  }, [])

  const isVisible = phase !== 'idle'

  return (
    <CurtainContext.Provider value={{ triggerCurtain, triggerInitialOpen }}>
      {children}
      
      {isVisible && (
        <>
          {/* Curtain rod */}
          <div style={{
            position: 'fixed', top: 0, left: 0,
            width: '100%', height: '18px',
            background: '#1A1A2E', zIndex: 9999,
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', padding: '0 2%',
            pointerEvents: 'none'
          }}>
            {Array.from({ length: 16 }).map((_, i) => (
              <div key={i} style={{
                width: '14px', height: '14px',
                borderRadius: '50%',
                background: '#FFE135',
                border: '2px solid #1A1A2E'
              }} />
            ))}
          </div>

          {/* Left curtain */}
          <div style={{
            position: 'fixed', top: 0, left: 0,
            width: '50%', height: '100%',
            zIndex: 9998,
            transformOrigin: 'left center',
            transform: (phase === 'opening' || phase === 'open') ? 'scaleX(0)' : 'scaleX(1)',
            transition: phase === 'opening'
              ? 'transform 0.9s cubic-bezier(0.76,0,0.24,1)'
              : phase === 'closing'
              ? 'transform 0.7s cubic-bezier(0.76,0,0.24,1)'
              : 'none',
            background: `repeating-linear-gradient(
              180deg,
              #FFE135 0px, #FFE135 60px,
              #1A1A2E 60px, #1A1A2E 64px,
              #FF6B6B 64px, #FF6B6B 124px,
              #1A1A2E 124px, #1A1A2E 128px,
              #4ECDC4 128px, #4ECDC4 188px,
              #1A1A2E 188px, #1A1A2E 192px,
              #74C0FC 192px, #74C0FC 252px,
              #1A1A2E 252px, #1A1A2E 256px,
              #C77DFF 256px, #C77DFF 316px
            )`,
            pointerEvents: 'none'
          }}>
            {[20, 40, 60, 80].map(pct => (
              <div key={pct} style={{
                position: 'absolute', top: 0,
                left: `${pct}%`, width: '2px', height: '100%',
                background: 'rgba(0,0,0,0.12)'
              }} />
            ))}
          </div>

          {/* Right curtain - mirror */}
          <div style={{
            position: 'fixed', top: 0, right: 0,
            width: '50%', height: '100%',
            zIndex: 9998,
            transformOrigin: 'right center',
            transform: (phase === 'opening' || phase === 'open') ? 'scaleX(0)' : 'scaleX(1)',
            transition: phase === 'opening'
              ? 'transform 0.9s cubic-bezier(0.76,0,0.24,1)'
              : phase === 'closing'
              ? 'transform 0.7s cubic-bezier(0.76,0,0.24,1)'
              : 'none',
            background: `repeating-linear-gradient(
              180deg,
              #FFE135 0px, #FFE135 60px,
              #1A1A2E 60px, #1A1A2E 64px,
              #FF6B6B 64px, #FF6B6B 124px,
              #1A1A2E 124px, #1A1A2E 128px,
              #4ECDC4 128px, #4ECDC4 188px,
              #1A1A2E 188px, #1A1A2E 192px,
              #74C0FC 192px, #74C0FC 252px,
              #1A1A2E 252px, #1A1A2E 256px,
              #C77DFF 256px, #C77DFF 316px
            )`,
            pointerEvents: 'none'
          }}>
            {[20, 40, 60, 80].map(pct => (
              <div key={pct} style={{
                position: 'absolute', top: 0,
                left: `${pct}%`, width: '2px', height: '100%',
                background: 'rgba(0,0,0,0.12)'
              }} />
            ))}
          </div>
        </>
      )}
    </CurtainContext.Provider>
  )
}

export const useCurtain = () => useContext(CurtainContext)
