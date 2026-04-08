import { useEffect, useState } from 'react'
import './IntroOverlay.css'

// React is removed from DOM after this delay (ms) — must be > CSS animation end
const REMOVE_DELAY = 3550

// SVG canvas: 560x560, center at 280,280
const CX = 280
const CY = 280

// Ring definitions — drawn outermost to innermost
// r     : radius
// sw    : primary stroke width (the main PCB trace)
// color : neon color
// dash  : strokeDasharray — long segment, gap, tiny pad, gap (PCB trace rhythm)
// dur   : seconds for one full rotation
// cw    : true = clockwise, false = counter-clockwise
const RINGS = [
  { r: 252, sw: 2,  color: '#00e5ff', dash: '30 5 3 5',         dur: 7.0, cw: true  },
  { r: 228, sw: 8,  color: '#6b1fef', dash: '55 4 4 4 4 4',     dur: 5.5, cw: false },
  { r: 204, sw: 2,  color: '#00cfff', dash: '14 5 2 5',         dur: 8.5, cw: true  },
  { r: 180, sw: 9,  color: '#c030fb', dash: '62 5 4 5 4 5',     dur: 4.8, cw: false },
  { r: 156, sw: 3,  color: '#18c8ff', dash: '22 5 2 5',         dur: 9.2, cw: true  },
  { r: 132, sw: 7,  color: '#8840e8', dash: '40 4 3 4',         dur: 6.1, cw: false },
  { r: 108, sw: 2,  color: '#00f0ff', dash: '12 4 2 4',         dur: 7.8, cw: true  },
  { r:  84, sw: 5,  color: '#a050ff', dash: '28 4 2 4',         dur: 5.2, cw: false },
]

// Renders one ring as three layered SVG elements:
//   1. Wide blurred copy  — outer glow bloom
//   2. Primary trace      — the actual PCB-style dashed ring
//   3. Inner shadow trace — thin parallel inner line for double-track depth
//   4. Junction pads      — small filled circles every 45°
// All four share the same animateTransform so they rotate as one unit.
function Ring({ ring, idx, halfId }) {
  const filterId = `glow-${halfId}-${idx}`
  const center   = `${CX} ${CY}`
  const fromAttr = `0 ${center}`
  const toAttr   = `${ring.cw ? 360 : -360} ${center}`
  const durStr   = `${ring.dur}s`

  // Thin inner shadow trace offset inward by (sw + 2px)
  const innerR = ring.r - ring.sw - 2

  return (
    <g>
      <defs>
        <filter id={filterId} x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur in="SourceGraphic" stdDeviation={ring.sw * 1.8} result="bloom" />
          <feMerge>
            <feMergeNode in="bloom" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* 1. Outer glow bloom — wide, transparent, blurred */}
      <circle
        cx={CX} cy={CY} r={ring.r}
        fill="none"
        stroke={ring.color}
        strokeWidth={ring.sw + 8}
        strokeDasharray={ring.dash}
        strokeLinecap="butt"
        opacity="0.15"
        filter={`url(#${filterId})`}
      >
        <animateTransform attributeName="transform" type="rotate"
          from={fromAttr} to={toAttr} dur={durStr} repeatCount="indefinite" />
      </circle>

      {/* 2. Primary PCB trace */}
      <circle
        cx={CX} cy={CY} r={ring.r}
        fill="none"
        stroke={ring.color}
        strokeWidth={ring.sw}
        strokeDasharray={ring.dash}
        strokeLinecap="butt"
        opacity="1"
        filter={`url(#${filterId})`}
      >
        <animateTransform attributeName="transform" type="rotate"
          from={fromAttr} to={toAttr} dur={durStr} repeatCount="indefinite" />
      </circle>

      {/* 3. Inner shadow trace — classic PCB double-line look */}
      {innerR > 0 && (
        <circle
          cx={CX} cy={CY} r={innerR}
          fill="none"
          stroke={ring.color}
          strokeWidth={1}
          strokeDasharray={`${parseFloat(ring.dash) * 0.55} 999`}
          strokeLinecap="butt"
          opacity="0.28"
        >
          <animateTransform attributeName="transform" type="rotate"
            from={fromAttr} to={toAttr} dur={durStr} repeatCount="indefinite" />
        </circle>
      )}

      {/* 4. Junction pads — 8 filled circles evenly spaced, rotate with the trace */}
      <g>
        <animateTransform attributeName="transform" type="rotate"
          from={fromAttr} to={toAttr} dur={durStr} repeatCount="indefinite" />
        {Array.from({ length: 8 }, (_, k) => {
          const angle = (k / 8) * 2 * Math.PI - Math.PI / 2
          const px = CX + ring.r * Math.cos(angle)
          const py = CY + ring.r * Math.sin(angle)
          return (
            <circle
              key={k}
              cx={px} cy={py}
              r={ring.sw * 1.1 + 0.5}
              fill={ring.color}
              opacity="0.9"
              filter={`url(#${filterId})`}
            />
          )
        })}
      </g>
    </g>
  )
}

// Renders the full SVG for one half (top or bottom).
// Both halves get the exact same SVG — the parent div clips them.
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

      {/* Central energy core — only in top SVG so it doesn't double-render */}
      {half === 'top' && (
        <>
          <defs>
            <radialGradient id="coreGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%"   stopColor="#ffffff" stopOpacity="1.0" />
              <stop offset="20%"  stopColor="#d0b8ff" stopOpacity="0.95" />
              <stop offset="55%"  stopColor="#7b2fff" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#7b2fff" stopOpacity="0" />
            </radialGradient>
            <filter id="core-bloom" x="-200%" y="-200%" width="500%" height="500%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="12" />
            </filter>
          </defs>
          {/* Soft outer bloom */}
          <circle cx={CX} cy={CY} r={48}
            fill="url(#coreGrad)"
            filter="url(#core-bloom)"
            opacity="0.65" />
          {/* Crisp inner core */}
          <circle cx={CX} cy={CY} r={18}
            fill="url(#coreGrad)"
            opacity="0.98" />
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
