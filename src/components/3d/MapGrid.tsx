import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { Text, Billboard } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useSimulationStore, LEVELS, LevelId } from '@/store/useSimulationStore'

// ─── Constants ────────────────────────────────────────────────────────────────

const TILE_SIZE = 1
const TILE_GAP  = 0.04
const STEP      = TILE_SIZE + TILE_GAP

type TileType = 'floor' | 'obstacle' | 'goal' | 'fire' | 'tree'

interface TileData {
  x: number
  z: number
  type: TileType
  worldX: number
  worldZ: number
}

// ─── Colors per Level ────────────────────────────────────────────────────────

const LEVEL_COLORS: Record<LevelId, any> = {
  earthquake: {
    floor:       '#6b6b6b',
    floorAlt:    '#7a7570',
    obstacle:    '#6b3a2a',
    obstacleAlt: '#8b4513',
    obstacleTop: '#4a2010',
    goal:        '#22c55e',
    goalGlow:    '#4ade80',
    fire:        '#ef4444',
    fireGlow:    '#f87171',
    grid:        '#3a3a3a',
  },
  flood: {
    floor:       '#1a6b8a',
    floorAlt:    '#1e5f7a',
    obstacle:    '#8b6914',
    obstacleTop: '#c0392b',
    goal:        '#4a7c3f',
    goalGlow:    '#22c55e',
    fire:        '#ef4444',
    fireGlow:    '#f87171',
    grid:        '#0d3d52',
  },
  tsunami: {
    floor:       '#e2e8f0',
    floorAlt:    '#cbd5e1',
    obstacle:    '#64748b',
    obstacleTop: '#475569',
    goal:        '#1e293b',
    goalGlow:    '#334155',
    fire:        '#ef4444',
    fireGlow:    '#f87171',
    grid:        '#94a3b8',
  },
}

// ─── Crack Texture Generator ─────────────────────────────────────────────────

function createCrackTexture(seed: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 128
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#6b6b6b'
  ctx.fillRect(0, 0, 128, 128)
  ctx.strokeStyle = '#1a1a1a'
  ctx.lineWidth = 1.5
  ctx.globalAlpha = 0.85

  const r = (n: number) => ((Math.sin(seed * 9301 + n * 49297) + 1) / 2)
  const numCracks = 3 + Math.floor(r(1) * 3)
  for (let i = 0; i < numCracks; i++) {
    ctx.beginPath()
    let cx = r(i * 10) * 128
    let cy = r(i * 10 + 1) * 128
    ctx.moveTo(cx, cy)
    const segments = 3 + Math.floor(r(i * 10 + 2) * 4)
    for (let s = 0; s < segments; s++) {
      cx += (r(i * 10 + s * 3 + 3) - 0.5) * 50
      cy += (r(i * 10 + s * 3 + 4) - 0.5) * 50
      ctx.lineTo(Math.max(0, Math.min(128, cx)), Math.max(0, Math.min(128, cy)))
    }
    ctx.stroke()
  }
  return new THREE.CanvasTexture(canvas)
}

// ─── Dust Cloud Texture ───────────────────────────────────────────────────────

function createDustTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 128
  const ctx = canvas.getContext('2d')!
  const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
  grad.addColorStop(0, 'rgba(180,160,140,0.7)')
  grad.addColorStop(0.5, 'rgba(160,140,120,0.35)')
  grad.addColorStop(1, 'rgba(140,120,100,0)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, 128, 128)
  return new THREE.CanvasTexture(canvas)
}

// ─── Cloud Texture ────────────────────────────────────────────────────────────

function createCloudTexture(r: number, g: number, b: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 128
  const ctx = canvas.getContext('2d')!
  const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
  grad.addColorStop(0, `rgba(${r},${g},${b},0.75)`)
  grad.addColorStop(0.5, `rgba(${r},${g},${b},0.4)`)
  grad.addColorStop(1, `rgba(${r},${g},${b},0)`)
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, 128, 128)
  return new THREE.CanvasTexture(canvas)
}

// ─── Cracked Floor Tile ───────────────────────────────────────────────────────

function CrackedFloorTile({ worldX, worldZ, isAlt, seed }: {
  worldX: number; worldZ: number; isAlt: boolean; seed: number
}) {
  const texture = useMemo(() => createCrackTexture(seed), [seed])
  return (
    <group position={[worldX, 0, worldZ]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[TILE_SIZE - TILE_GAP, TILE_SIZE - TILE_GAP]} />
        <meshStandardMaterial color={isAlt ? '#7a7570' : '#6b6b6b'} roughness={0.9} metalness={0.05} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]}>
        <planeGeometry args={[TILE_SIZE - TILE_GAP, TILE_SIZE - TILE_GAP]} />
        <meshBasicMaterial map={texture} transparent opacity={0.9} />
      </mesh>
    </group>
  )
}

// ─── Plain Floor Tile (Earthquake) ───────────────────────────────────────────

function EarthquakeFloorTile({ worldX, worldZ, isAlt }: {
  worldX: number; worldZ: number; isAlt: boolean
}) {
  return (
    <mesh position={[worldX, 0, worldZ]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[TILE_SIZE - TILE_GAP, TILE_SIZE - TILE_GAP]} />
      <meshStandardMaterial
        color={isAlt ? '#7a7570' : '#6b6b6b'}
        roughness={0.9}
        metalness={0.05}
      />
    </mesh>
  )
}

// ─── Standard Floor Tile (Tsunami only) ──────────────────────────────────────

function FloorTile({ worldX, worldZ, isAlt, colors }: {
  worldX: number; worldZ: number; isAlt: boolean; colors: any
}) {
  return (
    <mesh position={[worldX, 0, worldZ]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[TILE_SIZE - TILE_GAP, TILE_SIZE - TILE_GAP]} />
      <meshStandardMaterial color={isAlt ? colors.floorAlt : colors.floor} roughness={0.8} metalness={0.1} />
    </mesh>
  )
}

// ─── Animated Water Tile (Flood) ──────────────────────────────────────────────

function AnimatedWaterTile({ worldX, worldZ, isAlt, seed, withDebris }: {
  worldX: number; worldZ: number; isAlt: boolean; seed: number; withDebris?: boolean
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const debrisRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (meshRef.current) {
      meshRef.current.position.y = Math.sin(t * 1.2 + seed * 0.8) * 0.03 - 0.01
    }
    if (debrisRef.current && withDebris) {
      debrisRef.current.position.y = 0.06 + Math.sin(t * 1.5 + seed) * 0.02
      debrisRef.current.rotation.y = t * 0.3 + seed
    }
  })

  return (
    <group position={[worldX, 0, worldZ]}>
      <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[TILE_SIZE - TILE_GAP, TILE_SIZE - TILE_GAP]} />
        <meshPhongMaterial
          color={isAlt ? '#1a6b8a' : '#1e5f7a'}
          shininess={100}
          specular={new THREE.Color('#4fc3f7')}
          transparent
          opacity={0.88}
        />
      </mesh>
      {withDebris && (
        <mesh ref={debrisRef} position={[(Math.sin(seed * 3.7) * 0.28), 0.06, Math.cos(seed * 2.3) * 0.25]} rotation={[0, seed, 0]}>
          <boxGeometry args={[0.28, 0.05, 0.1]} />
          <meshLambertMaterial color="#6b4423" />
        </mesh>
      )}
    </group>
  )
}

// ─── Goal Tile (Tsunami) ──────────────────────────────────────────────────────

function GoalTile({ worldX, worldZ, colors }: { worldX: number; worldZ: number; colors: any }) {
  return (
    <group position={[worldX, 0, worldZ]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[TILE_SIZE - TILE_GAP, TILE_SIZE - TILE_GAP]} />
        <meshStandardMaterial color={colors.goal} roughness={0.3} metalness={0.6} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[0.3, 0.48, 32]} />
        <meshBasicMaterial color={colors.goal} transparent opacity={0.6} />
      </mesh>
      <pointLight color={colors.goal} intensity={0.8} distance={3} position={[0, 0.5, 0]} />
    </group>
  )
}

// ─── Earthquake Safe Zone (goal) ──────────────────────────────────────────────

const SPARKLE_COUNT = 14

function EarthquakeSafeZone({ worldX, worldZ }: { worldX: number; worldZ: number }) {
  const groupRef = useRef<THREE.Group>(null)
  const ringRef = useRef<THREE.Mesh>(null)
  const sparklesRef = useRef<THREE.InstancedMesh>(null)

  const sparkleData = useMemo(() => (
    Array.from({ length: SPARKLE_COUNT }, (_, i) => ({
      angle: (i / SPARKLE_COUNT) * Math.PI * 2,
      radius: 0.2 + Math.random() * 0.25,
      speed: 0.4 + Math.random() * 0.6,
      phase: Math.random() * Math.PI * 2,
      startY: Math.random() * 0.3,
    }))
  ), [])

  const dummy = useMemo(() => new THREE.Object3D(), [])

  useFrame((state) => {
    const t = state.clock.elapsedTime

    if (ringRef.current) {
      const scale = 1 + Math.sin(t * 2.5) * 0.07
      ringRef.current.scale.set(scale, scale, scale)
    }

    if (sparklesRef.current) {
      sparkleData.forEach((s, i) => {
        const y = ((s.startY + t * s.speed) % 1.2)
        const angle = s.angle + t * 0.3
        dummy.position.set(
          worldX + Math.cos(angle) * s.radius,
          y,
          worldZ + Math.sin(angle) * s.radius
        )
        const sc = 0.04 + Math.abs(Math.sin(t * 2 + s.phase)) * 0.04
        dummy.scale.setScalar(sc)
        dummy.updateMatrix()
        sparklesRef.current!.setMatrixAt(i, dummy.matrix)
      })
      sparklesRef.current.instanceMatrix.needsUpdate = true
    }
  })

  return (
    <group ref={groupRef}>
      <mesh position={[worldX, 0, worldZ]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[TILE_SIZE - TILE_GAP, TILE_SIZE - TILE_GAP]} />
        <meshStandardMaterial color="#22c55e" roughness={0.2} metalness={0.5} emissive="#16a34a" emissiveIntensity={0.4} />
      </mesh>
      <mesh ref={ringRef} position={[worldX, 0.005, worldZ]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.3, 0.47, 32]} />
        <meshBasicMaterial color="#4ade80" transparent opacity={0.7} />
      </mesh>
      <mesh position={[worldX, 0.003, worldZ]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.44, 0.49, 32]} />
        <meshBasicMaterial color="#22c55e" transparent opacity={0.35} />
      </mesh>
      <pointLight color="#ff4500" intensity={1.5} distance={4} position={[worldX, 0.5, worldZ]} />
      <pointLight color="#22c55e" intensity={1.0} distance={3} position={[worldX, 0.8, worldZ]} />
      <Billboard position={[worldX, 1.5, worldZ]}>
        <Text
          fontSize={0.28}
          color="#ffffff"
          outlineColor="#16a34a"
          outlineWidth={0.04}
          anchorX="center"
          anchorY="middle"
          font={undefined}
        >
          {'SAFE ZONE 🏃'}
        </Text>
      </Billboard>
      <instancedMesh ref={sparklesRef} args={[undefined, undefined, SPARKLE_COUNT]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color="#4ade80" transparent opacity={0.85} />
      </instancedMesh>
    </group>
  )
}

// ─── Flood Safe Zone (Elevated Platform) ─────────────────────────────────────

const FLOOD_SPARKLE_COUNT = 18

function FloodSafeZone({ worldX, worldZ }: { worldX: number; worldZ: number }) {
  const sparklesRef = useRef<THREE.InstancedMesh>(null)
  const ringRef = useRef<THREE.Mesh>(null)

  const sparkleData = useMemo(() => (
    Array.from({ length: FLOOD_SPARKLE_COUNT }, (_, i) => ({
      angle: (i / FLOOD_SPARKLE_COUNT) * Math.PI * 2,
      radius: 0.15 + (i % 3) * 0.12,
      speed: 0.5 + (i % 5) * 0.15,
      phase: (i * 1.3) % (Math.PI * 2),
      startY: (i * 0.07) % 0.8,
    }))
  ), [])

  const dummy = useMemo(() => new THREE.Object3D(), [])

  useFrame((state) => {
    const t = state.clock.elapsedTime

    if (ringRef.current) {
      const scale = 1 + Math.sin(t * 2.0) * 0.09
      ringRef.current.scale.set(scale, scale, scale)
    }

    if (sparklesRef.current) {
      sparkleData.forEach((s, i) => {
        const y = ((s.startY + t * s.speed) % 1.5) + 0.5
        const angle = s.angle + t * 0.5
        dummy.position.set(
          worldX + Math.cos(angle) * s.radius,
          y,
          worldZ + Math.sin(angle) * s.radius
        )
        const sc = 0.03 + Math.abs(Math.sin(t * 3 + s.phase)) * 0.04
        dummy.scale.setScalar(sc)
        dummy.updateMatrix()
        sparklesRef.current!.setMatrixAt(i, dummy.matrix)
      })
      sparklesRef.current.instanceMatrix.needsUpdate = true
    }
  })

  return (
    <group>
      {/* Elevated grass platform */}
      <mesh position={[worldX, 0.25, worldZ]} castShadow receiveShadow>
        <boxGeometry args={[TILE_SIZE - TILE_GAP + 0.1, 0.5, TILE_SIZE - TILE_GAP + 0.1]} />
        <meshStandardMaterial color="#4a7c3f" roughness={0.7} metalness={0.05} />
      </mesh>
      {/* Top grass surface with slight bump texture */}
      <mesh position={[worldX, 0.51, worldZ]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[TILE_SIZE - TILE_GAP + 0.08, TILE_SIZE - TILE_GAP + 0.08, 4, 4]} />
        <meshStandardMaterial color="#5a9c4f" roughness={0.9} />
      </mesh>

      {/* Pulsing green ring on top */}
      <mesh ref={ringRef} position={[worldX, 0.52, worldZ]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.25, 0.42, 32]} />
        <meshBasicMaterial color="#22c55e" transparent opacity={0.65} />
      </mesh>

      {/* Green point light above */}
      <pointLight color="#22c55e" intensity={2.0} distance={5} position={[worldX, 2.0, worldZ]} />

      {/* Floating label */}
      <Billboard position={[worldX, 2.2, worldZ]}>
        <Text
          fontSize={0.22}
          color="#ffffff"
          outlineColor="#166534"
          outlineWidth={0.045}
          anchorX="center"
          anchorY="middle"
          font={undefined}
        >
          {'DATARAN TINGGI 🏔️'}
        </Text>
      </Billboard>
      <Billboard position={[worldX, 1.85, worldZ]}>
        <Text
          fontSize={0.19}
          color="#4ade80"
          outlineColor="#14532d"
          outlineWidth={0.035}
          anchorX="center"
          anchorY="middle"
          font={undefined}
        >
          {'SAFE ZONE ✅'}
        </Text>
      </Billboard>

      {/* White sparkle particles floating up */}
      <instancedMesh ref={sparklesRef} args={[undefined, undefined, FLOOD_SPARKLE_COUNT]}>
        <sphereGeometry args={[1, 4, 4]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.8} />
      </instancedMesh>
    </group>
  )
}

// ─── Earthquake Rubble Obstacle ───────────────────────────────────────────────

function seededRng(seed: number) {
  let s = seed
  return () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}

const DEBRIS_PER_OBSTACLE = 3

function EarthquakeObstacleTile({ worldX, worldZ, gridX, gridZ }: {
  worldX: number; worldZ: number; gridX: number; gridZ: number
}) {
  const rng = useMemo(() => seededRng(gridX * 100 + gridZ), [gridX, gridZ])

  const height     = useMemo(() => 0.8 + rng() * 1.4, [rng])
  const rotY       = useMemo(() => (rng() - 0.5) * (Math.PI / 6), [rng])
  const color      = useMemo(() => (rng() > 0.5 ? '#6b3a2a' : '#8b4513'), [rng])
  const topColor   = '#4a2010'

  const debrisData = useMemo(() => (
    Array.from({ length: DEBRIS_PER_OBSTACLE }, () => ({
      ox: (rng() - 0.5) * 0.7,
      oz: (rng() - 0.5) * 0.7,
      speed: 0.15 + rng() * 0.2,
      phase: rng() * Math.PI * 2,
      size: 0.05 + rng() * 0.06,
    }))
  ), [])

  const debrisRefs = useRef<(THREE.Mesh | null)[]>([])

  useFrame((state) => {
    const t = state.clock.elapsedTime
    debrisData.forEach((d, i) => {
      const mesh = debrisRefs.current[i]
      if (!mesh) return
      const cycle = ((t * d.speed + d.phase) % 1.5)
      mesh.position.y = height + 0.1 + (1.0 - cycle * 1.0) * 0.6
      ;(mesh.material as THREE.MeshBasicMaterial).opacity = cycle < 1.2 ? 1 - (cycle / 1.2) * 0.8 : 0
      mesh.rotation.y = t * 1.2 + d.phase
    })
  })

  return (
    <group position={[worldX, 0, worldZ]} rotation={[0, rotY, 0]}>
      <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[TILE_SIZE - TILE_GAP - 0.05, height, TILE_SIZE - TILE_GAP - 0.05]} />
        <meshStandardMaterial color={color} roughness={0.85} metalness={0.05} emissive="#3d1a0a" emissiveIntensity={0.3} />
      </mesh>
      <mesh position={[0, height + 0.04, 0]}>
        <boxGeometry args={[TILE_SIZE - TILE_GAP + 0.04, 0.07, TILE_SIZE - TILE_GAP + 0.04]} />
        <meshStandardMaterial color={topColor} roughness={0.9} />
      </mesh>
      <mesh position={[(rng() - 0.5) * 0.3, height * 0.35, (rng() - 0.5) * 0.3]} castShadow>
        <boxGeometry args={[0.22, height * 0.4, 0.22]} />
        <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>
      {debrisData.map((d, i) => (
        <mesh
          key={i}
          ref={(el) => { debrisRefs.current[i] = el }}
          position={[d.ox, height + 0.3, d.oz]}
        >
          <boxGeometry args={[d.size, d.size, d.size]} />
          <meshBasicMaterial color="#5a3020" transparent opacity={0.8} />
        </mesh>
      ))}
    </group>
  )
}

// ─── Flood House Obstacle (semi-submerged) ────────────────────────────────────

function FloodHouseObstacle({ worldX, worldZ, gridX, gridZ }: {
  worldX: number; worldZ: number; gridX: number; gridZ: number
}) {
  const tilt = useMemo(() => {
    const rng = seededRng(gridX * 77 + gridZ * 13)
    return (rng() - 0.5) * (Math.PI / 36) // ±5 degrees
  }, [gridX, gridZ])

  // House is 2.0 tall total: 0.5 below water, 1.5 above
  const wallH = 2.0
  const wallY = 0.5 // center: 0.5 below + 1.0 above = center at 0.5

  return (
    <group position={[worldX, 0, worldZ]} rotation={[0, tilt, tilt * 0.4]}>
      {/* Wall body — lower half submerged */}
      <mesh position={[0, wallY, 0]} castShadow receiveShadow>
        <boxGeometry args={[TILE_SIZE - TILE_GAP - 0.05, wallH, TILE_SIZE - TILE_GAP - 0.05]} />
        <meshLambertMaterial color="#8b6914" />
      </mesh>

      {/* Roof — two slanted panels forming a peak */}
      <mesh position={[0, wallH + 0.18, -0.22]} rotation={[Math.PI / 5, 0, 0]} castShadow>
        <boxGeometry args={[TILE_SIZE - TILE_GAP + 0.06, 0.08, 0.68]} />
        <meshLambertMaterial color="#c0392b" />
      </mesh>
      <mesh position={[0, wallH + 0.18, 0.22]} rotation={[-Math.PI / 5, 0, 0]} castShadow>
        <boxGeometry args={[TILE_SIZE - TILE_GAP + 0.06, 0.08, 0.68]} />
        <meshLambertMaterial color="#c0392b" />
      </mesh>
      {/* Roof ridge cap */}
      <mesh position={[0, wallH + 0.38, 0]}>
        <boxGeometry args={[TILE_SIZE - TILE_GAP + 0.06, 0.07, 0.12]} />
        <meshLambertMaterial color="#96281b" />
      </mesh>

      {/* Water line mark on wall */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[TILE_SIZE - TILE_GAP, TILE_SIZE - TILE_GAP]} />
        <meshBasicMaterial color="#1a6b8a" transparent opacity={0.3} />
      </mesh>
    </group>
  )
}

// ─── Flood Tree Obstacle (leaning in current) ─────────────────────────────────

function FloodTreeObstacle({ worldX, worldZ, gridX, gridZ }: {
  worldX: number; worldZ: number; gridX: number; gridZ: number
}) {
  const { leanZ, leanX } = useMemo(() => {
    const rng = seededRng(gridX * 53 + gridZ * 31)
    return {
      leanZ: (rng() - 0.5) * (Math.PI / 9),  // ±20 degrees Z
      leanX: (rng() - 0.5) * (Math.PI / 18), // ±10 degrees X
    }
  }, [gridX, gridZ])

  return (
    <group position={[worldX, 0, worldZ]} rotation={[leanX, 0, leanZ]}>
      {/* Trunk */}
      <mesh position={[0, 1.0, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.12, 2.0, 7]} />
        <meshLambertMaterial color="#3d1f00" />
      </mesh>
      {/* Leaves sphere — slightly transparent */}
      <mesh position={[0, 2.3, 0]} castShadow>
        <sphereGeometry args={[0.6, 8, 6]} />
        <meshLambertMaterial color="#1a4a0f" transparent opacity={0.85} />
      </mesh>
      {/* Second leaf cluster */}
      <mesh position={[0.22, 2.0, 0.15]}>
        <sphereGeometry args={[0.38, 6, 5]} />
        <meshLambertMaterial color="#2d5a1b" transparent opacity={0.75} />
      </mesh>
    </group>
  )
}

// ─── Standard Obstacle Tile (Flood/Tsunami) ───────────────────────────────────

function ObstacleTile({ worldX, worldZ, isFire, colors }: {
  worldX: number; worldZ: number; isFire: boolean; colors: any
}) {
  const height = isFire ? 1.4 : 1.0
  const color  = isFire ? colors.fire : colors.obstacle

  return (
    <group position={[worldX, 0, worldZ]}>
      <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[TILE_SIZE - TILE_GAP, height, TILE_SIZE - TILE_GAP]} />
        <meshStandardMaterial
          color={color}
          roughness={0.6}
          metalness={isFire ? 0.0 : 0.2}
          emissive={isFire ? colors.fire : '#000000'}
          emissiveIntensity={isFire ? 0.3 : 0}
        />
      </mesh>
      <mesh position={[0, height + 0.04, 0]}>
        <boxGeometry args={[TILE_SIZE - TILE_GAP + 0.06, 0.06, TILE_SIZE - TILE_GAP + 0.06]} />
        <meshStandardMaterial color={isFire ? colors.fireGlow : colors.obstacleTop} />
      </mesh>
      {isFire && (
        <pointLight color={colors.fire} intensity={1.2} distance={4} position={[0, height + 0.5, 0]} />
      )}
    </group>
  )
}

// ─── Vocabulary Markers (Earthquake fixed positions) ─────────────────────────

const VOCAB_MARKERS = [
  { x: 2, z: 5, text: 'Beside',   color: '#fbbf24' },
  { x: 6, z: 3, text: 'Beside',   color: '#fbbf24' },
  { x: 4, z: 6, text: 'Between',  color: '#38bdf8' },
  { x: 7, z: 5, text: 'Between',  color: '#38bdf8' },
]

function EarthquakeVocabMarkers({ offset }: { offset: number }) {
  const markerRefs = useRef<(THREE.Group | null)[]>([])

  useFrame((state) => {
    const t = state.clock.elapsedTime
    markerRefs.current.forEach((g, i) => {
      if (!g) return
      g.position.y = 0.85 + Math.sin(t * 1.8 + i * 1.2) * 0.08
    })
  })

  return (
    <>
      {VOCAB_MARKERS.map((m, i) => {
        const worldX = m.x * STEP - offset
        const worldZ = m.z * STEP - offset
        return (
          <group
            key={`vocab-${i}`}
            ref={(el) => { markerRefs.current[i] = el }}
            position={[worldX, 0.85, worldZ]}
          >
            <Billboard>
              <mesh>
                <planeGeometry args={[0.7, 0.22]} />
                <meshBasicMaterial color={m.color} transparent opacity={0.18} />
              </mesh>
              <Text
                fontSize={0.19}
                color={m.color}
                outlineColor="#1a1a1a"
                outlineWidth={0.025}
                anchorX="center"
                anchorY="middle"
              >
                {m.text}
              </Text>
            </Billboard>
          </group>
        )
      })}
    </>
  )
}

// ─── Flood Vocabulary Markers ─────────────────────────────────────────────────

const FLOOD_VOCAB_MARKERS = [
  { x: 3, z: 7, text: 'Beside',  color: '#4fc3f7' },
  { x: 6, z: 5, text: 'Beside',  color: '#4fc3f7' },
  { x: 3, z: 6, text: 'Between', color: '#81d4fa' },
  { x: 7, z: 3, text: 'Between', color: '#81d4fa' },
]

function FloodVocabMarkers({ offset }: { offset: number }) {
  const markerRefs = useRef<(THREE.Group | null)[]>([])

  useFrame((state) => {
    const t = state.clock.elapsedTime
    markerRefs.current.forEach((g, i) => {
      if (!g) return
      g.position.y = 0.9 + Math.sin(t * 1.5 + i * 1.1) * 0.1
    })
  })

  return (
    <>
      {FLOOD_VOCAB_MARKERS.map((m, i) => {
        const worldX = m.x * STEP - offset
        const worldZ = m.z * STEP - offset
        return (
          <group
            key={`flood-vocab-${i}`}
            ref={(el) => { markerRefs.current[i] = el }}
            position={[worldX, 0.9, worldZ]}
          >
            <Billboard>
              <mesh>
                <planeGeometry args={[0.75, 0.24]} />
                <meshBasicMaterial color={m.color} transparent opacity={0.2} />
              </mesh>
              <Text
                fontSize={0.2}
                color={m.color}
                outlineColor="#0d3d52"
                outlineWidth={0.03}
                anchorX="center"
                anchorY="middle"
              >
                {m.text}
              </Text>
            </Billboard>
          </group>
        )
      })}
    </>
  )
}

// ─── Dust Cloud Sprites (Earthquake) ─────────────────────────────────────────

const DUST_SPRITES = [
  { baseX: -6.0, baseZ:  0.0, speed: 0.25, phase: 0.0,   scale: 2.2 },
  { baseX:  6.0, baseZ:  1.5, speed: 0.18, phase: 1.3,   scale: 2.8 },
  { baseX:  0.5, baseZ: -6.0, speed: 0.22, phase: 2.6,   scale: 1.8 },
  { baseX: -1.0, baseZ:  6.0, speed: 0.30, phase: 0.8,   scale: 2.4 },
  { baseX:  5.5, baseZ: -4.5, speed: 0.15, phase: 1.9,   scale: 1.6 },
  { baseX: -5.0, baseZ:  4.0, speed: 0.20, phase: 3.1,   scale: 2.0 },
]

function DustClouds() {
  const texture = useMemo(() => createDustTexture(), [])

  const sprites = useMemo(() => (
    DUST_SPRITES.map((d) => {
      const mat = new THREE.SpriteMaterial({ map: texture, transparent: true, opacity: 0.55, depthWrite: false })
      const sprite = new THREE.Sprite(mat)
      sprite.position.set(d.baseX, 1.2, d.baseZ)
      sprite.scale.set(d.scale, d.scale, 1)
      return { sprite, cfg: d }
    })
  ), [texture])

  useFrame((state) => {
    const t = state.clock.elapsedTime
    sprites.forEach(({ sprite, cfg }) => {
      sprite.position.x = cfg.baseX + Math.sin(t * cfg.speed + cfg.phase) * 0.6
      sprite.position.y = 1.2 + Math.cos(t * cfg.speed * 0.7 + cfg.phase) * 0.3
    })
  })

  return (
    <>
      {sprites.map(({ sprite }, idx) => (
        <primitive key={`dust-${idx}`} object={sprite} />
      ))}
    </>
  )
}

// ─── Dark Storm Clouds (Flood) ────────────────────────────────────────────────

const STORM_CLOUD_POSITIONS = [
  { baseX: -5.5, baseZ: -4.0, speed: 0.35, phase: 0.0,  scale: 3.2 },
  { baseX:  5.0, baseZ: -3.5, speed: 0.28, phase: 1.2,  scale: 3.8 },
  { baseX:  0.0, baseZ: -6.5, speed: 0.30, phase: 2.3,  scale: 2.8 },
  { baseX: -3.0, baseZ:  5.5, speed: 0.40, phase: 0.7,  scale: 3.4 },
  { baseX:  4.5, baseZ:  5.0, speed: 0.22, phase: 1.8,  scale: 2.6 },
  { baseX: -6.5, baseZ:  1.0, speed: 0.33, phase: 3.0,  scale: 3.0 },
  { baseX:  2.5, baseZ: -5.5, speed: 0.25, phase: 0.4,  scale: 2.4 },
  { baseX: -1.5, baseZ:  7.0, speed: 0.38, phase: 2.1,  scale: 3.6 },
]

function DarkStormClouds() {
  const texture = useMemo(() => createCloudTexture(40, 40, 60), [])

  const sprites = useMemo(() => (
    STORM_CLOUD_POSITIONS.map((d) => {
      const mat = new THREE.SpriteMaterial({ map: texture, transparent: true, opacity: 0.7, depthWrite: false })
      const sprite = new THREE.Sprite(mat)
      sprite.position.set(d.baseX, 5.5, d.baseZ)
      sprite.scale.set(d.scale, d.scale * 0.6, 1)
      return { sprite, cfg: d }
    })
  ), [texture])

  useFrame((state) => {
    const t = state.clock.elapsedTime
    sprites.forEach(({ sprite, cfg }) => {
      sprite.position.x = cfg.baseX + Math.sin(t * cfg.speed + cfg.phase) * 0.8
      sprite.position.y = 5.5 + Math.cos(t * cfg.speed * 0.5 + cfg.phase) * 0.2
    })
  })

  return (
    <>
      {sprites.map(({ sprite }, idx) => (
        <primitive key={`storm-cloud-${idx}`} object={sprite} />
      ))}
    </>
  )
}

// ─── Rain Particles (Flood) ───────────────────────────────────────────────────

const RAIN_COUNT = 250

function RainSystem() {
  const pointsRef = useRef<THREE.Points>(null)

  const { positions, velocities } = useMemo(() => {
    const positions = new Float32Array(RAIN_COUNT * 3)
    const velocities = new Float32Array(RAIN_COUNT)
    for (let i = 0; i < RAIN_COUNT; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * 18  // x
      positions[i * 3 + 1] = Math.random() * 16           // y
      positions[i * 3 + 2] = (Math.random() - 0.5) * 18  // z
      velocities[i] = 8 + Math.random() * 5               // fall speed
    }
    return { positions, velocities }
  }, [])

  useFrame((_, delta) => {
    if (!pointsRef.current) return
    const pos = (pointsRef.current.geometry.attributes.position as THREE.BufferAttribute).array as Float32Array

    for (let i = 0; i < RAIN_COUNT; i++) {
      pos[i * 3 + 1] -= velocities[i] * delta       // fall down
      pos[i * 3]     -= velocities[i] * delta * 0.18 // slight wind drift X

      // Reset to top when below ground
      if (pos[i * 3 + 1] < -1) {
        pos[i * 3]     = (Math.random() - 0.5) * 18
        pos[i * 3 + 1] = 15
        pos[i * 3 + 2] = (Math.random() - 0.5) * 18
      }
    }

    (pointsRef.current.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#c8dcff"
        size={0.04}
        transparent
        opacity={0.6}
        depthWrite={false}
        sizeAttenuation={true}
      />
    </points>
  )
}

// ─── Floating Debris (Flood) ──────────────────────────────────────────────────

const DEBRIS_ITEMS = Array.from({ length: 13 }, (_, i) => ({
  startX: (Math.sin(i * 2.3) * 4.0),
  startZ: (Math.cos(i * 1.7) * 4.0),
  dirX: Math.cos(i * 0.9) * 0.3,
  dirZ: Math.sin(i * 1.1) * 0.15,
  phase: i * 0.47,
  rotSpeed: (i % 2 === 0 ? 1 : -1) * (0.3 + (i % 4) * 0.15),
  w: 0.25 + (i % 3) * 0.12,
  h: 0.045,
  d: 0.09 + (i % 4) * 0.06,
}))

function FloatingDebris() {
  const refs = useRef<(THREE.Mesh | null)[]>([])

  useFrame((state) => {
    const t = state.clock.elapsedTime
    DEBRIS_ITEMS.forEach((item, i) => {
      const mesh = refs.current[i]
      if (!mesh) return
      // Move in direction + wobble
      mesh.position.x = item.startX + item.dirX * (t % 30) + Math.sin(t * 0.5 + item.phase) * 0.3
      mesh.position.y = 0.04 + Math.sin(t * 1.2 + item.phase) * 0.025
      mesh.position.z = item.startZ + item.dirZ * (t % 30) + Math.cos(t * 0.4 + item.phase) * 0.2
      mesh.rotation.y = t * item.rotSpeed
    })
  })

  return (
    <>
      {DEBRIS_ITEMS.map((item, i) => (
        <mesh
          key={`debris-${i}`}
          ref={(el) => { refs.current[i] = el }}
          position={[item.startX, 0.04, item.startZ]}
        >
          <boxGeometry args={[item.w, item.h, item.d]} />
          <meshLambertMaterial color={i % 3 === 0 ? '#6b4423' : i % 3 === 1 ? '#8b5e3c' : '#5a3a1a'} />
        </mesh>
      ))}
    </>
  )
}

// ─── Water Ripple System (Flood) ──────────────────────────────────────────────

interface Ripple {
  x: number
  z: number
  startTime: number
  id: number
}

function WaterRipples({ playerWorldX, playerWorldZ }: { playerWorldX: number; playerWorldZ: number }) {
  const ripples = useRef<Ripple[]>([])
  const idRef = useRef(0)
  const lastPosRef = useRef({ x: playerWorldX, z: playerWorldZ })
  const meshRefs = useRef<(THREE.Mesh | null)[]>(Array(6).fill(null))

  useFrame((state) => {
    const t = state.clock.elapsedTime

    // Detect movement to spawn ripple
    if (
      Math.abs(playerWorldX - lastPosRef.current.x) > 0.05 ||
      Math.abs(playerWorldZ - lastPosRef.current.z) > 0.05
    ) {
      lastPosRef.current = { x: playerWorldX, z: playerWorldZ }
      if (ripples.current.length < 6) {
        ripples.current.push({ x: playerWorldX, z: playerWorldZ, startTime: t, id: idRef.current++ })
      }
    }

    // Clean up finished ripples
    ripples.current = ripples.current.filter(r => t - r.startTime < 1.2)

    // Update mesh refs
    meshRefs.current.forEach((mesh, i) => {
      if (!mesh) return
      const ripple = ripples.current[i]
      if (!ripple) {
        mesh.scale.setScalar(0)
        return
      }
      const age = t - ripple.startTime
      const progress = age / 1.2
      const scale = 0.1 + progress * 2.5
      mesh.position.set(ripple.x, 0.05, ripple.z)
      mesh.scale.set(scale, 1, scale)
      ;(mesh.material as THREE.MeshBasicMaterial).opacity = (1 - progress) * 0.4
    })
  })

  return (
    <>
      {Array(6).fill(null).map((_, i) => (
        <mesh
          key={`ripple-${i}`}
          ref={(el) => { meshRefs.current[i] = el }}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.05, 0]}
        >
          <ringGeometry args={[0.3, 0.5, 32]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0} depthWrite={false} />
        </mesh>
      ))}
    </>
  )
}

// ─── Lightning Flash (Flood) ──────────────────────────────────────────────────

function LightningFlash({ ambientRef }: { ambientRef: React.RefObject<THREE.AmbientLight | null> }) {
  const nextFlash = useRef(Date.now() + 8000 + Math.random() * 4000)
  const flashing = useRef(false)
  const flashStart = useRef(0)

  useFrame(() => {
    const now = Date.now()
    if (!ambientRef.current) return

    if (!flashing.current && now > nextFlash.current) {
      flashing.current = true
      flashStart.current = now
      nextFlash.current = now + 8000 + Math.random() * 4000
    }

    if (flashing.current) {
      const elapsed = now - flashStart.current
      if (elapsed < 80) {
        ambientRef.current.intensity = 3.0
      } else if (elapsed < 160) {
        ambientRef.current.intensity = 0.8
      } else if (elapsed < 220) {
        ambientRef.current.intensity = 2.5
      } else if (elapsed < 320) {
        ambientRef.current.intensity = 0.8
      } else {
        ambientRef.current.intensity = 0.8
        flashing.current = false
      }
    }
  })

  return null
}

// ─── Flood Atmosphere Scene ───────────────────────────────────────────────────

function FloodAtmosphere({ offset }: { offset: number }) {
  const ambientRef = useRef<THREE.AmbientLight>(null)

  // Get player world position for ripples
  const avatarX = useSimulationStore(s => s.x)
  const avatarZ = useSimulationStore(s => s.z)
  const playerWorldX = avatarX * STEP - offset
  const playerWorldZ = avatarZ * STEP - offset

  return (
    <>
      {/* Cool blue ambient */}
      <ambientLight ref={ambientRef} color="#4a6fa5" intensity={0.8} />
      {/* Steel blue directional */}
      <directionalLight
        color="#b0c4de"
        intensity={1.2}
        position={[5, 20, 5]}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={0.1}
        shadow-camera-far={60}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
      />
      {/* Dim fill from below */}
      <directionalLight color="#1a3a5c" intensity={0.4} position={[-5, 5, -5]} />

      <LightningFlash ambientRef={ambientRef} />
      <RainSystem />
      <FloatingDebris />
      <DarkStormClouds />
      <WaterRipples playerWorldX={playerWorldX} playerWorldZ={playerWorldZ} />
      <FloodVocabMarkers offset={offset} />
    </>
  )
}

// ─── Route Markers (Flood / Tsunami) ─────────────────────────────────────────

function RouteMarkers() {
  const currentLevel = useSimulationStore(s => s.currentLevel)
  const shortestPath = useSimulationStore(s => s.shortestPath) || []
  const avatarX = useSimulationStore(s => s.x)
  const avatarZ = useSimulationStore(s => s.z)

  if (!currentLevel || currentLevel === 'earthquake' || currentLevel === 'flood' || shortestPath.length <= 1) return null

  const config = LEVELS[currentLevel]
  const offset = (config.gridSize * STEP) / 2 - STEP / 2

  const isNearObstacle = (x: number, z: number) => {
    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        if (dx === 0 && dz === 0) continue
        const key = `${x + dx},${z + dz}`
        if (config.obstacles.has(key) || config.fireCoords.has(key)) return true
      }
    }
    return false
  }

  const candidateCells = shortestPath.filter(cell => {
    if (cell.x === avatarX && cell.z === avatarZ) return false
    return isNearObstacle(cell.x, cell.z)
  })

  const markers: { x: number; z: number; text: string }[] = []
  let lastPlacedIndex = -99
  let labelIndex = 0

  candidateCells.forEach((cell) => {
    const pathIdx = shortestPath.findIndex(p => p.x === cell.x && p.z === cell.z)
    if (pathIdx - lastPlacedIndex >= 2) {
      let text = ''
      if (currentLevel === 'tsunami') {
        text = 'Go Up To Stairs'
      } else {
        text = labelIndex % 2 === 0 ? 'Between' : 'Beside'
        labelIndex++
      }
      markers.push({ x: cell.x, z: cell.z, text })
      lastPlacedIndex = pathIdx
    }
  })

  return (
    <>
      {markers.map((m, idx) => {
        const worldX = m.x * STEP - offset
        const worldZ = m.z * STEP - offset
        return (
          <Billboard key={`marker-${m.x}-${m.z}-${idx}`} position={[worldX, 0.65, worldZ]}>
            <Text
              fontSize={0.22}
              color="#ffffff"
              outlineColor="#1e293b"
              outlineWidth={0.03}
              anchorX="center"
              anchorY="middle"
            >
              {m.text}
            </Text>
          </Billboard>
        )
      })}
    </>
  )
}

// ─── MapGrid ──────────────────────────────────────────────────────────────────

const CRACKED_TILE_SEEDS: Record<string, number> = {
  '1,3': 7,  '3,5': 13, '5,2': 3,  '2,8': 19,
  '7,7': 42, '0,4': 5,  '4,1': 11, '8,3': 27,
  '6,6': 17, '9,5': 8,
}

// Tiles that have floating debris in flood
const DEBRIS_TILE_SEEDS: Record<string, number> = {
  '1,9': 1, '5,7': 2, '3,8': 3, '6,4': 4, '2,3': 5, '7,5': 6,
}

export default function MapGrid() {
  const currentLevel = useSimulationStore(s => s.currentLevel)

  if (!currentLevel) return null

  const config = LEVELS[currentLevel]
  const colors = LEVEL_COLORS[currentLevel]
  const isEarthquake = currentLevel === 'earthquake'
  const isFlood = currentLevel === 'flood'

  const offset = useMemo(
    () => (config.gridSize * STEP) / 2 - STEP / 2,
    [config.gridSize]
  )

  const tiles = useMemo<TileData[]>(() => {
    const result: TileData[] = []
    for (let x = 0; x < config.gridSize; x++) {
      for (let z = 0; z < config.gridSize; z++) {
        const key = `${x},${z}`
        let type: TileType = 'floor'
        const isGoal = config.goals.some(g => g.x === x && g.z === z)
        if (isGoal)                             type = 'goal'
        else if (config.fireCoords.has(key))    type = 'fire'
        else if (config.obstacles.has(key))     type = 'obstacle'
        else if (config.treeCoords.has(key))    type = 'tree'
        result.push({ x, z, type, worldX: x * STEP - offset, worldZ: z * STEP - offset })
      }
    }
    return result
  }, [config, offset])

  return (
    <group>
      {/* ── Lighting for Earthquake ── */}
      {isEarthquake && (
        <>
          <ambientLight color="#ffffff" intensity={1.2} />
          <directionalLight
            color="#fff5e0"
            position={[10, 20, 10]}
            intensity={2.0}
            castShadow
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
            shadow-camera-near={0.1}
            shadow-camera-far={60}
            shadow-camera-left={-18}
            shadow-camera-right={18}
            shadow-camera-top={18}
            shadow-camera-bottom={-18}
          />
          <directionalLight
            color="#ffe0b2"
            position={[-10, 15, -5]}
            intensity={1.0}
          />
        </>
      )}

      {/* ── Non-earthquake ambient (tsunami) ── */}
      {!isEarthquake && !isFlood && (
        <>
          <ambientLight intensity={0.7} />
          <directionalLight castShadow position={[5, 10, 5]} intensity={1.2}
            shadow-mapSize-width={1024} shadow-mapSize-height={1024}
            shadow-camera-near={0.1} shadow-camera-far={50}
            shadow-camera-left={-15} shadow-camera-right={15}
            shadow-camera-top={15} shadow-camera-bottom={-15}
          />
          <directionalLight position={[-5, 5, -5]} intensity={0.6} />
        </>
      )}

      {/* ── Base Ground Plane ── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[config.gridSize * STEP + 0.3, config.gridSize * STEP + 0.3]} />
        <meshStandardMaterial color={colors.grid} roughness={0.9} />
      </mesh>

      {/* ── Flood: deep water base plane ── */}
      {isFlood && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.005, 0]}>
          <planeGeometry args={[config.gridSize * STEP + 0.3, config.gridSize * STEP + 0.3]} />
          <meshPhongMaterial color="#0d3d52" shininess={80} specular={new THREE.Color('#1a6b8a')} transparent opacity={0.95} />
        </mesh>
      )}

      {/* ── Tiles ── */}
      {tiles.map((tile) => {
        const key = `${tile.x}-${tile.z}`
        const isAlt = (tile.x + tile.z) % 2 === 0
        const tileKey = `${tile.x},${tile.z}`

        if (isEarthquake) {
          switch (tile.type) {
            case 'goal':
              return <EarthquakeSafeZone key={key} worldX={tile.worldX} worldZ={tile.worldZ} />
            case 'obstacle':
              return (
                <EarthquakeObstacleTile
                  key={key}
                  worldX={tile.worldX}
                  worldZ={tile.worldZ}
                  gridX={tile.x}
                  gridZ={tile.z}
                />
              )
            default:
              if (CRACKED_TILE_SEEDS[tileKey] !== undefined) {
                return (
                  <CrackedFloorTile
                    key={key}
                    worldX={tile.worldX}
                    worldZ={tile.worldZ}
                    isAlt={isAlt}
                    seed={CRACKED_TILE_SEEDS[tileKey]}
                  />
                )
              }
              return (
                <EarthquakeFloorTile key={key} worldX={tile.worldX} worldZ={tile.worldZ} isAlt={isAlt} />
              )
          }
        }

        // ── Flood level rendering ──
        if (isFlood) {
          switch (tile.type) {
            case 'goal':
              return <FloodSafeZone key={key} worldX={tile.worldX} worldZ={tile.worldZ} />
            case 'obstacle':
              return <FloodHouseObstacle key={key} worldX={tile.worldX} worldZ={tile.worldZ} gridX={tile.x} gridZ={tile.z} />
            case 'tree':
              return <FloodTreeObstacle key={key} worldX={tile.worldX} worldZ={tile.worldZ} gridX={tile.x} gridZ={tile.z} />
            default:
              return (
                <AnimatedWaterTile
                  key={key}
                  worldX={tile.worldX}
                  worldZ={tile.worldZ}
                  isAlt={isAlt}
                  seed={tile.x * 11 + tile.z * 7}
                  withDebris={DEBRIS_TILE_SEEDS[tileKey] !== undefined}
                />
              )
          }
        }

        // ── Non-earthquake, non-flood (Tsunami) ──
        switch (tile.type) {
          case 'goal':
            return <GoalTile key={key} worldX={tile.worldX} worldZ={tile.worldZ} colors={colors} />
          case 'obstacle':
            return <ObstacleTile key={key} worldX={tile.worldX} worldZ={tile.worldZ} isFire={false} colors={colors} />
          case 'fire':
            return <ObstacleTile key={key} worldX={tile.worldX} worldZ={tile.worldZ} isFire={true} colors={colors} />
          default:
            return <FloorTile key={key} worldX={tile.worldX} worldZ={tile.worldZ} isAlt={isAlt} colors={colors} />
        }
      })}

      {/* ── Goal shadow labels (non-earthquake, non-flood) ── */}
      {!isEarthquake && !isFlood && config.goals.map((g, index) => (
        <mesh
          key={`goal-shadow-${index}`}
          position={[g.x * STEP - offset, 0.12, g.z * STEP - offset]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[0.6, 0.25]} />
          <meshBasicMaterial color={colors.goal} transparent opacity={0.15} />
        </mesh>
      ))}

      {/* ── Earthquake-specific atmosphere ── */}
      {isEarthquake && (
        <>
          <EarthquakeVocabMarkers offset={offset} />
          <DustClouds />
        </>
      )}

      {/* ── Flood-specific atmosphere ── */}
      {isFlood && <FloodAtmosphere offset={offset} />}

      {/* ── Route markers (tsunami only) ── */}
      <RouteMarkers />
    </group>
  )
}
