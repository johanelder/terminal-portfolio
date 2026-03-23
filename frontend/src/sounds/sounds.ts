let ctx: AudioContext | null = null

function ac(): AudioContext {
  if (!ctx) ctx = new AudioContext()
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

export function playShoot() {
  const a = ac()
  const o = a.createOscillator()
  const g = a.createGain()
  o.connect(g); g.connect(a.destination)
  o.frequency.setValueAtTime(900, a.currentTime)
  o.frequency.exponentialRampToValueAtTime(400, a.currentTime + 0.08)
  g.gain.setValueAtTime(0.25, a.currentTime)
  g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + 0.08)
  o.start(); o.stop(a.currentTime + 0.08)
}

export function playInvaderHit() {
  const a = ac()
  const size = Math.floor(a.sampleRate * 0.12)
  const buf = a.createBuffer(1, size, a.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < size; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / size)
  const s = a.createBufferSource()
  s.buffer = buf
  const g = a.createGain()
  g.gain.setValueAtTime(0.3, a.currentTime)
  s.connect(g); g.connect(a.destination)
  s.start()
}

export function playFlyByHit() {
  const a = ac()
  const o = a.createOscillator()
  const g = a.createGain()
  o.connect(g); g.connect(a.destination)
  o.frequency.setValueAtTime(1400, a.currentTime)
  o.frequency.exponentialRampToValueAtTime(150, a.currentTime + 0.4)
  g.gain.setValueAtTime(0.35, a.currentTime)
  g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + 0.4)
  o.start(); o.stop(a.currentTime + 0.4)
}

export function playPlayerDeath() {
  const a = ac()
  const o = a.createOscillator()
  const g = a.createGain()
  o.connect(g); g.connect(a.destination)
  o.frequency.setValueAtTime(500, a.currentTime)
  o.frequency.exponentialRampToValueAtTime(50, a.currentTime + 0.9)
  g.gain.setValueAtTime(0.4, a.currentTime)
  g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + 0.9)
  o.start(); o.stop(a.currentTime + 0.9)
}

export function playMarchNote(freq: number) {
  const a = ac()
  const o = a.createOscillator()
  const g = a.createGain()
  o.connect(g); g.connect(a.destination)
  o.frequency.setValueAtTime(freq, a.currentTime)
  g.gain.setValueAtTime(0.15, a.currentTime)
  g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + 0.07)
  o.start(); o.stop(a.currentTime + 0.07)
}

// ── Missile Command sounds ───────────────────────────────────────────────────

export function playMCLaunch() {
  const a = ac()
  const o = a.createOscillator()
  const g = a.createGain()
  o.connect(g); g.connect(a.destination)
  o.frequency.setValueAtTime(500, a.currentTime)
  o.frequency.exponentialRampToValueAtTime(1100, a.currentTime + 0.14)
  g.gain.setValueAtTime(0.18, a.currentTime)
  g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + 0.14)
  o.start(); o.stop(a.currentTime + 0.14)
}

export function playMCExplosion() {
  const a = ac()
  const size = Math.floor(a.sampleRate * 0.28)
  const buf = a.createBuffer(1, size, a.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < size; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / size, 1.2)
  const s = a.createBufferSource()
  s.buffer = buf
  const g = a.createGain()
  g.gain.setValueAtTime(0.38, a.currentTime)
  s.connect(g); g.connect(a.destination)
  s.start()
}

export function playMCCityHit() {
  const a = ac()
  // Low rumble via filtered noise
  const size = Math.floor(a.sampleRate * 0.9)
  const buf = a.createBuffer(1, size, a.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < size; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / size, 0.6)
  const s = a.createBufferSource()
  s.buffer = buf
  const f = a.createBiquadFilter()
  f.type = 'lowpass'
  f.frequency.setValueAtTime(280, a.currentTime)
  const g = a.createGain()
  g.gain.setValueAtTime(0.55, a.currentTime)
  s.connect(f); f.connect(g); g.connect(a.destination)
  s.start()
}

export function playMCGameOver() {
  const a = ac()
  const o = a.createOscillator()
  const g = a.createGain()
  o.connect(g); g.connect(a.destination)
  o.frequency.setValueAtTime(420, a.currentTime)
  o.frequency.exponentialRampToValueAtTime(55, a.currentTime + 1.8)
  g.gain.setValueAtTime(0.3, a.currentTime)
  g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + 1.8)
  o.start(); o.stop(a.currentTime + 1.8)
}

export function startFlyByHum(): () => void {
  const a = ac()
  const o = a.createOscillator()
  const g = a.createGain()
  o.type = 'square'
  o.frequency.setValueAtTime(480, a.currentTime)
  g.gain.setValueAtTime(0.07, a.currentTime)
  o.connect(g); g.connect(a.destination)
  o.start()
  return () => {
    try {
      g.gain.setValueAtTime(0.001, a.currentTime)
      o.stop(a.currentTime + 0.05)
    } catch (_) { /* already stopped */ }
  }
}
