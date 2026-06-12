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

// ─── OutlineBox Component ─────────────────────────────────────────────────────

interface OutlineBoxProps {
  args: [number, number, number]
  position: [number, number, number]
  color: string
  outlineColor: string
  emissiveIntensity?: number
  innerRef?: React.RefObject<THREE.Group>
}

function OutlineBox({ args, position, color, outlineColor, emissiveIntensity = 0, innerRef }: OutlineBoxProps) {
  return (
    <group position={position} ref={innerRef}>
      <mesh castShadow>
        <boxGeometry args={args} />
        <meshStandardMaterial
          color={color}
          roughness={0.4}
          metalness={0.2}
          emissive={color}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>
      {/* Neo-brutalism outline via BackSide rendering */}
      <mesh scale={1.08}>
        <boxGeometry args={args} />
        <meshBasicMaterial color={outlineColor} side={THREE.BackSide} />
      </mesh>
    </group>
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

  const upperBodyRef = useRef<THREE.Group>(null)
  const legLRef      = useRef<THREE.Group>(null)
  const legRRef      = useRef<THREE.Group>(null)
  const armLRef      = useRef<THREE.Group>(null)
  const armRRef      = useRef<THREE.Group>(null)

  const isFlood = currentLevel === 'flood'

  useFrame((_, delta) => {
    try {
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

    // Upper body bob (running animation when moving)
    if (upperBodyRef.current) {
      const bobFreq = isMoving ? 8 : 1
      const bobAmp  = isMoving ? 0.06 : 0.03
      upperBodyRef.current.position.y = 0.75 + Math.sin(time * bobFreq) * bobAmp
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

    // Flood water bob — subtle vertical oscillation
    if (isFlood && groupRef.current) {
      groupRef.current.position.y = Math.sin(time * 2.0) * 0.04
    }
  
    } catch (err) {
      console.error('Avatar useFrame error:', err)
    }
  })

  if (!currentLevel) return null

  // Neo-Brutalism character: Yellow body, coral accent
  const bodyColor   = status === 'success' ? '#22c55e' : status === 'failed' ? '#ef4444' : '#FFE135'
  const helmetColor = status === 'success' ? '#4ade80' : '#FF6B6B'
  const headColor   = '#FFE135'
  const legColor    = '#1A1A2E'
  const outlineColor = '#1A1A2E'

  return (
    <group key={currentLevel} ref={groupRef} position={[gridToWorld(0, gridSize), 0, gridToWorld(0, gridSize)]}>

      {/* ── Avatar point light ─── */}
      <pointLight color={bodyColor} intensity={0.6} distance={3} />

      {/* ── Left Leg ─────────────────────────────────────── */}
      <OutlineBox
        innerRef={legLRef}
        position={[-0.12, 0.2, 0]}
        args={[0.18, 0.4, 0.18]}
        color={legColor}
        outlineColor={outlineColor}
      />

      {/* ── Right Leg ────────────────────────────────────── */}
      <OutlineBox
        innerRef={legRRef}
        position={[0.12, 0.2, 0]}
        args={[0.18, 0.4, 0.18]}
        color={legColor}
        outlineColor={outlineColor}
      />

      {/* ── Upper Body Wrapper ───────────────────────────── */}
      <group ref={upperBodyRef} position={[0, 0.75, 0]}>
        
        {/* ── Body ─────────────────────────────────────────── */}
        <OutlineBox
          position={[0, 0, 0]}
          args={[0.5, 0.7, 0.4]}
          color={bodyColor}
          outlineColor={outlineColor}
          emissiveIntensity={status === 'success' ? 0.4 : 0.08}
        />

        {/* ── Back Direction Marker (Red Cross/T-Arrow) ── */}
        {/* Vertical Bar */}
        <mesh position={[0, 0, 0.21]} castShadow>
          <boxGeometry args={[0.03, 0.15, 0.02]} />
          <meshStandardMaterial color="#FF6B6B" roughness={0.5} />
        </mesh>
        {/* Horizontal Bar */}
        <mesh position={[0, 0.06, 0.21]} castShadow>
          <boxGeometry args={[0.15, 0.03, 0.02]} />
          <meshStandardMaterial color="#FF6B6B" roughness={0.5} />
        </mesh>

        {/* ── Head ─────────────────────────────────────────── */}
        <OutlineBox
          position={[0, 0.525, 0]}
          args={[0.35, 0.35, 0.35]}
          color={headColor}
          outlineColor={outlineColor}
        />

        {/* ── Face Elements (attached to the front of the head) ── */}
        {/* Mata Kiri */}
        <mesh position={[-0.08, 0.575, -0.185]} castShadow>
          <boxGeometry args={[0.08, 0.08, 0.02]} />
          <meshStandardMaterial color="#1A1A2E" roughness={0.5} />
        </mesh>
        {/* Mata Kiri Highlight */}
        <mesh position={[-0.055, 0.595, -0.195]} castShadow>
          <boxGeometry args={[0.03, 0.03, 0.02]} />
          <meshStandardMaterial color="#FFFFFF" roughness={0.2} />
        </mesh>

        {/* Mata Kanan */}
        <mesh position={[0.08, 0.575, -0.185]} castShadow>
          <boxGeometry args={[0.08, 0.08, 0.02]} />
          <meshStandardMaterial color="#1A1A2E" roughness={0.5} />
        </mesh>
        {/* Mata Kanan Highlight */}
        <mesh position={[0.105, 0.595, -0.195]} castShadow>
          <boxGeometry args={[0.03, 0.03, 0.02]} />
          <meshStandardMaterial color="#FFFFFF" roughness={0.2} />
        </mesh>

        {/* Hidung */}
        <mesh position={[0, 0.505, -0.19]} castShadow>
          <boxGeometry args={[0.05, 0.04, 0.03]} />
          <meshStandardMaterial color="#FF9A3C" roughness={0.5} />
        </mesh>

        {/* Mulut Senyum */}
        {/* Tengah */}
        <mesh position={[0, 0.445, -0.185]} castShadow>
          <boxGeometry args={[0.1, 0.03, 0.02]} />
          <meshStandardMaterial color="#1A1A2E" roughness={0.5} />
        </mesh>
        {/* Kiri */}
        <mesh position={[-0.05, 0.465, -0.185]} castShadow>
          <boxGeometry args={[0.03, 0.05, 0.02]} />
          <meshStandardMaterial color="#1A1A2E" roughness={0.5} />
        </mesh>
        {/* Kanan */}
        <mesh position={[0.05, 0.465, -0.185]} castShadow>
          <boxGeometry args={[0.03, 0.05, 0.02]} />
          <meshStandardMaterial color="#1A1A2E" roughness={0.5} />
        </mesh>

        {/* ── Helmet ───────────────────────────────────────── */}
        <OutlineBox
          position={[0, 0.775, 0]}
          args={[0.38, 0.15, 0.38]}
          color={helmetColor}
          outlineColor={outlineColor}
          emissiveIntensity={0.15}
        />

        {/* ── Left Arm ─────────────────────────────────────── */}
        <OutlineBox
          innerRef={armLRef}
          position={[-0.35, 0, 0]}
          args={[0.15, 0.45, 0.15]}
          color={bodyColor}
          outlineColor={outlineColor}
        />

        {/* ── Right Arm ────────────────────────────────────── */}
        <OutlineBox
          innerRef={armRRef}
          position={[0.35, 0, 0]}
          args={[0.15, 0.45, 0.15]}
          color={bodyColor}
          outlineColor={outlineColor}
        />
        
      </group>
    </group>
  )
}
