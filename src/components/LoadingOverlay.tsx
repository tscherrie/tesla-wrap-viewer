export function LoadingOverlay() {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#0a0a0b]">
      <div className="flex flex-col items-center gap-6">
        {/* Tesla-inspired loading animation */}
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-2 border-[#2a2a30]" />
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#e82127] animate-spin" />
        </div>
        
        <div className="text-center">
          <h2 className="text-white text-xl font-semibold tracking-tight">Loading Model</h2>
          <p className="text-[#71717a] text-sm mt-1">Preparing your Tesla Model 3...</p>
        </div>
      </div>
    </div>
  )
}

