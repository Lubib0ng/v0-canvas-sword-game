"use client"

import { useRef, useState, useEffect } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import { RigidBody, type RigidBodyApi } from "@react-three/rapier"
import Player from "./Player"
import Enemy from "./Enemy"
import Weapon from "./Weapon"

interface GameProps {
  weaponType: string
  onGameStateChange: (state: any) => void
  onRestart: () => void
}

export default function Game({ weaponType, onGameStateChange, onRestart }: GameProps) {
  const [enemies, setEnemies] = useState<any[]>([])
  const [projectiles, setProjectiles] = useState<any[]>([])
  const [wave, setWave] = useState(1)
  const [level, setLevel] = useState(1)
  const [score, setScore] = useState(0)
  const [health, setHealth] = useState(100)
  const [isAttacking, setIsAttacking] = useState(false)
  const [isDashing, setIsDashing] = useState(false)
  const [dashCooldown, setDashCooldown] = useState(0)
  const [mouseAngle, setMouseAngle] = useState({ x: 0, y: 0 })

  const playerRef = useRef<RigidBodyApi>(null)
  const { camera } = useThree()

  // 게임 상태 업데이트
  useEffect(() => {
    onGameStateChange({ health, score, wave, level, dashCooldown })
  }, [health, score, wave, level, dashCooldown])

  // 적 생성
  useEffect(() => {
    const spawnEnemies = () => {
      const newEnemies = []
      const enemyCount = 5 + wave * 2

      for (let i = 0; i < enemyCount; i++) {
        const angle = Math.random() * Math.PI * 2
        const distance = 15 + Math.random() * 10
        const x = Math.cos(angle) * distance
        const z = Math.sin(angle) * distance

        const types = ["basic", "fast", "tank", "ranged"]
        const type = types[Math.floor(Math.random() * types.length)]

        newEnemies.push({
          id: Math.random(),
          type,
          position: [x, 1, z],
          health: type === "tank" ? 30 : type === "basic" ? 10 : 8,
          speed: type === "fast" ? 3 : type === "tank" ? 0.5 : 1.5,
        })
      }

      // 보스 생성
      if (wave % 10 === 0) {
        newEnemies.push({
          id: Math.random(),
          type: "boss",
          position: [0, 1, -20],
          health: 100 + level * 50,
          speed: 1.5,
        })
      }

      setEnemies(newEnemies)
    }

    spawnEnemies()
  }, [wave, level])

  // 마우스 움직임 추적
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMouseAngle((prev) => {
        const newX = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, prev.x - e.movementY * 0.002))
        return {
          x: newX,
          y: prev.y - e.movementX * 0.002,
        }
      })
    }

    document.addEventListener("mousemove", handleMouseMove)
    return () => document.removeEventListener("mousemove", handleMouseMove)
  }, [])

  useFrame((state, delta) => {
    // 대쉬 쿨다운
    if (dashCooldown > 0) {
      setDashCooldown((prev) => Math.max(0, prev - delta))
    }

    // 적 제거 체크
    const remainingEnemies = enemies.filter((enemy) => enemy.health > 0)
    if (remainingEnemies.length === 0 && enemies.length > 0) {
      setWave((prev) => {
        const nextWave = prev + 1
        if (nextWave > 30) {
          // 승리!
          alert("30웨이브 클리어! 승리!")
          onRestart()
        }
        return nextWave
      })
      setHealth((prev) => Math.min(100, prev + 20))
    }
    setEnemies(remainingEnemies)
  })

  const handleAttack = () => {
    setIsAttacking(true)
    setTimeout(() => setIsAttacking(false), 300)
  }

  const handleDash = () => {
    if (dashCooldown === 0) {
      setIsDashing(true)
      setDashCooldown(1)
      setTimeout(() => setIsDashing(false), 200)
    }
  }

  const handleDamage = (amount: number) => {
    if (!isDashing) {
      setHealth((prev) => {
        const newHealth = prev - amount
        if (newHealth <= 0) {
          alert("Game Over!")
          onRestart()
        }
        return Math.max(0, newHealth)
      })
    }
  }

  const handleEnemyDamage = (enemyId: number, damage: number) => {
    setEnemies((prev) =>
      prev.map((enemy) => {
        if (enemy.id === enemyId) {
          const newHealth = enemy.health - damage
          if (newHealth <= 0) {
            setScore((s) => s + 1)
            if (enemy.type === "boss") {
              setLevel((l) => l + 1)
              setHealth((h) => Math.min(100, h + 50))
            }
          }
          return { ...enemy, health: newHealth }
        }
        return enemy
      }),
    )
  }

  return (
    <>
      {/* 바닥 */}
      <RigidBody type="fixed">
        <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[100, 100]} />
          <meshStandardMaterial color="#2a4a2a" />
        </mesh>
      </RigidBody>

      {/* 플레이어 */}
      <Player
        ref={playerRef}
        onAttack={handleAttack}
        onDash={handleDash}
        isDashing={isDashing}
        mouseAngle={mouseAngle}
      />

      {/* 무기 */}
      <Weapon
        weaponType={weaponType}
        isAttacking={isAttacking}
        mouseAngle={mouseAngle}
        enemies={enemies}
        onEnemyDamage={handleEnemyDamage}
        camera={camera}
      />

      {/* 적들 */}
      {enemies.map((enemy) => (
        <Enemy key={enemy.id} {...enemy} playerRef={playerRef} onDamage={handleDamage} wave={wave} />
      ))}
    </>
  )
}
