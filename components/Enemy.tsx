"use client"

import type React from "react"

import { useRef } from "react"
import { useFrame } from "@react-three/fiber"
import { RigidBody, type RigidBodyApi } from "@react-three/rapier"
import * as THREE from "three"

interface EnemyProps {
  id: number
  type: string
  position: number[]
  health: number
  speed: number
  playerRef: React.RefObject<RigidBodyApi>
  onDamage: (amount: number) => void
  wave: number
}

export default function Enemy({ id, type, position, health, speed, playerRef, onDamage, wave }: EnemyProps) {
  const enemyRef = useRef<RigidBodyApi>(null)
  const lastDamageTime = useRef(0)

  const enemyConfig = {
    basic: { color: "#ff4444", size: 0.5, damage: 5 },
    fast: { color: "#ffff44", size: 0.4, damage: 3 },
    tank: { color: "#888888", size: 0.8, damage: 10 },
    ranged: { color: "#44ffff", size: 0.5, damage: 2 },
    boss: { color: "#ff00ff", size: 1.5, damage: 20 },
  }

  const config = enemyConfig[type as keyof typeof enemyConfig]

  useFrame((state, delta) => {
    if (!enemyRef.current || !playerRef.current) return

    const enemyPos = enemyRef.current.translation()
    const playerPos = playerRef.current.translation()

    const direction = new THREE.Vector3(playerPos.x - enemyPos.x, 0, playerPos.z - enemyPos.z).normalize()

    const actualSpeed = speed * (1 + wave * 0.05)
    enemyRef.current.setLinvel(
      {
        x: direction.x * actualSpeed,
        y: enemyRef.current.linvel().y,
        z: direction.z * actualSpeed,
      },
      true,
    )

    // 플레이어 충돌 검사
    const distance = Math.sqrt(Math.pow(playerPos.x - enemyPos.x, 2) + Math.pow(playerPos.z - enemyPos.z, 2))

    const time = state.clock.elapsedTime
    if (distance < 1 && time - lastDamageTime.current > 1) {
      onDamage(config.damage)
      lastDamageTime.current = time
    }
  })

  if (health <= 0) return null

  return (
    <RigidBody ref={enemyRef} position={position as [number, number, number]} lockRotations>
      <mesh>
        <boxGeometry args={[config.size, config.size, config.size]} />
        <meshStandardMaterial color={config.color} />
      </mesh>
    </RigidBody>
  )
}
