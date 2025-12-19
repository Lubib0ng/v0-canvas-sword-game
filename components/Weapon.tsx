"use client"

import { useRef, useEffect } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"

interface WeaponProps {
  weaponType: string
  isAttacking: boolean
  mouseAngle: { x: number; y: number }
  enemies: any[]
  onEnemyDamage: (id: number, damage: number) => void
  camera: THREE.Camera
}

export default function Weapon({ weaponType, isAttacking, mouseAngle, enemies, onEnemyDamage, camera }: WeaponProps) {
  const weaponRef = useRef<THREE.Mesh>(null)
  const attackTime = useRef(0)
  const lastAttackTime = useRef(0)
  const hitEnemies = useRef(new Set<number>())

  const weaponStats = {
    longsword: { range: 2, damage: 15, cooldown: 0.5, width: 0.1, height: 2 },
    dagger: { range: 1, damage: 8, cooldown: 0.25, width: 0.05, height: 1 },
    greatsword: { range: 3, damage: 30, cooldown: 1, width: 0.15, height: 3 },
    chainsaw: { range: 1.5, damage: 5, cooldown: 0.1, width: 0.3, height: 0.8 },
  }

  const stats = weaponStats[weaponType as keyof typeof weaponStats]

  useEffect(() => {
    if (isAttacking) {
      attackTime.current = 0
      hitEnemies.current.clear()
    }
  }, [isAttacking])

  useFrame((state, delta) => {
    if (!weaponRef.current) return

    const time = state.clock.elapsedTime

    // 무기 위치 (카메라 앞)
    const weaponPos = new THREE.Vector3(0.5, -0.3, -1)
    weaponPos.applyEuler(camera.rotation)
    weaponPos.add(camera.position)
    weaponRef.current.position.copy(weaponPos)

    // 무기 회전
    weaponRef.current.rotation.copy(camera.rotation)

    // 공격 애니메이션
    if (isAttacking && attackTime.current < 0.3) {
      attackTime.current += delta
      const progress = attackTime.current / 0.3
      weaponRef.current.rotation.z = camera.rotation.z + (Math.sin(progress * Math.PI) * Math.PI) / 4

      // 충돌 검사
      if (time - lastAttackTime.current >= stats.cooldown) {
        checkCollision()
        lastAttackTime.current = time
      }
    } else if (weaponType === "chainsaw") {
      // 전기톱 자동 회전
      weaponRef.current.rotation.z = camera.rotation.z + time * 10
      if (time - lastAttackTime.current >= stats.cooldown) {
        checkCollision()
        lastAttackTime.current = time
      }
    }
  })

  const checkCollision = () => {
    if (!weaponRef.current) return

    const weaponWorldPos = new THREE.Vector3()
    weaponRef.current.getWorldPosition(weaponWorldPos)

    enemies.forEach((enemy) => {
      if (hitEnemies.current.has(enemy.id)) return

      const enemyPos = new THREE.Vector3(...enemy.position)
      const distance = weaponWorldPos.distanceTo(enemyPos)

      if (distance < stats.range) {
        onEnemyDamage(enemy.id, stats.damage)
        hitEnemies.current.add(enemy.id)
      }
    })
  }

  return (
    <mesh ref={weaponRef}>
      <boxGeometry args={[stats.width, stats.height, 0.1]} />
      <meshStandardMaterial color={weaponType === "chainsaw" ? "#ff6600" : "#c0c0c0"} metalness={0.8} roughness={0.2} />
    </mesh>
  )
}
