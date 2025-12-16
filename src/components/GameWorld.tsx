import { RigidBody, CuboidCollider } from '@react-three/rapier'
import * as THREE from 'three'
import { useMemo, useRef, useLayoutEffect } from 'react'
import { useThree } from '@react-three/fiber' // Import useThree
import { CityLevel } from './CityLevel' // Import CityLevel
import { InstancedMesh } from 'three'

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

    return (
        <group>
            {/* City Model */}
            <CityLevel onOffset={onOffset} onLoaded={onLoaded} />
            <ProxyTiles playerPosition={playerPosition} />

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

const TILE_SIZE = 200
const GRID_RADIUS = 1 // show one ring of proxy tiles

function ProxyTiles({ playerPosition }: { playerPosition?: { x: number, y: number, z: number } }) {
    const meshRef = useRef<InstancedMesh>(null)

    useLayoutEffect(() => {
        if (!meshRef.current) return;
        let i = 0;
        const px = playerPosition?.x ?? 0;
        const pz = playerPosition?.z ?? 0;
        const tileX = Math.round(px / TILE_SIZE);
        const tileZ = Math.round(pz / TILE_SIZE);
        for (let dx = -GRID_RADIUS; dx <= GRID_RADIUS; dx++) {
            for (let dz = -GRID_RADIUS; dz <= GRID_RADIUS; dz++) {
                if (dx === 0 && dz === 0) continue;
                const matrix = new THREE.Matrix4();
                matrix.makeTranslation(
                    (tileX + dx) * TILE_SIZE,
                    0,
                    (tileZ + dz) * TILE_SIZE
                );
                meshRef.current.setMatrixAt(i, matrix);
                meshRef.current.setColorAt(i, new THREE.Color('#1f1f27'));
                i++;
            }
        }
        meshRef.current.instanceMatrix.needsUpdate = true;
        if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
    }, [playerPosition]);

    const count = (GRID_RADIUS * 2 + 1) ** 2 - 1;
    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
            <boxGeometry args={[TILE_SIZE, 2, TILE_SIZE]} />
            <meshStandardMaterial color="#1f1f27" roughness={1} metalness={0} opacity={0.25} transparent />
        </instancedMesh>
    )
}
