import { useEffect, useState } from 'react'
import './IntroOverlay.css'

// React is removed from DOM after this delay (ms) — must be > CSS animation end
const REMOVE_DELAY = 3550

// SVG canvas: 560x560, center at 280,280
const CX = 280
const CY = 280

// Interpolate between magenta (#e040fb) and cyan (#00e5ff) based on t in [0,1]
function lerpColor(t) {
  const r = Math.round(0xe0 + (0x00 - 0xe0) * t)
  const g = Math.round(0x40 + (0xe5 - 0x40) * t)
  const b = Math.round(0xfb + (0xff - 0xfb) * t)
  return `rgb(${r},${g},${b})`
}

// Ring definitions — drawn outermost to innermost.
// t  : color blend 0=magenta, 1=cyan
// sw : stroke width
// dur: rotation period (s)
// cw : clockwise direction
// arcs: [{start, span}] partial arc segments in degrees
const RINGS = [
  { r: 252, sw: 2.5, t: 0.00, dur: 11.0, cw: true,  arcs: [{ start:  10, span: 70 },{ start:  95, span: 45 },{ start: 150, span: 15 },{ start: 172, span:  8 },{ start: 185, span: 60 },{ start: 252, span: 90 },{ start: 348, span: 40 }] },
  { r: 236, sw: 7.0, t: 0.05, dur:  8.2, cw: false, arcs: [{ start:   5, span: 110 },{ start: 125, span: 20 },{ start: 152, span:  8 },{ start: 168, span: 75 },{ start: 255, span: 50 },{ start: 315, span: 30 },{ start: 350, span: 12 }] },
  { r: 218, sw: 1.5, t: 0.12, dur: 14.5, cw: true,  arcs: [{ start:  20, span: 55 },{ start:  85, span: 12 },{ start: 105, span: 80 },{ start: 195, span: 35 },{ start: 238, span:  8 },{ start: 254, span: 55 },{ start: 318, span: 30 }] },
  { r: 200, sw: 9.5, t: 0.22, dur:  7.0, cw: false, arcs: [{ start:   0, span: 95 },{ start: 102, span: 15 },{ start: 125, span: 65 },{ start: 198, span: 45 },{ start: 252, span: 12 },{ start: 272, span: 70 },{ start: 348, span: 10 }] },
  { r: 180, sw: 3.0, t: 0.35, dur: 10.8, cw: true,  arcs: [{ start:  15, span: 40 },{ start:  63, span:  8 },{ start:  78, span: 55 },{ start: 142, span: 90 },{ start: 240, span: 30 },{ start: 278, span: 12 },{ start: 298, span: 50 }] },
  { r: 162, sw: 6.5, t: 0.50, dur:  9.0, cw: false, arcs: [{ start:   8, span: 80 },{ start:  96, span: 35 },{ start: 138, span: 10 },{ start: 156, span: 60 },{ start: 225, span: 45 },{ start: 278, span: 18 },{ start: 304, span: 48 }] },
  { r: 143, sw: 2.0, t: 0.63, dur: 13.0, cw: true,  arcs: [{ start:  25, span: 60 },{ start:  92, span: 20 },{ start: 120, span: 70 },{ start: 200, span: 40 },{ start: 248, span: 10 },{ start: 266, span: 55 },{ start: 328, span: 25 }] },
  { r: 124, sw: 8.0, t: 0.75, dur:  6.5, cw: false, arcs: [{ start:   0, span: 75 },{ start:  83, span: 25 },{ start: 116, span: 10 },{ start: 134, span: 80 },{ start: 222, span: 50 },{ start: 280, span: 15 },{ start: 303, span: 45 }] },
  { r: 105, sw: 2.5, t: 0.86, dur: 11.5, cw: true,  arcs: [{ start:  12, span: 50 },{ start:  70, span: 15 },{ start:  93, span: 65 },{ start: 168, span: 35 },{ start: 212, span: 10 },{ start: 230, span: 80 },{ start: 318, span: 30 }] },
  { r:  86, sw: 5.5, t: 0.94, dur:  8.8, cw: false, arcs: [{ start:   5, span: 85 },{ start: 100, span: 30 },{ start: 140, span: 10 },{ start: 158, span: 60 },{ start: 228, span: 40 },{ start: 276, span: 12 },{ start: 296, span: 55 }] },
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

// One ring: rotating bloom halo + crisp primary arcs
function Ring({ ring, idx, halfId }) {
  const glowId  = `glow-${halfId}-${idx}`
  const color   = lerpColor(ring.t)
  const center  = `${CX} ${CY}`
  const fromRot = `0 ${center}`
  const toRot   = `${ring.cw ? 360 : -360} ${center}`
  const durStr  = `${ring.dur}s`
  const bloomSd = ring.sw * 2.2

  return (
    <g>
      <defs>
        <filter id={glowId} x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur in="SourceGraphic" stdDeviation={bloomSd} result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Wide bloom halo — semi-transparent, blurred */}
      <g opacity="0.22" filter={`url(#${glowId})`}>
        <animateTransform attributeName="transform" type="rotate"
          from={fromRot} to={toRot} dur={durStr} repeatCount="indefinite" />
        {ring.arcs.map((arc, ai) => (
          <path
            key={ai}
            d={arcPath(CX, CY, ring.r, arc.start, arc.span)}
            fill="none"
            stroke={color}
            strokeWidth={ring.sw + 6}
            strokeLinecap="round"
          />
        ))}
      </g>

      {/* Crisp primary arcs */}
      <g filter={`url(#${glowId})`}>
        <animateTransform attributeName="transform" type="rotate"
          from={fromRot} to={toRot} dur={durStr} repeatCount="indefinite" />
        {ring.arcs.map((arc, ai) => (
          <path
            key={ai}
            d={arcPath(CX, CY, ring.r, arc.start, arc.span)}
            fill="none"
            stroke={color}
            strokeWidth={ring.sw}
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
          <circle cx={CX} cy={CY} r={55}
            fill="url(#coreGrad)" filter="url(#core-bloom)" opacity="0.7" />
          <circle cx={CX} cy={CY} r={20}
            fill="url(#coreGrad)" opacity="0.98" />
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

