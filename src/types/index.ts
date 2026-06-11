// ─── Shared TypeScript Interfaces & Types ────────────────────────────────────

export interface NavItem {
  id: string
  label: string
  icon: string // lucide icon name (unused directly; icons imported in component)
  path: string
  badge?: string
  isExternal?: boolean
}

export interface Mission {
  id: string
  toolId: 'genially' | 'assemblr' | 'blooket'
  title: string
  description: string
  embedUrl: string
  status: 'active' | 'locked' | 'completed'
  icon: string
  color: string
}

export interface Session {
  id: string
  teacherId: string
  title: string
  status: 'active' | 'completed' | 'paused'
  mapId: string
  studentCount: number
  createdAt: string
}

export interface AvatarPosition {
  id: string
  sessionId: string
  studentId: string
  posX: number
  posY: number
  posZ: number
  rotation: 0 | 90 | 180 | 270
  updatedAt: string
}

export interface SimulatorState {
  position: { x: number; y: number; z: number }
  rotation: 0 | 90 | 180 | 270
  isMoving: boolean
  commandQueue: string[]
  commandLog: string[]
}

export type DrawerProps = {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
}

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type BadgeVariant = 'active' | 'warning' | 'muted'
