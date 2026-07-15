/**
 * Ultra-level animated favicon: a glowing red rising sun drawn on canvas
 * and pushed into the browser tab as a data-URL PNG.
 *
 * Works in every modern browser; does not depend on SVG-in-favicon support.
 */

const SIZE = 64
const FPS = 30
const INTERVAL_MS = 1000 / FPS

let running = false
let raf = 0
let lastFrame = 0
let phase = 0

const canvas = document.createElement('canvas')
canvas.width = SIZE
canvas.height = SIZE
const ctx = canvas.getContext('2d')!

function drawFrame(t: number) {
  const w = SIZE
  const h = SIZE
  ctx.clearRect(0, 0, w, h)

  // Night sky background
  ctx.fillStyle = '#0F172A'
  ctx.beginPath()
  ctx.moveTo(12, 0)
  ctx.lineTo(w - 12, 0)
  ctx.quadraticCurveTo(w, 0, w, 12)
  ctx.lineTo(w, h - 12)
  ctx.quadraticCurveTo(w, h, w - 12, h)
  ctx.lineTo(12, h)
  ctx.quadraticCurveTo(0, h, 0, h - 12)
  ctx.lineTo(0, 12)
  ctx.quadraticCurveTo(0, 0, 12, 0)
  ctx.closePath()
  ctx.fill()

  // Animated phase: 0..1 loop
  phase = (Math.sin(t / 1000) + 1) / 2 // 0..1

  const cx = w / 2
  const baseCy = h / 2 + 6
  const cy = baseCy - phase * 6

  // Outer glow layers
  for (let i = 3; i >= 1; i--) {
    const r = 22 + i * 4
    const alpha = 0.08 + phase * 0.04
    const grad = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r)
    grad.addColorStop(0, `rgba(255, 215, 0, ${alpha})`)
    grad.addColorStop(0.5, `rgba(230, 57, 70, ${alpha * 0.6})`)
    grad.addColorStop(1, 'rgba(129, 27, 34, 0)')
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.fill()
  }

  // Rays (rotating)
  const rayCount = 8
  const rayLen = 10 + phase * 4
  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate(t / 3000)
  for (let i = 0; i < rayCount; i++) {
    const angle = (Math.PI * 2 * i) / rayCount
    const x1 = Math.cos(angle) * 16
    const y1 = Math.sin(angle) * 16
    const x2 = Math.cos(angle) * (16 + rayLen)
    const y2 = Math.sin(angle) * (16 + rayLen)
    const rayAlpha = 0.35 + phase * 0.3
    ctx.strokeStyle = `rgba(255, 215, 0, ${rayAlpha})`
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.stroke()
  }
  ctx.restore()

  // Sun body
  const bodyGrad = ctx.createRadialGradient(cx - 2, cy - 2, 2, cx, cy, 14)
  bodyGrad.addColorStop(0, '#FFE5B4')
  bodyGrad.addColorStop(0.4, '#E63946')
  bodyGrad.addColorStop(1, '#811B22')
  ctx.fillStyle = bodyGrad
  ctx.beginPath()
  ctx.arc(cx, cy, 14, 0, Math.PI * 2)
  ctx.fill()

  // Inner highlight
  ctx.fillStyle = `rgba(255, 229, 180, ${0.25 + phase * 0.15})`
  ctx.beginPath()
  ctx.arc(cx - 3, cy - 3, 5, 0, Math.PI * 2)
  ctx.fill()
}

let faviconLink = document.querySelector('link[rel*="icon"]') as HTMLLinkElement | null

export function startFaviconAnimation() {
  if (running) return
  running = true
  lastFrame = performance.now()
  tick(lastFrame)
}

export function stopFaviconAnimation() {
  running = false
  if (raf) cancelAnimationFrame(raf)
  raf = 0
}

function tick(now: number) {
  if (!running) return
  raf = requestAnimationFrame(tick)

  const delta = now - lastFrame
  if (delta < INTERVAL_MS) return
  lastFrame = now - (delta % INTERVAL_MS)

  drawFrame(now)

  const url = canvas.toDataURL('image/png')
  if (faviconLink) {
    faviconLink.href = url
  } else {
    const link = document.createElement('link')
    link.rel = 'icon'
    link.type = 'image/png'
    link.href = url
    document.head.appendChild(link)
    faviconLink = link
  }
}

// Auto-start if supported
if (typeof window !== 'undefined') {
  startFaviconAnimation()
}
