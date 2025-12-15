import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { CarModel } from './CarModel'
import { Html } from '@react-three/drei'

interface RemoteCarProps {
    id: string
    position: { x: number, y: number, z: number }
    rotation: { x: number, y: number, z: number, w: number }
    color: string | null
    wrapTexture: string | null
    onClick: (id: string) => void
}

export function RemoteCar({ id, position, rotation, color, wrapTexture, onClick }: RemoteCarProps) {
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
                onClick(id)
            }}
        >
            <CarModel wrapTexture={wrapTexture} solidColor={color} />
            <Html position={[0, 2, 0]} center>
                <div className="bg-black/50 text-white px-2 py-1 rounded text-xs backdrop-blur-sm">
                    Player {id.slice(0, 4)}
                </div>
            </Html>
        </group>
    )
}
