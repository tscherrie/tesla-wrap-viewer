import { useRef, useState } from 'react'

interface WrapSelectorProps {
  onSelectWrap: (texturePath: string | null) => void
  onSelectColor: (color: string | null) => void
  currentWrap: string | null
  currentColor: string | null
  customWraps: CustomWrap[]
  onAddCustomWrap: (wrap: CustomWrap) => void
  onRemoveCustomWrap: (id: string) => void
}

interface CustomWrap {
  id: string
  name: string
  dataUrl: string
}

const sanitizeName = (raw: string) => {
  const cleaned = (raw || 'wrap')
    .replace(/[^a-zA-Z0-9 _-]/g, '')
    .trim() || 'wrap'
  const base = cleaned.slice(0, 26) // leave room for "-wrap"/.png
  return base.length ? base : 'wrap'
}

const fileNameForDownload = (wrap: CustomWrap) => {
  const suffix = wrap.id.replace(/[^a-zA-Z0-9]/g, '').slice(-6) || 'wrap'
  const composed = `wrap-${suffix}`.slice(0, 24) // leave room for .png (max 30 chars)
  return `${composed}.png`
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

export function WrapSelector({
  onSelectWrap,
  onSelectColor,
  currentWrap,
  currentColor,
  customWraps,
  onAddCustomWrap,
  onRemoveCustomWrap
}: WrapSelectorProps) {
  const [activeTab, setActiveTab] = useState<'wraps' | 'colors'>('wraps')
  const [isExpanded, setIsExpanded] = useState(true)
  const [showTutorial, setShowTutorial] = useState(false)
  const [downloadWrap, setDownloadWrap] = useState<CustomWrap | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
        const safeName = sanitizeName(file.name.replace(/\.[^/.]+$/, ''))
        const customWrap: CustomWrap = {
          id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: safeName, // stored consistently
          dataUrl: dataUrl
        }

        onAddCustomWrap(customWrap)
        handleWrapSelect(dataUrl)
        setShowTutorial(false)
      }
      reader.readAsDataURL(file)

      // Reset input value so the same file can be selected again
      e.target.value = ''
    }
  }

  const handleDeleteCustomWrap = (id: string, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent selecting the wrap when clicking delete

    // If the deleted wrap was currently selected, clear the selection
    const wrapToDelete = customWraps.find(w => w.id === id)
    if (wrapToDelete && currentWrap === wrapToDelete.dataUrl) {
      onSelectWrap(null)
    }

    onRemoveCustomWrap(id)
  }

  const handleDownloadCustomWrap = async (wrap: CustomWrap, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    try {
      const safeName = fileNameForDownload(wrap)

      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.src = wrap.dataUrl
      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
      })

      const canvas = document.createElement('canvas')
      canvas.width = 1024
      canvas.height = 1024
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.drawImage(img, 0, 0, 1024, 1024)

      const pngData = canvas.toDataURL('image/png')
      const link = document.createElement('a')
      link.href = pngData
      link.download = safeName
      link.click()
    } catch (err) {
      console.error('Failed to download wrap', err)
    }
  }

  return (
    <div className="absolute top-4 right-4 z-10">
      {/* Tutorial Modal */}
      {showTutorial && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowTutorial(false)}
          />
          <div className="relative w-[90vw] max-w-4xl max-h-[85vh] bg-[#0c0c0f] text-white rounded-2xl border border-[#22232a] shadow-2xl overflow-hidden p-8">
            <div className="flex items-start justify-between pb-4 border-b border-[#22232a]">
              <p className="text-xs uppercase tracking-[0.25em] text-[#9ca3af]">Wrap Studio</p>
              <button
                onClick={() => setShowTutorial(false)}
                className="text-[#9ca3af] hover:text-white"
                aria-label="Close tutorial"
              >
                ✕
              </button>
            </div>

            <div className="pt-8 overflow-y-auto space-y-8">
              {/* Hero band */}
              <div className="relative overflow-hidden rounded-2xl border border-[#1f1f27] bg-gradient-to-r from-[#0f1118] via-[#141824] to-[#0d0f18] px-6 py-5">
                <div className="absolute inset-0 opacity-40 pointer-events-none" style={{ background: 'radial-gradient(circle at 20% 20%, #e82127 0, transparent 35%), radial-gradient(circle at 80% 0%, #8ab4ff 0, transparent 30%)' }} />
                <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h4 className="text-2xl font-semibold tracking-tight mt-1">Create a Custom Wrap</h4>
                    <p className="text-sm text-[#cbd5e1] max-w-2xl mt-1">Generate artwork with Gemini, then upload and preview instantly on your Model 3.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center justify-center px-3 py-2 rounded-lg bg-[#e82127] hover:bg-[#ff2b33] text-sm font-semibold text-white shadow-lg shadow-[#e82127]/30 transition-colors"
                    >
                      Upload custom wrap
                    </button>
                  </div>
                </div>
              </div>

              {/* Steps */}
              <div className="grid md:grid-cols-1 gap-8 items-start">
                <div className="bg-[#0f1017] border border-[#1f1f27] rounded-2xl p-6 shadow-lg shadow-black/30">
                  <div className="text-xs uppercase tracking-widest text-[#9ca3af] mb-4">Steps</div>
                  <ol className="space-y-5 text-sm leading-relaxed">
                    <li className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#e82127] text-white flex items-center justify-center text-sm font-semibold shrink-0">1</div>
                      <div>
                        <div className="font-semibold text-white">Generate art with Gemini</div>
                        <p className="text-[#cbd5e1]">Open <a href="https://gemini.google.com/gem/1lJl7rD4Ty-TlveolaVWGpIGzr0Wk_HjU?usp=sharing" className="text-[#7dd3fc] hover:text-white underline" target="_blank" rel="noreferrer">this Gemini prompt</a> and describe your vibe (e.g. <em>“intricate old cyberpunk robotaxi design”</em>). The template is already baked into the prompt.</p>
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#e82127] text-white flex items-center justify-center text-sm font-semibold shrink-0">2</div>
                      <div>
                        <div className="font-semibold text-white">Optional: download the UV template</div>
                        <p className="text-[#cbd5e1]">Design by hand? Grab <a href="/wraps/template.png" className="text-[#7dd3fc] hover:text-white underline" download>template.png</a> and paint directly on the UV map.</p>
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#e82127] text-white flex items-center justify-center text-sm font-semibold shrink-0">3</div>
                      <div>
                        <div className="font-semibold text-white">Download the generated image</div>
                        <p className="text-[#cbd5e1]">Save the PNG/JPEG to your device.</p>
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#e82127] text-white flex items-center justify-center text-sm font-semibold shrink-0">4</div>
                      <div>
                        <div className="font-semibold text-white">Upload to Wrap Studio</div>
                        <p className="text-[#cbd5e1]">Click “Upload custom wrap” and select your file. It appears in “Your Custom Wraps” and auto-applies to the car.</p>
                      </div>
                    </li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {downloadWrap && (
        <DownloadModal
          wrap={downloadWrap}
          onClose={() => setDownloadWrap(null)}
          onDownload={() => {
            handleDownloadCustomWrap(downloadWrap)
            setDownloadWrap(null)
          }}
        />
      )}

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
        className={`transition-all duration-300 ${isExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full pointer-events-none'}`}
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
              className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'colors'
                ? 'text-white bg-[#1e1e22] border-b-2 border-[#e82127]'
                : 'text-[#71717a] hover:text-white'
                }`}
            >
              Colors
            </button>
            <button
              onClick={() => setActiveTab('wraps')}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'wraps'
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
                      className={`group relative aspect-square rounded-xl overflow-hidden transition-all hover:scale-105 ${currentColor === item.color ? 'ring-2 ring-[#e82127] ring-offset-2 ring-offset-[#141416]' : ''
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
                {/* Create/Upload flow entry point */}
                <button
                  onClick={() => setShowTutorial(true)}
                  className="w-full py-3 px-4 rounded-xl border-2 border-dashed border-[#3d3d45] text-[#71717a] hover:border-[#52525b] hover:text-white transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Create Custom Wrap
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
                          className={`group relative aspect-square rounded-xl overflow-hidden transition-all hover:scale-[1.02] ${currentWrap === wrap.dataUrl ? 'ring-2 ring-[#e82127] ring-offset-2 ring-offset-[#141416]' : ''
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
                          {/* Download button (opens instructions) */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setDownloadWrap(wrap)
                            }}
                            className="absolute top-2 left-2 w-7 h-7 rounded-full bg-black/60 hover:bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs border border-white/20"
                            title="Download & transfer guide"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4" />
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
                      className={`group relative aspect-square rounded-xl overflow-hidden transition-all hover:scale-[1.02] ${currentWrap === wrap.file ? 'ring-2 ring-[#e82127] ring-offset-2 ring-offset-[#141416]' : ''
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

function DownloadModal({ wrap, onClose, onDownload }: { wrap: CustomWrap, onClose: () => void, onDownload: () => void }) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-[90vw] max-w-xl max-h-[85vh] bg-[#0c0c0f] text-white rounded-2xl border border-[#22232a] shadow-2xl overflow-hidden">
        <div className="flex items-start justify-between px-6 py-4 border-b border-[#22232a]">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-[#9ca3af]">Wrap Studio</p>
            <h3 className="text-xl font-semibold tracking-tight mt-1">How to Use Custom Wraps</h3>
            <p className="text-xs text-[#9ca3af] mt-1">Selected file: {wrap.name || 'custom wrap'}</p>
          </div>
          <button className="text-[#9ca3af] hover:text-white" onClick={onClose}>✕</button>
        </div>
        <div className="p-6 space-y-4 overflow-y-auto">
          <div className="space-y-2 text-sm text-[#d1d5db]">
            <ol className="space-y-3 list-decimal list-inside">
              <li>Download the design as a PNG file.</li>
              <li>Load your wraps onto a USB drive in a folder called <span className="font-semibold">Wraps</span>.</li>
              <li>Apply in your Tesla: <span className="font-semibold">Toybox → Paint Shop → Wraps</span> tab.</li>
            </ol>
          </div>
          <div className="space-y-2 text-sm text-[#d1d5db]">
            <p className="text-xs uppercase tracking-widest text-[#9ca3af]">Requirements</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Image Resolution: 512x512 to 1024x1024 pixels</li>
              <li>File Size: ≤ 1 MB</li>
              <li>File Name: alphanumeric, underscores, dashes, spaces (max 30 chars)</li>
              <li>File Format: PNG</li>
              <li>File Count: up to 10 images at a time</li>
            </ul>
          </div>
          <div className="space-y-2 text-sm text-[#d1d5db]">
            <p className="text-xs uppercase tracking-widest text-[#9ca3af]">USB Drive Setup</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Format: exFAT, FAT32 (Windows), MS-DOS FAT (Mac), ext3, or ext4</li>
              <li>Note: NTFS is not supported.</li>
            </ul>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-[#22232a] flex items-center justify-end gap-3">
          <button
            className="px-4 py-2 text-sm text-[#9ca3af] hover:text-white transition-colors"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 rounded-lg bg-[#e82127] hover:bg-[#ff2b33] text-sm font-semibold text-white shadow-lg shadow-[#e82127]/30 transition-colors"
            onClick={onDownload}
          >
            Download PNG
          </button>
        </div>
      </div>
    </div>
  )
}
