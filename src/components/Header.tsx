export function Header() {
  return (
    <header className="absolute top-0 left-0 right-0 z-10 pointer-events-none">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Logo / Title */}
        <div className="flex items-center gap-3 pointer-events-auto">
          <div className="w-10 h-10 rounded-xl bg-[#e82127] flex items-center justify-center">
            <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L4 7v10l8 5 8-5V7l-8-5zm0 2.5L17.5 8 12 11.5 6.5 8 12 4.5zM6 9.5l5 3v6l-5-3v-6zm7 9v-6l5-3v6l-5 3z" />
            </svg>
          </div>
          <div>
            <h1 className="text-white font-semibold text-lg tracking-tight">Wrap Visualizer</h1>
            <p className="text-[#52525b] text-xs">Model 3 Highland 2025</p>
          </div>
        </div>

        {/* Controls hint */}
        <div className="hidden md:flex items-center gap-4 text-[#52525b] text-xs pointer-events-auto">
          <span className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 rounded bg-[#1e1e22] border border-[#2a2a30] text-[#71717a]">Drag</kbd>
            Rotate
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 rounded bg-[#1e1e22] border border-[#2a2a30] text-[#71717a]">Scroll</kbd>
            Zoom
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 rounded bg-[#1e1e22] border border-[#2a2a30] text-[#71717a]">⇧ Drag</kbd>
            Pan
          </span>
        </div>
      </div>
    </header>
  )
}

