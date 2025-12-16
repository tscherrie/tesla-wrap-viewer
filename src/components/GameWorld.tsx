import { RigidBody, CuboidCollider } from '@react-three/rapier'
import * as THREE from 'three'
import { useMemo } from 'react'
import { useThree } from '@react-three/fiber' // Import useThree
import { CityLevel } from './CityLevel' // Import CityLevel

interface GameWorldProps {
    onOffset?: (offset: { x: number, y: number, z: number }) => void
    onLoaded?: () => void
    playerPosition?: { x: number, y: number, z: number }
}

export function GameWorld({ onOffset, onLoaded, playerPosition }: GameWorldProps) {
    const { scene } = useThree();
    useMemo(() => {
        scene.background = new THREE.Color('#87CEEB');
        scene.fog = new THREE.FogExp2('#dfe9f3', 0.02);
    }, [scene])

    // Determine which tiles to load (3x3 grid around current tile)
    const TILE_SIZE = 200;
    const px = playerPosition?.x ?? 0;
    const pz = playerPosition?.z ?? 0;
    const tileX = Math.round(px / TILE_SIZE);
    const tileZ = Math.round(pz / TILE_SIZE);
    const tiles: Array<{ dx: number, dz: number }> = [];
    for (let dx = -1; dx <= 1; dx++) {
        for (let dz = -1; dz <= 1; dz++) {
            tiles.push({ dx, dz });
        }
    }

    return (
        <group>
            {/* Center + adjacent tiles */}
            {tiles.map(({ dx, dz }) => {
                const offset: [number, number, number] = [
                    dx * TILE_SIZE,
                    0,
                    dz * TILE_SIZE
                ]
                const isCenter = dx === 0 && dz === 0;
                return (
                    <CityLevel
                        key={`${tileX + dx}_${tileZ + dz}`}
                        onOffset={isCenter ? onOffset : undefined}
                        onLoaded={isCenter ? onLoaded : undefined}
                        positionOffset={offset}
                    />
                )
            })}
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
