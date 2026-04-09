import { useEffect, useState } from 'react'
import './IntroOverlay.css'

// React is removed from DOM after this delay (ms) — must be > CSS animation end
const REMOVE_DELAY = 3550

// SVG canvas: 560x560, center at 280,280
const CX = 280
const CY = 280

// Ring definitions — drawn outermost to innermost.
// sw  : base stroke width for the ring (each arc gets its own sw variation)
// dur : rotation period (s)
// cw  : clockwise direction
// arcs: [{start, span, sw}] — sw overrides the per-arc thickness
const RINGS = [
  // r=252 — outermost, 6 arcs with clear gaps, thin ring, clockwise
  { r: 252, dur: 11.0, cw: true,  arcs: [{ start:   5, span: 55, sw: 1.5 },{ start: 104, span: 18, sw: 1 },{ start: 194, span: 60, sw: 2 },{ start: 292, span: 38, sw: 2.5 },{ start: 355, span: 20, sw: 1.5 },{ start: 30, span: 25, sw: 2 }] },
  // r=236 — 5 arcs with large gaps, thick ring, counter-clockwise
  { r: 236, dur:  8.2, cw: false, arcs: [{ start:   8, span: 75, sw: 4.5 },{ start: 136, span: 40, sw: 3.5 },{ start: 226, span: 45, sw: 2.5 },{ start: 316, span: 12, sw: 3 },{ start: 334, span: 28, sw: 4 }] },
  // r=218 — 5 arcs with clear empty stretches, thin, counter-clockwise
  { r: 218, dur: 14.5, cw: false, arcs: [{ start:  15, span: 48, sw: 1 },{ start:  90, span: 35, sw: 1.5 },{ start: 184, span: 28, sw: 2 },{ start: 242, span: 50, sw: 1 },{ start: 335, span: 18, sw: 1.5 }] },
  // r=200 — 9 arcs, thick, clockwise
  { r: 200, dur:  7.0, cw: true,  arcs: [{ start:   0, span: 70, sw: 5 },{ start:  78, span: 15, sw: 3.5 },{ start:  98, span: 52, sw: 4.5 },{ start: 158, span: 22, sw: 3 },{ start: 186, span: 40, sw: 5 },{ start: 234, span: 12, sw: 3.5 },{ start: 252, span: 60, sw: 4 },{ start: 320, span: 18, sw: 3 },{ start: 344, span: 12, sw: 4.5 }] },
  // r=180 — 8 arcs, thin, clockwise
  { r: 180, dur: 10.8, cw: true,  arcs: [{ start:  10, span: 38, sw: 1.5 },{ start:  55, span: 10, sw: 1 },{ start:  70, span: 55, sw: 2 },{ start: 132, span: 72, sw: 1.5 },{ start: 210, span: 28, sw: 2 },{ start: 246, span: 12, sw: 1 },{ start: 264, span: 48, sw: 2 },{ start: 318, span: 30, sw: 1.5 }] },
  // r=162 — 7 arcs, thick, clockwise
  { r: 162, dur:  9.0, cw: true,  arcs: [{ start:   5, span: 65, sw: 4.5 },{ start:  78, span: 28, sw: 3 },{ start: 112, span: 10, sw: 5 },{ start: 128, span: 55, sw: 3.5 },{ start: 190, span: 40, sw: 4 },{ start: 238, span: 18, sw: 3 },{ start: 262, span: 48, sw: 4.5 }] },
  // r=143 — 7 arcs, thin, counter-clockwise
  { r: 143, dur: 13.0, cw: false, arcs: [{ start:  20, span: 50, sw: 1.5 },{ start:  78, span: 18, sw: 1 },{ start:  102, span: 60, sw: 2 },{ start: 168, span: 35, sw: 1.5 },{ start: 210, span: 10, sw: 1 },{ start: 226, span: 55, sw: 2 },{ start: 288, span: 28, sw: 1.5 }] },
  // r=124 — 6 arcs, thick, counter-clockwise
  { r: 124, dur:  6.5, cw: false, arcs: [{ start:   0, span: 60, sw: 4.5 },{ start:  68, span: 22, sw: 3 },{ start:  96, span: 10, sw: 5 },{ start: 112, span: 70, sw: 3.5 },{ start: 190, span: 42, sw: 4 },{ start: 240, span: 15, sw: 3 }] },
  // r=105 — 5 arcs, thin, clockwise
  { r: 105, dur: 11.5, cw: true,  arcs: [{ start:  15, span: 55, sw: 1.5 },{ start:  78, span: 20, sw: 2 },{ start: 104, span: 65, sw: 1 },{ start: 176, span: 38, sw: 2 },{ start: 222, span: 75, sw: 1.5 }] },
  // r= 86 — innermost, 4 arcs, medium, counter-clockwise
  { r:  86, dur:  8.8, cw: false, arcs: [{ start:  10, span: 80, sw: 3.5 },{ start:  98, span: 28, sw: 2.5 },{ start: 134, span: 55, sw: 4 },{ start: 196, span: 40, sw: 3 }] },
]

// Convert polar arc (center, radius, startDeg, spanDeg) to an SVG arc path string
function arcPath(cx, cy, r, startDeg, spanDeg) {
  const toRad = (d) => (d * Math.PI) / 180
  const sx = cx + r * Math.cos(toRad(startDeg))
  const sy = cy + r * Math.sin(toRad(startDeg))
  const ex = cx + r * Math.cos(toRad(startDeg + spanDeg))
  const ey = cy + r * Math.sin(toRad(startDeg + spanDeg))
  const large = spanDeg > 180 ? 1 : 0
  return `M ${sx} ${sy} A ${r} ${r} 0 ${large} 1 ${ex} ${ey}`
}

// One ring: rotating bloom halo + crisp primary arcs.
// Each arc uses its own arc.sw for thickness variation.
// Stroke color comes from the shared diagonal gradient defined in RingsSVG.
function Ring({ ring, idx, halfId }) {
  const glowId  = `glow-${halfId}-${idx}`
  const center  = `${CX} ${CY}`
  const fromRot = `0 ${center}`
  const toRot   = `${ring.cw ? 360 : -360} ${center}`
  const durStr  = `${ring.dur}s`

  return (
    <g>
      <defs>
        <filter id={glowId} x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Wide bloom halo — semi-transparent, blurred */}
      <g opacity="0.2" filter={`url(#${glowId})`}>
        <animateTransform attributeName="transform" type="rotate"
          from={fromRot} to={toRot} dur={durStr} repeatCount="indefinite" />
        {ring.arcs.map((arc, ai) => (
          <path
            key={ai}
            d={arcPath(CX, CY, ring.r, arc.start, arc.span)}
            fill="none"
            stroke="url(#diagGrad)"
            strokeWidth={arc.sw + 5}
            strokeLinecap="round"
          />
        ))}
      </g>

      {/* Crisp primary arcs — each with its own thickness */}
      <g filter={`url(#${glowId})`}>
        <animateTransform attributeName="transform" type="rotate"
          from={fromRot} to={toRot} dur={durStr} repeatCount="indefinite" />
        {ring.arcs.map((arc, ai) => (
          <path
            key={ai}
            d={arcPath(CX, CY, ring.r, arc.start, arc.span)}
            fill="none"
            stroke="url(#diagGrad)"
            strokeWidth={arc.sw}
            strokeLinecap="round"
            opacity="0.95"
          />
        ))}
      </g>
    </g>
  )
}

function RingsSVG({ half }) {
  return (
    <svg
      className={`intro-svg--${half}`}
      viewBox="0 0 560 560"
      width="560"
      height="560"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Diagonal gradient in SVG-space: top-left magenta → bottom-right cyan.
          Arcs rotate through it, sampling different colour slices as they spin. */}
      <defs>
        <linearGradient id="diagGrad" gradientUnits="userSpaceOnUse"
          x1="0" y1="0" x2="560" y2="560">
          <stop offset="0%"   stopColor="#e040fb" />
          <stop offset="50%"  stopColor="#9b30f5" />
          <stop offset="100%" stopColor="#00e5ff" />
        </linearGradient>
      </defs>

      {RINGS.map((ring, i) => (
        <Ring key={i} ring={ring} idx={i} halfId={half} />
      ))}

      {half === 'top' && (
        <>
          <defs>
            <radialGradient id="coreGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%"   stopColor="#ffffff" stopOpacity="1.0" />
              <stop offset="18%"  stopColor="#e8c0ff" stopOpacity="0.95" />
              <stop offset="55%"  stopColor="#7b10cc" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#7b10cc" stopOpacity="0" />
            </radialGradient>
            <filter id="core-bloom" x="-250%" y="-250%" width="600%" height="600%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="14" />
            </filter>
          </defs>
        </>
      )}
    </svg>
  )
}

export default function IntroOverlay() {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => setVisible(false), REMOVE_DELAY)
    return () => clearTimeout(t)
  }, [])

  if (!visible) return null

  return (
    <div className="intro-overlay" aria-hidden="true">
      <div className="intro-half-wrap intro-half-wrap--top">
        <RingsSVG half="top" />
      </div>
      <div className="intro-half-wrap intro-half-wrap--bot">
        <RingsSVG half="bot" />
      </div>
    </div>
  )
}

