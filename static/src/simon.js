/**
 * simon.js — Core logic for Simon's Algorithm simulation
 *
 * Simon's problem: given f: {0,1}^n -> {0,1}^n that is either
 *   1-to-1 (s = 0...0), or 2-to-1 with f(x) = f(x XOR s),
 * find the hidden string s.
 */

// ?? Utility ??????????????????????????????????????????????????????????????????

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

// ?? Oracle builder ????????????????????????????????????????????????????????????

/**
 * Build an oracle function from a plain mapping object { '000': '001', ... }.
 * The oracle satisfies: oracle(x) = mapping[x].
 */
export function buildOracleFromMapping(mapping) {
  return (x) => mapping[x]
}

// ?? Oracle validation ?????????????????????????????????????????????????????????

/**
 * Validate that the oracle mapping satisfies Simon's promise:
 *   Either f is 1-to-1 (s = 0...0) or 2-to-1 with a fixed hidden s.
 *
 * Returns { valid: boolean, secret: string|null, isOneToOne: boolean }
 */
export function validateOracle(mapping, n) {
  const inputs = allBitstrings(n)
  const zero = '0'.repeat(n)

  // Check injectivity first — find any collision
  const seen = new Map() // output -> first input that produced it
  let candidateS = null

  for (const x of inputs) {
    const fx = mapping[x]
    if (seen.has(fx)) {
      const x2 = seen.get(fx)
      const s = xorStrings(x, x2)
      if (s === zero) return { valid: false, secret: null, isOneToOne: false }
      if (candidateS === null) {
        candidateS = s
      } else if (candidateS !== s) {
        // Two different non-zero XOR values — not Simon-valid
        return { valid: false, secret: null, isOneToOne: false }
      }
    } else {
      seen.set(fx, x)
    }
  }

  if (candidateS === null) {
    // No collisions: 1-to-1 function, s = 0...0
    return { valid: true, secret: zero, isOneToOne: true }
  }

  // Verify every pair: f(x) must equal f(x XOR s) for all x
  for (const x of inputs) {
    const partner = xorStrings(x, candidateS)
    if (mapping[x] !== mapping[partner]) {
      return { valid: false, secret: null, isOneToOne: false }
    }
  }

  return { valid: true, secret: candidateS, isOneToOne: false }
}

// ?? Gaussian elimination over GF(2) ??????????????????????????????????????????

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

// ?? Quantum simulation ????????????????????????????????????????????????????????

/**
 * Simulate a single quantum query to the Simon oracle.
 *
 * In Simon's algorithm, each query produces a uniformly random y in {0,1}^n
 * such that y · s = 0 (mod 2).  We simulate this classically.
 *
 * @param {string} secret  - the hidden s string
 * @param {number} n
 * @returns {string} sampled y
 */
function quantumQuery(secret, n) {
  const zero = '0'.repeat(n)
  while (true) {
    // Pick a random n-bit string
    let y = ''
    for (let i = 0; i < n; i++) y += Math.random() < 0.5 ? '0' : '1'
    // Accept if y · s = 0 mod 2 (always true when s = 0...0)
    if (dotMod2(y, secret) === 0) return y
  }
}

// ?? Main entry point ??????????????????????????????????????????????????????????

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
  const { valid, secret, isOneToOne } = validateOracle(mapping, n)

  if (!valid) {
    return {
      consistent: false,
      secret: null,
      isOneToOne: false,
      equations: [],
      recoveredSecrets: [],
      queryLog: [],
      oracleTable,
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
    const y = quantumQuery(secret, n)
    queryIndex++

    // Check if y is linearly independent of current equations over GF(2)
    if (isLinearlyIndependent(y, equations, n)) {
      equations.push(y)
      queryLog.push({
        queryIndex,
        y,
        equation: `${y}  * s = 0`,
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

// ?? Linear independence check over GF(2) ?????????????????????????????????????

/**
 * Returns true if y is linearly independent of the current equation set.
 */
function isLinearlyIndependent(y, current, n) {
  if (current.length === 0) return y !== '0'.repeat(n)

  // Run partial Gaussian elimination
  const rows = current.map((eq) => parseInt(eq, 2))
  let candidate = parseInt(y, 2)

  for (let col = n - 1; col >= 0; col--) {
    if (!((candidate >> col) & 1)) continue
    const pivot = rows.find((r) => (r >> col) & 1)
    if (pivot === undefined) return true // new pivot found
    candidate ^= pivot
  }

  return candidate !== 0
}
