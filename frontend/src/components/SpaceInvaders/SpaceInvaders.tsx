import { useEffect, useRef } from 'react'
import {
  playShoot, playInvaderHit, playFlyByHit,
  playPlayerDeath, playMarchNote, startFlyByHum,
} from '../../sounds/sounds'
import styles from './SpaceInvaders.module.css'

// ─── Constants ────────────────────────────────────────────────────────────────
const COLS = 9, ROWS = 4
const IW = 36, IH = 22, IGX = 20, IGY = 18   // invader size + gaps
const SSTEP = 14, SDROP = 22                   // grid step + drop per march
const BASE_MS = 750, MIN_MS = 100              // march interval bounds
const FIRE_INT = 1400                          // invader fire cooldown (ms)
const MW = 52, MH = 16, MSPD = 2.5            // mystery ship
const PW = 44, PH = 18, PSPD = 5              // player
const PBW = 3, PBH = 14, PBSPD = 9            // player bullet
const IBW = 3, IBH = 12, IBSPD = 4            // invader bullet
const GREEN = '#00FF00'
const MARCH = [160, 130, 160, 110]

interface Inv { x: number; y: number; row: number; col: number; alive: boolean }
interface Bul { x: number; y: number; active: boolean }
type Status = 'start' | 'playing' | 'won' | 'lost'

export default function SpaceInvaders() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight
    const W = canvas.width
    const H = canvas.height

    // Layout
    const GW  = COLS * IW + (COLS - 1) * IGX
    const GX0 = (W - GW) / 2
    const GY0 = 68
    const PLY = H - 55
    const MYY = 26

    // ─── State ──────────────────────────────────────────────────────────────
    let status: Status = 'start'
    let score = 0
    let px = 0
    let pb: Bul = { x: 0, y: 0, active: false }
    let invs: Inv[] = []
    let ibs: Bul[] = []
    let dir = 1
    let marchT = 0, marchN = 0
    let fireT = 0
    let gameT = 0
    let mystX = 0, mystAlive = false, mystDir = 1, mystDone = false, mystSpawnT = 0
    let flyByStop: (() => void) | null = null
    const keys = new Set<string>()
    let spaceEdge = false

    // ─── Helpers ────────────────────────────────────────────────────────────
    function live() { return invs.filter(i => i.alive) }

    function marchMs() {
      return Math.max(MIN_MS, Math.floor(BASE_MS * (live().length / (COLS * ROWS))))
    }

    function hit(ax: number, ay: number, aw: number, ah: number,
                 bx: number, by: number, bw: number, bh: number) {
      return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by
    }

    // ─── Game init ──────────────────────────────────────────────────────────
    function initInvaders() {
      invs = []
      for (let r = 0; r < ROWS; r++)
        for (let c = 0; c < COLS; c++)
          invs.push({ x: GX0 + c * (IW + IGX), y: GY0 + r * (IH + IGY), row: r, col: c, alive: true })
    }

    function startGame() {
      status = 'playing'
      score = 0
      px = W / 2 - PW / 2
      pb = { x: 0, y: 0, active: false }
      ibs = []
      dir = 1
      marchT = 0; marchN = 0; fireT = 0; gameT = 0
      mystAlive = false; mystDone = false
      mystSpawnT = 15000 + Math.random() * 20000
      initInvaders()
    }

    function endGame(result: 'won' | 'lost') {
      status = result
      if (flyByStop) { flyByStop(); flyByStop = null }
    }

    // ─── Input ──────────────────────────────────────────────────────────────
    function onKeyDown(e: KeyboardEvent) {
      if ([' ', 'ArrowLeft', 'ArrowRight'].includes(e.key)) e.preventDefault()
      if (!keys.has(e.key) && e.key === ' ') spaceEdge = true
      keys.add(e.key)
    }
    function onKeyUp(e: KeyboardEvent) { keys.delete(e.key) }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)

    // ─── Update ─────────────────────────────────────────────────────────────
    function update(delta: number) {
      if (status === 'start') {
        if (spaceEdge) startGame()
        spaceEdge = false
        return
      }
      if (status !== 'playing') { spaceEdge = false; return }

      gameT += delta
      const dt = delta / 16.667

      // Player move
      if (keys.has('ArrowLeft'))  px = Math.max(0, px - PSPD * dt)
      if (keys.has('ArrowRight')) px = Math.min(W - PW, px + PSPD * dt)

      // Player fire
      if (spaceEdge && !pb.active) {
        pb = { x: px + PW / 2 - PBW / 2, y: PLY - PBH, active: true }
        playShoot()
      }
      spaceEdge = false

      // Move player bullet
      if (pb.active) {
        pb.y -= PBSPD * dt
        if (pb.y + PBH < 0) pb.active = false
      }

      // Move invader bullets
      for (const b of ibs) {
        if (!b.active) continue
        b.y += IBSPD * dt
        if (b.y > H) b.active = false
      }

      // Invader march
      marchT += delta
      if (marchT >= marchMs()) {
        marchT = 0
        playMarchNote(MARCH[marchN % 4])
        marchN++

        const lv = live()
        const hitRight = lv.some(i => i.x + IW > W - 8)
        const hitLeft  = lv.some(i => i.x < 8)

        if ((dir === 1 && hitRight) || (dir === -1 && hitLeft)) {
          lv.forEach(i => i.y += SDROP)
          dir = -dir
        } else {
          lv.forEach(i => i.x += SSTEP * dir)
        }

        if (lv.some(i => i.y + IH >= PLY)) {
          playPlayerDeath()
          endGame('lost')
          return
        }
      }

      // Invader fire
      fireT += delta
      if (fireT >= FIRE_INT) {
        fireT = 0
        const bottom = new Map<number, Inv>()
        for (const inv of invs) {
          if (!inv.alive) continue
          const cur = bottom.get(inv.col)
          if (!cur || inv.row > cur.row) bottom.set(inv.col, inv)
        }
        const candidates = [...bottom.values()]
        if (candidates.length) {
          const s = candidates[Math.floor(Math.random() * candidates.length)]
          ibs.push({ x: s.x + IW / 2 - IBW / 2, y: s.y + IH, active: true })
        }
      }

      // Mystery ship
      if (!mystAlive && !mystDone && gameT >= mystSpawnT) {
        mystAlive = true
        mystDir = Math.random() < 0.5 ? 1 : -1
        mystX = mystDir === 1 ? -MW : W
        flyByStop = startFlyByHum()
      }
      if (mystAlive) {
        mystX += MSPD * mystDir * dt
        if ((mystDir === 1 && mystX > W) || (mystDir === -1 && mystX + MW < 0)) {
          mystAlive = false; mystDone = true
          if (flyByStop) { flyByStop(); flyByStop = null }
        }
      }

      // ── Collisions ──────────────────────────────────────────────────────
      if (pb.active) {
        for (const inv of invs) {
          if (!inv.alive) continue
          if (hit(pb.x, pb.y, PBW, PBH, inv.x, inv.y, IW, IH)) {
            inv.alive = false
            pb.active = false
            score += 10
            playInvaderHit()
            break
          }
        }
      }

      if (pb.active && mystAlive) {
        if (hit(pb.x, pb.y, PBW, PBH, mystX, MYY, MW, MH)) {
          pb.active = false
          mystAlive = false; mystDone = true
          score += 25
          if (flyByStop) { flyByStop(); flyByStop = null }
          playFlyByHit()
        }
      }

      for (const b of ibs) {
        if (!b.active) continue
        if (hit(b.x, b.y, IBW, IBH, px, PLY, PW, PH)) {
          playPlayerDeath()
          endGame('lost')
          return
        }
      }

      if (live().length === 0) endGame('won')
    }

    // ─── Draw ────────────────────────────────────────────────────────────────
    function drawInvader(inv: Inv) {
      const { x, y } = inv
      ctx.fillStyle = GREEN
      ctx.fillRect(x + 7,        y - 4,       3,        5)   // left antenna
      ctx.fillRect(x + IW - 10,  y - 4,       3,        5)   // right antenna
      ctx.fillRect(x + 3,        y,           IW - 6,   IH - 4) // body
      ctx.fillStyle = '#000'
      ctx.fillRect(x + 7,        y + 4,       5,        5)   // left eye
      ctx.fillRect(x + IW - 12,  y + 4,       5,        5)   // right eye
      ctx.fillStyle = GREEN
      ctx.fillRect(x,            y + IH - 8,  5,        5)   // left leg
      ctx.fillRect(x + IW - 5,   y + IH - 8,  5,        5)   // right leg
      ctx.fillRect(x + 10,       y + IH - 4,  4,        4)   // left foot
      ctx.fillRect(x + IW - 14,  y + IH - 4,  4,        4)   // right foot
    }

    function drawMystery() {
      const x = mystX, y = MYY
      ctx.fillStyle = GREEN
      ctx.fillRect(x + 14, y,      MW - 28, 5)          // dome
      ctx.fillRect(x + 5,  y + 4,  MW - 10, MH - 6)    // body
      ctx.fillRect(x,      y + 8,  6,       5)           // left fin
      ctx.fillRect(x + MW - 6, y + 8, 6,   5)           // right fin
      ctx.fillStyle = '#000'
      ctx.fillRect(x + 12,       y + 6, 5, 5)           // porthole 1
      ctx.fillRect(x + MW/2 - 3, y + 6, 6, 5)           // porthole 2
      ctx.fillRect(x + MW - 17,  y + 6, 5, 5)           // porthole 3
    }

    function drawPlayer() {
      ctx.fillStyle = GREEN
      ctx.fillRect(px + PW / 2 - 3, PLY,      6,        5)   // tip
      ctx.fillRect(px + 8,          PLY + 4,  PW - 16,  7)   // mid
      ctx.fillRect(px,              PLY + 10, PW,       PH - 10) // base
    }

    function drawScene() {
      ctx.fillStyle = GREEN
      ctx.font = '14px "JetBrains Mono", monospace'
      ctx.textAlign = 'left'
      ctx.fillText(`> score: ${score}`, 16, 18)

      // Separator line below mystery ship lane
      ctx.strokeStyle = GREEN
      ctx.globalAlpha = 0.2
      ctx.beginPath()
      ctx.moveTo(0, MYY + MH + 10)
      ctx.lineTo(W, MYY + MH + 10)
      ctx.stroke()
      ctx.globalAlpha = 1

      if (mystAlive) drawMystery()
      for (const inv of invs) if (inv.alive) drawInvader(inv)

      ctx.fillStyle = GREEN
      for (const b of ibs) if (b.active) ctx.fillRect(b.x, b.y, IBW, IBH)
      if (pb.active) ctx.fillRect(pb.x, pb.y, PBW, PBH)

      drawPlayer()

      // Ground line
      ctx.globalAlpha = 0.35
      ctx.beginPath()
      ctx.moveTo(0, PLY + PH + 6)
      ctx.lineTo(W, PLY + PH + 6)
      ctx.stroke()
      ctx.globalAlpha = 1
    }

    function drawStartScreen() {
      ctx.fillStyle = GREEN
      ctx.textAlign = 'center'
      ctx.font = 'bold 22px "JetBrains Mono", monospace'
      ctx.fillText('[ SPACE INVADERS ]', W / 2, H / 2 - 90)
      ctx.font = '13px "JetBrains Mono", monospace'
      ctx.fillText('← → to move', W / 2, H / 2 - 38)
      ctx.fillText('SPACE to fire', W / 2, H / 2 - 16)
      ctx.fillText('grid invader  =  10 pts', W / 2, H / 2 + 20)
      ctx.fillText('fly-by ship   =  25 pts', W / 2, H / 2 + 42)
      if (Math.floor(Date.now() / 500) % 2 === 0) {
        ctx.font = 'bold 15px "JetBrains Mono", monospace'
        ctx.fillText('> press SPACE to start', W / 2, H / 2 + 88)
      }
      ctx.textAlign = 'left'
    }

    function drawEndOverlay() {
      ctx.fillStyle = 'rgba(0,0,0,0.78)'
      ctx.fillRect(0, 0, W, H)
      ctx.fillStyle = GREEN
      ctx.textAlign = 'center'
      ctx.font = 'bold 20px "JetBrains Mono", monospace'
      ctx.fillText(status === 'won' ? '> round complete' : '> session terminated', W / 2, H / 2 - 24)
      ctx.font = '15px "JetBrains Mono", monospace'
      ctx.fillText(`final score: ${score}`, W / 2, H / 2 + 14)
      ctx.textAlign = 'left'
    }

    function draw() {
      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, W, H)
      if (status === 'start') { drawStartScreen(); return }
      drawScene()
      if (status === 'won' || status === 'lost') drawEndOverlay()
    }

    // ─── Loop ────────────────────────────────────────────────────────────────
    let rafId = 0
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
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      if (flyByStop) flyByStop()
    }
  }, [])

  return (
    <div className={styles.wrapper}>
      <canvas ref={canvasRef} className={styles.canvas} />
    </div>
  )
}
