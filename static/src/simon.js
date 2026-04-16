/**
 * simon.js — Core logic for Simon's Algorithm simulation
 *
 * Simon's problem: given f: {0,1}^n -> {0,1}^n that is either
 *   1-to-1 (s = 0...0), or 2-to-1 with f(x) = f(x XOR s),
 * find the hidden string s.
 */

// --- Utility -------------------------------------------------

/** Return all n-bit binary strings in lexicographic order. */
export function allBitstrings(n) {
  const result = []
  for (let i = 0; i < 1 << n; i++) {
    result.push(i.toString(2).padStart(n, '0'))
  }
  return result
}

/** XOR two equal-length bitstrings, return result string. */
function xorStrings(a, b) {
  return a.split('').map((bit, i) => (bit ^ b[i]).toString()).join('')
}

/** Dot product mod 2 of two equal-length bitstrings. */
function dotMod2(a, b) {
  return a.split('').reduce((acc, bit, i) => acc ^ (bit & b[i]), 0)
}

// -- Oracle builder -------------------------------------

/**
 * Build an oracle function from a plain mapping object { '000': '001', ... }.
 * The oracle satisfies: oracle(x) = mapping[x].
 */
export function buildOracleFromMapping(mapping) {
  return (x) => mapping[x]
}

// -- Oracle validation -------------------------------------

/**
 * Validate that the oracle mapping satisfies Simon's promise:
 *   Either f is 1-to-1 (s = 0...0) or 2-to-1 with a fixed hidden s.
 *
 * Returns { valid: boolean, secret: string|null, isOneToOne: boolean }
 */
export function validateOracle(mapping, n) {
  const inputs = allBitstrings(n)
  const zero = '0'.repeat(n)

  // Collect every collision: output -> [list of inputs]
  const buckets = new Map()
  for (const x of inputs) {
    const fx = mapping[x]
    if (!buckets.has(fx)) buckets.set(fx, [])
    buckets.get(fx).push(x)
  }

  // Build collision pair list with the XOR for each pair
  const collisions = []
  let candidateS = null
  let hasConflict = false

  for (const [fx, xs] of buckets) {
    if (xs.length === 1) continue // no collision for this output
    if (xs.length > 2) {
      // More than 2 inputs map to the same output — not 2-to-1
      for (let i = 0; i < xs.length; i++) {
        for (let j = i + 1; j < xs.length; j++) {
          collisions.push({ x1: xs[i], x2: xs[j], fx, s: xorStrings(xs[i], xs[j]) })
        }
      }
      hasConflict = true
      continue
    }
    const [x1, x2] = xs
    const s = xorStrings(x1, x2)
    collisions.push({ x1, x2, fx, s })
    if (s === zero) {
      hasConflict = true
    } else if (candidateS === null) {
      candidateS = s
    } else if (candidateS !== s) {
      hasConflict = true
    }
  }

  if (collisions.length === 0) {
    // No collisions: 1-to-1 function, s = 0...0
    return { valid: true, secret: zero, isOneToOne: true, collisions: [] }
  }

  if (hasConflict) {
    return { valid: false, secret: null, isOneToOne: false, collisions }
  }

  // Verify every pair: f(x) must equal f(x XOR s) for all x
  for (const x of inputs) {
    const partner = xorStrings(x, candidateS)
    if (mapping[x] !== mapping[partner]) {
      return { valid: false, secret: null, isOneToOne: false, collisions }
    }
  }

  return { valid: true, secret: candidateS, isOneToOne: false, collisions }
}

// -- Gaussian elimination over GF(2) -------------------------------------

/**
 * Solve the system of equations { y_i · s = 0 } over GF(2).
 * Returns all non-trivial solutions (excluding the all-zeros string).
 *
 * @param {string[]} equations - array of n-bit strings y_i
 * @param {number} n
 * @returns {string[]} list of non-trivial s values consistent with all equations
 */
function solveGF2(equations, n) {
  // Represent each equation as an integer bitmask
  const rows = equations.map((eq) => parseInt(eq, 2))

  // Gaussian elimination to find the null space
  const pivotCol = new Array(n).fill(-1) // pivotCol[col] = row index
  const mat = [...rows]
  let rank = 0
  const pivotRow = [] // pivotRow[rank] = pivot column

  for (let col = n - 1; col >= 0; col--) {
    // Find a row with a 1 in this column (at or below current rank)
    let found = -1
    for (let r = rank; r < mat.length; r++) {
      if ((mat[r] >> col) & 1) { found = r; break }
    }
    if (found === -1) continue
    // Swap
    ;[mat[rank], mat[found]] = [mat[found], mat[rank]]
    pivotCol[col] = rank
    pivotRow.push(col)
    // Eliminate
    for (let r = 0; r < mat.length; r++) {
      if (r !== rank && (mat[r] >> col) & 1) mat[r] ^= mat[rank]
    }
    rank++
  }

  // Free variables are columns without a pivot
  const freeCols = []
  for (let col = 0; col < n; col++) {
    if (pivotCol[col] === -1) freeCols.push(col)
  }

  // Enumerate all 2^(freeCols.length) assignments of free variables
  const solutions = []
  const numFree = freeCols.length
  for (let mask = 1; mask < (1 << numFree); mask++) {
    // Assign free variables
    const x = new Array(n).fill(0)
    for (let i = 0; i < numFree; i++) {
      x[freeCols[i]] = (mask >> i) & 1
    }
    // Back-substitute pivot variables
    for (let i = 0; i < pivotRow.length; i++) {
      const pc = pivotRow[i]
      let val = 0
      for (let col = 0; col < n; col++) {
        if (col !== pc) val ^= ((mat[i] >> col) & 1) & x[col]
      }
      x[pc] = val
    }
    // Build string (MSB first, matching our bitstring convention)
    const s = x.slice().reverse().map(String).join('')
    solutions.push(s)
  }

  return solutions
}

// -- Quantum simulation -------------------------------------

// -- Full state-vector quantum simulation ---------------------

/**
 * Simulate a single run of Simon's quantum circuit on 2n qubits
 * using full state-vector evolution.  No knowledge of s is used.
 *
 * The circuit is:
 *   |0>^n |0>^n  -->  H^n ? I  -->  U_f  -->  H^n ? I  -->  measure input register
 *
 * State vector has 2^(2n) complex amplitudes (stored as real numbers
 * since all amplitudes in Simon's circuit are real).
 *
 * @param {object} mapping - oracle lookup table { '000': '001', ... }
 * @param {number} n
 * @returns {string} measured y from the input register
 */
function quantumQuery(mapping, n) {
  const N = 1 << n        // 2^n
  const NN = 1 << (2 * n) // 2^(2n) — full state-vector size

  // --- Step 0: Initialize |0...0> ---
  // --- Step 1: Apply H^n to input register (top n qubits) ---
  // Combined: (1/sqrt(N)) sum_x |x>|0>^n
  // Index layout: |x>|w> lives at index (x << n) | w
  const afterH1 = new Float64Array(NN)
  const invSqrtN = 1.0 / Math.sqrt(N)
  for (let x = 0; x < N; x++) {
    afterH1[x << n] = invSqrtN
  }

  // --- Step 2: Apply U_f: |x>|w> -> |x>|w XOR f(x)> ---
  const afterUf = new Float64Array(NN)
  for (let idx = 0; idx < NN; idx++) {
    if (afterH1[idx] === 0) continue
    const x = idx >> n
    const w = idx & (N - 1)
    const xStr = x.toString(2).padStart(n, '0')
    const fx = parseInt(mapping[xStr], 2)
    const newIdx = (x << n) | (w ^ fx)
    afterUf[newIdx] += afterH1[idx]
  }

  // --- Step 3: Apply H^n to input register again ---
  // H^n|x> = (1/sqrt(N)) sum_y (-1)^(x·y) |y>
  const afterH2 = new Float64Array(NN)
  for (let idx = 0; idx < NN; idx++) {
    if (afterUf[idx] === 0) continue
    const x = idx >> n
    const w = idx & (N - 1)
    const amp = afterUf[idx]
    const scaled = amp * invSqrtN
    for (let y = 0; y < N; y++) {
      // (-1)^(x·y) via popcount parity of (x & y)
      let bits = x & y
      let parity = 0
      while (bits) { parity ^= 1; bits &= bits - 1 }
      const newIdx = (y << n) | w
      afterH2[newIdx] += parity ? -scaled : scaled
    }
  }

  // --- Step 4: Measure the input register ---
  // P(y) = sum_w |<y,w|state>|^2
  const probs = new Float64Array(N)
  for (let idx = 0; idx < NN; idx++) {
    const y = idx >> n
    probs[y] += afterH2[idx] * afterH2[idx]
  }

  // Sample from the distribution
  const r = Math.random()
  let cumulative = 0
  for (let y = 0; y < N; y++) {
    cumulative += probs[y]
    if (r < cumulative) {
      return y.toString(2).padStart(n, '0')
    }
  }
  return (N - 1).toString(2).padStart(n, '0')
}

// -- Main entry point ------------------------------

/**
 * Run Simon's algorithm simulation.
 *
 * @param {function} oracle  - oracle(x: string) -> string
 * @param {number}   n
 * @returns {object} result object consumed by the UI
 */
export function runSimon(oracle, n) {
  const inputs = allBitstrings(n)

  // Build the full oracle table for display
  const oracleTable = inputs.map((x) => ({ x, fx: oracle(x) }))

  // Build mapping for validation
  const mapping = {}
  oracleTable.forEach(({ x, fx }) => { mapping[x] = fx })

  // Validate the oracle satisfies Simon's promise
  const { valid, secret, isOneToOne, collisions } = validateOracle(mapping, n)

  if (!valid) {
    return {
      consistent: false,
      secret: null,
      isOneToOne: false,
      equations: [],
      recoveredSecrets: [],
      queryLog: [],
      oracleTable,
      collisions,
    }
  }

  // Trivial case: 1-to-1 (s = 0...0), no equations needed
  if (isOneToOne) {
    return {
      consistent: true,
      secret,
      isOneToOne: true,
      equations: [],
      recoveredSecrets: [],
      queryLog: [],
      oracleTable,
    }
  }

  // Collect linearly independent equations y · s = 0 until we can solve for s
  // We need n-1 linearly independent equations to pin down s uniquely (up to sign)
  const equations = []
  const queryLog = []
  let queryIndex = 0
  const maxQueries = n * 20 // safety cap

  while (equations.length < n - 1 && queryIndex < maxQueries) {
    const y = quantumQuery(mapping, n)
    queryIndex++

    // Check if y is linearly independent of current equations over GF(2)
    if (isLinearlyIndependent(y, equations, n)) {
      equations.push(y)
      queryLog.push({
        queryIndex,
        y,
        equation: `${y} · s = 0`,
      })
    }
  }

  // Solve the system to recover s
  const recoveredSecrets = solveGF2(equations, n)

  return {
    consistent: true,
    secret,
    isOneToOne: false,
    equations,
    recoveredSecrets,
    queryLog,
    oracleTable,
  }
}

// -- Linear independence check over GF(2) -------------------------------------

/**
 * Returns true if y is linearly independent of the current equation set.
 *
 * Builds a reduced row echelon form (RREF) from the existing equations,
 * then reduces y against it.  If y reduces to non-zero it is independent.
 */
function isLinearlyIndependent(y, current, n) {
  if (current.length === 0) return y !== '0'.repeat(n)

  // Build RREF from existing equations
  const basis = new Array(n).fill(0) // basis[col] = reduced row with pivot at col, or 0
  for (const eq of current) {
    let val = parseInt(eq, 2)
    for (let col = n - 1; col >= 0; col--) {
      if (!((val >> col) & 1)) continue
      if (basis[col] === 0) { basis[col] = val; break }
      val ^= basis[col]
    }
  }

  // Reduce candidate against the basis
  let candidate = parseInt(y, 2)
  for (let col = n - 1; col >= 0; col--) {
    if (!((candidate >> col) & 1)) continue
    if (basis[col] === 0) return true // new pivot position — independent
    candidate ^= basis[col]
  }

  return candidate !== 0
}
