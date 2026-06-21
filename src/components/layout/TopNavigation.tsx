import { useLocation } from 'react-router-dom'

// ─── Route title map ──────────────────────────────────────────────────────────

const ROUTE_TITLES: Record<string, { title: string; subtitle: string }> = {
  '/':            { title: 'SafeKids',           subtitle: 'Media Pembelajaran Evakuasi Bencana untuk Siswa MI/SD' },
  '/admin':       { title: 'Dashboard Guru',         subtitle: 'Panel kontrol & monitoring sesi' },
  '/mission':     { title: 'Mission Briefing',       subtitle: 'Tools pembelajaran interaktif' },
  '/teammaker':   { title: 'Team Maker',             subtitle: 'Pembagian kelompok belajar siswa' },
  '/video':       { title: 'Evacuation Video', subtitle: 'Analisis kepanikan vs evakuasi terstruktur' },
  '/tutorial':    { title: 'Ice Breaking',             subtitle: 'Lagu & Ice Breaking SafeKids' },
  '/simulator':   { title: 'Evacuation 3D',          subtitle: 'Interactive Disaster Evacuation Learning for Elementary Students' },
  '/vocabulary':  { title: 'Vocabulary Lab',         subtitle: 'Latihan kosakata bahasa Inggris' },
  '/evaluation':  { title: 'Evaluation',             subtitle: 'Penilaian & hasil belajar siswa' },
  '/reflection':  { title: 'Refleksi Digital',       subtitle: 'Word cloud & refleksi kelas' },
}


function getRouteInfo(pathname: string) {
  // Exact match first
  if (ROUTE_TITLES[pathname]) return ROUTE_TITLES[pathname]
  // Prefix match for nested routes like /mission/blooket
  const prefix = Object.keys(ROUTE_TITLES).find(
    (key) => key !== '/' && pathname.startsWith(key),
  )
  return prefix ? ROUTE_TITLES[prefix] : { title: 'SafeKids', subtitle: '' }
}

// ─── TopNavigation Component ──────────────────────────────────────────────────

export default function TopNavigation() {
  const location = useLocation()
  const { title, subtitle } = getRouteInfo(location.pathname)

  return (
    <header
      className="flex h-16 flex-shrink-0 items-center justify-between border-b-4 border-brutal-black px-6 bg-brutal-white w-full overflow-hidden"
    >
      {/* ── Page title ─────────────────────────────────────── */}
      <div>
        <h1 className="text-xl font-black text-brutal-black uppercase tracking-wide">{title}</h1>
        {subtitle && (
          <p className="text-xs font-bold text-brutal-black/50">{subtitle}</p>
        )}
      </div>

    </header>
  )
}
