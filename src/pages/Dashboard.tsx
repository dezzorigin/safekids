import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Users,
  Globe,
  Layers,
  Gamepad2,
  ArrowRight,
  Activity,
  TrendingUp,
  Zap,
  Clock,
} from 'lucide-react'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Drawer from '@/components/layout/Drawer'
import type { Mission } from '@/types'
import { supabase } from '@/lib/supabaseClient'

interface TrackingData {
  group_id: string
  x: number
  z: number
  status: string
  last_command: string
  updated_at: string
}

// ─── Static data ──────────────────────────────────────────────────────────────

const MISSIONS: Mission[] = [
  {
    id: 'genially',
    toolId: 'genially',
    title: 'Mission Briefing',
    description: 'Presentasi interaktif materi bencana alam & instruksi evakuasi menggunakan Genially.',
    embedUrl: 'https://view.genial.ly/placeholder',
    status: 'active',
    icon: '🌍',
    color: 'bg-cyan-300',
  },
  {
    id: 'assemblr',
    toolId: 'assemblr',
    title: 'Vocabulary Lab (AR)',
    description: 'Eksplorasi kosakata bencana dalam lingkungan Augmented Reality menggunakan Assemblr.',
    embedUrl: 'https://studio.assemblrworld.com/placeholder',
    status: 'active',
    icon: '🔮',
    color: 'bg-pink-300',
  },
  {
    id: 'blooket',
    toolId: 'blooket',
    title: 'Evaluation Quiz',
    description: 'Uji pemahaman siswa dengan game kuis Blooket yang seru dan kompetitif.',
    embedUrl: 'https://play.blooket.com/placeholder',
    status: 'active',
    icon: '🎮',
    color: 'bg-lime-300',
  },
]

const STATS = [
  { label: 'Siswa Online',   value: '24',  icon: <Users size={18} />,     change: '+2',   color: 'text-cyan-400' },
  { label: 'Sesi Aktif',     value: '1',   icon: <Activity size={18} />,  change: 'Live', color: 'text-emerald-400' },
  { label: 'Rata-rata Skor', value: '82%', icon: <TrendingUp size={18} />, change: '+5%', color: 'text-amber-400' },
  { label: 'Durasi Sesi',    value: '32m', icon: <Clock size={18} />,     change: 'now',  color: 'text-purple-400' },
]

// ─── Dashboard ────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const navigate = useNavigate()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null)

  const handleMissionInfo = (mission: Mission) => {
    setSelectedMission(mission)
    setDrawerOpen(true)
  }

  // ── Live Tracking State ──────────────────────────────
  const [trackingData, setTrackingData] = useState<Record<string, TrackingData>>({})

  useEffect(() => {
    // Listen to Supabase Broadcast
    const channel = supabase
      .channel('tracking-channel')
      .on(
        'broadcast',
        { event: 'simulation_update' },
        (payload) => {
          const newData = payload.payload as TrackingData
          if (newData && newData.group_id) {
            setTrackingData((prev) => ({ ...prev, [newData.group_id]: newData }))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
  }
  const itemVariants = {
    hidden:   { opacity: 0, y: 16 },
    visible:  { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } },
  }

  return (
    <div className="min-h-full p-6 space-y-6">

      {/* ── Hero welcome ────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-3xl border-2 border-sky-200 p-6 shadow-bouncy-sm"
        style={{
          background: 'linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 60%)',
        }}
      >
        {/* Glow blob */}
        <div
          className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full opacity-50"
          style={{ background: 'radial-gradient(circle, rgba(56,189,248,0.4), transparent)' }}
        />
        <div className="relative">
          <div className="flex items-center gap-2 mb-1">
            <Zap size={14} className="text-black" />
            <span className="text-xs font-black text-black uppercase tracking-widest">
              Sesi Aktif
            </span>
          </div>
          <h2 className="text-2xl font-black text-black mb-1">
            Selamat datang,{' '}
            <span className="text-black">Teacher!</span>
          </h2>
          <p className="text-sm font-black text-black max-w-lg">
            Portal Microteaching Bahasa Inggris — materi <strong className="text-black">Giving &amp; Following Instructions</strong> dalam konteks bencana alam.
          </p>
        </div>
      </motion.div>

      {/* ── Stats ────────────────────────────────────────────── */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 gap-4 lg:grid-cols-4"
      >
        {STATS.map((stat) => (
          <motion.div key={stat.label} variants={itemVariants}>
            <Card accent className="flex items-center gap-4">
              <div
                className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm"
                style={{ border: '2px solid #bae6fd' }}
              >
                <span className={stat.color}>{stat.icon}</span>
              </div>
              <div>
                <p className="text-2xl font-black text-sky-900">{stat.value}</p>
                <p className="text-xs font-bold text-slate-500">{stat.label}</p>
              </div>
              <Badge variant="active" className="ml-auto text-[10px]">
                {stat.change}
              </Badge>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* ── Mission cards ────────────────────────────────────── */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black text-sky-900">Misi Pembelajaran</h3>
            <p className="text-sm font-semibold text-slate-500">Pilih tool untuk memulai sesi</p>
          </div>
          <Badge variant="active" dot>
            {MISSIONS.filter((m) => m.status === 'active').length} aktif
          </Badge>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {MISSIONS.map((mission) => (
            <motion.div key={mission.id} variants={itemVariants}>
              <div
                className={`group relative overflow-hidden rounded-xl border-4 border-black p-5 transition-all duration-100 hover:translate-x-[2px] hover:translate-y-[2px] shadow-brutal hover:shadow-brutal-sm ${mission.color}`}
              >
                <div className="relative space-y-3">
                  {/* Icon + status */}
                  <div className="flex items-start justify-between">
                    <span className="text-3xl">{mission.icon}</span>
                    <Badge variant={mission.status === 'active' ? 'active' : 'muted'} dot>
                      {mission.status === 'active' ? 'Aktif' : 'Terkunci'}
                    </Badge>
                  </div>

                  {/* Title & desc */}
                  <div>
                    <h4 className="font-black text-black mb-1">{mission.title}</h4>
                    <p className="text-xs font-black text-black leading-relaxed line-clamp-2">
                      {mission.description}
                    </p>
                  </div>

                  {/* Tool tag */}
                  <div className="flex items-center gap-2">
                    <Layers size={12} className="text-slate-500" />
                    <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                      {mission.toolId}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-1">
                    <Button
                      id={`mission-start-${mission.id}`}
                      variant="primary"
                      size="sm"
                      rightIcon={<ArrowRight size={13} />}
                      onClick={() => navigate(`/mission/${mission.toolId}`)}
                      className="flex-1"
                    >
                      Mulai Misi
                    </Button>
                    <Button
                      id={`mission-info-${mission.id}`}
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMissionInfo(mission)}
                    >
                      Info
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* ── Live Tracking ────────────────────────────────────── */}
      <div>
        <h3 className="text-lg font-black text-sky-900 mb-4 flex items-center gap-2">
          <Zap size={20} className="text-sky-500" />
          Live Tracker (Evacuation 3D)
        </h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Object.values(trackingData).length === 0 ? (
            <div className="col-span-full rounded-3xl border-2 border-sky-100 bg-white p-6 text-center text-sm font-bold text-slate-400 shadow-sm">
              Menunggu data sinkronisasi dari Simulator...
            </div>
          ) : (
            Object.values(trackingData).map((data) => (
              <Card key={data.group_id} className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="font-black text-sky-900 capitalize">{data.group_id.replace('-', ' ')}</span>
                  <Badge variant={data.status === 'success' ? 'active' : data.status === 'failed' ? 'warning' : 'muted'} dot>
                    {data.status.toUpperCase()}
                  </Badge>
                </div>
                <div className="flex justify-between text-sm font-bold">
                  <span className="text-slate-500">Posisi Grid:</span>
                  <span className="font-mono text-sky-500">[{data.x}, {data.z}]</span>
                </div>
                <div className="flex justify-between text-sm items-center font-bold">
                  <span className="text-slate-500">Log Terakhir:</span>
                  <span className="font-mono text-sky-700 truncate max-w-[120px] text-xs bg-sky-50 px-2 py-1 rounded-md border border-sky-200">
                    {data.last_command || '-'}
                  </span>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* ── Quick access ─────────────────────────────────────── */}
      <div>
        <h3 className="text-lg font-black text-sky-900 mb-4">Akses Cepat</h3>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            { label: 'Evacuation 3D', icon: <Gamepad2 size={20} />, path: '/simulator', color: 'text-cyan-400' },
            { label: 'Vocabulary Lab', icon: <Globe size={20} />, path: '/vocabulary', color: 'text-purple-400' },
            { label: 'Evaluasi Siswa', icon: <Activity size={20} />, path: '/evaluation', color: 'text-amber-400' },
            { label: 'Kelola Sesi', icon: <Users size={20} />, path: '/', color: 'text-emerald-400' },
          ].map((item) => (
            <Button
              key={item.label}
              id={`quickaccess-${item.label.replace(/\s+/g, '-').toLowerCase()}`}
              variant="secondary"
              size="sm"
              leftIcon={<span className={item.color}>{item.icon}</span>}
              onClick={() => navigate(item.path)}
              className="justify-start"
            >
              {item.label}
            </Button>
          ))}
        </div>
      </div>

      {/* ── Mission detail drawer ────────────────────────────── */}
      <Drawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={selectedMission?.title ?? 'Detail Misi'}
      >
        {selectedMission && (
          <div className="space-y-4">
            <div className="text-center py-6">
              <span className="text-6xl">{selectedMission.icon}</span>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Deskripsi</p>
              <p className="text-sm text-slate-300 leading-relaxed">{selectedMission.description}</p>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Platform</p>
              <Badge variant="active">{selectedMission.toolId}</Badge>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Status</p>
              <Badge variant={selectedMission.status === 'active' ? 'active' : 'muted'} dot>
                {selectedMission.status === 'active' ? 'Aktif & Tersedia' : 'Terkunci'}
              </Badge>
            </div>
            <Button
              id="drawer-start-mission-btn"
              variant="primary"
              className="w-full mt-4"
              rightIcon={<ArrowRight size={14} />}
              onClick={() => {
                setDrawerOpen(false)
                navigate(`/mission/${selectedMission.toolId}`)
              }}
            >
              Mulai Misi Sekarang
            </Button>
          </div>
        )}
      </Drawer>
    </div>
  )
}
