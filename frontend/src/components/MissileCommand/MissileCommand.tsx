import { useEffect, useRef } from 'react'
import { playMCLaunch, playMCExplosion, playMCCityHit, playMCGameOver } from '../../sounds/sounds'
import { MISSILE_ART } from '../../constants/missileArt'
import styles from './MissileCommand.module.css'

const GREEN = '#00FF00'

interface IncomingMissile {
  x: number; y: number
  startX: number; startY: number
  targetX: number
  dx: number; dy: number
  speed: number
  destroyed: boolean
  reachedGround: boolean
}

interface CounterMissile {
  x: number; y: number
  startX: number; startY: number
  targetX: number; targetY: number
  dx: number; dy: number
  arrived: boolean
}

interface Explosion {
  x: number; y: number
  radius: number
  maxRadius: number
  expanding: boolean
  done: boolean
  expandRate: number
  shrinkRate: number
}

interface MushroomCloud {
  x: number; y: number
  t: number
  duration: number
  done: boolean
}

interface City {
  x: number
  alive: boolean
}

interface Launcher {
  x: number
  alive: boolean
}

type Status = 'start' | 'playing' | 'gameover'

export default function MissileCommand() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    canvas.width  = canvas.offsetWidth
    canvas.height = canvas.offsetHeight
    const W = canvas.width
    const H = canvas.height

    // ─── Layout ───────────────────────────────────────────────────────────────
    const GROUND_Y      = H - 50
    const LAUNCHER_L_X  = 55
    const LAUNCHER_R_X  = W - 55
    const LAUNCHER_Y    = GROUND_Y
    const cityGap       = (LAUNCHER_R_X - LAUNCHER_L_X) / 4
    const CITY_XS       = [
      LAUNCHER_L_X + cityGap,
      LAUNCHER_L_X + cityGap * 2,
      LAUNCHER_L_X + cityGap * 3,
    ]

    // ─── State ────────────────────────────────────────────────────────────────
    let status: Status    = 'start'
    let score             = 0
    let wave              = 0
    let cities: City[]    = []
    let launchers: Launcher[] = []
    let incoming: IncomingMissile[] = []
    let counters: CounterMissile[]  = []
    let explosions: Explosion[]     = []
    let mushrooms: MushroomCloud[]  = []
    let spawnQueue             = 0
    let spawnTimer             = 0
    let waveClearing           = false
    let waveClearTimer         = 0
    let waveBannerTimer        = 0
    let currentWaveSpeed       = 0
    let currentSpawnInterval   = 0

    function dist(ax: number, ay: number, bx: number, by: number) {
      return Math.sqrt((ax - bx) ** 2 + (ay - by) ** 2)
    }

    // ─── Init / wave ──────────────────────────────────────────────────────────
    function initGame() {
      score     = 0
      wave      = 0
      cities    = CITY_XS.map(x => ({ x, alive: true }))
      launchers = [
        { x: LAUNCHER_L_X, alive: true },
        { x: LAUNCHER_R_X, alive: true },
      ]
      incoming   = []
      counters   = []
      explosions = []
      mushrooms  = []
      startWave(1)
    }

    function startWave(n: number) {
      wave                  = n
      currentWaveSpeed      = Math.min(0.32 + (n - 1) * 0.05, 0.72)
      currentSpawnInterval  = Math.max(480, 1900 - (n - 1) * 160)
      spawnQueue            = Math.min(4 + (n - 1) * 2, 14)
      spawnTimer            = 900
      waveClearing          = false
      waveBannerTimer       = 2200
    }

    // ─── Spawn ────────────────────────────────────────────────────────────────
    function spawnIncoming() {
      const liveCities   = cities.filter(c => c.alive)
      const liveLaunchers = launchers.filter(l => l.alive)
      if (liveCities.length === 0) return
      let targetX: number
      if (Math.random() < 0.72 || liveLaunchers.length === 0) {
        const t = liveCities[Math.floor(Math.random() * liveCities.length)]
        targetX = t.x + (Math.random() * 18 - 9)
      } else {
        const t = liveLaunchers[Math.floor(Math.random() * liveLaunchers.length)]
        targetX = t.x + (Math.random() * 12 - 6)
      }
      const startX   = W * 0.08 + Math.random() * W * 0.84
      const startY   = 0
      const dx_raw   = targetX - startX
      const dy_raw   = GROUND_Y - startY
      const len      = Math.sqrt(dx_raw * dx_raw + dy_raw * dy_raw)
      const speed    = currentWaveSpeed * (0.82 + Math.random() * 0.36)
      incoming.push({
        x: startX, y: startY,
        startX,    startY: 0,
        targetX,
        dx: dx_raw / len,
        dy: dy_raw / len,
        speed,
        destroyed: false,
        reachedGround: false,
      })
    }

    function fireCounter(mouseX: number, mouseY: number) {
      const aliveLaunchers = launchers.filter(l => l.alive)
      if (aliveLaunchers.length === 0) return
      const chosen = aliveLaunchers.reduce((best, l) =>
        dist(mouseX, mouseY, l.x, LAUNCHER_Y) < dist(mouseX, mouseY, best.x, LAUNCHER_Y) ? l : best
      )
      const lx = chosen.x
      const ly        = LAUNCHER_Y - 24          // tip of launcher
      const dx_raw    = mouseX - lx
      const dy_raw    = mouseY - ly
      const len       = Math.sqrt(dx_raw * dx_raw + dy_raw * dy_raw)
      if (len < 2) return
      counters.push({
        x: lx, y: ly,
        startX: lx, startY: ly,
        targetX: mouseX, targetY: mouseY,
        dx: dx_raw / len,
        dy: dy_raw / len,
        arrived: false,
      })
      playMCLaunch()
    }

    function createExplosion(x: number, y: number) {
      explosions.push({
        x, y,
        radius: 0,
        maxRadius: 42 + Math.random() * 18,
        expanding: true,
        done: false,
        expandRate: 1.7,
        shrinkRate: 2.1,
      })
      playMCExplosion()
    }

    function createMushroom(x: number, y: number) {
      mushrooms.push({ x, y, t: 0, duration: 3400, done: false })
    }

    // ─── Update ───────────────────────────────────────────────────────────────
    function update(delta: number) {
      if (status !== 'playing') return
      const dt = delta / 16.667

      if (waveBannerTimer > 0) waveBannerTimer -= delta

      // Game over once all cities (or all launchers) gone and mushroom clouds settle
      const allCitiesGone    = cities.every(c => !c.alive)
      const allLaunchersGone = launchers.every(l => !l.alive)
      if ((allCitiesGone || allLaunchersGone) && mushrooms.every(m => m.done)) {
        status = 'gameover'
        playMCGameOver()
        return
      }

      // Spawn
      if (spawnQueue > 0) {
        spawnTimer -= delta
        if (spawnTimer <= 0) {
          spawnIncoming()
          spawnQueue--
          spawnTimer = currentSpawnInterval
        }
      }

      // Move incoming
      for (const m of incoming) {
        if (m.destroyed || m.reachedGround) continue
        m.x += m.dx * m.speed * dt
        m.y += m.dy * m.speed * dt
        if (m.y >= GROUND_Y) {
          m.reachedGround = true
          let hit = false
          for (const city of cities) {
            if (city.alive && Math.abs(m.x - city.x) < 36) {
              city.alive = false
              createMushroom(city.x, GROUND_Y)
              playMCCityHit()
              hit = true
              break
            }
          }
          if (!hit) {
            for (const launcher of launchers) {
              if (launcher.alive && Math.abs(m.x - launcher.x) < 30) {
                launcher.alive = false
                createMushroom(launcher.x, GROUND_Y)
                playMCCityHit()
                break
              }
            }
          }
        }
      }

      // Move counter missiles
      for (const c of counters) {
        if (c.arrived) continue
        const speed = 3.2
        c.x += c.dx * speed * dt
        c.y += c.dy * speed * dt
        if (dist(c.x, c.y, c.targetX, c.targetY) < speed * dt * 2 + 3) {
          c.arrived = true
          c.x = c.targetX
          c.y = c.targetY
          createExplosion(c.targetX, c.targetY)
        }
      }

      // Update explosions + check missile kills
      for (const exp of explosions) {
        if (exp.done) continue
        if (exp.expanding) {
          exp.radius += exp.expandRate * dt
          if (exp.radius >= exp.maxRadius) exp.expanding = false
        } else {
          exp.radius -= exp.shrinkRate * dt
          if (exp.radius <= 0) { exp.radius = 0; exp.done = true }
        }
        for (const m of incoming) {
          if (m.destroyed || m.reachedGround) continue
          if (dist(exp.x, exp.y, m.x, m.y) <= exp.radius) {
            m.destroyed = true
            score += 25
          }
        }
      }

      // Advance mushroom clouds
      for (const mc of mushrooms) {
        if (mc.done) continue
        mc.t += delta
        if (mc.t >= mc.duration) mc.done = true
      }

      // Wave clear check
      if (!waveClearing && spawnQueue === 0) {
        const anyActive = incoming.some(m => !m.destroyed && !m.reachedGround)
          || counters.some(c => !c.arrived)
          || explosions.some(e => !e.done)
        if (!anyActive) {
          waveClearing    = true
          waveClearTimer  = 2600
          score += cities.filter(c => c.alive).length * 100
        }
      }

      if (waveClearing) {
        waveClearTimer -= delta
        if (waveClearTimer <= 0) {
          incoming   = []
          counters   = []
          explosions = []
          startWave(wave + 1)
        }
      }
    }

    // ─── Draw helpers ─────────────────────────────────────────────────────────
    function glow(blur = 12) { ctx.shadowBlur = blur; ctx.shadowColor = GREEN }
    function noGlow()        { ctx.shadowBlur = 0 }

    function drawGround() {
      ctx.strokeStyle = GREEN
      ctx.lineWidth   = 1
      ctx.globalAlpha = 0.38
      glow(4)
      ctx.beginPath()
      ctx.moveTo(0, GROUND_Y)
      ctx.lineTo(W, GROUND_Y)
      ctx.stroke()
      noGlow()
      ctx.globalAlpha = 1
    }

    function drawLauncher(launcher: Launcher) {
      const x = launcher.x
      if (!launcher.alive) {
        // Rubble — same style as destroyed city
        ctx.fillStyle   = GREEN
        ctx.globalAlpha = 0.45
        for (let i = 0; i < 5; i++)
          ctx.fillRect(x - 14 + i * 7, GROUND_Y - 2 - (i % 2) * 3, 5, 3)
        ctx.globalAlpha = 1
        return
      }
      ctx.fillStyle = GREEN
      glow(8)
      ctx.fillRect(x - 12, GROUND_Y - 8,  24, 8)   // base plate
      ctx.fillRect(x - 6,  GROUND_Y - 18, 12, 10)  // body
      ctx.fillRect(x - 2,  GROUND_Y - 24,  4,  6)  // barrel tip
      noGlow()
    }

    function drawCity(city: City) {
      if (!city.alive) {
        // Rubble
        ctx.fillStyle   = GREEN
        ctx.globalAlpha = 0.45
        for (let i = 0; i < 7; i++)
          ctx.fillRect(city.x - 22 + i * 7, GROUND_Y - 2 - (i % 3) * 3, 5, 3)
        ctx.globalAlpha = 1
        return
      }
      ctx.fillStyle = GREEN
      glow(6)
      // Three buildings
      ctx.fillRect(city.x - 22, GROUND_Y - 20, 11, 20)
      ctx.fillRect(city.x - 8,  GROUND_Y - 30, 16, 30)
      ctx.fillRect(city.x + 11, GROUND_Y - 22, 11, 22)
      // Windows (black cutouts)
      ctx.fillStyle = '#000'
      ctx.fillRect(city.x - 20, GROUND_Y - 17, 3, 4)
      ctx.fillRect(city.x - 20, GROUND_Y -  9, 3, 4)
      ctx.fillRect(city.x -  5, GROUND_Y - 26, 4, 5)
      ctx.fillRect(city.x -  5, GROUND_Y - 17, 4, 5)
      ctx.fillRect(city.x +  1, GROUND_Y - 26, 4, 5)
      ctx.fillRect(city.x +  1, GROUND_Y - 17, 4, 5)
      ctx.fillRect(city.x + 13, GROUND_Y - 19, 3, 4)
      ctx.fillRect(city.x + 13, GROUND_Y - 10, 3, 4)
      noGlow()
    }

    function drawIncoming(m: IncomingMissile) {
      if (m.destroyed || m.reachedGround) return
      ctx.strokeStyle = GREEN
      ctx.lineWidth   = 1
      glow(6)
      ctx.beginPath()
      ctx.moveTo(m.startX, m.startY)
      ctx.lineTo(m.x, m.y)
      ctx.stroke()
      ctx.fillStyle = GREEN
      ctx.beginPath()
      ctx.arc(m.x, m.y, 3, 0, Math.PI * 2)
      ctx.fill()
      noGlow()
    }

    function drawCounter(c: CounterMissile) {
      if (c.arrived) return
      ctx.strokeStyle = GREEN
      ctx.lineWidth   = 1
      ctx.setLineDash([5, 4])
      glow(4)
      ctx.beginPath()
      ctx.moveTo(c.startX, c.startY)
      ctx.lineTo(c.x, c.y)
      ctx.stroke()
      ctx.setLineDash([])
      ctx.fillStyle = GREEN
      ctx.beginPath()
      ctx.arc(c.x, c.y, 2, 0, Math.PI * 2)
      ctx.fill()
      noGlow()
    }

    function drawExplosion(exp: Explosion) {
      if (exp.done || exp.radius <= 0) return
      const alpha = exp.expanding ? 1 : exp.radius / exp.maxRadius
      ctx.globalAlpha = Math.max(alpha, 0.08)
      ctx.strokeStyle = GREEN
      ctx.lineWidth   = 2
      glow(20)
      ctx.beginPath()
      ctx.arc(exp.x, exp.y, exp.radius, 0, Math.PI * 2)
      ctx.stroke()
      noGlow()
      ctx.globalAlpha = 1
    }

    function drawMushroom(mc: MushroomCloud) {
      if (mc.done) return
      const p    = mc.t / mc.duration
      const fade = p > 0.68 ? 1 - (p - 0.68) / 0.32 : 1
      ctx.globalAlpha = Math.max(fade, 0)
      ctx.fillStyle   = GREEN
      ctx.strokeStyle = GREEN

      // Fireball (p 0 → 0.32)
      if (p < 0.32) {
        const r = (p / 0.32) * 26
        glow(22)
        ctx.beginPath()
        ctx.arc(mc.x, mc.y, r, 0, Math.PI * 2)
        ctx.fill()
        noGlow()
      }

      // Column (p 0.18 → 0.88)
      if (p > 0.18) {
        const prog      = Math.min((p - 0.18) / 0.7, 1)
        const colHeight = prog * 72
        ctx.lineWidth   = 14
        glow(12)
        ctx.beginPath()
        ctx.moveTo(mc.x, mc.y - 6)
        ctx.lineTo(mc.x, mc.y - 6 - colHeight)
        ctx.stroke()
        noGlow()
      }

      // Cap (p 0.38 → 0.96)
      if (p > 0.38) {
        const capProg   = Math.min((p - 0.38) / 0.42, 1)
        const colHeight = Math.min((p - 0.18) / 0.7, 1) * 72
        const capR      = capProg * 38
        glow(16)
        ctx.beginPath()
        ctx.arc(mc.x, mc.y - 6 - colHeight, capR, 0, Math.PI * 2)
        ctx.fill()
        noGlow()
      }

      ctx.globalAlpha = 1
      ctx.lineWidth   = 1
    }

    function drawHUD() {
      ctx.fillStyle = GREEN
      ctx.font      = '14px "JetBrains Mono", monospace'
      ctx.textAlign = 'left'
      ctx.fillText(`> score: ${score}`, 14, 20)
      ctx.textAlign = 'center'
      ctx.fillText(
        `cities: ${cities.filter(c => c.alive).length}/3  launchers: ${launchers.filter(l => l.alive).length}/2`,
        W / 2, 20
      )
      ctx.textAlign = 'right'
      ctx.fillText(`wave: ${wave}`, W - 14, 20)
      ctx.textAlign = 'left'
    }

    function drawBanner(text: string, subtext: string, timer: number, maxTime: number) {
      if (timer <= 0) return
      ctx.globalAlpha = Math.min(timer / 400, 1)
      ctx.fillStyle   = GREEN
      ctx.textAlign   = 'center'
      ctx.font        = 'bold 18px "JetBrains Mono", monospace'
      ctx.fillText(text, W / 2, H / 2 - 12)
      if (subtext) {
        ctx.font = '13px "JetBrains Mono", monospace'
        ctx.fillText(subtext, W / 2, H / 2 + 14)
      }
      ctx.globalAlpha = 1
      ctx.textAlign   = 'left'
      void maxTime
    }

    function drawStartScreen() {
      ctx.fillStyle = GREEN
      ctx.textAlign = 'center'
      const artSize  = 14
      const lineH    = artSize * 1.55
      const artTotalH = MISSILE_ART.length * lineH
      const artY     = H / 2 - 140
      ctx.font = `${artSize}px "JetBrains Mono", monospace`
      glow(6)
      MISSILE_ART.forEach((line, i) => ctx.fillText(line, W / 2, artY + i * lineH))
      noGlow()
      ctx.font = 'bold 20px "JetBrains Mono", monospace'
      ctx.fillText('[ MISSILE COMMAND ]', W / 2, artY + artTotalH + 20)
      ctx.font = '13px "JetBrains Mono", monospace'
      const ctrlY = artY + artTotalH + 54
      ctx.fillText('click to fire a counter-missile from the nearest launcher', W / 2, ctrlY)
      ctx.fillText('defend your cities — each surviving city scores a bonus', W / 2, ctrlY + 22)
      if (Math.floor(Date.now() / 500) % 2 === 0) {
        ctx.font = 'bold 15px "JetBrains Mono", monospace'
        ctx.fillText('> click to start', W / 2, ctrlY + 62)
      }
      ctx.textAlign = 'left'
    }

    function drawGameOver() {
      ctx.fillStyle = 'rgba(0,0,0,0.78)'
      ctx.fillRect(0, 0, W, H)
      ctx.fillStyle = GREEN
      ctx.textAlign = 'center'
      ctx.font = 'bold 20px "JetBrains Mono", monospace'
      const reason = launchers.every(l => !l.alive) && cities.some(c => c.alive)
        ? '> LAUNCHERS DESTROYED'
        : '> CITIES DESTROYED'
      ctx.fillText(reason, W / 2, H / 2 - 42)
      ctx.font = '15px "JetBrains Mono", monospace'
      ctx.fillText(`final score: ${score}`, W / 2, H / 2 - 8)
      ctx.fillText(`waves survived: ${wave}`, W / 2, H / 2 + 18)
      if (Math.floor(Date.now() / 500) % 2 === 0) {
        ctx.font = 'bold 14px "JetBrains Mono", monospace'
        ctx.fillText('> click to restart', W / 2, H / 2 + 58)
      }
      ctx.textAlign = 'left'
    }

    function draw() {
      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, W, H)
      ctx.lineWidth = 1

      if (status === 'start') { drawStartScreen(); return }

      drawGround()
      for (const launcher of launchers) drawLauncher(launcher)
      for (const city of cities)  drawCity(city)
      for (const m    of incoming) drawIncoming(m)
      for (const c    of counters) drawCounter(c)
      for (const exp  of explosions) drawExplosion(exp)
      for (const mc   of mushrooms)  drawMushroom(mc)
      drawHUD()

      if (waveBannerTimer > 0)
        drawBanner(`[ WAVE ${wave} ]`, '', waveBannerTimer, 2200)
      if (waveClearing && waveClearTimer > 0)
        drawBanner(`> wave ${wave} cleared`, 'next wave incoming...', waveClearTimer, 2600)

      if (status === 'gameover') drawGameOver()
    }

    // ─── Input ────────────────────────────────────────────────────────────────
    function onMouseDown(e: MouseEvent) {
      const rect   = canvas.getBoundingClientRect()
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top

      if (status === 'start' || status === 'gameover') {
        status = 'playing'
        initGame()
        return
      }
      fireCounter(mouseX, mouseY)
    }
    canvas.addEventListener('mousedown', onMouseDown)

    // ─── Loop ─────────────────────────────────────────────────────────────────
    let rafId    = 0
    let lastTime = 0
    function loop(ts: number) {
      const delta = lastTime ? Math.min(ts - lastTime, 50) : 16.667
      lastTime = ts
      update(delta)
      draw()
      rafId = requestAnimationFrame(loop)
    }
    rafId = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(rafId)
      canvas.removeEventListener('mousedown', onMouseDown)
    }
  }, [])

  return (
    <div className={styles.wrapper}>
      <canvas ref={canvasRef} className={styles.canvas} />
    </div>
  )
}
