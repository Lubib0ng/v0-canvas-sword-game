"use client"

interface UIProps {
  gameState: {
    health: number
    score: number
    wave: number
    level: number
    dashCooldown: number
  }
  onRestart: () => void
}

export default function UI({ gameState, onRestart }: UIProps) {
  return (
    <div className="absolute top-0 left-0 w-full p-4 pointer-events-none">
      <div className="flex justify-between items-start">
        <div className="bg-slate-900/80 backdrop-blur-sm p-4 rounded-lg border border-amber-500/50">
          <div className="flex gap-6 text-white">
            <div>
              <div className="text-xs text-slate-400">체력</div>
              <div className="text-2xl font-bold text-red-400">{gameState.health}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400">점수</div>
              <div className="text-2xl font-bold text-amber-400">{gameState.score}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400">웨이브</div>
              <div className="text-2xl font-bold text-blue-400">{gameState.wave}/30</div>
            </div>
            <div>
              <div className="text-xs text-slate-400">레벨</div>
              <div className="text-2xl font-bold text-purple-400">{gameState.level}</div>
            </div>
          </div>
        </div>

        {gameState.dashCooldown > 0 && (
          <div className="bg-slate-900/80 backdrop-blur-sm px-4 py-2 rounded-lg border border-blue-500/50">
            <div className="text-white text-sm">대쉬 쿨다운: {gameState.dashCooldown.toFixed(1)}s</div>
          </div>
        )}
      </div>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-center">
        <div className="text-4xl mb-2">+</div>
        <div className="text-sm text-slate-400">클릭하여 마우스 잠금</div>
      </div>
    </div>
  )
}
