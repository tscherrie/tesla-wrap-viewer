import { useGLTF } from '@react-three/drei'
import { RigidBody } from '@react-three/rapier'
import { useEffect, useState, useMemo, useRef } from 'react'
import * as THREE from 'three'

interface CityLevelProps {
    onOffset?: (offset: { x: number, y: number, z: number }) => void
    onLoaded?: () => void
    positionOffset?: [number, number, number]
}

export function CityLevel({ onOffset, onLoaded, positionOffset = [0, 0, 0] }: CityLevelProps) {
    const { scene } = useGLTF('/models/city/cityfbx.glb')
    const [offset, setOffset] = useState<[number, number, number] | null>(null)
    const loadedOnce = useRef(false)

    // Clone the scene to ensure we have a fresh instance and don't mutate the global cache
    // usage of useMemo ensures we only clone when the base scene changes
    const clonedScene = useMemo(() => scene.clone(), [scene])

    useEffect(() => {
        if (!clonedScene) return

        // 1. Calculate Bounding Box of the CLONED scene
        const box = new THREE.Box3().setFromObject(clonedScene)
        const center = box.getCenter(new THREE.Vector3())

        // 2. Calculate Offset to center the city at World Origin (0,0,0)
        // We move the RigidBody to: -Center + Correction
        // Add +50 offset to avoid "dead center"
        const x = -center.x + 50
        const z = -center.z + 50
        const y = 0 // Trust the model's origin instead of aligning to bottom bounding box

        console.log("City Offset Calculated:", x, y, z)
        const finalOffset: [number, number, number] = [x + positionOffset[0], y + positionOffset[1], z + positionOffset[2]]
        setOffset(finalOffset)
        onOffset?.({ x, y, z })

    }, [clonedScene, onOffset, positionOffset])

    useEffect(() => {
        if (offset && !loadedOnce.current) {
            loadedOnce.current = true
            onLoaded?.()
        }
    }, [offset, onLoaded])

    if (!offset) return null

    return (
        <RigidBody type="fixed" colliders="trimesh" friction={1} position={offset}>
            <primitive object={clonedScene} />
        </RigidBody>
    )
}
