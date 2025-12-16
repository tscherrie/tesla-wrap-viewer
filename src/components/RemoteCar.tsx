import { useRef, Suspense } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { CarModel } from './CarModel'
import { Html } from '@react-three/drei'

interface RemoteCarProps {
    id: string
    position: { x: number, y: number, z: number }
    rotation: { x: number, y: number, z: number, w: number }
    velocity: { x: number, y: number, z: number }
    color: string | null
    wrapTexture: string | null
    displayName?: string
    onSelect: (id: string) => void
    onCopy: (id: string) => void
    selected?: boolean
}

export function RemoteCar({ id, position, rotation, color, wrapTexture, displayName, selected, onSelect, onCopy }: RemoteCarProps) {
    const groupRef = useRef<THREE.Group>(null)

    useFrame(() => {
        if (!groupRef.current) return

        // Linear interpolation for smooth movement
        const currentPos = groupRef.current.position
        const targetPos = new THREE.Vector3(position.x, position.y, position.z)
        currentPos.lerp(targetPos, 0.1)

        const currentRot = groupRef.current.quaternion
        const targetRot = new THREE.Quaternion(rotation.x, rotation.y, rotation.z, rotation.w)
        currentRot.slerp(targetRot, 0.1)
    })

    return (
        <group
            ref={groupRef}
            position={[position.x, position.y, position.z]}
            onClick={(e) => {
                e.stopPropagation()
                onSelect(id)
            }}
        >
            <Suspense fallback={null}>
                <CarModel wrapTexture={wrapTexture} solidColor={color} />
            </Suspense>
            <Html position={[0, 2, 0]} center style={{ zIndex: 200, pointerEvents: 'none' }}>
                <div className="bg-black/50 text-white px-2 py-1 rounded text-xs backdrop-blur-sm">
                    {displayName || `Player ${id.slice(0, 4)}`}
                </div>
            </Html>
            {selected && (
                <Html position={[0, 3, 0]} center style={{ zIndex: 300 }}>
                    <button
                        className="bg-[#e82127] hover:bg-[#ff2b33] text-white px-3 py-1 rounded-lg text-xs font-semibold shadow-lg shadow-[#e82127]/30"
                        onClick={(e) => {
                            e.stopPropagation()
                            onCopy(id)
                        }}
                    >
                        Copy Wrap
                    </button>
                </Html>
            )}
        </group>
    )
}
