"use client"

import { useRef, useMemo } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { Float, MeshTransmissionMaterial, ContactShadows, Environment, Stars, PerspectiveCamera } from "@react-three/drei"
import * as THREE from "three"

function Molecule({ scale = 1 }: { scale?: number }) {
    const meshRef = useRef<THREE.Group>(null)

    useFrame((state) => {
        if (!meshRef.current) return
        const time = state.clock.getElapsedTime()
        // Slow elegant rotation of the whole group
        meshRef.current.rotation.y = time * 0.1
        meshRef.current.rotation.z = time * 0.05
    })

    return (
        <group ref={meshRef} scale={scale}>
            <MedicineValidationScene />
        </group>
    )
}

// Main scene: Two medicine streams converging through a validation barrier
function MedicineValidationScene() {
    const groupRef = useRef<THREE.Group>(null)

    useFrame((state) => {
        if (!groupRef.current) return
        // Very subtle breathing effect only
        const t = state.clock.getElapsedTime()
        const s = 1 + Math.sin(t * 0.3) * 0.02
        groupRef.current.scale.set(s, s, s)
    })

    return (
        <group ref={groupRef}>
            {/* Medicine Stream A - Left side, moving toward center */}
            <MedicineStream
                startPosition={[-5, 0, 0]}
                endPosition={[0, 0, 0]}
                color="#6366f1" // Indigo
                count={8}
                offset={0}
            />

            {/* Medicine Stream B - Right side, moving toward center */}
            <MedicineStream
                startPosition={[5, 0, 0]}
                endPosition={[0, 0, 0]}
                color="#06b6d4" // Cyan
                count={8}
                offset={Math.PI}
            />

            {/* Central Validation Barrier */}
            <ValidationBarrier />

            {/* Post-validation merged stream */}
            <MergedStream />
        </group>
    )
}

// Stream of capsule-shaped medicine particles
function MedicineStream({
    startPosition,
    endPosition,
    color,
    count,
    offset
}: {
    startPosition: [number, number, number]
    endPosition: [number, number, number]
    color: string
    count: number
    offset: number
}) {
    const particles = useMemo(() => {
        return Array.from({ length: count }, (_, i) => ({
            id: i,
            phase: (i / count) * Math.PI * 2,
            yOffset: (i / count - 0.5) * 4
        }))
    }, [count])

    return (
        <group>
            {particles.map((p) => (
                <MedicineCapsule
                    key={p.id}
                    startPos={startPosition}
                    endPos={endPosition}
                    color={color}
                    phase={p.phase + offset}
                    yOffset={p.yOffset}
                />
            ))}
        </group>
    )
}

// Single medicine capsule particle
function MedicineCapsule({
    startPos,
    endPos,
    color,
    phase,
    yOffset
}: {
    startPos: [number, number, number]
    endPos: [number, number, number]
    color: string
    phase: number
    yOffset: number
}) {
    const ref = useRef<THREE.Group>(null)

    useFrame((state) => {
        if (!ref.current) return
        const t = state.clock.getElapsedTime() * 0.3 + phase // Slow flow

        // Smooth flow from start to end
        const progress = (Math.sin(t) + 1) / 2 // 0 to 1
        const x = THREE.MathUtils.lerp(startPos[0], endPos[0], progress)
        const z = startPos[2]

        ref.current.position.set(x, yOffset, z)

        // Subtle rotation aligned with flow direction
        ref.current.rotation.z = Math.PI / 2
    })

    return (
        <group ref={ref}>
            <mesh>
                {/* Capsule geometry - pill shaped */}
                <capsuleGeometry args={[0.15, 0.5, 4, 8]} />
                <meshStandardMaterial
                    color={color}
                    emissive={color}
                    emissiveIntensity={0.3}
                    roughness={0.7}
                    metalness={0.1}
                    transparent
                    opacity={0.85}
                />
            </mesh>

            {/* Soft glow halo */}
            <mesh scale={1.3}>
                <capsuleGeometry args={[0.15, 0.5, 4, 8]} />
                <meshBasicMaterial
                    color={color}
                    transparent
                    opacity={0.15}
                />
            </mesh>
        </group>
    )
}

// Central validation barrier - scanning grid
function ValidationBarrier() {
    const ref = useRef<THREE.Group>(null)

    useFrame((state) => {
        if (!ref.current) return
        const t = state.clock.getElapsedTime()
        // Gentle pulsing
        const opacity = 0.3 + Math.sin(t * 0.5) * 0.1
        ref.current.children.forEach((child) => {
            if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
                child.material.opacity = opacity
            }
        })
    })

    return (
        <group ref={ref} position={[0, 0, 0]}>
            {/* Vertical scanning plane */}
            <mesh rotation={[0, Math.PI / 2, 0]}>
                <planeGeometry args={[6, 6, 12, 12]} />
                <meshStandardMaterial
                    color="#8b5cf6"
                    emissive="#8b5cf6"
                    emissiveIntensity={0.4}
                    transparent
                    opacity={0.25}
                    wireframe
                    side={THREE.DoubleSide}
                />
            </mesh>

            {/* Central verification icon - simple shield */}
            <mesh>
                <ringGeometry args={[0.6, 0.8, 6]} />
                <meshStandardMaterial
                    color="#a78bfa"
                    emissive="#a78bfa"
                    emissiveIntensity={0.8}
                    roughness={0.5}
                    metalness={0.2}
                />
            </mesh>
        </group>
    )
}

// Merged stream after validation
function MergedStream() {
    const particles = useMemo(() => {
        return Array.from({ length: 4 }, (_, i) => ({
            id: i,
            yOffset: (i / 4 - 0.5) * 3
        }))
    }, [])

    return (
        <group>
            {particles.map((p) => (
                <VerifiedParticle key={p.id} yOffset={p.yOffset} index={p.id} />
            ))}
        </group>
    )
}

function VerifiedParticle({ yOffset, index }: { yOffset: number, index: number }) {
    const ref = useRef<THREE.Mesh>(null)

    useFrame((state) => {
        if (!ref.current) return
        const t = state.clock.getElapsedTime() * 0.25 + index * 0.5

        // Slow drift away from center after validation
        const x = Math.sin(t) * 0.3
        const z = -2 - t % 4 // Move backward slowly

        ref.current.position.set(x, yOffset, z)
    })

    return (
        <mesh ref={ref}>
            <capsuleGeometry args={[0.12, 0.4, 4, 8]} />
            <meshStandardMaterial
                color="#10b981" // Safe green
                emissive="#10b981"
                emissiveIntensity={0.5}
                roughness={0.6}
                metalness={0.2}
                transparent
                opacity={0.7}
            />
        </mesh>
    )
}

function Scene() {
    const { viewport } = useThree()
    const scale = viewport.width < 5 ? 0.7 : 1
    const positionX = viewport.width < 5 ? 0 : 0

    return (
        <>
            <PerspectiveCamera makeDefault position={[0, 0, 12]} fov={35} />

            {/* Soft clinical lighting setup */}
            <ambientLight intensity={0.6} color="#f0f4ff" />
            <directionalLight position={[5, 5, 5]} intensity={0.5} color="#ffffff" />
            <directionalLight position={[-5, -5, -5]} intensity={0.3} color="#e0e7ff" />

            {/* Subtle environment for reflections */}
            <Environment preset="city" environmentIntensity={0.3} />

            <group position={[positionX, 0, 0]}>
                <Molecule scale={scale} />
            </group>
        </>
    )
}

export function Hero3D() {
    return (
        // Low opacity (25-35%), fixed positioning, stable
        <div className="fixed top-0 left-0 w-full h-[70vh] z-0 pointer-events-none opacity-30">
            <Canvas
                dpr={[1, 1.5]}
                gl={{
                    antialias: true,
                    alpha: true,
                    powerPreference: "high-performance",
                    preserveDrawingBuffer: true
                }}
                camera={{ position: [0, 0, 12], fov: 35 }}
                style={{ pointerEvents: 'none' }}
            >
                <Scene />
            </Canvas>
        </div>
    )
}
