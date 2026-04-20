import { useState } from 'react'
import { Link } from 'react-router-dom'
import './SimonOracleExplorer.css'

// All valid 2-qubit Simon oracles
// s=01: 12 oracles with pairs (00,01) and (10,11)
const s01Oracles = [
  { id: 1, s: '01', pairs: [[0, 1], [2, 3]], mapping: { '00': '00', '01': '00', '10': '01', '11': '01' } },
  { id: 2, s: '01', pairs: [[0, 1], [2, 3]], mapping: { '00': '00', '01': '00', '10': '10', '11': '10' } },
  { id: 3, s: '01', pairs: [[0, 1], [2, 3]], mapping: { '00': '00', '01': '00', '10': '11', '11': '11' } },
  { id: 4, s: '01', pairs: [[0, 1], [2, 3]], mapping: { '00': '01', '01': '01', '10': '00', '11': '00' } },
  { id: 5, s: '01', pairs: [[0, 1], [2, 3]], mapping: { '00': '01', '01': '01', '10': '10', '11': '10' } },
  { id: 6, s: '01', pairs: [[0, 1], [2, 3]], mapping: { '00': '01', '01': '01', '10': '11', '11': '11' } },
  { id: 7, s: '01', pairs: [[0, 1], [2, 3]], mapping: { '00': '10', '01': '10', '10': '00', '11': '00' } },
  { id: 8, s: '01', pairs: [[0, 1], [2, 3]], mapping: { '00': '10', '01': '10', '10': '01', '11': '01' } },
  { id: 9, s: '01', pairs: [[0, 1], [2, 3]], mapping: { '00': '10', '01': '10', '10': '11', '11': '11' } },
  { id: 10, s: '01', pairs: [[0, 1], [2, 3]], mapping: { '00': '11', '01': '11', '10': '00', '11': '00' } },
  { id: 11, s: '01', pairs: [[0, 1], [2, 3]], mapping: { '00': '11', '01': '11', '10': '01', '11': '01' } },
  { id: 12, s: '01', pairs: [[0, 1], [2, 3]], mapping: { '00': '11', '01': '11', '10': '10', '11': '10' } },
]

// s=10: 12 oracles with pairs (00,10) and (01,11)
const s10Oracles = [
  { id: 1, s: '10', pairs: [[0, 2], [1, 3]], mapping: { '00': '00', '01': '01', '10': '00', '11': '01' } },
  { id: 2, s: '10', pairs: [[0, 2], [1, 3]], mapping: { '00': '00', '01': '10', '10': '00', '11': '10' } },
  { id: 3, s: '10', pairs: [[0, 2], [1, 3]], mapping: { '00': '00', '01': '11', '10': '00', '11': '11' } },
  { id: 4, s: '10', pairs: [[0, 2], [1, 3]], mapping: { '00': '01', '01': '00', '10': '01', '11': '00' } },
  { id: 5, s: '10', pairs: [[0, 2], [1, 3]], mapping: { '00': '01', '01': '10', '10': '01', '11': '10' } },
  { id: 6, s: '10', pairs: [[0, 2], [1, 3]], mapping: { '00': '01', '01': '11', '10': '01', '11': '11' } },
  { id: 7, s: '10', pairs: [[0, 2], [1, 3]], mapping: { '00': '10', '01': '00', '10': '10', '11': '00' } },
  { id: 8, s: '10', pairs: [[0, 2], [1, 3]], mapping: { '00': '10', '01': '01', '10': '10', '11': '01' } },
  { id: 9, s: '10', pairs: [[0, 2], [1, 3]], mapping: { '00': '10', '01': '11', '10': '10', '11': '11' } },
  { id: 10, s: '10', pairs: [[0, 2], [1, 3]], mapping: { '00': '11', '01': '00', '10': '11', '11': '00' } },
  { id: 11, s: '10', pairs: [[0, 2], [1, 3]], mapping: { '00': '11', '01': '01', '10': '11', '11': '01' } },
  { id: 12, s: '10', pairs: [[0, 2], [1, 3]], mapping: { '00': '11', '01': '10', '10': '11', '11': '10' } },
]

// s=11: 12 oracles with pairs (00,11) and (01,10)
const s11Oracles = [
  { id: 1, s: '11', pairs: [[0, 3], [1, 2]], mapping: { '00': '00', '01': '01', '10': '01', '11': '00' } },
  { id: 2, s: '11', pairs: [[0, 3], [1, 2]], mapping: { '00': '00', '01': '10', '10': '10', '11': '00' } },
  { id: 3, s: '11', pairs: [[0, 3], [1, 2]], mapping: { '00': '00', '01': '11', '10': '11', '11': '00' } },
  { id: 4, s: '11', pairs: [[0, 3], [1, 2]], mapping: { '00': '01', '01': '00', '10': '00', '11': '01' } },
  { id: 5, s: '11', pairs: [[0, 3], [1, 2]], mapping: { '00': '01', '01': '10', '10': '10', '11': '01' } },
  { id: 6, s: '11', pairs: [[0, 3], [1, 2]], mapping: { '00': '01', '01': '11', '10': '11', '11': '01' } },
  { id: 7, s: '11', pairs: [[0, 3], [1, 2]], mapping: { '00': '10', '01': '00', '10': '00', '11': '10' } },
  { id: 8, s: '11', pairs: [[0, 3], [1, 2]], mapping: { '00': '10', '01': '01', '10': '01', '11': '10' } },
  { id: 9, s: '11', pairs: [[0, 3], [1, 2]], mapping: { '00': '10', '01': '11', '10': '11', '11': '10' } },
  { id: 10, s: '11', pairs: [[0, 3], [1, 2]], mapping: { '00': '11', '01': '00', '10': '00', '11': '11' } },
  { id: 11, s: '11', pairs: [[0, 3], [1, 2]], mapping: { '00': '11', '01': '01', '10': '01', '11': '11' } },
  { id: 12, s: '11', pairs: [[0, 3], [1, 2]], mapping: { '00': '11', '01': '10', '10': '10', '11': '11' } },
]

function OracleCard({ oracle, secretLabel }) {
  const inputs = ['00', '01', '10', '11']
  
  return (
    <div className="oracle-card">
      <div className="oracle-header">
        <span className="oracle-id">#{oracle.id}</span>
        <span className="oracle-secret">{secretLabel}</span>
      </div>
      <div className="oracle-pairs">
        Pairs: {oracle.pairs.map(([a, b]) => `{${inputs[a]}, ${inputs[b]}}`).join(', ')}
      </div>
      <table className="oracle-mini-table">
        <tbody>
          {inputs.map((x) => (
            <tr key={x}>
              <td className="input-cell">f({x})</td>
              <td className="output-cell">
                <span className={`output-dot output-${oracle.mapping[x]}`}>
                  {oracle.mapping[x]}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function SimonOracleExplorer() {
  const [selectedS, setSelectedS] = useState('01')
  
  const getOraclesForS = (s) => {
    if (s === '01') return s01Oracles
    if (s === '10') return s10Oracles
    if (s === '11') return s11Oracles
    return []
  }
  
  const oracles = getOraclesForS(selectedS)
  const inputs = ['00', '01', '10', '11']
  
  return (
    <div className="oracle-explorer">
      <header className="explorer-header">
        <h1>Simon Oracle Set Notation</h1>
        <p className="explorer-subtitle">
          Exhaustive listing of all valid 2-qubit Simon oracles
        </p>
        <Link to="/" className="back-link">? Back to Simulator</Link>
      </header>

      <section className="explorer-controls">
        <h2>Simon oracle set notation</h2>
        <div className="s-selector">
          {['01', '10', '11'].map((s) => (
            <button
              key={s}
              className={`btn-s ${selectedS === s ? 'active' : ''}`}
              onClick={() => setSelectedS(s)}
            >
              s = {s}
            </button>
          ))}
        </div>
        <div className="oracle-info">
          <div className="info-row">
            <span className="info-label">Pairs:</span>
            <span className="info-value">
              {selectedS === '01' && '{00, 01} and {10, 11} ? 12 oracles'}
              {selectedS === '10' && '{00, 10} and {01, 11} ? 12 oracles'}
              {selectedS === '11' && '{00, 11} and {01, 10} ? 12 oracles'}
            </span>
          </div>
        </div>
      </section>

      <section className="oracle-grid">
        {oracles.map((oracle) => (
          <OracleCard 
            key={`${selectedS}-${oracle.id}`} 
            oracle={oracle} 
            secretLabel={`s=${selectedS}`}
          />
        ))}
      </section>

      <footer className="explorer-footer">
        <div>Total: {oracles.length} oracles for s = {selectedS}</div>
        <div className="footer-note">
          Note: s = 00 represents the identity function (1-to-1 mapping), which has 4! = 24 permutations.
        </div>
      </footer>
    </div>
  )
}

export default SimonOracleExplorer
