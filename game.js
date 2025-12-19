const CANVAS_WIDTH = 800
const CANVAS_HEIGHT = 600
const PLAYER_SIZE = 25
const PLAYER_SPEED = 1.8 // 이동속도 추가 너프 (기존 2.5 -> 1.8)
const ENEMY_SIZE = 20

const SWORD_TYPES = {
  LONGSWORD: {
    name: "롱소드",
    range: 60,
    damage: 25,
    cooldown: 500, // ms
    swingAngle: Math.PI / 3,
    color: "#4682b4",
  },
  DAGGER: {
    name: "단검",
    range: 40,
    damage: 15,
    cooldown: 250, // ms
    swingAngle: Math.PI / 4,
    color: "#9370db",
  },
  GREATSWORD: {
    name: "대검",
    range: 90,
    damage: 50,
    cooldown: 1000, // ms
    swingAngle: Math.PI / 2,
    color: "#dc143c",
  },
}

const ENEMY_TYPES = {
  NORMAL: {
    name: "일반",
    speed: 1.2,
    health: 30,
    damage: 10,
    color: "#ff4444",
    size: ENEMY_SIZE,
  },
  FAST: {
    name: "빠른",
    speed: 2.5,
    health: 20,
    damage: 10,
    color: "#ffff44",
    size: ENEMY_SIZE * 0.8,
  },
  TANK: {
    name: "탱커",
    speed: 0.7,
    health: 100,
    damage: 5,
    color: "#888888",
    size: ENEMY_SIZE * 1.5,
  },
  RANGED: {
    name: "원거리",
    speed: 0,
    health: 40,
    damage: 15,
    color: "#44ffff",
    size: ENEMY_SIZE,
    shootInterval: 2000,
  },
}

const BOSS_TYPES = {
  BOSS_1: {
    name: "어둠의 기사",
    speed: 1.0, // 1.5에서 감소
    health: 500,
    damage: 25,
    color: "#8b00ff",
    size: ENEMY_SIZE * 4, // 3에서 증가
    pattern: "charge",
  },
  BOSS_2: {
    name: "사신",
    speed: 1.3, // 2.0에서 감소
    health: 1000,
    damage: 35,
    color: "#ff0080",
    size: ENEMY_SIZE * 4.5, // 3.5에서 증가
    pattern: "teleport",
  },
  BOSS_3: {
    name: "파멸의 군주",
    speed: 0.7, // 1.0에서 감소
    health: 2000,
    damage: 50,
    color: "#ff6600",
    size: ENEMY_SIZE * 5, // 4에서 증가
    pattern: "summon",
  },
}

class Projectile {
  constructor(x, y, targetX, targetY, damage) {
    this.x = x
    this.y = y
    this.damage = damage
    this.speed = 3
    this.size = 8

    const angle = Math.atan2(targetY - y, targetX - x)
    this.vx = Math.cos(angle) * this.speed
    this.vy = Math.sin(angle) * this.speed
  }

  update() {
    this.x += this.vx
    this.y += this.vy
  }

  draw(ctx) {
    ctx.fillStyle = "#ff4444"
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
    ctx.fill()
  }

  isOffScreen() {
    return this.x < -50 || this.x > CANVAS_WIDTH + 50 || this.y < -50 || this.y > CANVAS_HEIGHT + 50
  }
}

class Sword {
  constructor(type) {
    this.type = SWORD_TYPES[type]
    this.isSwinging = false
    this.swingProgress = 0
    this.swingDuration = 300
    this.angle = 0
    this.targetAngle = 0
    this.lastAttackTime = 0
  }

  startSwing(angle) {
    const currentTime = Date.now()
    if (currentTime - this.lastAttackTime < this.type.cooldown) {
      return false
    }

    this.isSwinging = true
    this.swingProgress = 0
    this.targetAngle = angle
    this.lastAttackTime = currentTime
    return true
  }

  update() {
    if (this.isSwinging) {
      this.swingProgress += 1000 / 60 / this.swingDuration
      if (this.swingProgress >= 1) {
        this.isSwinging = false
        this.swingProgress = 0
      }
    }

    this.angle += (this.targetAngle - this.angle) * 0.3
  }

  draw(ctx, x, y, angle) {
    if (!this.isSwinging && this.swingProgress === 0) return

    ctx.save()
    ctx.translate(x, y)

    const swingStart = -this.type.swingAngle / 2
    const swingEnd = this.type.swingAngle / 2
    const currentSwingAngle = swingStart + (swingEnd - swingStart) * this.swingProgress

    ctx.rotate(angle + currentSwingAngle)

    ctx.strokeStyle = this.type.color
    ctx.lineWidth = 8
    ctx.lineCap = "round"

    ctx.beginPath()
    ctx.moveTo(10, 0)
    ctx.lineTo(this.type.range, 0)
    ctx.stroke()

    ctx.fillStyle = "#8B4513"
    ctx.fillRect(0, -5, 15, 10)

    ctx.restore()
  }

  checkHit(enemyX, enemyY, playerX, playerY, enemySize, enemyId) {
    if (!this.isSwinging) return false

    const dx = enemyX - playerX
    const dy = enemyY - playerY
    const distance = Math.sqrt(dx * dx + dy * dy)

    if (distance > this.type.range + enemySize / 2) return false

    const angleToEnemy = Math.atan2(dy, dx)

    const swingStart = -this.type.swingAngle / 2
    const swingEnd = this.type.swingAngle / 2
    const currentSwingAngle = swingStart + (swingEnd - swingStart) * this.swingProgress
    const currentAngle = this.angle + currentSwingAngle

    let angleDiff = angleToEnemy - currentAngle
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2

    return Math.abs(angleDiff) < Math.PI / 4
  }
}

class Player {
  constructor(x, y, swordType) {
    this.x = x
    this.y = y
    this.size = PLAYER_SIZE
    this.speed = PLAYER_SPEED
    this.maxHealth = 100
    this.health = this.maxHealth
    this.sword = new Sword(swordType)
    this.mouseAngle = 0
    this.isDashing = false
    this.dashSpeed = 15
    this.dashDuration = 150
    this.dashCooldown = 1000
    this.lastDashTime = 0
    this.dashEndTime = 0
    this.invincible = false
  }

  takeDamage(amount) {
    if (this.invincible) return
    this.health -= amount
    if (this.health < 0) this.health = 0
  }

  heal(amount) {
    this.health += amount
    if (this.health > this.maxHealth) this.health = this.maxHealth
  }

  update(keys) {
    const currentTime = Date.now()

    if (this.isDashing) {
      this.x += this.dashDirectionX * this.dashSpeed
      this.y += this.dashDirectionY * this.dashSpeed

      if (currentTime >= this.dashEndTime) {
        this.isDashing = false
        this.invincible = false
      }
    } else {
      if (keys["w"] || keys["arrowup"]) this.y -= this.speed
      if (keys["s"] || keys["arrowdown"]) this.y += this.speed
      if (keys["a"] || keys["arrowleft"]) this.x -= this.speed
      if (keys["d"] || keys["arrowright"]) this.x += this.speed
    }

    this.x = Math.max(this.size, Math.min(CANVAS_WIDTH - this.size, this.x))
    this.y = Math.max(this.size, Math.min(CANVAS_HEIGHT - this.size, this.y))

    this.sword.update()
  }

  attack() {
    return this.sword.startSwing(this.mouseAngle)
  }

  dash(keys) {
    const currentTime = Date.now()

    if (currentTime - this.lastDashTime < this.dashCooldown) {
      return false
    }

    let dashX = 0
    let dashY = 0

    if (keys["w"] || keys["arrowup"]) dashY = -1
    if (keys["s"] || keys["arrowdown"]) dashY = 1
    if (keys["a"] || keys["arrowleft"]) dashX = -1
    if (keys["d"] || keys["arrowright"]) dashX = 1

    if (dashX === 0 && dashY === 0) {
      dashY = -1
    }

    const length = Math.sqrt(dashX * dashX + dashY * dashY)
    if (length > 0) {
      dashX /= length
      dashY /= length
    }

    this.dashDirectionX = dashX
    this.dashDirectionY = dashY
    this.isDashing = true
    this.invincible = true
    this.lastDashTime = currentTime
    this.dashEndTime = currentTime + this.dashDuration

    return true
  }

  draw(ctx) {
    ctx.save()
    ctx.translate(this.x, this.y)

    if (this.isDashing) {
      ctx.globalAlpha = 0.5
      ctx.shadowBlur = 20
      ctx.shadowColor = "#4a90e2"
    }

    ctx.fillStyle = "#4a90e2"
    ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size)

    ctx.fillStyle = "#2c5aa0"
    ctx.fillRect(-this.size / 4, -this.size / 2, this.size / 2, this.size)

    ctx.restore()

    this.sword.draw(ctx, this.x, this.y, this.mouseAngle)
  }
}

class Enemy {
  constructor(x, y, level, type) {
    this.x = x
    this.y = y
    this.type = type
    this.speed = type.speed * (1 + level * 0.1)
    this.maxHealth = type.health * (1 + level * 0.2)
    this.health = this.maxHealth
    this.damage = type.damage * (1 + level * 0.15)
    this.size = type.size
    this.color = type.color
    this.id = Math.random().toString(36).substr(2, 9)

    this.patternTimer = 0
    this.chargeSpeed = 0
    this.teleportTimer = 0
    this.summonTimer = 0

    if (type.shootInterval) {
      this.lastShootTime = Date.now()
      this.shootInterval = type.shootInterval
    }
  }

  updateBossPattern(player, game) {
    this.patternTimer++

    if (this.type.pattern === "charge") {
      if (this.patternTimer % 180 === 0) {
        const dx = player.x - this.x
        const dy = player.y - this.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        this.chargeSpeed = 8
        this.chargeVx = (dx / distance) * this.chargeSpeed
        this.chargeVy = (dy / distance) * this.chargeSpeed
      }

      if (this.chargeSpeed > 0) {
        this.x += this.chargeVx
        this.y += this.chargeVy
        this.chargeSpeed *= 0.95
      }
    } else if (this.type.pattern === "teleport") {
      if (this.patternTimer % 120 === 0) {
        const angle = Math.random() * Math.PI * 2
        const distance = 200
        this.x = player.x + Math.cos(angle) * distance
        this.y = player.y + Math.sin(angle) * distance

        this.x = Math.max(this.size, Math.min(CANVAS_WIDTH - this.size, this.x))
        this.y = Math.max(this.size, Math.min(CANVAS_HEIGHT - this.size, this.y))
      }
    } else if (this.type.pattern === "summon") {
      if (this.patternTimer % 240 === 0 && game.enemies.length < 30) {
        for (let i = 0; i < 3; i++) {
          const angle = ((Math.PI * 2) / 3) * i
          const distance = 100
          const spawnX = this.x + Math.cos(angle) * distance
          const spawnY = this.y + Math.sin(angle) * distance

          const randomType = Math.random() < 0.5 ? ENEMY_TYPES.FAST : ENEMY_TYPES.NORMAL
          game.enemies.push(new Enemy(spawnX, spawnY, game.level, randomType))
        }
      }
    }
  }

  update(player, game) {
    if (this.type.pattern) {
      this.updateBossPattern(player, game)
    }

    if (this.type.shootInterval) {
      const currentTime = Date.now()
      if (currentTime - this.lastShootTime > this.shootInterval) {
        game.projectiles.push(new Projectile(this.x, this.y, player.x, player.y, this.damage))
        this.lastShootTime = currentTime
      }
      return
    }

    if (!this.type.pattern || this.chargeSpeed <= 0) {
      const dx = player.x - this.x
      const dy = player.y - this.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance > 0) {
        this.x += (dx / distance) * this.speed
        this.y += (dy / distance) * this.speed
      }
    }
  }

  takeDamage(amount) {
    this.health -= amount
    return this.health <= 0
  }

  draw(ctx) {
    if (this.type.pattern) {
      ctx.fillStyle = this.color + "33"
      ctx.beginPath()
      ctx.arc(this.x, this.y, this.size * 1.5, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = "#ffd700"
      ctx.font = `${this.size}px Arial`
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillText("👑", this.x, this.y - this.size * 1.2)
    }

    ctx.fillStyle = this.color
    if (this.type === ENEMY_TYPES.TANK) {
      ctx.fillRect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size)
    } else {
      ctx.beginPath()
      ctx.arc(this.x, this.y, this.size / 2, 0, Math.PI * 2)
      ctx.fill()
    }

    const barWidth = this.size * 1.2
    const barHeight = 4
    const healthPercent = this.health / this.maxHealth

    ctx.fillStyle = "#333"
    ctx.fillRect(this.x - barWidth / 2, this.y - this.size - 10, barWidth, barHeight)

    ctx.fillStyle = this.type.pattern ? "#ffd700" : "#4ade80"
    ctx.fillRect(this.x - barWidth / 2, this.y - this.size - 10, barWidth * healthPercent, barHeight)
  }
}

class UI {
  constructor() {
    this.healthBar = document.getElementById("healthBar")
    this.healthValue = document.getElementById("healthValue")
    this.scoreValue = document.getElementById("scoreValue")
    this.levelValue = document.getElementById("levelValue")
    this.killsValue = document.getElementById("killsValue")
    this.waveValue = document.getElementById("waveValue")
    this.upgradesContainer = document.getElementById("upgradesContainer")
  }

  updateHealth(current, max) {
    const percent = (current / max) * 100
    this.healthBar.style.width = percent + "%"
    this.healthValue.textContent = `${Math.max(0, current)}/${max}`
  }

  updateScore(score) {
    this.scoreValue.textContent = score
  }

  updateLevel(level) {
    this.levelValue.textContent = level
  }

  updateKills(kills) {
    this.killsValue.textContent = kills
  }

  updateWave(wave) {
    this.waveValue.textContent = wave
  }

  addUpgrade(message) {
    const upgrade = document.createElement("div")
    upgrade.className = "upgrade-item"
    upgrade.textContent = message
    this.upgradesContainer.insertBefore(upgrade, this.upgradesContainer.firstChild)

    if (this.upgradesContainer.children.length > 5) {
      this.upgradesContainer.removeChild(this.upgradesContainer.lastChild)
    }
  }
}

class Game {
  constructor() {
    this.canvas = document.getElementById("gameCanvas")
    this.ctx = this.canvas.getContext("2d")
    this.ui = new UI()

    this.keys = {}
    this.isPaused = false
    this.isGameOver = false
    this.isStarted = false
    this.selectedSwordType = null

    this.score = 0
    this.level = 1
    this.wave = 1
    this.kills = 0

    this.player = null
    this.enemies = []
    this.projectiles = []

    this.lastDamageTime = 0
    this.damageInterval = 1000

    this.isBossFight = false

    this.setupControls()
    this.showStartScreen()
  }

  showStartScreen() {
    const startScreen = document.createElement("div")
    startScreen.id = "startScreen"
    startScreen.className = "sword-selection-screen active"
    startScreen.innerHTML = `
      <div class="sword-selection-content">
        <h2>검 로그라이크</h2>
        <p style="color: #a0a0a0; margin-bottom: 30px;">30웨이브를 생존하세요!</p>
        <button id="startButton" style="
          background: linear-gradient(135deg, #ffd700, #ffed4e);
          color: #1a1a2e;
          border: none;
          padding: 20px 60px;
          font-size: 1.5rem;
          font-weight: 700;
          border-radius: 12px;
          cursor: pointer;
          box-shadow: 0 4px 15px rgba(255, 215, 0, 0.3);
          transition: transform 0.2s;
        ">게임 시작</button>
      </div>
    `
    document.body.appendChild(startScreen)

    document.getElementById("startButton").addEventListener("click", () => {
      startScreen.remove()
      this.showSwordSelection()
    })
  }

  showSwordSelection() {
    const selectionScreen = document.getElementById("swordSelectionScreen")
    selectionScreen.classList.add("active")
  }

  startGame(swordType) {
    this.selectedSwordType = swordType
    this.player = new Player(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, swordType)
    this.isStarted = true
    this.startWave()
    this.gameLoop()
  }

  setupControls() {
    document.addEventListener("keydown", (e) => {
      this.handleKeyDown(e)
    })

    document.addEventListener("keyup", (e) => {
      this.keys[e.key.toLowerCase()] = false
    })

    this.canvas.addEventListener("mousemove", (e) => {
      if (!this.player) return
      const rect = this.canvas.getBoundingClientRect()
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top
      this.player.mouseAngle = Math.atan2(mouseY - this.player.y, mouseX - this.player.x)
    })

    this.canvas.addEventListener("click", (e) => {
      if (!this.player || this.isPaused || this.isGameOver) return
      this.player.attack()
    })

    this.canvas.addEventListener("contextmenu", (e) => {
      e.preventDefault()
      if (!this.player || this.isPaused || this.isGameOver) return
      this.player.attack()
    })

    document.getElementById("selectLongsword").addEventListener("click", () => {
      document.getElementById("swordSelectionScreen").classList.remove("active")
      this.startGame("LONGSWORD")
    })

    document.getElementById("selectDagger").addEventListener("click", () => {
      document.getElementById("swordSelectionScreen").classList.remove("active")
      this.startGame("DAGGER")
    })

    document.getElementById("selectGreatsword").addEventListener("click", () => {
      document.getElementById("swordSelectionScreen").classList.remove("active")
      this.startGame("GREATSWORD")
    })

    document.getElementById("restartButton").addEventListener("click", () => {
      location.reload()
    })
  }

  handleKeyDown(e) {
    const key = e.key.toLowerCase()
    this.keys[key] = true

    if (key === "q" && !this.isGameOver && !this.isPaused && !this.isBossFight) {
      this.player.dash(this.keys)
    }

    if (key === "p") {
      this.isPaused = !this.isPaused
    }

    if (key === "r" && this.isGameOver) {
      location.reload()
    }
  }

  startWave() {
    if (this.wave === 10) {
      this.isBossFight = true
      this.enemies.push(new Enemy(CANVAS_WIDTH / 2, -100, this.level, BOSS_TYPES.BOSS_1))
      this.ui.addUpgrade("⚠️ 보스 등장: 어둠의 기사!")
      return
    } else if (this.wave === 20) {
      this.isBossFight = true
      this.enemies.push(new Enemy(CANVAS_WIDTH / 2, -100, this.level, BOSS_TYPES.BOSS_2))
      this.ui.addUpgrade("⚠️ 보스 등장: 사신!")
      return
    } else if (this.wave === 30) {
      this.isBossFight = true
      this.enemies.push(new Enemy(CANVAS_WIDTH / 2, -100, this.level, BOSS_TYPES.BOSS_3))
      this.ui.addUpgrade("⚠️ 최종 보스 등장: 파멸의 군주!")
      return
    }

    const baseEnemyCount = 5 + this.wave * 2

    for (let i = 0; i < baseEnemyCount; i++) {
      const side = Math.floor(Math.random() * 4)
      let x, y
      const margin = 100

      if (side === 0) {
        x = Math.random() * (CANVAS_WIDTH - margin * 2) + margin
        y = margin
      } else if (side === 1) {
        x = CANVAS_WIDTH - margin
        y = Math.random() * (CANVAS_HEIGHT - margin * 2) + margin
      } else if (side === 2) {
        x = Math.random() * (CANVAS_WIDTH - margin * 2) + margin
        y = CANVAS_HEIGHT - margin
      } else {
        x = margin
        y = Math.random() * (CANVAS_HEIGHT - margin * 2) + margin
      }

      const rand = Math.random()
      let type = ENEMY_TYPES.NORMAL

      if (this.wave >= 2 && rand < 0.2) {
        type = ENEMY_TYPES.FAST
      } else if (this.wave >= 3 && rand < 0.35) {
        type = ENEMY_TYPES.TANK
      } else if (this.wave >= 4 && rand < 0.45) {
        type = ENEMY_TYPES.RANGED
      }

      this.enemies.push(new Enemy(x, y, this.level, type))
    }

    this.ui.updateWave(this.wave)
  }

  handleInput() {
    let dx = 0
    let dy = 0

    if (this.keys["w"] || this.keys["arrowup"]) dy -= 1
    if (this.keys["s"] || this.keys["arrowdown"]) dy += 1
    if (this.keys["a"] || this.keys["arrowleft"]) dx -= 1
    if (this.keys["d"] || this.keys["arrowright"]) dx += 1

    if (dx !== 0 || dy !== 0) {
      const magnitude = Math.sqrt(dx * dx + dy * dy)
      dx /= magnitude
      dy /= magnitude

      this.player.x += dx * this.player.speed
      this.player.y += dy * this.player.speed

      this.player.x = Math.max(this.player.size, Math.min(CANVAS_WIDTH - this.player.size, this.player.x))
      this.player.y = Math.max(this.player.size, Math.min(CANVAS_HEIGHT - this.player.size, this.player.y))
    }

    if (this.keys["shift"] && !this.player.isDashing) {
      this.player.dash(this.keys)
    }
  }

  update() {
    if (this.isPaused || this.isGameOver || !this.isStarted) return

    this.handleInput()
    this.player.update(this.keys)

    this.enemies.forEach((enemy) => {
      enemy.update(this.player, this)
    })

    this.projectiles.forEach((projectile) => {
      projectile.update()
    })

    this.projectiles = this.projectiles.filter((p) => !p.isOffScreen())

    this.checkCollisions()
    this.checkWaveComplete()

    if (this.player.health <= 0) {
      this.gameOver()
    }
  }

  checkCollisions() {
    const currentTime = Date.now()

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i]

      if (this.player.sword.checkHit(enemy.x, enemy.y, this.player.x, this.player.y, enemy.size, enemy.id)) {
        if (enemy.takeDamage(this.player.sword.type.damage)) {
          this.enemies.splice(i, 1)
          this.kills++
          this.score += enemy.type.pattern ? 500 : 10
          this.ui.updateKills(this.kills)
          this.ui.updateScore(this.score)

          if (this.kills % 10 === 0) {
            this.levelUp()
          }
          continue
        }
      }

      const dx = this.player.x - enemy.x
      const dy = this.player.y - enemy.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance < this.player.size / 2 + enemy.size / 2) {
        if (currentTime - this.lastDamageTime > this.damageInterval) {
          this.player.takeDamage(enemy.damage)
          this.ui.updateHealth(this.player.health, this.player.maxHealth)
          this.lastDamageTime = currentTime
        }
      }
    }

    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i]
      const dx = this.player.x - proj.x
      const dy = this.player.y - proj.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance < this.player.size / 2 + proj.size) {
        this.player.takeDamage(proj.damage)
        this.ui.updateHealth(this.player.health, this.player.maxHealth)
        this.projectiles.splice(i, 1)
      }
    }
  }

  levelUp() {
    this.level++
    this.ui.updateLevel(this.level)

    const upgrades = [
      { type: "damage", message: "공격력 증가!" },
      { type: "health", message: "최대 체력 증가!" },
      { type: "speed", message: "이동 속도 증가!" },
    ]

    const upgrade = upgrades[Math.floor(Math.random() * upgrades.length)]

    switch (upgrade.type) {
      case "damage":
        this.player.sword.type.damage *= 1.1
        break
      case "health":
        this.player.maxHealth += 20
        this.player.heal(20)
        this.ui.updateHealth(this.player.health, this.player.maxHealth)
        break
      case "speed":
        this.player.speed *= 1.05
        break
    }

    this.ui.addUpgrade(`레벨 ${this.level}: ${upgrade.message}`)
  }

  checkWaveComplete() {
    if (this.enemies.length === 0) {
      if (this.isBossFight) {
        this.isBossFight = false

        this.player.maxHealth += 50
        this.player.heal(100)
        this.player.sword.type.damage *= 1.5
        this.player.speed *= 1.1

        this.ui.updateHealth(this.player.health, this.player.maxHealth)
        this.ui.addUpgrade("🏆 보스 처치! 능력치 대폭 상승!")

        if (this.wave === 30) {
          this.gameWin()
          return
        }
      } else {
        this.player.heal(20)
        this.ui.updateHealth(this.player.health, this.player.maxHealth)
        this.ui.addUpgrade("웨이브 클리어! 체력 회복 +20")
      }

      this.wave++
      this.startWave()
    }
  }

  gameWin() {
    this.isGameOver = true
    const gameOverScreen = document.getElementById("gameOverScreen")
    const gameOverContent = gameOverScreen.querySelector(".game-over-content")

    gameOverContent.querySelector("h2").textContent = "게임 클리어!"
    gameOverContent.querySelector("h2").style.color = "#ffd700"

    document.getElementById("finalScore").textContent = this.score
    document.getElementById("finalLevel").textContent = this.level
    document.getElementById("finalKills").textContent = this.kills

    gameOverScreen.classList.add("active")
  }

  gameOver() {
    this.isGameOver = true
    const gameOverScreen = document.getElementById("gameOverScreen")

    document.getElementById("finalScore").textContent = this.score
    document.getElementById("finalLevel").textContent = this.level
    document.getElementById("finalKills").textContent = this.kills

    gameOverScreen.classList.add("active")
  }

  draw() {
    this.ctx.fillStyle = "#0a0a15"
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    if (!this.isStarted) return

    this.player.draw(this.ctx)

    this.enemies.forEach((enemy) => {
      enemy.draw(this.ctx)
    })

    this.projectiles.forEach((projectile) => {
      projectile.draw(this.ctx)
    })

    if (this.isPaused) {
      this.ctx.fillStyle = "rgba(0, 0, 0, 0.7)"
      this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
      this.ctx.fillStyle = "#ffd700"
      this.ctx.font = "48px Arial"
      this.ctx.textAlign = "center"
      this.ctx.textBaseline = "middle"
      this.ctx.fillText("일시정지", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2)
    }

    this.drawUI(this.ctx)
  }

  drawUI(ctx) {
    const dashCooldown = this.player.lastDashTime + this.player.dashCooldown - Date.now()
    const dashReady = dashCooldown <= 0

    ctx.fillStyle = dashReady ? "#00ff00" : "#666"
    ctx.font = "16px Arial"
    ctx.textAlign = "left"
    ctx.fillText(`대쉬 (Q): ${dashReady ? "준비완료" : `${Math.ceil(dashCooldown / 1000)}초`}`, 20, CANVAS_HEIGHT - 70)
  }

  gameLoop() {
    this.update()
    this.draw()
    requestAnimationFrame(() => this.gameLoop())
  }
}

const game = new Game()
