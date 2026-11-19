import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Backpack,
  Clapperboard,
  ClipboardCheck,
  Cloud,
  Compass,
  Dices,
  Download,
  FileText,
  Flag,
  Github,
  GraduationCap,
  LayoutDashboard,
  Map as MapIcon,
  Music,
  Play,
  ShieldCheck,
  Siren,
  Timer,
  Users,
} from 'lucide-react'
import { useCurtain } from '@/context/CurtainContext'
import ConceptMap from '@/components/ui/ConceptMap'
import { LEVELS, type LevelId } from '@/store/useSimulationStore'

// ─── Data nyata produk (bukan angka vanity) ───────────────────────────────────

const LEVEL_META: Record<LevelId, { label: string; blurb: string }> = {
  earthquake: { label: 'Gempa', blurb: 'Reruntuhan menutup jalan — cari rute terpendek ke titik aman.' },
  flood: { label: 'Banjir', blurb: 'Rumah terendam dan pagar pohon membatasi gerak — susun langkah hemat.' },
  tsunami: { label: 'Tsunami', blurb: 'Ombak datang dalam 75 detik — dua titik aman, pilih yang terjangkau.' },
}

const LEVEL_ORDER: LevelId[] = ['earthquake', 'flood', 'tsunami']

const LEARNING_STEPS = [
  { icon: MapIcon, label: 'Peta Konsep', desc: 'Guru menjelaskan materi & tujuan', to: '#peta' },
  { icon: Dices, label: 'Spin Wheel', desc: 'Pembagian kelompok secara acak', to: '/teammaker' },
  { icon: Clapperboard, label: 'Evacuation Video', desc: 'Nonton video Tsunami Aceh vs Jepang', to: '/video' },
  { icon: Music, label: 'Tutorial & Ice Break', desc: 'Video AR + ice breaking song', to: '/tutorial' },
  { icon: Siren, label: 'Evacuation 3D', desc: 'Game simulasi rute evakuasi', to: '/simulator' },
  { icon: ClipboardCheck, label: 'Quiz + Refleksi', desc: 'Evaluasi & word cloud kelas', to: '/evaluation' },
]

const TICKER_ITEMS = [
  'Gempa',
  'Banjir',
  'Tsunami',
  'Titik Aman',
  'Rute Evakuasi',
  'Simulasi 3D',
  'Kelas V SD',
]

// ─── Rute terpendek (BFS) di atas data level asli ────────────────────────────

function shortestPath(level: LevelId): { x: number; z: number }[] {
  const cfg = LEVELS[level]
  const blocked = new Set([...cfg.obstacles, ...cfg.treeCoords, ...cfg.fireCoords])
  const key = (x: number, z: number) => `${x},${z}`
  const start = { x: cfg.initialX, z: cfg.initialZ }
  const goals = new Set(cfg.goals.map((g) => key(g.x, g.z)))
  const prev = new Map<string, string | null>()
  prev.set(key(start.x, start.z), null)
  const queue = [start]
  while (queue.length > 0) {
    const cur = queue.shift()!
    if (goals.has(key(cur.x, cur.z))) {
      const path = [cur]
      let k = key(cur.x, cur.z)
      let parent = prev.get(k)
      while (parent) {
        const [px, pz] = parent.split(',').map(Number)
        path.unshift({ x: px, z: pz })
        k = parent
        parent = prev.get(k)
      }
      return path
    }
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const nx = cur.x + dx
      const nz = cur.z + dz
      if (nx < 0 || nz < 0 || nx >= cfg.gridSize || nz >= cfg.gridSize) continue
      const nk = key(nx, nz)
      if (blocked.has(nk) || prev.has(nk)) continue
      prev.set(nk, key(cur.x, cur.z))
      queue.push({ x: nx, z: nz })
    }
  }
  return [start]
}

// ─── Mini peta evakuasi (preview produk, data asli dari store) ─────────────

const CELL = 30
const GRID = 10

function EvacuationMapPreview() {
  const [level, setLevel] = useState<LevelId>('earthquake')
  const cfg = LEVELS[level]
  const path = useMemo(() => shortestPath(level), [level])
  const blocked = useMemo(
    () => new Set([...cfg.obstacles, ...cfg.treeCoords, ...cfg.fireCoords]),
    [cfg],
  )
  const goalKeys = new Set(cfg.goals.map((g) => `${g.x},${g.z}`))
  const points = path.map((p) => `${p.x * CELL + CELL / 2},${p.z * CELL + CELL / 2}`).join(' ')

  return (
    <div className="border-4 border-brutal-black bg-white shadow-brutal-xl">
      {/* Header panel */}
      <div className="flex items-center justify-between border-b-4 border-brutal-black bg-brutal-mint px-4 py-3">
        <p className="font-mono text-xs font-medium uppercase tracking-widest text-brutal-black">
          Peta Evakuasi — Level {LEVEL_META[level].label}
        </p>
        <span className="flex items-center gap-1 border-2 border-brutal-black bg-white px-2 py-0.5 font-mono text-xs font-medium">
          <Timer className="h-3.5 w-3.5" aria-hidden />
          {level === 'tsunami' ? '75 dtk' : 'tanpa batas'}
        </span>
      </div>

      {/* Grid 10×10 */}
      <div className="overflow-x-auto p-4">
        <svg
          viewBox={`0 0 ${GRID * CELL} ${GRID * CELL}`}
          className="mx-auto block h-auto w-full max-w-[320px]"
          role="img"
          aria-label={`Peta grid 10 kali 10 level ${LEVEL_META[level].label} dengan rute evakuasi terpendek ${path.length - 1} langkah`}
        >
          {/* sel */}
          {Array.from({ length: GRID * CELL * CELL }, (_, i) => {
            const x = i % GRID
            const z = Math.floor(i / GRID)
            const k = `${x},${z}`
            if (goalKeys.has(k)) return <rect key={k} x={x * CELL} y={z * CELL} width={CELL} height={CELL} fill="#4ECDC4" />
            if (blocked.has(k)) return <rect key={k} x={x * CELL + 3} y={z * CELL + 3} width={CELL - 6} height={CELL - 6} fill="#FF6B6B" stroke="#1A1A2E" strokeWidth="2" />
            return <rect key={k} x={x * CELL} y={z * CELL} width={CELL} height={CELL} fill="#FFFEF7" stroke="#1A1A2E" strokeOpacity="0.15" />
          })}
          {/* rute putus-putus = jalur evakuasi */}
          <polyline
            points={points}
            fill="none"
            stroke="#1A1A2E"
            strokeWidth="3"
            strokeDasharray="7 5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {/* start */}
          <circle cx={cfg.initialX * CELL + CELL / 2} cy={cfg.initialZ * CELL + CELL / 2} r="10" fill="#FFE135" stroke="#1A1A2E" strokeWidth="3" />
          {/* titik aman */}
          {cfg.goals.map((g) => (
            <g key={`${g.x},${g.z}`}>
              <line x1={g.x * CELL + CELL / 2} y1={g.z * CELL + CELL / 2 + 8} x2={g.x * CELL + CELL / 2} y2={g.z * CELL + CELL / 2 - 10} stroke="#1A1A2E" strokeWidth="2.5" />
              <path d={`M ${g.x * CELL + CELL / 2} ${g.z * CELL + CELL / 2 - 10} l 12 4 l -12 4 z`} fill="#1A1A2E" />
            </g>
          ))}
        </svg>
      </div>

      {/* Kaki panel: data jujur */}
      <div className="border-t-4 border-brutal-black px-4 py-3">
        <p className="text-sm font-bold text-brutal-black">{LEVEL_META[level].blurb}</p>
        <p className="mt-1 font-mono text-xs text-brutal-black/60">
          Langkah optimal: {path.length - 1} langkah · Rintangan: {blocked.size} petak · Grid 10×10
        </p>
        <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Pilih level bencana">
          {LEVEL_ORDER.map((id) => (
            <button
              key={id}
              type="button"
              aria-pressed={level === id}
              onClick={() => setLevel(id)}
              className={
                level === id
                  ? 'border-2 border-brutal-black bg-brutal-black px-3 py-1.5 text-xs font-black text-brutal-yellow'
                  : 'border-2 border-brutal-black bg-white px-3 py-1.5 text-xs font-black text-brutal-black transition-all duration-100 hover:-translate-y-0.5'
              }
            >
              {LEVEL_META[id].label}
            </button>
          ))}
          <Link
            to="/simulator"
            className="ml-auto inline-flex items-center gap-1 border-2 border-brutal-black bg-brutal-yellow px-3 py-1.5 text-xs font-black text-brutal-black transition-all duration-100 hover:-translate-y-0.5"
          >
            Mainkan <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>
      </div>
    </div>
  )
}

// ─── Stempel nomor langkah ────────────────────────────────────────────────────

function StepStamp({ n }: { n: number }) {
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center border-2 border-brutal-black bg-brutal-black font-mono text-sm font-medium text-brutal-yellow" aria-hidden>
      {n}
    </span>
  )
}

// ─── WelcomePage (landing) ────────────────────────────────────────────────────

export default function WelcomePage() {
  const navigate = useNavigate()
  const { triggerCurtain } = useCurtain()

  return (
    <div className="min-h-screen bg-brutal-white font-sans text-brutal-black">
      {/* ══════════ NAVBAR (sticky) ══════════ */}
      <header className="sticky top-0 z-50 border-b-4 border-brutal-black bg-brutal-white">
        <nav className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3 sm:px-6" aria-label="Navigasi utama">
          <Link to="/" className="flex items-center gap-2" aria-label="SafeKids — beranda">
            <span className="flex h-10 w-10 items-center justify-center border-2 border-brutal-black bg-brutal-yellow shadow-brutal-sm">
              <Compass className="h-5 w-5" aria-hidden />
            </span>
            <span className="text-xl font-black tracking-tight">SafeKids</span>
            <span className="hidden font-mono text-[11px] uppercase tracking-widest text-brutal-black/50 lg:inline">
              PGMI · UIN Ar-Raniry
            </span>
          </Link>

          <div className="ml-auto hidden items-center gap-6 text-sm font-bold md:flex">
            <a href="#fitur" className="transition-colors hover:text-brutal-coral">Fitur</a>
            <a href="#alur" className="transition-colors hover:text-brutal-coral">Alur</a>
            <a href="#peta" className="transition-colors hover:text-brutal-coral">Peta Konsep</a>
            <a href="#guru" className="transition-colors hover:text-brutal-coral">Untuk Guru</a>
          </div>

          <a
            href="https://github.com/dezzorigin/safekids"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Kode sumber SafeKids di GitHub"
            className="ml-auto flex h-10 w-10 items-center justify-center border-2 border-brutal-black bg-white shadow-brutal-sm transition-all duration-100 hover:-translate-y-0.5 hover:shadow-brutal md:ml-0"
          >
            <Github className="h-5 w-5" aria-hidden />
          </a>
          <button
            type="button"
            onClick={() => navigate('/admin/login')}
            className="hidden min-h-[44px] items-center gap-2 border-2 border-brutal-black bg-brutal-black px-4 text-sm font-black text-brutal-yellow transition-all duration-100 hover:-translate-y-0.5 sm:inline-flex"
          >
            <GraduationCap className="h-4 w-4" aria-hidden />
            Masuk Guru
          </button>
        </nav>
      </header>

      <main>
        {/* ══════════ HERO 2 kolom ══════════ */}
        <section className="border-b-4 border-brutal-black bg-brutal-white px-4 py-14 sm:px-6 lg:py-20">
          <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2">
            {/* Copy kiri */}
            <div>
              <p className="mb-5 inline-flex items-center gap-2 border-2 border-brutal-black bg-brutal-black px-3 py-1.5 font-mono text-[11px] font-medium uppercase tracking-widest text-brutal-yellow">
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
                Media pembelajaran · SD kelas V
              </p>
              <h1 className="text-5xl font-black leading-[1.02] tracking-tight sm:text-6xl">
                Belajar{' '}
                <mark className="border-2 border-brutal-black bg-brutal-yellow px-1">selamat</mark>{' '}
                dari bencana, sambil main.
              </h1>
              <p className="mt-5 max-w-[60ch] text-lg font-bold leading-relaxed text-brutal-black/70">
                SafeKids adalah media pembelajaran evakuasi bencana interaktif
                untuk siswa sekolah dasar — simulasi 3D gempa, banjir, dan
                tsunami di peta 10×10, dipandu guru dalam 6 langkah ±90 menit.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <button
                  id="cta-guru-btn"
                  type="button"
                  onClick={() => navigate('/admin/login')}
                  className="inline-flex min-h-[52px] items-center gap-2 border-4 border-brutal-black bg-brutal-black px-6 text-base font-black text-brutal-yellow shadow-brutal transition-all duration-100 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brutal-lg active:translate-x-0.5 active:translate-y-0.5 active:shadow-brutal-sm"
                >
                  <GraduationCap className="h-5 w-5" aria-hidden />
                  Masuk sebagai Guru
                </button>
                <button
                  id="cta-siswa-btn"
                  type="button"
                  onClick={() => triggerCurtain(() => navigate('/student/login'))}
                  className="inline-flex min-h-[52px] items-center gap-2 border-4 border-brutal-black bg-brutal-yellow px-6 text-base font-black text-brutal-black shadow-brutal transition-all duration-100 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brutal-lg active:translate-x-0.5 active:translate-y-0.5 active:shadow-brutal-sm"
                >
                  <Backpack className="h-5 w-5" aria-hidden />
                  Masuk sebagai Siswa
                </button>
              </div>

              <p className="mt-6 font-mono text-xs uppercase tracking-widest text-brutal-black/50">
                3 level bencana · 6 langkah · ±90 menit · tanpa instalasi
              </p>
            </div>

            {/* Preview produk kanan */}
            <EvacuationMapPreview />
          </div>
        </section>

        {/* ══════════ TICKER ══════════ */}
        <div className="overflow-hidden border-b-4 border-brutal-black bg-brutal-black py-3" aria-hidden>
          <div className="ticker-track flex w-max gap-0 whitespace-nowrap">
            {[0, 1].map((copy) => (
              <span key={copy} className="flex items-center font-mono text-sm font-medium uppercase tracking-[0.2em] text-brutal-yellow">
                {TICKER_ITEMS.map((item) => (
                  <span key={`${copy}-${item}`} className="flex items-center">
                    <span className="px-4">{item}</span>
                    <span className="text-brutal-coral">◆</span>
                  </span>
                ))}
              </span>
            ))}
          </div>
        </div>

        {/* ══════════ FITUR (asimetris) ══════════ */}
        <section id="fitur" className="border-b-4 border-brutal-black bg-brutal-white px-4 py-16 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <p className="mb-3 inline-block border-2 border-brutal-black bg-brutal-yellow px-3 py-1 font-mono text-[11px] font-medium uppercase tracking-widest">
              Fitur
            </p>
            <h2 className="max-w-[22ch] text-4xl font-black leading-tight tracking-tight">
              Satu sesi, semua alat guru sudah siap.
            </h2>
            <p className="mt-3 max-w-[65ch] font-bold text-brutal-black/60">
              Bukan kumpulan tombol pajangan — tiap kartu di bawah ini membuka
              modul yang benar-benar jalan di aplikasi.
            </p>

            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {/* Kartu besar: simulator */}
              <Link
                to="/simulator"
                className="group border-4 border-brutal-black bg-brutal-mint p-6 shadow-brutal transition-all duration-100 hover:-translate-y-1 hover:shadow-brutal-lg md:col-span-2 md:row-span-2"
              >
                <span className="flex h-12 w-12 items-center justify-center border-2 border-brutal-black bg-white shadow-brutal-sm">
                  <Siren className="h-6 w-6" aria-hidden />
                </span>
                <h3 className="mt-5 text-2xl font-black leading-tight">Simulator Evakuasi 3D</h3>
                <p className="mt-2 max-w-[55ch] font-bold text-brutal-black/70">
                  Gerakkan avatar di peta 3D gempa, banjir, dan tsunami.
                  Susun perintah maju–belok, hindari rintangan, dan capai
                  titik aman sebelum waktu habis.
                </p>
                <p className="mt-4 font-mono text-xs uppercase tracking-widest text-brutal-black/60">
                  3 level · grid 10×10 · timer tsunami 75 detik
                </p>
                <span className="mt-5 inline-flex items-center gap-2 border-2 border-brutal-black bg-brutal-black px-4 py-2 text-sm font-black text-brutal-yellow">
                  Buka simulator <ArrowRight className="h-4 w-4 transition-transform duration-100 group-hover:translate-x-1" aria-hidden />
                </span>
              </Link>

              {/* Kartu kecil: video */}
              <Link
                to="/video"
                className="group border-4 border-brutal-black bg-brutal-sky/40 p-5 shadow-brutal transition-all duration-100 hover:-translate-y-1 hover:shadow-brutal-lg"
              >
                <span className="flex h-10 w-10 items-center justify-center border-2 border-brutal-black bg-white shadow-brutal-sm">
                  <Play className="h-5 w-5" aria-hidden />
                </span>
                <h3 className="mt-4 text-lg font-black">Video Bencana</h3>
                <p className="mt-1 text-sm font-bold text-brutal-black/60">
                  Tsunami Aceh vs Jepang — tonton, bandingkan, diskusikan.
                </p>
              </Link>

              {/* Kartu kecil: kuis */}
              <Link
                to="/evaluation"
                className="group border-4 border-brutal-black bg-brutal-white p-5 shadow-brutal transition-all duration-100 hover:-translate-y-1 hover:shadow-brutal-lg"
              >
                <span className="flex h-10 w-10 items-center justify-center border-2 border-brutal-black bg-white shadow-brutal-sm">
                  <ClipboardCheck className="h-5 w-5" aria-hidden />
                </span>
                <h3 className="mt-4 text-lg font-black">Kuis &amp; Evaluasi</h3>
                <p className="mt-1 text-sm font-bold text-brutal-black/60">
                  Soal pilihan ganda per level, skor langsung terlihat.
                </p>
              </Link>

              {/* Kartu kecil: refleksi */}
              <Link
                to="/reflection"
                className="group border-4 border-brutal-black bg-brutal-white p-5 shadow-brutal transition-all duration-100 hover:-translate-y-1 hover:shadow-brutal-lg"
              >
                <span className="flex h-10 w-10 items-center justify-center border-2 border-brutal-black bg-white shadow-brutal-sm">
                  <Cloud className="h-5 w-5" aria-hidden />
                </span>
                <h3 className="mt-4 text-lg font-black">Refleksi Word Cloud</h3>
                <p className="mt-1 text-sm font-bold text-brutal-black/60">
                  Satu kata dari tiap siswa, jadi awan kata kelas.
                </p>
              </Link>

              {/* Kartu lebar: dashboard guru */}
              <Link
                to="/dashboard-guru"
                className="group flex flex-col justify-between gap-4 border-4 border-brutal-black bg-brutal-black p-6 text-brutal-yellow shadow-brutal transition-all duration-100 hover:-translate-y-1 hover:shadow-brutal-lg md:col-span-2"
              >
                <span className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center border-2 border-brutal-yellow bg-brutal-black">
                    <LayoutDashboard className="h-5 w-5" aria-hidden />
                  </span>
                  <h3 className="text-lg font-black">Dashboard Guru</h3>
                </span>
                <p className="max-w-[60ch] text-sm font-bold text-brutal-yellow/70">
                  Rekap skor tiap kelompok, ekspor laporan PDF/Word, dan
                  pantau progres kelas — butuh login guru.
                </p>
                <span className="inline-flex w-fit items-center gap-2 border-2 border-brutal-yellow px-4 py-2 text-sm font-black">
                  Buka dashboard <ArrowRight className="h-4 w-4 transition-transform duration-100 group-hover:translate-x-1" aria-hidden />
                </span>
              </Link>
            </div>
          </div>
        </section>

        {/* ══════════ ALUR 6 langkah ══════════ */}
        <section id="alur" className="border-b-4 border-brutal-black bg-brutal-yellow px-4 py-16 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <p className="mb-3 inline-block border-2 border-brutal-black bg-brutal-black px-3 py-1 font-mono text-[11px] font-medium uppercase tracking-widest text-brutal-yellow">
              Alur
            </p>
            <h2 className="text-4xl font-black leading-tight tracking-tight">
              Alur pembelajaran hari ini
            </h2>
            <p className="mt-2 font-mono text-xs uppercase tracking-widest text-brutal-black/60">
              6 langkah · ±90 menit · klik tiap langkah untuk membuka modulnya
            </p>

            <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {LEARNING_STEPS.map((step, i) => {
                const Icon = step.icon
                const inner = (
                  <>
                    <span className="flex items-start justify-between">
                      <StepStamp n={i + 1} />
                      <Icon className="h-7 w-7" aria-hidden />
                    </span>
                    <span className="mt-4 block text-lg font-black leading-tight">{step.label}</span>
                    <span className="mt-1 block text-sm font-bold text-brutal-black/60">{step.desc}</span>
                    <span className="mt-4 inline-flex items-center gap-1 text-sm font-black">
                      Buka modul <ArrowRight className="h-4 w-4" aria-hidden />
                    </span>
                  </>
                )
                const cls =
                  'block border-4 border-brutal-black bg-white p-5 shadow-brutal transition-all duration-100 hover:-translate-y-1 hover:shadow-brutal-lg'
                return (
                  <li key={step.label}>
                    {step.to.startsWith('#') ? (
                      <a href={step.to} className={cls}>{inner}</a>
                    ) : (
                      <Link to={step.to} className={cls}>{inner}</Link>
                    )}
                  </li>
                )
              })}
            </ol>
          </div>
        </section>

        {/* ══════════ PETA KONSEP ══════════ */}
        <section id="peta" className="border-b-4 border-brutal-black bg-brutal-white px-4 py-16 sm:px-6">
          <div className="mx-auto max-w-5xl">
            <p className="mb-3 inline-block border-2 border-brutal-black bg-brutal-yellow px-3 py-1 font-mono text-[11px] font-medium uppercase tracking-widest">
              Peta Konsep
            </p>
            <h2 className="text-4xl font-black leading-tight tracking-tight">
              Peta konsep pembelajaran
            </h2>
            <p className="mt-2 max-w-[65ch] font-bold text-brutal-black/60">
              Tiga bencana, satu tujuan: siswa tahu ke mana harus lari dan
              apa yang harus dilakukan saat alarm berbunyi.
            </p>
            <div className="mt-10">
              <ConceptMap />
            </div>
          </div>
        </section>

        {/* ══════════ UNTUK GURU ══════════ */}
        <section id="guru" className="border-b-4 border-brutal-black bg-brutal-black px-4 py-16 text-brutal-yellow sm:px-6">
          <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-2">
            <div>
              <p className="mb-3 inline-block border-2 border-brutal-yellow px-3 py-1 font-mono text-[11px] font-medium uppercase tracking-widest">
                Untuk Guru
              </p>
              <h2 className="text-4xl font-black leading-tight tracking-tight">
                Guru pegang kendali penuh.
              </h2>
              <ul className="mt-6 space-y-4">
                {[
                  { icon: Users, text: 'Bagi siswa ke kelompok secara acak dengan Spin Wheel.' },
                  { icon: LayoutDashboard, text: 'Pantau skor dan ekspor rekap kelas ke PDF/Word.' },
                  { icon: Flag, text: 'Satu sesi tuntas: dari peta konsep sampai refleksi.' },
                ].map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-start gap-3 font-bold text-brutal-yellow/80">
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center border-2 border-brutal-yellow">
                      <Icon className="h-4 w-4" aria-hidden />
                    </span>
                    {text}
                  </li>
                ))}
              </ul>
              <div className="mt-8 flex flex-wrap gap-4">
                <button
                  type="button"
                  onClick={() => navigate('/admin/login')}
                  className="inline-flex min-h-[52px] items-center gap-2 border-4 border-brutal-yellow bg-brutal-yellow px-6 text-base font-black text-brutal-black shadow-[4px_4px_0px_0px_#FF6B6B] transition-all duration-100 hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none"
                >
                  <GraduationCap className="h-5 w-5" aria-hidden />
                  Masuk sebagai Guru
                </button>
                <a
                  href="https://bzyvozxzvjovevkrebwe.supabase.co/storage/v1/object/public/docs/SafeKids_User_Guide.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[52px] items-center gap-2 border-2 border-brutal-yellow px-6 text-base font-black text-brutal-yellow transition-all duration-100 hover:-translate-y-0.5"
                >
                  <Download className="h-5 w-5" aria-hidden />
                  Panduan Guru (PDF)
                </a>
              </div>
            </div>

            {/* Kartu contoh rekap — dilabeli contoh dengan jujur */}
            <div className="border-4 border-brutal-yellow bg-brutal-white p-6 text-brutal-black shadow-[8px_8px_0px_0px_#FF6B6B]">
              <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-brutal-black/50">
                <FileText className="h-4 w-4" aria-hidden />
                Contoh rekap kelas — data contoh, bukan data asli
              </p>
              <h3 className="mt-3 text-xl font-black">Rekap Sesi — Kelas V</h3>
              <div className="mt-5 space-y-3">
                {[
                  { group: 'Kelompok 1', level: 'Gempa', score: '92', tone: 'bg-brutal-mint' },
                  { group: 'Kelompok 2', level: 'Banjir', score: '85', tone: 'bg-brutal-yellow' },
                  { group: 'Kelompok 3', level: 'Tsunami', score: '78', tone: 'bg-brutal-sky/60' },
                ].map((row) => (
                  <div key={row.group} className="flex items-center justify-between gap-3 border-2 border-brutal-black px-3 py-2.5">
                    <span className="text-sm font-black">{row.group}</span>
                    <span className="font-mono text-xs uppercase tracking-widest text-brutal-black/50">{row.level}</span>
                    <span className={`border-2 border-brutal-black px-2 py-0.5 font-mono text-sm font-medium ${row.tone}`}>
                      {row.score}
                    </span>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-sm font-bold text-brutal-black/60">
                Di dashboard guru, tabel ini terisi dari skor nyata tiap
                kelompok dan bisa diekspor ke PDF/Word.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* ══════════ FOOTER ══════════ */}
      <footer className="bg-brutal-black px-4 py-10 text-brutal-yellow sm:px-6">
        <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-2">
          <div>
            <p className="flex items-center gap-2 text-xl font-black">
              <span className="flex h-9 w-9 items-center justify-center border-2 border-brutal-yellow bg-brutal-yellow text-brutal-black">
                <Compass className="h-5 w-5" aria-hidden />
              </span>
              SafeKids
            </p>
            <p className="mt-3 max-w-[50ch] text-sm font-bold text-brutal-yellow/70">
              Media pembelajaran evakuasi bencana interaktif untuk siswa
              sekolah dasar. Belajar. Simulasi. Tetap aman.
            </p>
            <p className="mt-4 font-mono text-xs text-brutal-yellow/50">
              © 2026 Najwa Azzahra — NIM 240209050 · PGMI, UIN Ar-Raniry
            </p>
          </div>
          <nav className="flex flex-col gap-2 text-sm font-bold md:items-end" aria-label="Tautan footer">
            <a href="https://github.com/dezzorigin/safekids" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 transition-colors hover:text-white">
              <Github className="h-4 w-4" aria-hidden /> Kode sumber di GitHub
            </a>
            <a href="https://bzyvozxzvjovevkrebwe.supabase.co/storage/v1/object/public/docs/SafeKids_User_Guide.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 transition-colors hover:text-white">
              <Download className="h-4 w-4" aria-hidden /> Panduan Guru (PDF)
            </a>
            <Link to="/admin/login" className="inline-flex items-center gap-2 transition-colors hover:text-white">
              <GraduationCap className="h-4 w-4" aria-hidden /> Masuk sebagai Guru
            </Link>
            <Link to="/student/login" className="inline-flex items-center gap-2 transition-colors hover:text-white">
              <Backpack className="h-4 w-4" aria-hidden /> Masuk sebagai Siswa
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
