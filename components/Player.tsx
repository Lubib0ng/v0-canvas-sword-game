"use client"

import { useRef, useEffect, forwardRef } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import { RigidBody, type RigidBodyApi } from "@react-three/rapier"
import * as THREE from "three"

interface PlayerProps {
  onAttack: () => void
  onDash: () => void
  isDashing: boolean
  mouseAngle: { x: number; y: number }
}

const Player = forwardRef<RigidBodyApi, PlayerProps>(({ onAttack, onDash, isDashing, mouseAngle }, ref) => {
  const keys = useRef({ w: false, a: false, s: false, d: false, q: false })
  const { camera } = useThree()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()
      if (key in keys.current) {
        keys.current[key as keyof typeof keys.current] = true
      }
      if (key === "q") {
        onDash()
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()
      if (key in keys.current) {
        keys.current[key as keyof typeof keys.current] = false
      }
    }

    const handleClick = () => {
      onAttack()
    }

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)
    window.addEventListener("click", handleClick)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
      window.removeEventListener("click", handleClick)
    }
  }, [onAttack, onDash])

  useFrame(() => {
    if (!ref || !("current" in ref) || !ref.current) return

    const speed = isDashing ? 10 : 5
    const velocity = new THREE.Vector3()

    if (keys.current.w) velocity.z -= speed
    if (keys.current.s) velocity.z += speed
    if (keys.current.a) velocity.x -= speed
    if (keys.current.d) velocity.x += speed

    // 카메라 방향으로 이동
    velocity.applyEuler(new THREE.Euler(0, mouseAngle.y, 0))

    const currentVel = ref.current.linvel()
    ref.current.setLinvel({ x: velocity.x, y: currentVel.y, z: velocity.z }, true)

    // 카메라 위치 업데이트
    const position = ref.current.translation()
    camera.position.set(position.x, position.y + 0.6, position.z)

    const clampedX = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, mouseAngle.x))
    camera.rotation.set(clampedX, mouseAngle.y, 0)
  })

  return (
    <RigidBody ref={ref} position={[0, 1.6, 0]} lockRotations>
      <mesh visible={false}>
        <capsuleGeometry args={[0.5, 0.5]} />
      </mesh>
    </RigidBody>
  )
})

Player.displayName = "Player"

export default Player
