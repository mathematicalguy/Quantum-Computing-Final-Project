import { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { allBitstrings, buildOracleFromMapping, runSimon } from './simon.js'
import CircuitCanvas from './CircuitCanvas.jsx'
import IntroOverlay from './IntroOverlay.jsx'
import './App.css'

const DEFAULT_N = 3

function buildDefaultMapping(n) {
  // Default: custom 2-to-1 mapping (n=3, s=101)
  if (n === 3) {
    return {
      '000': '100',
      '001': '001',
      '010': '101',
      '011': '111',
      '100': '001',
      '101': '100',
      '110': '111',
      '111': '101',
    }
  }
  // Default: custom 2-to-1 mapping (n=4, s=1010)
  if (n === 4) {
    return {
      '0000': '0000',
      '0001': '0001',
      '0010': '0010',
      '0011': '0011',
      '0100': '0100',
      '0101': '0101',
      '0110': '0110',
      '0111': '0111',
      '1000': '0010',
      '1001': '0011',
      '1010': '0000',
      '1011': '0001',
      '1100': '0110',
      '1101': '0111',
      '1110': '0100',
      '1111': '0101',
    }
  }
  // Generic identity (1-to-1) default for other n
  const inputs = allBitstrings(n)
  const m = {}
  inputs.forEach((x) => (m[x] = x))
  return m
}

function isValidBitstring(s, n) {
  return typeof s === 'string' && s.length === n && /^[01]+$/.test(s)
}

function downloadJSON(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function OracleTable({ n, mapping, onChange }) {
  const inputs = allBitstrings(n)
  return (
    <div className="oracle-table-wrap">
      <table className="oracle-table">
        <thead>
          <tr>
            <th>x (input)</th>
            <th>f(x) (output)</th>
          </tr>
        </thead>
        <tbody>
          {inputs.map((x) => (
            <tr key={x}>
              <td><code>{x}</code></td>
              <td>
                <input
                  className={`oracle-input ${isValidBitstring(mapping[x] ?? '', n) ? '' : 'invalid'}`}
                  value={mapping[x] ?? ''}
                  maxLength={n}
                  onChange={(e) => onChange(x, e.target.value)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ResultsPanel({ result, onDownload }) {
  if (!result) return null
  const { secret, equations, recoveredSecrets, queryLog, consistent, isOneToOne, oracleTable } = result
  return (
    <div className="results">
      <div className="results-header">
        <h2>Results</h2>
        <button className="btn-download" onClick={onDownload}>
          Download JSON
        </button>
      </div>

      {!consistent && (
        <>
          <div className="alert alert-error">
            This mapping is <strong>not a valid Simon&apos;s oracle</strong>.
            Every colliding pair f(x1)&nbsp;=&nbsp;f(x2) must satisfy x1&nbsp;XOR&nbsp;x2&nbsp;=&nbsp;<em>s</em> for
            the <strong>same</strong> secret string <em>s</em>, but your mapping produces different
            XOR values across pairs.
          </div>

          {result.collisions && result.collisions.length > 0 && (
            <details className="collapsible" open>
              <summary>Collision diagnostics ({result.collisions.length} pairs)</summary>
              <table className="result-table">
                <thead>
                  <tr>
                    <th>x1</th>
                    <th>x2</th>
                    <th>f(x)</th>
                    <th>x1 XOR x2</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const sValues = new Set(result.collisions.map((c) => c.s))
                    const isConflict = sValues.size > 1
                    return result.collisions.map((c, i) => (
                      <tr key={i}>
                        <td><code>{c.x1}</code></td>
                        <td><code>{c.x2}</code></td>
                        <td><code>{c.fx}</code></td>
                        <td>
                          <code className={isConflict ? 'collision-conflict' : ''}>{c.s}</code>
                        </td>
                      </tr>
                    ))
                  })()}
                </tbody>
              </table>
            </details>
          )}
        </>
      )}

      {consistent && (
        <>
          <div className="result-row">
            <span className="result-label">Hidden string <em>s</em>:</span>
            <code className="result-value highlight">{secret}</code>
            {isOneToOne && <span className="tag">1-to-1 (s = 0...0)</span>}
          </div>

          <div className="result-row">
            <span className="result-label">Equations collected (y &middot; s = 0):</span>
            <div className="equation-list">
              {equations.length === 0
                ? <em>None needed (trivial case)</em>
                : equations.map((eq, i) => (
                  <div key={i} className="equation-item">
                      <code>{eq}</code> &middot; s = 0
                    </div>
                  ))}
            </div>
          </div>

          {recoveredSecrets.length > 0 && (
            <div className="result-row">
              <span className="result-label">Non-trivial solution(s) recovered:</span>
              <div className="equation-list">
                {recoveredSecrets.map((s, i) => (
                  <code key={i} className="result-value">{s}</code>
                ))}
              </div>
            </div>
          )}

          <details className="collapsible">
            <summary>Oracle table ({oracleTable.length} entries)</summary>
            <table className="result-table">
              <thead><tr><th>x</th><th>f(x)</th></tr></thead>
              <tbody>
                {oracleTable.map(({ x, fx }) => (
                  <tr key={x}><td><code>{x}</code></td><td><code>{fx}</code></td></tr>
                ))}
              </tbody>
            </table>
          </details>

          <details className="collapsible">
            <summary>Quantum query log ({queryLog.length} queries)</summary>
            <table className="result-table">
              <thead><tr><th>#</th><th>Sample y</th><th>Equation</th></tr></thead>
              <tbody>
                {queryLog.map(({ queryIndex, y, equation }) => (
                  <tr key={queryIndex}>
                    <td>{queryIndex}</td>
                    <td><code>{y}</code></td>
                    <td><code>{equation}</code></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </>
      )}
    </div>
  )
}

function App() {
  const [n, setN] = useState(DEFAULT_N)
  const [mapping, setMapping] = useState(buildDefaultMapping(DEFAULT_N))
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const handleNChange = (newN) => {
    setN(newN)
    setMapping(buildDefaultMapping(newN))
    setResult(null)
    setError(null)
  }

  const handleCellChange = (x, val) => {
    setMapping((prev) => ({ ...prev, [x]: val }))
    setResult(null)
  }

  const handleRun = useCallback(() => {
    setError(null)
    setResult(null)
    const inputs = allBitstrings(n)
    for (const x of inputs) {
      if (!isValidBitstring(mapping[x] ?? '', n)) {
        setError(`Invalid output for input ${x}: "${mapping[x]}" — must be a ${n}-bit binary string.`)
        return
      }
    }
    try {
      const oracle = buildOracleFromMapping(mapping)
      const res = runSimon(oracle, n)
      setResult(res)
    } catch (e) {
      setError(String(e))
    }
  }, [n, mapping])

  const handleDownload = () => {
    if (!result) return
    downloadJSON({ n, mapping, ...result }, `simon-n${n}-s${result.secret}.json`)
  }

  return (
    <div className="app">
      <IntroOverlay />
      <CircuitCanvas />
      <header className="app-header">
        <h1>Simon&apos;s Algorithm Simulator</h1>
        <p className="subtitle">
          Define a custom oracle f : [0,1]<sup>n</sup> &rarr; [0,1]<sup>n</sup> and
          simulate the quantum algorithm to recover the hidden string <em>s</em>.
        </p>
        <div className="header-links">
          <Link to="/explorer" className="explorer-link">
            View All 2-Qubit Oracles ?
          </Link>
        </div>
      </header>

      <main className="app-main">
        <section className="card">
          <h2>1. Choose n (number of bits)</h2>
          <div className="n-selector">
            {[2, 3, 4].map((v) => (
              <button
                key={v}
                className={`btn-n ${n === v ? 'active' : ''}`}
                onClick={() => handleNChange(v)}
              >
                n = {v}
              </button>
            ))}
          </div>
          <p className="hint">
            f maps {2 ** n} inputs. The oracle must be 2-to-1 with a fixed hidden
            string s, or 1-to-1 (s = 0...0).
          </p>
        </section>

        <section className="card">
          <h2>2. Define the Oracle f(x)</h2>
          <p className="hint">
            Enter a {n}-bit binary string for each output.
            Swap pairs of rows to encode a secret s.
          </p>
          <OracleTable n={n} mapping={mapping} onChange={handleCellChange} />
        </section>

        <section className="card run-card">
          <button className="btn-run" onClick={handleRun}>
            Run Simon&apos;s Algorithm
          </button>
          {error && <div className="alert alert-error">{error}</div>}
        </section>

        <ResultsPanel result={result} onDownload={handleDownload} />
      </main>

      <footer className="app-footer">
         <div>Quantum Computing &mdash; Simon&apos;s Algorithm Project</div>
         <div className="footer-author">by <span>Garrett Poetker</span></div>
      </footer>
    </div>
  )
}

export default App
