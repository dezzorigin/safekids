import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useSimulationStore, LEVELS } from '@/store/useSimulationStore'
import type { Facing } from '@/store/useSimulationStore'

// ─── Constants ────────────────────────────────────────────────────────────────

const TILE_SIZE = 1
const TILE_GAP  = 0.04
const STEP      = TILE_SIZE + TILE_GAP
const LERP_SPEED = 8

function gridToWorld(coord: number, gridSize: number): number {
  const offset = (gridSize * STEP) / 2 - STEP / 2
  return coord * STEP - offset
}

const FACING_RAD: Record<Facing, number> = {
  0:   0,
  90:  -Math.PI / 2,
  180: Math.PI,
  270: Math.PI / 2,
}

// ─── Footstep Dust Particles ──────────────────────────────────────────────────

const DUST_COUNT = 6

interface DustParticle {
  active: boolean
  x: number
  z: number
  vx: number
  vz: number
  y: number
  life: number
  maxLife: number
}

function FootstepDust({ groupRef, isMoving, isEarthquake }: {
  groupRef: React.RefObject<THREE.Group | null>
  isMoving: boolean
  isEarthquake: boolean
}) {
  const dustRef = useRef<THREE.InstancedMesh>(null)
  const particles = useRef<DustParticle[]>(
    Array.from({ length: DUST_COUNT }, () => ({
      active: false, x: 0, z: 0, vx: 0, vz: 0, y: 0, life: 0, maxLife: 0.5,
    }))
  )
  const spawnTimer = useRef(0)
  const dummy = useMemo(() => new THREE.Object3D(), [])

  useFrame((_, delta) => {
    if (!dustRef.current || !groupRef.current) return
    if (!isEarthquake) return

    spawnTimer.current += delta

    // Spawn dust while moving
    if (isMoving && spawnTimer.current > 0.08) {
      spawnTimer.current = 0
      const p = particles.current.find(p => !p.active)
      if (p) {
        p.active = true
        p.x = groupRef.current!.position.x + (Math.random() - 0.5) * 0.2
        p.z = groupRef.current!.position.z + (Math.random() - 0.5) * 0.2
        p.y = 0.02
        p.vx = (Math.random() - 0.5) * 0.8
        p.vz = (Math.random() - 0.5) * 0.8
        p.life = 0
        p.maxLife = 0.35 + Math.random() * 0.2
      }
    }

    // Update particles
    particles.current.forEach((p, i) => {
      if (!p.active) {
        dummy.scale.setScalar(0)
        dummy.updateMatrix()
        dustRef.current!.setMatrixAt(i, dummy.matrix)
        return
      }
      p.life += delta
      if (p.life >= p.maxLife) {
        p.active = false
        dummy.scale.setScalar(0)
        dummy.updateMatrix()
        dustRef.current!.setMatrixAt(i, dummy.matrix)
        return
      }
      const t = p.life / p.maxLife
      p.x += p.vx * delta * 0.5
      p.z += p.vz * delta * 0.5
      p.y += delta * 0.1
      const sc = (1 - t) * 0.08
      dummy.position.set(p.x, p.y, p.z)
      dummy.scale.setScalar(sc)
      dummy.updateMatrix()
      dustRef.current!.setMatrixAt(i, dummy.matrix)
    })

    dustRef.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={dustRef} args={[undefined, undefined, DUST_COUNT]}>
      <sphereGeometry args={[1, 4, 4]} />
      <meshBasicMaterial color="#a08060" transparent opacity={0.5} depthWrite={false} />
    </instancedMesh>
  )
}

// ─── Water Splash Particles (Flood) ─────────────────────────────────────────

const SPLASH_COUNT = 8

interface SplashParticle {
  active: boolean
  x: number
  z: number
  vx: number
  vz: number
  vy: number
  y: number
  life: number
  maxLife: number
}

function WaterSplash({ groupRef, isMoving, isFlood }: {
  groupRef: React.RefObject<THREE.Group | null>
  isMoving: boolean
  isFlood: boolean
}) {
  const splashRef = useRef<THREE.InstancedMesh>(null)
  const particles = useRef<SplashParticle[]>(
    Array.from({ length: SPLASH_COUNT }, () => ({
      active: false, x: 0, z: 0, vx: 0, vz: 0, vy: 0, y: 0, life: 0, maxLife: 0.4,
    }))
  )
  const spawnTimer = useRef(0)
  const dummy = useMemo(() => new THREE.Object3D(), [])

  useFrame((_, delta) => {
    if (!splashRef.current || !groupRef.current) return
    if (!isFlood) return

    spawnTimer.current += delta

    if (isMoving && spawnTimer.current > 0.07) {
      spawnTimer.current = 0
      const inactive = particles.current.filter(p => !p.active).slice(0, 3)
      inactive.forEach(p => {
        p.active = true
        p.x = groupRef.current!.position.x + (Math.random() - 0.5) * 0.3
        p.z = groupRef.current!.position.z + (Math.random() - 0.5) * 0.3
        p.y = 0.05
        p.vx = (Math.random() - 0.5) * 1.8
        p.vz = (Math.random() - 0.5) * 1.8
        p.vy = 0.8 + Math.random() * 0.8
        p.life = 0
        p.maxLife = 0.3 + Math.random() * 0.2
      })
    }

    particles.current.forEach((p, i) => {
      if (!p.active) {
        dummy.scale.setScalar(0)
        dummy.updateMatrix()
        splashRef.current!.setMatrixAt(i, dummy.matrix)
        return
      }
      p.life += delta
      if (p.life >= p.maxLife) {
        p.active = false
        dummy.scale.setScalar(0)
        dummy.updateMatrix()
        splashRef.current!.setMatrixAt(i, dummy.matrix)
        return
      }
      const t = p.life / p.maxLife
      p.x += p.vx * delta * 0.5
      p.z += p.vz * delta * 0.5
      p.y += (p.vy - t * p.vy * 2) * delta
      if (p.y < 0.02) p.y = 0.02
      const sc = (1 - t) * 0.055
      dummy.position.set(p.x, p.y, p.z)
      dummy.scale.setScalar(sc)
      dummy.updateMatrix()
      splashRef.current!.setMatrixAt(i, dummy.matrix)
    })

    splashRef.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={splashRef} args={[undefined, undefined, SPLASH_COUNT]}>
      <sphereGeometry args={[1, 4, 4]} />
      <meshBasicMaterial color="#4fc3f7" transparent opacity={0.75} depthWrite={false} />
    </instancedMesh>
  )
}


export default function Avatar() {
  const groupRef = useRef<THREE.Group>(null)

  const currentLevel = useSimulationStore((s) => s.currentLevel)
  const x       = useSimulationStore((s) => s.x)
  const z       = useSimulationStore((s) => s.z)
  const facing  = useSimulationStore((s) => s.facing)
  const status  = useSimulationStore((s) => s.status)
  const isMoving = useSimulationStore((s) => s.isMoving)
  const setIsMoving = useSimulationStore((s) => s.setIsMoving)

  const gridSize = useMemo(() => {
    return currentLevel ? LEVELS[currentLevel].gridSize : 10
  }, [currentLevel])

  const targetWorldX = useMemo(() => gridToWorld(x, gridSize), [x, gridSize])
  const targetWorldZ = useMemo(() => gridToWorld(z, gridSize), [z, gridSize])
  const targetRotY   = useMemo(() => FACING_RAD[facing], [facing])

  const arrowRef = useRef<THREE.Mesh>(null)
  const bodyRef  = useRef<THREE.Mesh>(null)
  const legLRef  = useRef<THREE.Mesh>(null)
  const legRRef  = useRef<THREE.Mesh>(null)
  const armLRef  = useRef<THREE.Mesh>(null)
  const armRRef  = useRef<THREE.Mesh>(null)

  const isEarthquake = currentLevel === 'earthquake'
  const isFlood = currentLevel === 'flood'

  useFrame((_, delta) => {
    if (!groupRef.current) return
    const t = 1 - Math.pow(0.001, delta * LERP_SPEED)

    const prevX = groupRef.current.position.x
    const prevZ = groupRef.current.position.z

    groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, targetWorldX, t)
    groupRef.current.position.z = THREE.MathUtils.lerp(groupRef.current.position.z, targetWorldZ, t)

    const targetQuat = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(0, 1, 0),
      targetRotY,
    )
    groupRef.current.quaternion.slerp(targetQuat, t)

    const dx = Math.abs(groupRef.current.position.x - targetWorldX)
    const dz = Math.abs(groupRef.current.position.z - targetWorldZ)
    const isClose = dx < 0.005 && dz < 0.005
    const wasMoving = Math.abs(prevX - groupRef.current.position.x) > 0.001
      || Math.abs(prevZ - groupRef.current.position.z) > 0.001
    if (wasMoving && isClose) setIsMoving(false)

    const time = Date.now() * 0.003

    // Body bob (running animation when moving)
    if (bodyRef.current) {
      const bobFreq = isMoving ? 8 : 1
      const bobAmp  = isMoving ? 0.06 : 0.03
      bodyRef.current.position.y = 0.55 + Math.sin(time * bobFreq) * bobAmp
    }

    // Leg swing when moving
    if (legLRef.current && legRRef.current) {
      const swing = isMoving ? Math.sin(time * 8) * 0.12 : 0
      legLRef.current.rotation.x =  swing
      legRRef.current.rotation.x = -swing
    }

    // Arm swing when moving
    if (armLRef.current && armRRef.current) {
      const swing = isMoving ? Math.sin(time * 8) * 0.15 : 0
      armLRef.current.rotation.x = -swing
      armRRef.current.rotation.x =  swing
    }

    // Arrow pulse
    if (arrowRef.current) {
      const pulse = 0.85 + Math.sin(time * 1.3) * 0.15
      arrowRef.current.scale.set(pulse, pulse, pulse)
    }

    // Flood water bob — subtle vertical oscillation
    if (isFlood && groupRef.current) {
      groupRef.current.position.y = Math.sin(time * 2.0) * 0.04
    }
  })

  if (!currentLevel) return null

  // For Gempa Bumi: Blue body, peach head
  const bodyColor   = isEarthquake
    ? (status === 'success' ? '#22c55e' : '#3b82f6')
    : (status === 'success' ? '#22c55e' : status === 'failed' ? '#ef4444' : '#ffffff')
  const helmetColor = status === 'success' ? '#4ade80' : '#fbbf24'
  const headColor   = '#fbbf24' // peach

  return (
    <group key={currentLevel} ref={groupRef} position={[gridToWorld(0, gridSize), 0, gridToWorld(0, gridSize)]}>

      {/* ── Avatar point light ─── */}
      <pointLight color={bodyColor} intensity={0.6} distance={3} />

      {/* ── Left Leg ─────────────────────────────────────── */}
      <mesh ref={legLRef} position={[-0.09, 0.15, 0]}>
        <boxGeometry args={[0.1, 0.28, 0.1]} />
        {isEarthquake ? (
          <meshLambertMaterial color="#1e40af" />
        ) : (
          <meshStandardMaterial color="#1e3a5f" roughness={0.7} />
        )}
      </mesh>

      {/* ── Right Leg ────────────────────────────────────── */}
      <mesh ref={legRRef} position={[0.09, 0.15, 0]}>
        <boxGeometry args={[0.1, 0.28, 0.1]} />
        {isEarthquake ? (
          <meshLambertMaterial color="#1e40af" />
        ) : (
          <meshStandardMaterial color="#1e3a5f" roughness={0.7} />
        )}
      </mesh>

      {/* ── Body ─────────────────────────────────────────── */}
      <mesh ref={bodyRef} position={[0, 0.55, 0]} castShadow>
        <boxGeometry args={[0.32, 0.36, 0.18]} />
        {isEarthquake ? (
          <meshLambertMaterial
            color={bodyColor}
            emissive={bodyColor}
            emissiveIntensity={status === 'success' ? 0.4 : 0.08}
          />
        ) : (
          <meshStandardMaterial
            color={bodyColor}
            roughness={0.4}
            metalness={0.2}
            emissive={bodyColor}
            emissiveIntensity={status === 'success' ? 0.4 : 0.08}
          />
        )}
      </mesh>

      {/* ── Left Arm ─────────────────────────────────────── */}
      <mesh ref={armLRef} position={[-0.22, 0.52, 0]}>
        <boxGeometry args={[0.1, 0.28, 0.1]} />
        {isEarthquake ? (
          <meshLambertMaterial color={bodyColor} />
        ) : (
          <meshStandardMaterial color={bodyColor} roughness={0.5} />
        )}
      </mesh>

      {/* ── Right Arm ────────────────────────────────────── */}
      <mesh ref={armRRef} position={[0.22, 0.52, 0]}>
        <boxGeometry args={[0.1, 0.28, 0.1]} />
        {isEarthquake ? (
          <meshLambertMaterial color={bodyColor} />
        ) : (
          <meshStandardMaterial color={bodyColor} roughness={0.5} />
        )}
      </mesh>

      {/* ── Neck ─────────────────────────────────────────── */}
      <mesh position={[0, 0.76, 0]}>
        <boxGeometry args={[0.1, 0.08, 0.1]} />
        {isEarthquake ? (
          <meshLambertMaterial color={headColor} />
        ) : (
          <meshStandardMaterial color={headColor} roughness={0.6} />
        )}
      </mesh>

      {/* ── Head ─────────────────────────────────────────── */}
      <mesh position={[0, 0.9, 0]} castShadow>
        <boxGeometry args={[0.26, 0.26, 0.26]} />
        {isEarthquake ? (
          <meshLambertMaterial color={headColor} />
        ) : (
          <meshStandardMaterial color={headColor} roughness={0.5} metalness={0.1} />
        )}
      </mesh>

      {/* ── Helmet ───────────────────────────────────────── */}
      <mesh position={[0, 1.01, 0]}>
        <boxGeometry args={[0.29, 0.1, 0.29]} />
        <meshStandardMaterial
          color={helmetColor}
          roughness={0.3}
          metalness={0.5}
          emissive={helmetColor}
          emissiveIntensity={0.15}
        />
      </mesh>

      {/* ── Direction Arrow ──────────────────────────────── */}
      <mesh ref={arrowRef} position={[0, 0.05, -0.56]} rotation={[-Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.1, 0.2, 3]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.85} />
      </mesh>

      {/* ── Footstep Dust (earthquake only) ──────────────── */}
      <FootstepDust groupRef={groupRef} isMoving={isMoving} isEarthquake={isEarthquake} />

      {/* ── Water Splash (flood only) ─────────────────────── */}
      <WaterSplash groupRef={groupRef} isMoving={isMoving} isFlood={isFlood} />
    </group>
  )
}
