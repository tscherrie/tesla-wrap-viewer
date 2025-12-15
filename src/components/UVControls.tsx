import { useState } from 'react'

interface UVControlsProps {
  values: {
    x: number
    y: number
    scale: number
    rotation: number
    flipX: boolean
    flipY: boolean
    projection: 'top' | 'side' | 'front' | 'cylindrical' | 'spherical'
  }
  onChange: (values: any) => void
}

export function UVControls({ values, onChange }: UVControlsProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const handleChange = (key: string, value: any) => {
    onChange({ ...values, [key]: value })
  }

  return (
    <div className="absolute top-4 left-4 z-10">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 px-4 py-2 bg-[#1e1e22]/90 backdrop-blur-xl border border-[#3d3d45]/50 rounded-xl text-white text-sm font-medium hover:border-[#52525b] transition-all"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        Wrap Calibration
        <svg
          className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && (
        <div className="mt-2 w-64 bg-[#141416]/95 backdrop-blur-xl rounded-2xl border border-[#2a2a30] shadow-2xl p-4 space-y-4">
          <div className="space-y-1">
            <div className="text-xs text-[#71717a] mb-1">Projection Mode</div>
            <select 
              value={values.projection}
              onChange={(e) => handleChange('projection', e.target.value)}
              className="w-full bg-[#1e1e22] border border-[#3d3d45] rounded-lg text-xs text-white px-2 py-1.5 focus:border-[#e82127] outline-none"
            >
              <option value="top">Planar (Top)</option>
              <option value="side">Planar (Side)</option>
              <option value="front">Planar (Front)</option>
              <option value="cylindrical">Cylindrical</option>
              <option value="spherical">Spherical</option>
            </select>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs text-[#71717a]">
              <span>Scale</span>
              <span>{values.scale.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="3"
              step="0.01"
              value={values.scale}
              onChange={(e) => handleChange('scale', parseFloat(e.target.value))}
              className="w-full accent-[#e82127]"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs text-[#71717a]">
              <span>Offset X</span>
              <span>{values.x.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="-1"
              max="1"
              step="0.01"
              value={values.x}
              onChange={(e) => handleChange('x', parseFloat(e.target.value))}
              className="w-full accent-[#e82127]"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs text-[#71717a]">
              <span>Offset Y</span>
              <span>{values.y.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="-1"
              max="1"
              step="0.01"
              value={values.y}
              onChange={(e) => handleChange('y', parseFloat(e.target.value))}
              className="w-full accent-[#e82127]"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs text-[#71717a]">
              <span>Rotation</span>
              <span>{values.rotation}°</span>
            </div>
            <input
              type="range"
              min="0"
              max="360"
              step="1"
              value={values.rotation}
              onChange={(e) => handleChange('rotation', parseFloat(e.target.value))}
              className="w-full accent-[#e82127]"
            />
          </div>

          <div className="flex gap-2 pt-2 border-t border-[#2a2a30]">
            <button
              onClick={() => handleChange('flipX', !values.flipX)}
              className={`flex-1 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                values.flipX
                  ? 'bg-[#e82127]/10 border-[#e82127] text-[#e82127]'
                  : 'border-[#3d3d45] text-[#71717a] hover:border-[#52525b] hover:text-white'
              }`}
            >
              Flip X
            </button>
            <button
              onClick={() => handleChange('flipY', !values.flipY)}
              className={`flex-1 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                values.flipY
                  ? 'bg-[#e82127]/10 border-[#e82127] text-[#e82127]'
                  : 'border-[#3d3d45] text-[#71717a] hover:border-[#52525b] hover:text-white'
              }`}
            >
              Flip Y
            </button>
          </div>
          
          <button
            onClick={() => onChange({ x: 0, y: 0, scale: 1, rotation: 0, flipX: false, flipY: false, projection: 'top' })}
            className="w-full py-1.5 text-xs text-[#71717a] hover:text-white transition-colors"
          >
            Reset Calibration
          </button>
        </div>
      )}
    </div>
  )
}

