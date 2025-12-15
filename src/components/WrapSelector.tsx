import { useState, useRef, useEffect } from 'react'

interface WrapSelectorProps {
  onSelectWrap: (texturePath: string | null) => void
  onSelectColor: (color: string | null) => void
  currentWrap: string | null
  currentColor: string | null
}

interface CustomWrap {
  id: string
  name: string
  dataUrl: string
}

// Tesla wrap presets from the official repo
const PRESET_WRAPS = [
  { name: 'Cosmic Burst', file: '/wraps/Cosmic_Burst.png' },
  { name: 'Leopard', file: '/wraps/Leopard.png' },
  { name: 'Camo', file: '/wraps/Camo.png' },
  { name: 'Pixel Art', file: '/wraps/Pixel_Art.png' },
  { name: 'Sakura', file: '/wraps/Sakura.png' },
  { name: 'Doge', file: '/wraps/Doge.png' },
  { name: 'Vintage Stripes', file: '/wraps/Vintage_Stripes.png' },
  { name: 'Dot Matrix', file: '/wraps/Dot_Matrix.png' },
  { name: 'Acid Drip', file: '/wraps/Acid_Drip.png' },
  { name: 'Ice Cream', file: '/wraps/Ice_Cream.png' },
  { name: 'Sketch', file: '/wraps/Sketch.png' },
  { name: 'Apocalypse', file: '/wraps/Apocalypse.png' },
]

// Tesla color palette
const SOLID_COLORS = [
  { name: 'Ultra White', color: '#f2f2f2' },
  { name: 'Pearl White', color: '#e8e8e8' },
  { name: 'Midnight Silver', color: '#42464d' },
  { name: 'Deep Blue', color: '#1e3a5f' },
  { name: 'Solid Black', color: '#0a0a0a' },
  { name: 'Red Multi-Coat', color: '#a31e21' },
  { name: 'Quicksilver', color: '#8a8d8f' },
  { name: 'Midnight Cherry', color: '#4a1c2a' },
]

const STORAGE_KEY = 'tesla-wrap-viewer-custom-wraps'

export function WrapSelector({ onSelectWrap, onSelectColor, currentWrap, currentColor }: WrapSelectorProps) {
  const [activeTab, setActiveTab] = useState<'wraps' | 'colors'>('wraps')
  const [isExpanded, setIsExpanded] = useState(true)
  const [customWraps, setCustomWraps] = useState<CustomWrap[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load custom wraps from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const wraps = JSON.parse(stored) as CustomWrap[]
        setCustomWraps(wraps)
      }
    } catch (error) {
      console.error('Failed to load custom wraps:', error)
    }
  }, [])

  // Save custom wraps to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(customWraps))
    } catch (error) {
      console.error('Failed to save custom wraps:', error)
    }
  }, [customWraps])

  const handleWrapSelect = (wrapPath: string) => {
    // onSelectColor(null) // Do not clear color so we can layer wraps on base paint
    onSelectWrap(wrapPath)
  }

  const handleColorSelect = (color: string) => {
    // onSelectWrap(null) // Do not clear wrap so we can change base paint under wrap
    onSelectColor(color)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string
        const customWrap: CustomWrap = {
          id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
          dataUrl: dataUrl
        }
        
        setCustomWraps(prev => [...prev, customWrap])
        handleWrapSelect(dataUrl)
      }
      reader.readAsDataURL(file)
      
      // Reset input value so the same file can be selected again
      e.target.value = ''
    }
  }

  const handleDeleteCustomWrap = (id: string, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent selecting the wrap when clicking delete
    setCustomWraps(prev => prev.filter(wrap => wrap.id !== id))
    
    // If the deleted wrap was currently selected, clear the selection
    const wrapToDelete = customWraps.find(w => w.id === id)
    if (wrapToDelete && currentWrap === wrapToDelete.dataUrl) {
      onSelectWrap(null)
    }
  }

  return (
    <div className="absolute top-4 right-4 z-10">
      {/* Toggle button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="absolute -left-12 top-0 w-10 h-10 rounded-full bg-[#1e1e22]/90 backdrop-blur-xl border border-[#3d3d45]/50 flex items-center justify-center text-white/70 hover:text-white hover:border-[#52525b] transition-all"
      >
        <svg
          className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-0' : 'rotate-180'}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Panel */}
      <div
        className={`transition-all duration-300 ${
          isExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full pointer-events-none'
        }`}
      >
        <div className="w-72 bg-[#141416]/95 backdrop-blur-xl rounded-2xl border border-[#2a2a30] shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="px-5 py-4 border-b border-[#2a2a30]">
            <h2 className="text-white font-semibold text-lg tracking-tight">Wrap Studio</h2>
            <p className="text-[#71717a] text-sm mt-0.5">Customize your Model 3</p>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-[#2a2a30]">
            <button
              onClick={() => setActiveTab('colors')}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === 'colors'
                  ? 'text-white bg-[#1e1e22] border-b-2 border-[#e82127]'
                  : 'text-[#71717a] hover:text-white'
              }`}
            >
              Colors
            </button>
            <button
              onClick={() => setActiveTab('wraps')}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === 'wraps'
                  ? 'text-white bg-[#1e1e22] border-b-2 border-[#e82127]'
                  : 'text-[#71717a] hover:text-white'
              }`}
            >
              Wraps
            </button>
          </div>

          {/* Content */}
          <div className="p-4 max-h-[60vh] overflow-y-auto">
            {activeTab === 'colors' && (
              <div className="space-y-3">
                <p className="text-[#71717a] text-xs uppercase tracking-wider mb-3">Tesla Colors</p>
                <div className="grid grid-cols-4 gap-2">
                  {SOLID_COLORS.map((item) => (
                    <button
                      key={item.name}
                      onClick={() => handleColorSelect(item.color)}
                      className={`group relative aspect-square rounded-xl overflow-hidden transition-all hover:scale-105 ${
                        currentColor === item.color ? 'ring-2 ring-[#e82127] ring-offset-2 ring-offset-[#141416]' : ''
                      }`}
                      title={item.name}
                    >
                      <div
                        className="w-full h-full"
                        style={{ backgroundColor: item.color }}
                      />
                      {item.name === 'Ultra White' && (
                        <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent" />
                      )}
                    </button>
                  ))}
                </div>
                {currentColor && (
                  <p className="text-center text-white/60 text-sm mt-3">
                    {SOLID_COLORS.find(c => c.color === currentColor)?.name}
                  </p>
                )}
              </div>
            )}

            {activeTab === 'wraps' && (
              <div className="space-y-4">
                {/* Upload button */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-3 px-4 rounded-xl border-2 border-dashed border-[#3d3d45] text-[#71717a] hover:border-[#52525b] hover:text-white transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Upload Custom Wrap
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                {/* Custom Wraps Section */}
                {customWraps.length > 0 && (
                  <>
                    <p className="text-[#71717a] text-xs uppercase tracking-wider">Your Custom Wraps</p>
                    <div className="grid grid-cols-2 gap-2">
                      {customWraps.map((wrap) => (
                        <button
                          key={wrap.id}
                          onClick={() => handleWrapSelect(wrap.dataUrl)}
                          className={`group relative aspect-square rounded-xl overflow-hidden transition-all hover:scale-[1.02] ${
                            currentWrap === wrap.dataUrl ? 'ring-2 ring-[#e82127] ring-offset-2 ring-offset-[#141416]' : ''
                          }`}
                        >
                          <img
                            src={wrap.dataUrl}
                            alt={wrap.name}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                          <span className="absolute bottom-2 left-2 right-2 text-xs text-white font-medium opacity-0 group-hover:opacity-100 transition-opacity truncate">
                            {wrap.name}
                          </span>
                          {/* Delete button */}
                          <button
                            onClick={(e) => handleDeleteCustomWrap(wrap.id, e)}
                            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-600/90 hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs"
                            title="Delete wrap"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </button>
                      ))}
                    </div>
                  </>
                )}

                <p className="text-[#71717a] text-xs uppercase tracking-wider">Official Presets</p>
                <div className="grid grid-cols-2 gap-2">
                  {PRESET_WRAPS.map((wrap) => (
                    <button
                      key={wrap.name}
                      onClick={() => handleWrapSelect(wrap.file)}
                      className={`group relative aspect-square rounded-xl overflow-hidden transition-all hover:scale-[1.02] ${
                        currentWrap === wrap.file ? 'ring-2 ring-[#e82127] ring-offset-2 ring-offset-[#141416]' : ''
                      }`}
                    >
                      <img
                        src={wrap.file}
                        alt={wrap.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <span className="absolute bottom-2 left-2 right-2 text-xs text-white font-medium opacity-0 group-hover:opacity-100 transition-opacity truncate">
                        {wrap.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-[#2a2a30] bg-[#0a0a0b]/50">
            <button
              onClick={() => {
                onSelectWrap(null)
                onSelectColor(null)
              }}
              className="w-full py-2 text-sm text-[#71717a] hover:text-white transition-colors"
            >
              Reset to Default
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

