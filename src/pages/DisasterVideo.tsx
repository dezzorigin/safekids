import { useState, useEffect } from 'react'

export default function DisasterVideo() {
  const [expandedVideo, setExpandedVideo] = useState<null | {
    embedUrl: string
    title: string
    tagColor: string
    tag: string
  }>(null)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setExpandedVideo(null)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return (
    <div className="min-h-full bg-[#FFFEF7] w-full flex flex-col px-0">
      {/* ── Video 1 Card ───────────────────────────────────────────── */}
      <div
        className="bg-white border-4 border-[#1A1A2E] flex flex-col overflow-hidden w-full"
        style={{ boxShadow: '6px 6px 0px #1A1A2E' }}
      >
        {/* Compact Header strip */}
        <div className="bg-[#FF6B6B]/20 px-5 py-4 border-b-4 border-[#1A1A2E] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="bg-[#FF6B6B] text-white font-black text-xs px-3 py-1 border-2 border-[#1A1A2E] inline-block select-none">
              TSUNAMI · BANDA ACEH · 2004
            </span>
            <h2 className="font-black text-xl text-[#1A1A2E]">
              Kepanikan Tsunami Aceh 2004
            </h2>
          </div>
          <span className="bg-white border-2 border-[#1A1A2E] text-[#1A1A2E] font-black text-xs px-2.5 py-1 select-none whitespace-nowrap">
            1 menit
          </span>
        </div>

        {/* Click wrapper */}
        <div 
          onClick={() => setExpandedVideo({
            embedUrl: 'https://www.youtube.com/embed/cW3GVNRfDiI?start=490&end=550&rel=0&modestbranding=1',
            title: 'Kepanikan Tsunami Aceh 2004',
            tagColor: '#FF6B6B',
            tag: 'TSUNAMI · BANDA ACEH · 2004'
          })}
          style={{ cursor: 'zoom-in', position: 'relative' }}
        >
          {/* Embed container */}
          <div
            className="relative w-full overflow-hidden"
            style={{ paddingTop: '56.25%' }}
          >
            <iframe
              src="https://www.youtube.com/embed/cW3GVNRfDiI?start=490&end=550&autoplay=0&rel=0&modestbranding=1"
              title="Kepanikan Tsunami Aceh 2004"
              className="absolute top-0 left-0 w-full h-full"
              style={{ border: 'none' }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          
          {/* Hover overlay hint */}
          <div style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0)',
            display: 'flex', alignItems: 'center', 
            justifyContent: 'center',
            transition: 'background 0.2s',
            pointerEvents: 'none',
          }}
          className="video-hover-overlay"
          >
            <div style={{
              background: '#FFE135',
              border: '3px solid #1A1A2E',
              boxShadow: '3px 3px 0 #1A1A2E',
              padding: '8px 20px',
              fontWeight: 900, fontSize: '14px',
              opacity: 0,
              transition: 'opacity 0.2s',
            }}
            className="video-expand-hint"
            >
              🔍 Klik untuk perbesar
            </div>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: '6px', background: '#1A1A2E', margin: '0' }} />

      {/* ── Video 2 Card ───────────────────────────────────────────── */}
      <div
        className="bg-white border-4 border-[#1A1A2E] flex flex-col overflow-hidden w-full"
        style={{ boxShadow: '6px 6px 0px #1A1A2E' }}
      >
        {/* Compact Header strip */}
        <div className="bg-[#4ECDC4]/20 px-5 py-4 border-b-4 border-[#1A1A2E] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="bg-[#4ECDC4] text-[#1A1A2E] font-black text-xs px-3 py-1 border-2 border-[#1A1A2E] inline-block select-none">
              EVACUATION DRILL · JAPAN
            </span>
            <h2 className="font-black text-xl text-[#1A1A2E]">
              Evakuasi Terstruktur — Latihan Bencana Jepang
            </h2>
          </div>
          <span className="bg-white border-2 border-[#1A1A2E] text-[#1A1A2E] font-black text-xs px-2.5 py-1 select-none whitespace-nowrap">
            4 menit
          </span>
        </div>

        {/* Click wrapper */}
        <div 
          onClick={() => setExpandedVideo({
            embedUrl: 'https://www.youtube.com/embed/uzyqEcDJRc4?start=62&end=330&rel=0&modestbranding=1',
            title: 'Evakuasi Terstruktur — Latihan Bencana Jepang',
            tagColor: '#4ECDC4',
            tag: 'EVACUATION DRILL · JAPAN'
          })}
          style={{ cursor: 'zoom-in', position: 'relative' }}
        >
          {/* Embed container */}
          <div
            className="relative w-full overflow-hidden"
            style={{ paddingTop: '56.25%' }}
          >
            <iframe
              src="https://www.youtube.com/embed/uzyqEcDJRc4?start=62&end=330&autoplay=0&rel=0&modestbranding=1"
              title="Evakuasi Terstruktur — Latihan Bencana Jepang"
              className="absolute top-0 left-0 w-full h-full"
              style={{ border: 'none' }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          
          {/* Hover overlay hint */}
          <div style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0)',
            display: 'flex', alignItems: 'center', 
            justifyContent: 'center',
            transition: 'background 0.2s',
            pointerEvents: 'none',
          }}
          className="video-hover-overlay"
          >
            <div style={{
              background: '#FFE135',
              border: '3px solid #1A1A2E',
              boxShadow: '3px 3px 0 #1A1A2E',
              padding: '8px 20px',
              fontWeight: 900, fontSize: '14px',
              opacity: 0,
              transition: 'opacity 0.2s',
            }}
            className="video-expand-hint"
            >
              🔍 Klik untuk perbesar
            </div>
          </div>
        </div>
      </div>

      {/* ── Expanded Video Overlay ─────────────────────────────────── */}
      {expandedVideo && (
        <div 
          onClick={() => setExpandedVideo(null)}
          style={{
            position: 'fixed',
            top: 0, left: 0,
            width: '100vw', height: '100vh',
            background: 'rgba(0,0,0,0.92)',
            zIndex: 500,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'fadeIn 0.25s ease-out',
            cursor: 'zoom-out',
          }}
        >
          {/* Header bar */}
          <div style={{
            width: '90vw', maxWidth: '1200px',
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', marginBottom: '12px'
          }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{
              background: expandedVideo.tagColor,
              border: '2px solid white',
              padding: '4px 12px',
              fontWeight: 900, fontSize: '12px',
              color: '#1A1A2E'
            }}>
              {expandedVideo.tag}
            </div>
            <span style={{
              fontWeight: 900, color: 'white', fontSize: '16px'
            }}>
              {expandedVideo.title}
            </span>
            <button
              onClick={() => setExpandedVideo(null)}
              style={{
                background: '#FF6B6B',
                border: '3px solid white',
                color: 'white',
                fontWeight: 900,
                padding: '6px 14px',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              ✕ Tutup
            </button>
          </div>

          {/* Video iframe - large */}
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '90vw', maxWidth: '1200px',
              aspectRatio: '16/9',
              border: '4px solid white',
              boxShadow: '8px 8px 0px #FF6B6B',
            }}
          >
            <iframe
              src={expandedVideo.embedUrl + '&autoplay=1'}
              width="100%" height="100%"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{ display: 'block' }}
            />
          </div>

          {/* Hint */}
          <p style={{
            color: 'rgba(255,255,255,0.3)',
            fontSize: '12px', marginTop: '16px',
            letterSpacing: '0.1em'
          }}>
            Klik di luar video atau tekan ESC untuk kembali
          </p>
        </div>
      )}
    </div>
  )
}
