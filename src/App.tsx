import { useState, Suspense, useEffect, useRef } from 'react'
import { Game } from './components/Game'
import { WrapSelector } from './components/WrapSelector'
import { LoadingOverlay } from './components/LoadingOverlay'
import { Header } from './components/Header'

const STORAGE_KEY = 'tesla-wrap-viewer-custom-wraps'
const STORAGE_SELECTION_KEY = 'tesla-wrap-viewer-selection'
const STORAGE_NAME_KEY = 'tesla-wrap-viewer-player-name'
const STORAGE_THEME_KEY = 'tesla-wrap-viewer-theme'

interface CustomWrap {
  id: string
  name: string
  dataUrl: string
}

function App() {
  const [wrapTexture, setWrapTexture] = useState<string | null>(null)
  const [solidColor, setSolidColor] = useState<string | null>('#e8e8e8') // Pearl White default
  const [customWraps, setCustomWraps] = useState<CustomWrap[]>([])
  const [playerName, setPlayerName] = useState<string>('Player')
  const [isNight, setIsNight] = useState<boolean>(false)
  const hydrated = useRef(false)

  // Load custom wraps from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const wraps = JSON.parse(stored) as CustomWrap[]
        setCustomWraps(wraps)
      }

      const selectionRaw = localStorage.getItem(STORAGE_SELECTION_KEY)
      if (selectionRaw) {
        const selection = JSON.parse(selectionRaw) as { wrapTexture: string | null, solidColor: string | null }
        setWrapTexture(selection.wrapTexture ?? null)
        setSolidColor(selection.solidColor ?? '#e8e8e8')
      }

      const storedName = localStorage.getItem(STORAGE_NAME_KEY)
      if (storedName) {
        setPlayerName(storedName)
      }

      const storedTheme = localStorage.getItem(STORAGE_THEME_KEY)
      if (storedTheme) {
        setIsNight(storedTheme === 'night')
      } else {
        // Basic heuristic fallback until geolocation finishes
        const hour = new Date().getHours()
        setIsNight(hour < 6 || hour >= 19)
      }
      hydrated.current = true
    } catch (error) {
      console.error('Failed to load custom wraps:', error)
    }
  }, [])

  // Save custom wraps to localStorage whenever they change
  useEffect(() => {
    if (!hydrated.current) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(customWraps))
    } catch (error) {
      console.error('Failed to save custom wraps:', error)
    }
  }, [customWraps])

  // Persist current selection (wrap + color)
  useEffect(() => {
    if (!hydrated.current) return
    try {
      const payload = JSON.stringify({ wrapTexture, solidColor })
      localStorage.setItem(STORAGE_SELECTION_KEY, payload)
    } catch (error) {
      console.error('Failed to save selection:', error)
    }
  }, [wrapTexture, solidColor])

  // Persist player name
  useEffect(() => {
    if (!hydrated.current) return
    try {
      localStorage.setItem(STORAGE_NAME_KEY, playerName)
    } catch (error) {
      console.error('Failed to save player name:', error)
    }
  }, [playerName])

  // Persist theme
  useEffect(() => {
    if (!hydrated.current) return
    try {
      localStorage.setItem(STORAGE_THEME_KEY, isNight ? 'night' : 'day')
    } catch (error) {
      console.error('Failed to save theme:', error)
    }
  }, [isNight])

  // Auto-set theme based on local sunrise/sunset (best effort)
  useEffect(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition((pos) => {
      const { latitude, longitude } = pos.coords
      const url = `https://api.sunrise-sunset.org/json?lat=${latitude}&lng=${longitude}&formatted=0`
      fetch(url)
        .then(res => res.json())
        .then(data => {
          if (data.status !== 'OK') return
          const now = Date.now()
          const sunrise = new Date(data.results.sunrise).getTime()
          const sunset = new Date(data.results.sunset).getTime()
          const night = now < sunrise || now > sunset
          setIsNight(night)
        })
        .catch(() => { /* ignore */ })
    }, () => { /* ignore permission errors */ })
  }, [])

  const handleAddCustomWrap = (wrap: CustomWrap) => {
    setCustomWraps(prev => [...prev, wrap])
  }

  const handleRemoveCustomWrap = (id: string) => {
    setCustomWraps(prev => prev.filter(w => w.id !== id))
  }

  return (
    <div className="relative w-full h-full">
      {/* 3D Scene */}
      <Suspense fallback={<LoadingOverlay />}>
        <Game
          wrapTexture={wrapTexture}
          solidColor={solidColor}
          playerName={playerName}
          onRename={setPlayerName}
          isNight={isNight}
        />
      </Suspense>

      {/* UI Overlays */}
      <Header
        isNight={isNight}
        onToggleTheme={() => setIsNight(prev => !prev)}
      />
      <WrapSelector
        onSelectWrap={setWrapTexture}
        onSelectColor={setSolidColor}
        currentWrap={wrapTexture}
        currentColor={solidColor}
        customWraps={customWraps}
        onAddCustomWrap={handleAddCustomWrap}
        onRemoveCustomWrap={handleRemoveCustomWrap}
      />

    </div>
  )
}

export default App
