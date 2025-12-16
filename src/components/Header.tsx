interface HeaderProps {
  playerName: string
  onRename: (name: string) => void
}

export function Header({ playerName, onRename }: HeaderProps) {
  const handleRename = () => {
    const next = window.prompt('Enter your display name', playerName || 'Player')?.trim()
    if (next) onRename(next)
  }

  return (
    <header className="absolute top-0 left-0 right-0 z-10 pointer-events-none">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Logo / Title */}
        <div className="flex items-center gap-3 pointer-events-auto">
          <a 
            href="https://www.youtube.com/@robo-jerry" 
            target="_blank" 
            rel="noopener noreferrer"
            className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center bg-transparent hover:opacity-80 transition-opacity"
          >
            <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
          </a>
          <div>
            <h1 className="text-white font-semibold text-lg tracking-tight">Tesla Wrap Viewer</h1>
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

        {/* Player name */}
        <button
          onClick={handleRename}
          className="pointer-events-auto text-white/80 hover:text-white text-sm bg-[#1e1e22]/80 border border-[#2a2a30] rounded-full px-3 py-1 transition-colors"
          title="Click to rename"
        >
          You: {playerName || 'Player'}
        </button>
      </div>
    </header>
  )
}
