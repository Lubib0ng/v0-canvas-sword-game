"use client"

import { Canvas } from "@react-three/fiber"
import { PointerLockControls, Sky } from "@react-three/drei"
import { Physics } from "@react-three/rapier"
import { Suspense, useState } from "react"
import Game from "@/components/Game"
import WeaponSelect from "@/components/WeaponSelect"
import UI from "@/components/UI"

export default function Page() {
  const [gameStarted, setGameStarted] = useState(false)
  const [selectedWeapon, setSelectedWeapon] = useState<string | null>(null)
  const [gameState, setGameState] = useState({
    health: 100,
    score: 0,
    wave: 1,
    level: 1,
    dashCooldown: 0,
  })

  const handleWeaponSelect = (weapon: string) => {
    setSelectedWeapon(weapon)
    setGameStarted(true)
  }

  const handleRestart = () => {
    setGameStarted(false)
    setSelectedWeapon(null)
    setGameState({
      health: 100,
      score: 0,
      wave: 1,
      level: 1,
      dashCooldown: 0,
    })
  }

  if (!gameStarted) {
    return (
      <div className="w-full h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center">
        <WeaponSelect onSelect={handleWeaponSelect} />
      </div>
    )
  }

  return (
    <div className="w-full h-screen relative">
      <Canvas camera={{ fov: 75, position: [0, 1.6, 0] }}>
        <Sky sunPosition={[100, 20, 100]} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />

        <Suspense fallback={null}>
          <Physics gravity={[0, -9.81, 0]}>
            <Game weaponType={selectedWeapon!} onGameStateChange={setGameState} onRestart={handleRestart} />
          </Physics>
        </Suspense>

        <PointerLockControls />
      </Canvas>

      <UI gameState={gameState} onRestart={handleRestart} />
    </div>
  )
}
