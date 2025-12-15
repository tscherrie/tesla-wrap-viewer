import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, useProgress, Html } from '@react-three/drei'
import { Suspense } from 'react'
import { CarModel } from './CarModel'
import * as THREE from 'three'

// Simple sky dome component
function SkyDome() {
  return (
    <mesh scale={[-1, 1, 1]}>
      <sphereGeometry args={[50, 32, 32]} />
      <meshBasicMaterial side={THREE.BackSide}>
        <primitive 
          attach="map" 
          object={(() => {
            const canvas = document.createElement('canvas')
            canvas.width = 512
            canvas.height = 512
            const ctx = canvas.getContext('2d')!
            const gradient = ctx.createLinearGradient(0, 0, 0, 512)
            gradient.addColorStop(0, '#1e90ff')    // Bright blue at top
            gradient.addColorStop(0.4, '#87ceeb')  // Sky blue
            gradient.addColorStop(0.7, '#b0e0e6')  // Powder blue
            gradient.addColorStop(1, '#e6e6fa')    // Lavender at horizon
            ctx.fillStyle = gradient
            ctx.fillRect(0, 0, 512, 512)
            const texture = new THREE.CanvasTexture(canvas)
            return texture
          })()}
        />
      </meshBasicMaterial>
    </mesh>
  )
}

interface SceneProps {
  wrapTexture: string | null
  solidColor: string | null
}

function Loader() {
  const { progress } = useProgress()
  return (
    <Html center>
      <div className="text-white text-center">
        <div className="w-32 h-1 bg-[#2a2a30] rounded-full overflow-hidden">
          <div 
            className="h-full bg-[#e82127] transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-2 text-sm text-[#71717a]">Loading model... {progress.toFixed(0)}%</p>
      </div>
    </Html>
  )
}

export function Scene({ wrapTexture, solidColor }: SceneProps) {
  return (
    <Canvas
      gl={{ 
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
        preserveDrawingBuffer: true
      }}
      style={{ background: 'linear-gradient(180deg, #87CEEB 0%, #E0F6FF 100%)' }}
    >
      <PerspectiveCamera makeDefault position={[4, 2, 5]} fov={45} />
      
      {/* Outdoor sunlight setup */}
      <ambientLight intensity={0.6} color="#e8f4ff" />
      
      {/* Sun - main directional light */}
      <directionalLight
        position={[15, 20, 10]}
        intensity={2.5}
        color="#fff8e8"
      />
      
      {/* Sky fill light */}
      <hemisphereLight
        color="#87CEEB"
        groundColor="#3d5c3d"
        intensity={0.8}
      />
      
      {/* Bounce light from ground */}
      <directionalLight
        position={[0, -5, 5]}
        intensity={0.3}
        color="#8899aa"
      />
      
      {/* Rim light for car definition */}
      <directionalLight
        position={[-10, 8, -5]}
        intensity={1}
        color="#ffffff"
      />
      
      {/* Car Model */}
      <Suspense fallback={<Loader />}>
        <CarModel wrapTexture={wrapTexture} solidColor={solidColor} />
      </Suspense>
      
      {/* Camera controls */}
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={2}
        maxDistance={15}
        minPolarAngle={0.2}
        maxPolarAngle={Math.PI / 2 - 0.1}
        autoRotate={false}
        autoRotateSpeed={0.5}
        enableDamping={true}
        dampingFactor={0.05}
      />
      
      {/* Sky dome */}
      <SkyDome />
      
      {/* Asphalt road surface */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial 
          color="#3a3a3a"
          metalness={0.0}
          roughness={0.9}
        />
      </mesh>
      
      {/* Road markings - center line */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.49, -15]}>
        <planeGeometry args={[0.15, 25]} />
        <meshStandardMaterial color="#f5f5dc" emissive="#f5f5dc" emissiveIntensity={0.1} />
      </mesh>
      
      {/* Road markings - dashed lines */}
      {[-8, -4, 0, 4, 8].map((z) => (
        <mesh key={z} rotation={[-Math.PI / 2, 0, 0]} position={[-4, -0.49, z]}>
          <planeGeometry args={[0.12, 1.5]} />
          <meshStandardMaterial color="#f5f5dc" emissive="#f5f5dc" emissiveIntensity={0.1} />
        </mesh>
      ))}
      
      {/* Sidewalk / curb - left side */}
      <mesh position={[-8, -0.35, 0]}>
        <boxGeometry args={[3, 0.3, 50]} />
        <meshStandardMaterial color="#555555" roughness={0.9} />
      </mesh>
      
      {/* Sidewalk / curb - right side */}
      <mesh position={[12, -0.35, 0]}>
        <boxGeometry args={[6, 0.3, 50]} />
        <meshStandardMaterial color="#555555" roughness={0.9} />
      </mesh>
      
      {/* Grass areas */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-12, -0.48, 0]}>
        <planeGeometry args={[6, 50]} />
        <meshStandardMaterial color="#2d4a2d" roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[18, -0.48, 0]}>
        <planeGeometry args={[6, 50]} />
        <meshStandardMaterial color="#2d4a2d" roughness={1} />
      </mesh>
    </Canvas>
  )
}

