import { create } from 'zustand'
import { supabase } from '@/lib/supabaseClient'

// ─── Constants & Types ────────────────────────────────────────────────────────

export type LevelId = 'earthquake' | 'flood' | 'tsunami'

export interface LevelConfig {
  gridSize: number
  initialX: number
  initialZ: number
  goals: { x: number; z: number }[]
  obstacles: Set<string>   // house-type obstacles
  treeCoords: Set<string>  // tree-type obstacles (flood fence/border)
  fireCoords: Set<string>
}

export const LEVELS: Record<LevelId, LevelConfig> = {
  earthquake: {
    gridSize: 10,
    initialX: 0,
    initialZ: 9,
    goals: [{ x: 9, z: 0 }],
    // 18 reruntuhan bangunan positions — BFS optimal from (0,9)→(9,0) = ~16 steps
    obstacles: new Set([
      '1,1','1,2','2,1',
      '3,3','3,4','4,3',
      '5,5','5,6','6,5',
      '7,2','7,3',
      '8,6','8,7',
      '2,7','3,7','4,8',
      '6,8','1,7',
    ]),
    treeCoords: new Set([]),
    fireCoords: new Set([]), // no fire — all obstacles are collapsed rubble
  },
  flood: {
    gridSize: 10,
    initialX: 0,
    initialZ: 9,
    goals: [{ x: 9, z: 0 }],
    // Houses (semi-submerged) blocking non-route tiles
    obstacles: new Set([
      '1,7','1,8','2,7','2,8',     // house cluster bottom-left
      '4,3','4,4','5,3','5,4',     // house cluster middle
      '7,6','7,7','8,6','8,7',     // house cluster right
      '0,3','0,4','1,3',           // house cluster top-left
    ]),
    // Trees as fence/border (tall single tile)
    treeCoords: new Set([
      '4,8','4,9','5,8','5,9',     // tree row bottom
      '0,5','0,6','0,7','0,8',     // tree column left side
      '6,0','6,1','6,2','7,0',     // tree row top
      '8,2','8,3','8,4','9,2',     // tree column right-top
      '2,4','2,5','3,5','3,6',     // tree divider middle
    ]),
    fireCoords: new Set([]), // no fire in flood
  },
  tsunami: {
    gridSize: 12,
    initialX: 5,
    initialZ: 11,
    goals: [{ x: 5, z: 1 }, { x: 1, z: 1 }],
    obstacles: new Set([
      '3,9', '4,9', '6,9', '7,9', 
      '3,6', '4,6', '5,6', '6,6', '7,6', 
      '2,3', '8,3'
    ]),
    treeCoords: new Set([]),
    fireCoords: new Set([]), // no fire in tsunami
  }
}

export type Facing = 0 | 90 | 180 | 270
export type GameStatus = 'idle' | 'playing' | 'success' | 'failed'
export type CommandType = 'forward' | 'backward' | 'left' | 'right'

export interface InstructionLog {
  id: string
  text: string
  action: string
  success: boolean
  timestamp: number
}

export interface SimulationState {
  // ── Level state ───────────────────────────────────────────
  currentLevel: LevelId | null
  
  // ── Avatar state ──────────────────────────────────────────
  x: number
  z: number
  facing: Facing
  targetX: number
  targetZ: number
  isMoving: boolean

  // ── Game state ────────────────────────────────────────────
  status: GameStatus
  steps: number
  instructions: InstructionLog[]
  commandQueue: CommandType[]
  
  // ── New educational & UI states ───────────────────────────
  shortestPath: { x: number; z: number }[]
  inputValue: string
  isLoading: boolean
  isTrapActive: boolean

  // ── Actions ───────────────────────────────────────────────
  setLevel: (level: LevelId) => void
  moveForward: () => void
  moveBackward: () => void
  turnLeft: () => void
  turnRight: () => void
  enqueueCommands: (cmds: CommandType[]) => void
  shiftCommand: () => void
  resetSimulation: () => void
  addInstruction: (log: Omit<InstructionLog, 'id' | 'timestamp'>) => void
  setIsMoving: (v: boolean) => void
  syncToSupabase: (groupId: string) => Promise<void>
  setInputValue: (v: string) => void
  setTrapActive: (v: boolean) => void
  setLoading: (v: boolean) => void
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DIRECTION_DELTA: Record<Facing, { dx: number; dz: number }> = {
  0:   { dx:  0, dz: -1 },
  90:  { dx:  1, dz:  0 },
  180: { dx:  0, dz:  1 },
  270: { dx: -1, dz:  0 },
}

function isBlocked(nx: number, nz: number, levelId: LevelId | null): boolean {
  if (!levelId) return true
  const config = LEVELS[levelId]
  if (nx < 0 || nx >= config.gridSize || nz < 0 || nz >= config.gridSize) return true
  return config.obstacles.has(`${nx},${nz}`) || config.treeCoords.has(`${nx},${nz}`) || config.fireCoords.has(`${nx},${nz}`)
}

function checkWinCondition(x: number, z: number, levelId: LevelId | null): GameStatus {
  if (!levelId) return 'playing'
  const config = LEVELS[levelId]
  const reached = config.goals.some(g => g.x === x && g.z === z)
  return reached ? 'success' : 'playing'
}

// BFS shortest pathfinder
function findShortestPath(
  startX: number,
  startZ: number,
  goals: { x: number; z: number }[],
  obstacles: Set<string>,
  treeCoords: Set<string>,
  fireCoords: Set<string>,
  gridSize: number
): { x: number; z: number }[] {
  const queue: { x: number; z: number; path: { x: number; z: number }[] }[] = []
  const visited = new Set<string>()

  queue.push({ x: startX, z: startZ, path: [{ x: startX, z: startZ }] })
  visited.add(`${startX},${startZ}`)

  while (queue.length > 0) {
    const { x, z, path } = queue.shift()!

    // If reached any of the goals, this is the shortest path
    if (goals.some(g => g.x === x && g.z === z)) {
      return path
    }

    // Try 4 neighbors
    const neighbors = [
      { x: x + 1, z },
      { x: x - 1, z },
      { x, z: z + 1 },
      { x, z: z - 1 }
    ]

    for (const n of neighbors) {
      if (n.x >= 0 && n.x < gridSize && n.z >= 0 && n.z < gridSize) {
        const key = `${n.x},${n.z}`
        if (!obstacles.has(key) && !treeCoords.has(key) && !fireCoords.has(key) && !visited.has(key)) {
          visited.add(key)
          queue.push({ x: n.x, z: n.z, path: [...path, { x: n.x, z: n.z }] })
        }
      }
    }
  }

  return []
}

const updatePath = (set: any, get: any) => {
  const { currentLevel, x, z } = get()
  if (!currentLevel) {
    set({ shortestPath: [] })
    return
  }
  const config = LEVELS[currentLevel as LevelId]
  const path = findShortestPath(x, z, config.goals, config.obstacles, config.treeCoords, config.fireCoords, config.gridSize)
  set({ shortestPath: path })
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useSimulationStore = create<SimulationState>((set, get) => ({
  currentLevel: null,
  
  x: 0,
  z: 0,
  facing: 0,
  targetX: 0,
  targetZ: 0,
  isMoving: false,
  status: 'idle',
  steps: 0,
  instructions: [],
  commandQueue: [],

  shortestPath: [],
  inputValue: '',
  isLoading: false,
  isTrapActive: false,

  setInputValue: (v) => set({ inputValue: v }),
  setTrapActive: (v) => set({ isTrapActive: v }),
  setLoading: (v) => set({ isLoading: v }),

  setLevel: (level: LevelId) => {
    const config = LEVELS[level]
    set({
      currentLevel: level,
      x: config.initialX,
      z: config.initialZ,
      targetX: config.initialX,
      targetZ: config.initialZ,
      facing: 0,
      isMoving: false,
      status: 'playing',
      steps: 0,
      instructions: [],
      commandQueue: [],
      isLoading: true,
    })
    updatePath(set, get)

    setTimeout(() => {
      set({ isLoading: false })
    }, 3000)
  },

  moveForward: () => {
    const { x, z, facing, status, currentLevel } = get()
    if (status === 'success' || status === 'failed' || !currentLevel) return

    const { dx, dz } = DIRECTION_DELTA[facing]
    const nx = x + dx
    const nz = z + dz

    if (isBlocked(nx, nz, currentLevel)) {
      set({ status: 'playing' })
      return
    }

    const newStatus = checkWinCondition(nx, nz, currentLevel)
    set({
      x: nx, z: nz,
      targetX: nx, targetZ: nz,
      isMoving: true,
      steps: get().steps + 1,
      status: newStatus,
    })
    updatePath(set, get)
  },

  moveBackward: () => {
    const { x, z, facing, status, currentLevel } = get()
    if (status === 'success' || status === 'failed' || !currentLevel) return

    const { dx, dz } = DIRECTION_DELTA[facing]
    const nx = x - dx
    const nz = z - dz

    if (isBlocked(nx, nz, currentLevel)) return

    const newStatus = checkWinCondition(nx, nz, currentLevel)
    set({
      x: nx, z: nz,
      targetX: nx, targetZ: nz,
      isMoving: true,
      steps: get().steps + 1,
      status: newStatus,
    })
    updatePath(set, get)
  },

  turnLeft: () => {
    const { facing, status } = get()
    if (status === 'success' || status === 'failed') return
    const next = ((facing - 90 + 360) % 360) as Facing
    set({ facing: next, steps: get().steps + 1, status: 'playing' })
  },

  turnRight: () => {
    const { facing, status } = get()
    if (status === 'success' || status === 'failed') return
    const next = ((facing + 90) % 360) as Facing
    set({ facing: next, steps: get().steps + 1, status: 'playing' })
  },

  enqueueCommands: (cmds) => set((state) => ({ commandQueue: [...state.commandQueue, ...cmds] })),
  
  shiftCommand: () => set((state) => ({ commandQueue: state.commandQueue.slice(1) })),

  resetSimulation: () => {
    const { currentLevel } = get()
    if (!currentLevel) return
    const config = LEVELS[currentLevel]
    set({
      x: config.initialX, z: config.initialZ,
      targetX: config.initialX, targetZ: config.initialZ,
      facing: 0,
      isMoving: false,
      status: 'playing',
      steps: 0,
      instructions: [],
      commandQueue: [],
      isLoading: true,
    })
    updatePath(set, get)

    setTimeout(() => {
      set({ isLoading: false })
    }, 3000)
  },

  addInstruction: (log) => {
    set((state) => ({
      instructions: [
        { ...log, id: crypto.randomUUID(), timestamp: Date.now() },
        ...state.instructions,
      ].slice(0, 30),
    }))
  },

  setIsMoving: (v) => set({ isMoving: v }),

  syncToSupabase: async (groupId: string) => {
    const { x, z, status, instructions } = get()
    const lastCommand = instructions.length > 0 ? instructions[0].text : ''
    
    try {
      await supabase
        .from('avatar_positions')
        .upsert(
          {
            group_id: groupId,
            x,
            z,
            status,
            last_command: lastCommand,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'group_id' }
        )
    } catch (error) {
      console.error('Error syncing to Supabase:', error)
    }
  },
}))

