import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// ─── Constants ────────────────────────────────────────────────────────────────

const TILE_SIZE = 1
const TILE_GAP  = 0.04
const STEP      = TILE_SIZE + TILE_GAP

const GROUND_COLOR = '#8B6914'
const GROUND_EXTEND = 2 // units beyond grid edge

// ─── Cloud Puff (group of spheres forming one cloud) ──────────────────────────

interface CloudConfig {
  position: [number, number, number]
  scale: number
  speed: number
  phase: number
}

function CloudPuff({ config }: { config: CloudConfig }) {
  const groupRef = useRef<THREE.Group>(null)
  const baseY = config.position[1]

  useFrame((state) => {
    if (!groupRef.current) return
    const t = state.clock.elapsedTime
    // Gentle float up/down
    groupRef.current.position.y = baseY + Math.sin(t * config.speed + config.phase) * 0.1
  })

  const puffColor = '#e8e8e8'
  const puffColorDark = '#d0d0d0'

  return (
    <group ref={groupRef} position={config.position} scale={config.scale}>
      {/* Main body */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.5, 8, 6]} />
        <meshLambertMaterial color={puffColor} transparent opacity={0.85} />
      </mesh>
      {/* Left puff */}
      <mesh position={[-0.35, -0.05, 0.1]}>
        <sphereGeometry args={[0.38, 7, 5]} />
        <meshLambertMaterial color={puffColorDark} transparent opacity={0.8} />
      </mesh>
      {/* Right puff */}
      <mesh position={[0.4, -0.08, -0.05]}>
        <sphereGeometry args={[0.42, 7, 5]} />
        <meshLambertMaterial color={puffColor} transparent opacity={0.82} />
      </mesh>
      {/* Top puff */}
      <mesh position={[0.05, 0.25, 0.08]}>
        <sphereGeometry args={[0.3, 6, 5]} />
        <meshLambertMaterial color="#f0f0f0" transparent opacity={0.75} />
      </mesh>
    </group>
  )
}

// ─── Environment Component ────────────────────────────────────────────────────

export default function Environment({ gridSize }: { gridSize: number }) {
  const gridExtent = (gridSize * STEP) / 2
  const groundSize = gridSize * STEP + GROUND_EXTEND * 2 + 2

  // Generate cloud positions at corners and sides
  const clouds = useMemo<CloudConfig[]>(() => {
    const extent = gridExtent + 2.5
    return [
      // Four corners
      { position: [-extent, 4.0, -extent] as [number, number, number], scale: 1.8, speed: 0.3, phase: 0 },
      { position: [extent, 4.5, -extent] as [number, number, number], scale: 2.2, speed: 0.25, phase: 1.2 },
      { position: [-extent, 3.8, extent] as [number, number, number], scale: 2.0, speed: 0.35, phase: 2.4 },
      { position: [extent, 4.2, extent] as [number, number, number], scale: 1.6, speed: 0.28, phase: 3.6 },
      // Sides
      { position: [0, 5.0, -extent - 1] as [number, number, number], scale: 2.5, speed: 0.2, phase: 0.8 },
      { position: [0, 4.8, extent + 1] as [number, number, number], scale: 1.9, speed: 0.32, phase: 1.6 },
      { position: [-extent - 1, 4.3, 0] as [number, number, number], scale: 1.7, speed: 0.27, phase: 2.0 },
      { position: [extent + 1, 4.6, 0] as [number, number, number], scale: 2.1, speed: 0.22, phase: 3.2 },
    ]
  }, [gridExtent])

  return (
    <group>
      {/* ── Ground Plane ───────────────────────────────────────── */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -1, 0]}
        receiveShadow
      >
        <planeGeometry args={[groundSize, groundSize]} />
        <meshStandardMaterial
          color={GROUND_COLOR}
          roughness={0.95}
          metalness={0.02}
        />
      </mesh>

      {/* ── Decorative Clouds ──────────────────────────────────── */}
      {clouds.map((cloud, i) => (
        <CloudPuff key={`cloud-${i}`} config={cloud} />
      ))}
    </group>
  )
}
