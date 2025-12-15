import { useMemo, useEffect, useState } from 'react'
import { useLoader } from '@react-three/fiber'
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'

interface CarModelProps {
  wrapTexture: string | null
  solidColor: string | null
}

// Component for when we have a wrap texture
function TexturedCar({ object, texturePath }: { object: THREE.Object3D, texturePath: string }) {
  const texture = useTexture(texturePath)
  
  useEffect(() => {
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    // Flip Y to match Blender UV export convention for separate textures
    texture.flipY = false 
    texture.colorSpace = THREE.SRGBColorSpace
    texture.anisotropy = 16 // Sharper texture at angles
    texture.needsUpdate = true
    
    // Apply texture to all meshes in the object
    object.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const mat = child.material as THREE.MeshStandardMaterial
        
        // Apply wrap to the main body
        if (mat.name === 'body') {
          // Create new material if needed or update existing
          const material = new THREE.MeshPhysicalMaterial({
            map: texture,
            color: "white",
            metalness: 0.2,
            roughness: 0.5,
            clearcoat: 0.1,
            clearcoatRoughness: 0.2,
            transparent: true,
            side: THREE.DoubleSide,
            polygonOffset: true,
            polygonOffsetFactor: -1
          })
          child.material = material
        }
        
        // Fix tires to be black rubber
        if (mat.name === 'tire_mat4') {
          const rubber = new THREE.MeshStandardMaterial({
            color: '#252525',
            roughness: 0.7,
            metalness: 0.1,
            side: THREE.DoubleSide
          })
          child.material = rubber
        }

        // Enhance glass materials
        const glassMaterials = ['window', 'windowpng', 'clearglass', 'clearglasssidepillar']
        if (glassMaterials.includes(mat.name)) {
          const glass = new THREE.MeshPhysicalMaterial({
            color: '#ffffff',
            metalness: 0.1,
            roughness: 0.05,
            transmission: 0.9, // Add transparency/refraction
            thickness: 0.5,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide,
            clearcoat: 1.0,
            clearcoatRoughness: 0.0
          })
          child.material = glass
        }

        // Enhance light glass materials
        const lightMaterials = ['lightled', 'rearlightwhite', 'chromheadlight', 'rearlight_bright']
        if (lightMaterials.includes(mat.name)) {
          const lightGlass = new THREE.MeshPhysicalMaterial({
            color: '#ffffff',
            metalness: 0.1,
            roughness: 0.1,
            transmission: 0.8,
            thickness: 0.2,
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide
          })
          child.material = lightGlass
        }
      }
    })
  }, [texture, object])

  return <primitive object={object} />
}

// Component for solid color
function SolidColorCar({ object, color }: { object: THREE.Object3D, color: string }) {
  useEffect(() => {
    object.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const mat = child.material as THREE.MeshStandardMaterial
        
        // Only apply color to the main body
        if (mat.name === 'body') {
          const material = new THREE.MeshPhysicalMaterial({
            color: color,
            metalness: 0.6,
            roughness: 0.3,
            clearcoat: 0.8,
            clearcoatRoughness: 0.1,
            side: THREE.DoubleSide
          })
          child.material = material
        }
        
        // Fix tires to be black rubber
        if (mat.name === 'tire_mat4') {
          const rubber = new THREE.MeshStandardMaterial({
            color: '#252525',
            roughness: 0.7,
            metalness: 0.1,
            side: THREE.DoubleSide
          })
          child.material = rubber
        }

        // Enhance glass materials
        const glassMaterials = ['window', 'windowpng', 'clearglass', 'clearglasssidepillar']
        if (glassMaterials.includes(mat.name)) {
          const glass = new THREE.MeshPhysicalMaterial({
            color: '#ffffff',
            metalness: 0.1,
            roughness: 0.05,
            transmission: 0.9, // Add transparency/refraction
            thickness: 0.5,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide,
            clearcoat: 1.0,
            clearcoatRoughness: 0.0
          })
          child.material = glass
        }

        // Enhance light glass materials
        const lightMaterials = ['lightled', 'rearlightwhite', 'chromheadlight', 'rearlight_bright']
        if (lightMaterials.includes(mat.name)) {
          const lightGlass = new THREE.MeshPhysicalMaterial({
            color: '#ffffff',
            metalness: 0.1,
            roughness: 0.1,
            transmission: 0.8,
            thickness: 0.2,
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide
          })
          child.material = lightGlass
        }
      }
    })
  }, [object, color])

  return <primitive object={object} />
}

export function CarModel({ wrapTexture, solidColor }: CarModelProps) {
  const [modelType, setModelType] = useState<'glb' | 'stl'>('stl')
  
  // Try to load GLB first
  const gltf = useLoader(GLTFLoader, '/models/model3.glb', (loader) => {
    // Error handler: if GLB fails, we fallback to STL
    loader.manager.onError = () => {
      console.log('GLB model not found, falling back to STL')
      setModelType('stl')
    }
  })

  // Load STL as fallback
  const stlGeometry = useLoader(STLLoader, '/models/3dmodel.stl')
  
  const processedModel = useMemo(() => {
    if (gltf && gltf.scene) {
      // Process GLB model
      const model = gltf.scene.clone()
      
      // Log material names to help identify parts
      console.log('Model Materials:')
      model.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          const mat = child.material as THREE.MeshStandardMaterial
          console.log(`- Mesh: "${child.name}", Material: "${mat.name}"`)
        }
      })
      
      // Compute bounding box
      const box = new THREE.Box3().setFromObject(model)
      const size = new THREE.Vector3()
      box.getSize(size)
      const maxDim = Math.max(size.x, size.y, size.z)
      
      // Normalize scale to ~4.5 units
      const scale = 4.5 / maxDim
      model.scale.set(scale, scale, scale)
      
      // Center and ground
      const scaledBox = new THREE.Box3().setFromObject(model)
      const center = new THREE.Vector3()
      scaledBox.getCenter(center)
      
      model.position.x += -center.x
      model.position.z += -center.z
      model.position.y = -scaledBox.min.y
      
      return { type: 'glb', object: model }
    } else {
      // Process STL geometry (fallback)
      const geo = stlGeometry.clone()
      
      // ... existing STL processing logic ...
      // Rotate geometry from Z-up (CAD) to Y-up
      geo.rotateX(-Math.PI / 2)
      
      // Center
      geo.computeBoundingBox()
      const box = geo.boundingBox!
      const center = new THREE.Vector3()
      box.getCenter(center)
      geo.translate(-center.x, -center.y, -center.z)
      
      // Scale
      const size = new THREE.Vector3()
      box.getSize(size)
      const maxDim = Math.max(size.x, size.y, size.z)
      const scale = 3 / maxDim
      geo.scale(scale, scale, scale)
      
      // Ground alignment
      geo.computeBoundingBox()
      const newBox = geo.boundingBox!
      geo.translate(0, -newBox.min.y, 0)
      
      // Normals
      geo.computeVertexNormals()
      
      // Planar UVs (Top-down)
      const positions = geo.attributes.position
      const uvs = new Float32Array(positions.count * 2)
      
      const boxBounds = new THREE.Box3().setFromBufferAttribute(positions)
      const sizeBounds = new THREE.Vector3()
      boxBounds.getSize(sizeBounds)
      const minBounds = boxBounds.min
      
      for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i)
        const z = positions.getZ(i)
        const u = (x - minBounds.x) / sizeBounds.x
        const v = 1 - (z - minBounds.z) / sizeBounds.z
        uvs[i * 2] = u
        uvs[i * 2 + 1] = v
      }
      geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2))
      
      const mesh = new THREE.Mesh(geo)
      return { type: 'stl', object: mesh }
    }
  }, [gltf, stlGeometry])

  const defaultColor = '#2a2a30'

  if (wrapTexture) {
    return (
      <group rotation={[0, Math.PI, 0]}>
        <SolidColorCar object={processedModel.object.clone()} color={solidColor || defaultColor} />
        <TexturedCar object={processedModel.object.clone()} texturePath={wrapTexture} />
      </group>
    )
  }

  return (
    <group rotation={[0, Math.PI, 0]}>
      <SolidColorCar object={processedModel.object.clone()} color={solidColor || defaultColor} />
    </group>
  )
}

