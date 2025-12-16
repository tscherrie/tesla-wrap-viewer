interface HeaderProps {
  isNight: boolean
  onToggleTheme: () => void
}

export function Header({ isNight, onToggleTheme }: HeaderProps) {
  return (
    <header className="absolute top-0 left-0 right-0 z-10">
      <div className="flex items-center justify-between px-6 py-4 pointer-events-auto">
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
            <h1 className="text-white font-semibold text-lg tracking-tight">Tesla Wrapper</h1>
            <a
              href="https://github.com/tscherrie/tesla-wrap-viewer"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#7dd3fc] hover:text-white text-xs underline"
            >
              github.com/tscherrie/tesla-wrap-viewer
            </a>
          </div>
        </div>

        <button
          onClick={onToggleTheme}
          className="pointer-events-auto text-white/80 hover:text-white bg-[#1e1e22]/80 border border-[#2a2a30] rounded-full px-3 py-2 transition-colors flex items-center gap-2"
          title="Toggle day/night"
        >
          <span className="text-lg leading-none">{isNight ? '🌙' : '☀️'}</span>
        </button>
      </div>
    </header>
  )
}
