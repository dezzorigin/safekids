export default function TutorialIceBreak() {
  return (
    <div className="min-h-full bg-[#FFFEF7] w-full p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
        {/* === CARD 1 (LEFT) === */}
        <div
          className="bg-white border-4 border-[#1A1A2E] flex flex-col overflow-hidden"
          style={{ boxShadow: '6px 6px 0px #1A1A2E' }}
        >
          {/* Header strip */}
          <div className="bg-[#74C0FC] px-5 py-4 border-b-4 border-[#1A1A2E]">
            <span className="bg-[#1A1A2E] text-[#FFE135] font-black text-xs px-3 py-1 border-2 border-[#1A1A2E] inline-block mb-2 select-none">
              TUTORIAL · 3D SIMULATOR
            </span>
            <h2 className="font-black text-xl text-[#1A1A2E]">
              Tutorial Evacuation 3D
            </h2>
          </div>

          {/* Locked Hover wrapper */}
          <div style={{ position: 'relative' }}>
            {/* Video embed placeholder (16:9 ratio) */}
            <div
              className="relative w-full overflow-hidden bg-[#1A1A2E]"
              style={{ paddingTop: '56.25%', borderBottom: '4px solid #1A1A2E' }}
            >
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                <span className="text-5xl mb-3 select-none">🎬</span>
                <h3 className="font-black text-white text-xl">Video Tutorial</h3>
                <p className="text-sm text-white/50 mt-2 font-bold">
                  Coming soon — akan diisi video motion graphic
                </p>
              </div>
            </div>

            {/* Hover overlay lock hint */}
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
                background: '#FF6B6B',
                color: 'white',
                border: '3px solid #1A1A2E',
                boxShadow: '3px 3px 0 #1A1A2E',
                padding: '8px 20px',
                fontWeight: 900, fontSize: '14px',
                opacity: 0,
                transition: 'opacity 0.2s',
              }}
              className="video-expand-hint"
              >
                🔒 Video belum tersedia
              </div>
            </div>
          </div>
        </div>

        {/* === CARD 2 (RIGHT) === */}
        <div
          className="bg-white border-4 border-[#1A1A2E] flex flex-col overflow-hidden"
          style={{ boxShadow: '6px 6px 0px #1A1A2E' }}
        >
          {/* Header strip */}
          <div className="bg-[#FF9A3C] px-5 py-4 border-b-4 border-[#1A1A2E]">
            <span className="bg-[#1A1A2E] text-[#FFE135] font-black text-xs px-3 py-1 border-2 border-[#1A1A2E] inline-block mb-2 select-none">
              ICE BREAKING · MV LAGU
            </span>
            <h2 className="font-black text-xl text-[#1A1A2E]">
              JAK PLUENG! (Aman Bersama)
            </h2>
          </div>

          {/* Locked Hover wrapper */}
          <div style={{ position: 'relative' }}>
            {/* Video embed placeholder (16:9 ratio) */}
            <div
              className="relative w-full overflow-hidden bg-[#1A1A2E]"
              style={{ paddingTop: '56.25%', borderBottom: '4px solid #1A1A2E' }}
            >
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                <span className="text-5xl mb-3 select-none">🎵</span>
                <h3 className="font-black text-white text-xl">Music Video</h3>
                <p className="text-sm text-white/50 mt-2 font-bold">
                  Coming soon — akan diisi MV dengan lirik lagu
                </p>
              </div>
            </div>

            {/* Hover overlay lock hint */}
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
                background: '#FF6B6B',
                color: 'white',
                border: '3px solid #1A1A2E',
                boxShadow: '3px 3px 0 #1A1A2E',
                padding: '8px 20px',
                fontWeight: 900, fontSize: '14px',
                opacity: 0,
                transition: 'opacity 0.2s',
              }}
              className="video-expand-hint"
              >
                🔒 Video belum tersedia
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
