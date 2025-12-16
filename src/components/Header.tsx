export function Header() {
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

      </div>
    </header>
  )
}
