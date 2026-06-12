import { useNavigate } from 'react-router-dom'
import { useCurtain } from '@/context/CurtainContext'
import ConceptMap from '@/components/ui/ConceptMap'

// ─── Data ─────────────────────────────────────────────────────────────────────


const LEARNING_STEPS = [
  { icon: '🗺️', label: 'Peta Konsep',       desc: 'Guru menjelaskan materi & tujuan' },
  { icon: '🎡', label: 'Spin Wheel',         desc: 'Pembagian kelompok secara acak' },
  { icon: '🎬', label: 'Evacuation Video',   desc: 'Nonton video Tsunami Aceh vs Jepang' },
  { icon: '🎵', label: 'Tutorial & Ice Break', desc: 'Video AR + ice breaking song' },
  { icon: '🚨', label: 'Evacuation 3D',      desc: 'Game simulasi rute evakuasi' },
  { icon: '🎮', label: 'Quiz + Refleksi',    desc: 'Evaluasi & word cloud kelas' },
]

// ─── WelcomePage ──────────────────────────────────────────────────────────────

export default function WelcomePage() {
  const navigate = useNavigate()
  const { triggerCurtain } = useCurtain()

  return (
    <div className="min-h-screen font-sans bg-brutal-white">

      {/* ══════════════════════════════════════════════════════════
          SECTION 1 · HERO
      ══════════════════════════════════════════════════════════ */}
      <section
        className="relative flex min-h-[90vh] flex-col items-center justify-center px-6 py-20 text-center overflow-hidden"
        style={{
          background: `repeating-linear-gradient(
            45deg,
            #FFE135,
            #FFE135 4px,
            #FFFEF7 4px,
            #FFFEF7 20px
          )`,
        }}
      >
        {/* Decorative corner stamps */}
        <div className="absolute top-6 left-6 h-16 w-16 border-4 border-brutal-black bg-brutal-coral shadow-brutal rotate-6 flex items-center justify-center text-2xl select-none">
          🌊
        </div>
        <div className="absolute top-6 right-6 h-16 w-16 border-4 border-brutal-black bg-brutal-mint shadow-brutal -rotate-6 flex items-center justify-center text-2xl select-none">
          📚
        </div>
        <div className="absolute bottom-8 left-10 h-12 w-12 border-4 border-brutal-black bg-brutal-lavender shadow-brutal rotate-12 flex items-center justify-center text-xl select-none">
          🏫
        </div>
        <div className="absolute bottom-8 right-10 h-12 w-12 border-4 border-brutal-black bg-brutal-orange shadow-brutal -rotate-12 flex items-center justify-center text-xl select-none">
          🎓
        </div>

        {/* Hero content */}
        <div className="relative z-10 max-w-3xl">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-none border-2 border-brutal-black bg-brutal-black px-4 py-1.5 shadow-brutal-sm">
            <span className="text-xs font-black uppercase tracking-widest text-brutal-yellow">
              LIDM 2025 · Microteaching Portal
            </span>
          </div>

          {/* Main heading */}
          <h1 className="mb-3 text-7xl font-black text-brutal-black leading-none drop-shadow-sm">
            JAK PLUENG! 🌊
          </h1>

          <p className="mb-2 text-xl font-bold text-brutal-black/70">
            Portal Microteaching Bahasa Inggris
          </p>
          <p className="mb-12 text-sm font-bold uppercase tracking-widest text-brutal-black/50">
            Giving &amp; Following Instructions · Konteks Bencana Alam
          </p>

          {/* CTA buttons */}
          <div className="flex flex-wrap items-center justify-center gap-5">
            <button
              id="cta-guru-btn"
              onClick={() => navigate('/admin/login')}
              className="group relative flex items-center gap-3 border-4 border-brutal-black bg-brutal-black px-8 py-4 text-lg font-black text-brutal-yellow shadow-brutal-xl transition-all duration-100 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[14px_14px_0px_0px_#FF6B6B] active:translate-x-1 active:translate-y-1 active:shadow-brutal-sm"
            >
              <span className="text-2xl">👨🏫</span>
              Masuk sebagai Guru
            </button>

            <button
              id="cta-siswa-btn"
              onClick={() => triggerCurtain(() => navigate('/student/login'))}
              className="group relative flex items-center gap-3 border-4 border-brutal-black bg-brutal-yellow px-8 py-4 text-lg font-black text-brutal-black shadow-brutal-xl transition-all duration-100 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[14px_14px_0px_0px_#4ECDC4] active:translate-x-1 active:translate-y-1 active:shadow-brutal-sm"
            >
              <span className="text-2xl">🎒</span>
              Masuk sebagai Siswa
            </button>
          </div>
        </div>

        {/* Scroll cue */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 opacity-50">
          <span className="text-xs font-bold uppercase tracking-widest text-brutal-black">Scroll</span>
          <div className="h-6 w-0.5 animate-bounce bg-brutal-black" />
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          SECTION 2 · PETA KONSEP PEMBELAJARAN
      ══════════════════════════════════════════════════════════ */}
      <section className="bg-brutal-white px-6 py-20 border-t-4 border-brutal-black">
        <div className="mx-auto max-w-5xl">
          {/* Section header */}
          <div className="mb-14 text-center">
            <h2 className="relative mb-2 inline-block text-4xl font-black text-brutal-black">
              🗺️ Peta Konsep Pembelajaran
              {/* Brutal underline decoration */}
              <span className="absolute -bottom-2 left-0 h-2 w-full bg-brutal-coral border-t-2 border-brutal-black" />
            </h2>
          </div>

          {/* SVG Mind Map */}
          <ConceptMap />
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          SECTION 3 · ALUR PEMBELAJARAN
      ══════════════════════════════════════════════════════════ */}
      <section className="border-t-4 border-brutal-black bg-[#FFE135]/20 px-6 py-20">
        <div className="mx-auto max-w-6xl">
          {/* Section header */}
          <div className="mb-10 text-center">
            <h2 className="text-4xl font-black text-brutal-black">📋 Alur Pembelajaran Hari Ini</h2>
            <p className="mt-2 text-sm font-bold uppercase tracking-widest text-brutal-black/50">
              6 langkah · ±90 menit
            </p>
          </div>

          {/* Step cards — horizontal scroll on mobile, wrapping grid on desktop */}
          <div className="flex gap-4 overflow-x-auto pb-4 md:grid md:grid-cols-3 md:overflow-visible lg:grid-cols-6">
            {LEARNING_STEPS.map((step, i) => (
              <div
                key={step.label}
                className="relative flex-shrink-0 w-44 md:w-auto border-4 border-brutal-black bg-white shadow-brutal transition-all duration-100 hover:-translate-y-1 hover:shadow-brutal-lg"
              >
                {/* Step number stamp */}
                <div className="absolute -top-3 -left-3 h-7 w-7 border-2 border-brutal-black bg-brutal-black flex items-center justify-center">
                  <span className="text-xs font-black text-brutal-yellow">{i + 1}</span>
                </div>

                <div className="p-4 pt-5">
                  <div className="text-3xl mb-2">{step.icon}</div>
                  <p className="text-sm font-black text-brutal-black leading-tight mb-1">{step.label}</p>
                  <p className="text-xs text-gray-500 leading-snug">{step.desc}</p>
                </div>

                {/* Arrow connector (right edge, hidden on last item) */}
                {i < LEARNING_STEPS.length - 1 && (
                  <div className="hidden lg:flex absolute -right-5 top-1/2 -translate-y-1/2 z-10 items-center">
                    <div className="h-0.5 w-3 bg-brutal-black" />
                    <div className="border-y-4 border-l-4 border-y-transparent border-l-brutal-black h-0 w-0" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer className="border-t-4 border-brutal-black bg-brutal-black px-6 py-8 text-center">
        <p className="text-sm font-bold text-brutal-yellow">
          JAK PLUENG! · LIDM 2025 · Microteaching Bahasa Inggris
        </p>
        <p className="mt-1 text-xs text-brutal-yellow/50 font-bold uppercase tracking-widest">
          Giving &amp; Following Instructions in Natural Disaster Context
        </p>
      </footer>
    </div>
  )
}
