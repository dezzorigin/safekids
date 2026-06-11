import ConceptMap from '@/components/ui/ConceptMap'

// ─── Vocabulary data ──────────────────────────────────────────────────────────

const VOCAB_PILLS = [
  { word: 'beside',       color: 'bg-[#74C0FC]' },
  { word: 'between',      color: 'bg-[#74C0FC]' },
  { word: 'behind',       color: 'bg-[#74C0FC]' },
  { word: 'in front of',  color: 'bg-[#74C0FC]' },
  { word: 'next to',      color: 'bg-[#74C0FC]' },
  { word: 'turn left',    color: 'bg-[#A9E34B]' },
  { word: 'turn right',   color: 'bg-[#A9E34B]' },
  { word: 'go straight',  color: 'bg-[#A9E34B]' },
  { word: 'go back',      color: 'bg-[#A9E34B]' },
  { word: 'EarthQuake',   color: 'bg-[#FF6B6B]' },
  { word: 'Flood',        color: 'bg-[#FF6B6B]' },
  { word: 'Tsunami',      color: 'bg-[#FF6B6B]' },
]

// ─── MissionBriefing ──────────────────────────────────────────────────────────

export default function MissionBriefing() {
  return (
    <div
      className="min-h-screen font-sans"
      style={{
        minHeight: 'fit-content',
        background: '#FFFEF7',
        backgroundImage: 'radial-gradient(circle, rgba(26,26,46,0.06) 1px, transparent 1px)',
        backgroundSize: '28px 28px',
      }}
    >

      {/* ── Header bar ────────────────────────────────────────────── */}
      <header
        className="border-b-4 border-[#1A1A2E] px-8 py-6"
        style={{
          background: 'linear-gradient(90deg, #FFE135 0%, #FFD700 40%, #FFE135 60%, #FFF176 80%, #FFE135 100%)',
          backgroundSize: '200% 100%',
          animation: 'headerShimmer 3s ease-in-out infinite',
        }}
      >
        <h1 className="text-3xl font-black text-[#1A1A2E] leading-tight">
          🗺️ Peta Konsep &amp; Tujuan Pembelajaran
        </h1>
        <p className="mt-1 text-sm font-bold text-[#1A1A2E]/60 uppercase tracking-widest">
          Giving &amp; Following Instructions · Konteks Bencana Alam
        </p>
      </header>

      {/* ── Concept Map ────────────────────────────────────────────── */}
      <section className="px-8 pb-4">
        <style>{`
          @keyframes floatBadge1 {
            0%   { transform: rotate(-3deg) translateY(0px); }
            100% { transform: rotate(-3deg) translateY(-6px); }
          }
          @keyframes floatBadge2 {
            0%   { transform: rotate(2deg) translateY(0px); }
            100% { transform: rotate(2deg) translateY(-6px); }
          }
          @keyframes floatBadge3 {
            0%   { transform: rotate(-1deg) translateY(0px); }
            100% { transform: rotate(-1deg) translateY(-6px); }
          }
          @keyframes headerShimmer {
            0%   { background-position: 200% center; }
            100% { background-position: -200% center; }
          }
        `}</style>

        <div className="relative overflow-visible w-full" style={{ position: 'relative', overflow: 'visible' }}>
          {/* Badge 3 — bottom right */}
          <div
            className="absolute bg-[#4ECDC4] border-2 border-[#1A1A2E] font-black text-xs px-3 py-1.5 z-10 select-none"
            style={{
              bottom: '2%',
              right: '3%',
              boxShadow: '2px 2px 0px #1A1A2E',
              animation: 'floatBadge3 3s ease-in-out 0.5s infinite alternate',
            }}
          >
            ↓ Scroll untuk tujuan pembelajaran
          </div>

          {/* ConceptMap centered with minimal top padding */}
          <div
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'flex-start',
              padding: '1rem 0 0 0',
            }}
          >
            <ConceptMap />
          </div>
        </div>
        
        {/* Subtle scroll hint */}
        <div className="text-xs text-gray-400 text-center py-2 animate-bounce mt-4">
          ↓ Scroll untuk Tujuan Pembelajaran &amp; Kosakata
        </div>
      </section>

      {/* ── Tujuan Pembelajaran ────────────────────────────────────── */}
      <section className="mx-8 my-6">
        
        {/* Header */}
        <div
          className="bg-[#FFE135] border-4 border-[#1A1A2E] px-6 py-4 mb-0"
          style={{ boxShadow: '6px 6px 0 #1A1A2E' }}
        >
          <span className="font-black text-2xl text-[#1A1A2E]">🎯 Tujuan Pembelajaran</span>
          <p className="text-sm font-bold opacity-70 mt-1 text-[#1A1A2E]">
            Setelah pembelajaran ini, peserta didik mampu:
          </p>
        </div>
        
        {/* Two goal cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
          
          {/* Card 1 */}
          <div
            className="bg-white border-4 border-[#1A1A2E] border-t-0 p-6 relative overflow-hidden"
            style={{ boxShadow: '4px 4px 0 #1A1A2E' }}
          >
            {/* Big watermark number */}
            <div className="absolute top-2 right-4 font-black text-8xl text-[#FF6B6B] opacity-10 select-none leading-none">
              01
            </div>
            
            <div className="text-4xl mb-3">🗣️</div>
            <h3 className="font-black text-lg mb-2 text-[#1A1A2E]">Mengidentifikasi &amp; Mengucapkan</h3>
            <p className="text-sm leading-relaxed text-gray-700">
              Kata kerja perintah dasar <em>(imperative verbs)</em> dalam konteks mitigasi bencana.
            </p>
            <div className="mt-4">
              <span
                className="bg-[#74C0FC] border-2 border-[#1A1A2E] text-xs font-black px-3 py-1 inline-block text-[#1A1A2E]"
                style={{ boxShadow: '2px 2px 0 #1A1A2E' }}
              >
                SPEAKING &amp; VOCABULARY
              </span>
            </div>
          </div>
          
          {/* Card 2 */}
          <div
            className="bg-white border-4 border-[#1A1A2E] border-t-0 md:border-l-0 p-6 relative overflow-hidden"
            style={{ boxShadow: '4px 4px 0 #1A1A2E' }}
          >
            <div className="absolute top-2 right-4 font-black text-8xl text-[#4ECDC4] opacity-10 select-none leading-none">
              02
            </div>
            
            <div className="text-4xl mb-3">🎮</div>
            <h3 className="font-black text-lg mb-2 text-[#1A1A2E]">Merespons &amp; Memperagakan</h3>
            <p className="text-sm leading-relaxed text-gray-700">
              Frasa instruksi keselamatan bencana secara tepat melalui simulasi interaktif pada media pembelajaran digital.
            </p>
            <div className="mt-4">
              <span
                className="bg-[#4ECDC4] border-2 border-[#1A1A2E] text-xs font-black px-3 py-1 inline-block text-[#1A1A2E]"
                style={{ boxShadow: '2px 2px 0 #1A1A2E' }}
              >
                LISTENING &amp; SIMULATION
              </span>
            </div>
          </div>
        </div>
        
        {/* Context strip */}
        <div className="bg-[#1A1A2E] text-white px-6 py-3 border-4 border-[#1A1A2E] border-t-0 flex gap-8 justify-center items-center">
          <span className="font-bold text-sm">🌊 Tsunami Aceh</span>
          <span className="opacity-30">|</span>
          <span className="font-bold text-sm">🌍 Gempa Bumi</span>
          <span className="opacity-30">|</span>
          <span className="font-bold text-sm">🌧️ Banjir</span>
        </div>

      </section>

      {/* ── Vocabulary Pills ───────────────────────────────────────── */}
      <section className="mx-8 mb-10">
        <div className="border-4 border-[#1A1A2E] bg-white p-6"
             style={{ boxShadow: '4px 4px 0px #1A1A2E' }}>
          <h3 className="text-base font-black text-[#1A1A2E] mb-4 uppercase tracking-wider">
            📖 Kosakata Kunci
          </h3>
          <div className="flex flex-wrap gap-2">
            {VOCAB_PILLS.map(({ word, color }) => (
              <span
                key={word}
                className={`${color} border-2 border-[#1A1A2E] px-3 py-1 text-xs font-black text-[#1A1A2E]`}
                style={{ boxShadow: '2px 2px 0px #1A1A2E' }}
              >
                {word}
              </span>
            ))}
          </div>
        </div>
      </section>

    </div>
  )
}
