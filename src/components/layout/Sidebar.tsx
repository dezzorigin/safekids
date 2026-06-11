import { useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Compass } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

// ─── Types ───────────────────────────────────────────────────────────────────

interface NavItemConfig {
  label: string
  icon: string
  path: string
  color: string
  description: string
  teacherOnly?: boolean
}

// ─── Nav Items ───────────────────────────────────────────────────────────────

const NAV_ITEMS: NavItemConfig[] = [
  {
    label: 'Peta Konsep & Materi',
    icon: '🗺️',
    path: '/mission',
    color: 'bg-brutal-sky',
    description: 'Tujuan & konsep pembelajaran',
  },
  {
    label: 'Spin Wheel',
    icon: '🎡',
    path: '/teammaker',
    color: 'bg-brutal-yellow',
    description: 'Pembagian kelompok kelas',
    teacherOnly: true,
  },
  {
    label: 'Evacuation Video',
    icon: '🎬',
    path: '/video',
    color: 'bg-brutal-coral',
    description: 'Video evakuasi bencana',
  },
  {
    label: 'Tutorial & Ice Break',
    icon: '🎵',
    path: '/tutorial',
    color: 'bg-brutal-lavender',
    description: 'Video AR & ice breaking',
  },
  {
    label: 'Evacuation 3D',
    icon: '🚨',
    path: '/simulator',
    color: 'bg-brutal-orange',
    description: 'Game simulasi rute evakuasi',
  },
  {
    label: 'Game Quiz',
    icon: '🎮',
    path: '/evaluation',
    color: 'bg-brutal-mint',
    description: 'Kuis evaluasi individu',
  },
  {
    label: 'Refleksi Digital',
    icon: '✨',
    path: '/reflection',
    color: 'bg-brutal-lavender',
    description: 'Word cloud & refleksi kelas',
  },
  {
    label: 'Dashboard Guru',
    icon: '📊',  
    path: '/dashboard-guru',
    color: 'bg-[#FF6B6B]',
    description: 'Monitor & kontrol sesi',
    teacherOnly: true
  }
]

// ─── Sidebar Component ────────────────────────────────────────────────────────

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { isTeacher, isStudent, studentGroup, clearStudentGroup } = useAuth()

  const sidebarVariants = {
    expanded: { width: 260 },
    collapsed: { width: 72 },
  }

  const labelVariants = {
    expanded: { opacity: 1, x: 0, display: 'block' },
    collapsed: { opacity: 0, x: -10, transitionEnd: { display: 'none' } },
  }

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  return (
    <motion.aside
      variants={sidebarVariants}
      animate={isCollapsed ? 'collapsed' : 'expanded'}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="relative flex h-screen flex-col border-r-4 border-brutal-black bg-brutal-yellow"
      style={{ flexShrink: 0, overflow: 'hidden', minHeight: '100vh' }}
    >
      {/* ── Logo / Brand ──────────────────────────────────────── */}
      <div className="relative flex h-16 items-center border-b-4 border-brutal-black px-4 bg-brutal-yellow">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-brutal-black border-2 border-brutal-black shadow-brutal-sm text-brutal-yellow">
            <Compass size={22} />
          </div>

          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                variants={labelVariants}
                animate="expanded"
                exit="collapsed"
                initial="collapsed"
                transition={{ duration: 0.2 }}
              >
                <p className="text-sm font-black text-brutal-black leading-none mb-0.5 uppercase tracking-wide" style={{ whiteSpace: 'nowrap' }}>
                  JAK PLUENG!
                </p>
                <p className="text-[9px] font-bold text-brutal-black/60 uppercase tracking-widest leading-none">
                  LIDM Portal
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Navigation Items ────────────────────────────── */}
      <nav className="flex flex-1 flex-col space-y-1 overflow-y-auto overflow-x-hidden px-2 py-4 bg-brutal-yellow">
        {!isCollapsed && (
          <p className="mb-2 px-3 text-[10px] font-black uppercase tracking-widest text-brutal-black/50">
            Navigation
          </p>
        )}

        {NAV_ITEMS.filter(item => !item.teacherOnly || isTeacher).map((item) => {
          const active = isActive(item.path)
          return (
            <NavLink
              key={item.path}
              to={item.path}
              title={isCollapsed ? item.label : undefined}
              className="block"
            >
              <motion.div
                whileHover={{ x: isCollapsed ? 0 : 3, y: isCollapsed ? 0 : -1 }}
                whileTap={{ scale: 0.96 }}
                transition={{ duration: 0.12 }}
                className={[
                  'relative flex items-center gap-3 rounded-lg px-2.5 py-2 transition-all duration-100',
                  active
                    ? 'bg-brutal-white border-2 border-brutal-black shadow-brutal'
                    : 'hover:bg-brutal-white hover:border-2 hover:border-brutal-black hover:shadow-brutal-sm',
                ].join(' ')}
              >
                {/* Colored square icon badge */}
                <span
                  className={[
                    'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border-2 border-brutal-black text-lg leading-none shadow-brutal-sm',
                    item.color,
                  ].join(' ')}
                  aria-hidden="true"
                >
                  {item.icon}
                </span>

                {/* Label + description */}
                <AnimatePresence>
                  {!isCollapsed && (
                    <motion.div
                      variants={labelVariants}
                      animate="expanded"
                      exit="collapsed"
                      initial="collapsed"
                      transition={{ duration: 0.2 }}
                      className="flex-1 overflow-hidden"
                    >
                      <span className="block text-sm font-bold text-brutal-black leading-tight" style={{ whiteSpace: 'nowrap' }}>
                        {item.label}
                      </span>
                      <span className="block text-xs text-gray-500 leading-tight" style={{ whiteSpace: 'nowrap' }}>
                        {item.description}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Teacher-only badge */}
                {item.teacherOnly && !isCollapsed && (
                  <span
                    className="absolute right-2 top-1.5 rounded-md bg-brutal-black px-1 py-0.5 text-[9px] font-black text-brutal-yellow leading-none"
                    title="Guru saja"
                  >
                    👨🏫
                  </span>
                )}

                {/* Active dot when collapsed */}
                {active && isCollapsed && (
                  <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-brutal-coral border border-brutal-black" />
                )}
              </motion.div>
            </NavLink>
          )
        })}
      </nav>



      {/* ── Bottom status strip ───────────────────────────── */}
      {isTeacher && (
        <div className="flex-shrink-0 border-t-4 border-brutal-black bg-brutal-black p-3 w-full">
          <div className="flex items-center gap-3 px-1 py-1">
            <div className="flex-shrink-0">
              <div className="relative">
                <div className="h-8 w-8 rounded-lg bg-brutal-yellow border-2 border-brutal-yellow flex items-center justify-center text-xs font-black text-brutal-black">
                  👨🏫
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-green-400 border-2 border-brutal-black animate-pulse" />
              </div>
            </div>
            <AnimatePresence>
              {!isCollapsed && (
                <motion.div
                  variants={labelVariants}
                  animate="expanded"
                  exit="collapsed"
                  initial="collapsed"
                  transition={{ duration: 0.2 }}
                >
                  <p className="text-xs font-black text-brutal-yellow leading-none mb-0.5" style={{ whiteSpace: 'nowrap' }}>
                    👨🏫 Guru · Sesi Aktif
                  </p>
                  <p className="text-[9px] font-bold text-brutal-yellow/60 leading-none">Online</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {isStudent && (
        <div
          className="flex-shrink-0 border-t-4 border-brutal-black p-3 w-full text-[#1A1A2E]"
          style={{ background: '#4ECDC4' }}
        >
          <div className="flex items-center justify-between px-1 py-1">
            <div className="flex items-center gap-3">
              <div
                className="flex-shrink-0"
                onClick={() => {
                  if (isCollapsed) {
                    clearStudentGroup()
                    navigate('/')
                  }
                }}
                style={{ cursor: isCollapsed ? 'pointer' : 'default' }}
                title={isCollapsed ? `Kelompok ${studentGroup} (Klik untuk Keluar)` : undefined}
              >
                <div className="h-8 w-8 rounded-lg bg-brutal-black border-2 border-brutal-black flex items-center justify-center text-xs text-white font-black hover:bg-red-500 hover:text-white transition-colors duration-100">
                  🎒
                </div>
              </div>
              <AnimatePresence>
                {!isCollapsed && (
                  <motion.div
                    variants={labelVariants}
                    animate="expanded"
                    exit="collapsed"
                    initial="collapsed"
                    transition={{ duration: 0.2 }}
                  >
                    <p className="text-xs font-black leading-none mb-0.5" style={{ whiteSpace: 'nowrap' }}>
                      Kelompok {studentGroup}
                    </p>
                    <p className="text-[9px] font-bold text-[#1A1A2E]/60 leading-none">Mode Siswa</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {!isCollapsed && (
              <button
                onClick={() => {
                  clearStudentGroup()
                  navigate('/')
                }}
                className="text-[10px] font-black underline hover:text-red-600 transition-colors uppercase ml-2"
              >
                Keluar
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Collapse toggle button ────────────────────────────── */}
      <button
        onClick={() => setIsCollapsed((prev) => !prev)}
        className="absolute -right-4 top-[72px] z-10 flex h-8 w-8 items-center justify-center rounded-lg border-2 border-brutal-black bg-brutal-yellow text-brutal-black shadow-brutal-sm hover:bg-brutal-white transition-colors duration-100"
        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>
    </motion.aside>
  )
}
