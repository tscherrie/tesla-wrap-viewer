import { RigidBody, CuboidCollider } from '@react-three/rapier'
import * as THREE from 'three'
import { useMemo } from 'react'
import { useThree } from '@react-three/fiber' // Import useThree
import { CityLevel } from './CityLevel' // Import CityLevel
import { useEffect } from 'react'

interface GameWorldProps {
    onOffset?: (offset: { x: number, y: number, z: number }) => void
}

export function GameWorld({ onOffset }: GameWorldProps) {
    const { scene } = useThree();
    useMemo(() => {
        scene.background = new THREE.Color('#87CEEB');
        scene.fog = new THREE.FogExp2('#dfe9f3', 0.02);
    }, [scene])

    return (
        <group>
            {/* City Model */}
            <CityLevel onOffset={onOffset} />

            {/* Safety Ground Plane - Invisible Floor to catch car if City has holes or is offset */}
            <RigidBody type="fixed" friction={2} position={[0, -0.05, 0]}>
                <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                    <planeGeometry args={[2000, 2000]} />
                    <meshStandardMaterial color="#333" opacity={0} transparent />
                </mesh>
            </RigidBody>

            {/* Boundary Walls - Expanded for larger city */}
            <RigidBody type="fixed">
                {/* Invisible walls to separate world from void if needed */}
            </RigidBody>

            {/* Boundary Walls to keep players in */}
            <RigidBody type="fixed">
                <CuboidCollider args={[500, 10, 1]} position={[0, 10, 500]} />
                <CuboidCollider args={[500, 10, 1]} position={[0, 10, -500]} />
                <CuboidCollider args={[1, 10, 500]} position={[500, 10, 0]} />
                <CuboidCollider args={[1, 10, 500]} position={[-500, 10, 0]} />
            </RigidBody>
        </group>
    )
}
