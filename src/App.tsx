import { useState, Suspense } from 'react'
import { Scene } from './components/Scene'
import { WrapSelector } from './components/WrapSelector'
import { LoadingOverlay } from './components/LoadingOverlay'
import { Header } from './components/Header'

function App() {
  const [wrapTexture, setWrapTexture] = useState<string | null>(null)
  const [solidColor, setSolidColor] = useState<string | null>('#e8e8e8') // Pearl White default

  return (
    <div className="relative w-full h-full">
      {/* 3D Scene */}
      <Suspense fallback={<LoadingOverlay />}>
        <Scene wrapTexture={wrapTexture} solidColor={solidColor} />
      </Suspense>

      {/* UI Overlays */}
      <Header />
      <WrapSelector
        onSelectWrap={setWrapTexture}
        onSelectColor={setSolidColor}
        currentWrap={wrapTexture}
        currentColor={solidColor}
      />

      {/* Bottom info */}
      <div className="absolute bottom-4 left-4 text-[#52525b] text-xs">
        <p>Note: STL model uses generated UVs. For accurate wrap preview,</p>
        <p>use a UV-mapped GLB/GLTF model matching the Tesla template.</p>
      </div>
    </div>
  )
}

export default App
