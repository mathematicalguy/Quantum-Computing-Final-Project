import { useEffect, useRef } from 'react'

const ACCENT   = '124,111,255'
const ACCENT_2 = '86,207,178'
const COLORS   = [ACCENT, ACCENT_2]

// How many trace paths to keep alive at once
const TRACE_COUNT = 18

// Each trace is a series of axis-aligned segments (circuit-board style)
function createTrace(W, H) {
  const color  = COLORS[Math.floor(Math.random() * COLORS.length)]
  const startX = Math.random() < 0.5 ? 0 : W
  const startY = Math.random() * H
  const points = [{ x: startX, y: startY }]

  // Build 4-8 random right-angle segments
  const segments = 4 + Math.floor(Math.random() * 5)
  let cx = startX
  let cy = startY
  let lastDir = null

  for (let i = 0; i < segments; i++) {
    // Alternate or pick a direction that is different from last
    const dirs = ['h', 'v'].filter((d) => d !== lastDir)
    const dir  = dirs[Math.floor(Math.random() * dirs.length)]
    lastDir    = dir

    if (dir === 'h') {
      cx += (Math.random() * 0.25 + 0.05) * W * (Math.random() < 0.5 ? 1 : -1)
      cx  = Math.max(-50, Math.min(W + 50, cx))
    } else {
      cy += (Math.random() * 0.25 + 0.05) * H * (Math.random() < 0.5 ? 1 : -1)
      cy  = Math.max(-50, Math.min(H + 50, cy))
    }
    points.push({ x: cx, y: cy })
  }

  // Total path length (sum of segment lengths)
  let totalLen = 0
  for (let i = 1; i < points.length; i++) {
    totalLen += Math.hypot(points[i].x - points[i-1].x, points[i].y - points[i-1].y)
  }

  return {
    points,
    totalLen,
    color,
    // How far along the path the "head" and "tail" are (in px)
    head: 0,
    tail: 0,
    speed: 80 + Math.random() * 160,    // px per second
    trailLen: 60 + Math.random() * 120, // px of glowing tail
    done: false,
    // Small node dots at every corner
    nodes: points.map((p) => ({ ...p, pulse: Math.random() })),
  }
}

// Given a distance along the polyline, return the {x,y} point
function pointAtDist(points, dist) {
  let remaining = dist
  for (let i = 1; i < points.length; i++) {
    const dx  = points[i].x - points[i-1].x
    const dy  = points[i].y - points[i-1].y
    const len = Math.hypot(dx, dy)
    if (remaining <= len) {
      const t = remaining / len
      return { x: points[i-1].x + dx * t, y: points[i-1].y + dy * t }
    }
    remaining -= len
  }
  return points[points.length - 1]
}

export default function CircuitCanvas() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx    = canvas.getContext('2d')
    let animId
    let lastTime = null

    const traces = []

    function resize() {
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    // Seed initial traces staggered so they don't all start at once
    for (let i = 0; i < TRACE_COUNT; i++) {
      const t = createTrace(canvas.width, canvas.height)
      // stagger: push head forward so they're mid-draw at startup
      t.head = (t.totalLen / TRACE_COUNT) * i
      t.tail = Math.max(0, t.head - t.trailLen)
      traces.push(t)
    }

    function drawTrace(trace) {
      const { points, color, head, tail, trailLen } = trace
      if (head <= 0) return

      ctx.save()
      ctx.lineCap  = 'round'
      ctx.lineJoin = 'round'

      // --- glowing trail ---
      const steps = 12
      for (let s = 0; s < steps; s++) {
        const t0 = tail  + (head - tail) * (s / steps)
        const t1 = tail  + (head - tail) * ((s + 1) / steps)
        const p0 = pointAtDist(points, Math.max(0, t0))
        const p1 = pointAtDist(points, Math.min(trace.totalLen, t1))

        // alpha strongest at head, fades toward tail
        const alpha = 0.08 + 0.55 * ((s + 1) / steps)
        const width = 1 + 2.5 * ((s + 1) / steps)

        ctx.beginPath()
        ctx.moveTo(p0.x, p0.y)
        ctx.lineTo(p1.x, p1.y)
        ctx.strokeStyle = `rgba(${color},${alpha})`
        ctx.lineWidth   = width
        ctx.stroke()
      }

      // --- bright head dot ---
      const headPt = pointAtDist(points, head)
      const grad   = ctx.createRadialGradient(headPt.x, headPt.y, 0, headPt.x, headPt.y, 8)
      grad.addColorStop(0, `rgba(${color},0.95)`)
      grad.addColorStop(1, `rgba(${color},0)`)
      ctx.beginPath()
      ctx.arc(headPt.x, headPt.y, 8, 0, Math.PI * 2)
      ctx.fillStyle = grad
      ctx.fill()

      // --- corner node dots ---
      for (const node of trace.nodes) {
        const distToHead = Math.abs(head - node.pulse * trace.totalLen)
        if (distToHead > trailLen * 2) continue
        const nodeAlpha = Math.max(0, 1 - distToHead / (trailLen * 2)) * 0.7
        ctx.beginPath()
        ctx.arc(node.x, node.y, 2.5, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${color},${nodeAlpha})`
        ctx.fill()
      }

      ctx.restore()
    }

    function tick(ts) {
      if (!lastTime) lastTime = ts
      const dt = Math.min((ts - lastTime) / 1000, 0.05) // seconds, capped
      lastTime = ts

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      for (let i = 0; i < traces.length; i++) {
        const tr = traces[i]

        tr.head += tr.speed * dt
        tr.tail  = Math.max(0, tr.head - tr.trailLen)

        if (tr.head > tr.totalLen + tr.trailLen) {
          // Recycle with a new random trace
          traces[i] = createTrace(canvas.width, canvas.height)
        }

        drawTrace(tr)
      }

      animId = requestAnimationFrame(tick)
    }

    animId = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return <canvas ref={canvasRef} className="circuit-canvas" />
}
