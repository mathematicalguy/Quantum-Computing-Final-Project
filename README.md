# Simon's Algorithm Simulator

> Quantum Computing Final Project — University of Cincinnati  
> **Author:** Garrett Poetker

An interactive web simulator for **Simon's Algorithm** — a quantum algorithm that finds the hidden period *s* of a 2-to-1 function f : {0,1}? ? {0,1}? exponentially faster than any classical approach.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Running Locally](#running-locally)
- [Building for Production](#building-for-production)
- [Architecture Overview](#architecture-overview)
- [How It Works](#how-it-works)

---

## Prerequisites

| Tool | Version |
|------|---------|
| [Node.js](https://nodejs.org/) | v18 or later |
| npm | v9 or later (bundled with Node) |

---

## Installation

```bash
# 1. Clone the repository
git clone https://github.com/mathematicalguy/Quantum-Computing-Final-Project.git
cd Quantum-Computing-Final-Project

# 2. Move into the app directory
cd static

# 3. Install dependencies
npm install
```

---

## Running Locally

```bash
# From the static/ directory
npm run dev
```

Vite will start a dev server. Open the URL shown in your terminal (typically `http://localhost:5173/Quantum-Computing-Final-Project/`).

The page hot-reloads automatically on any file save.

---

## Building for Production

```bash
# From the static/ directory
npm run build
```

Output is written to `static/dist/`. To preview the production build locally:

```bash
npm run preview
```

---

## Architecture Overview

```
Quantum-Computing-Final-Project/
??? README.md
??? static/                        # Vite + React application
    ??? index.html                 # HTML entry point
    ??? vite.config.js             # Vite config (base path, React plugin)
    ??? package.json
    ??? src/
        ??? main.jsx               # React root mount
        ??? App.jsx                # UI — layout, state, oracle editor
        ??? simon.js               # Core algorithm logic (no React)
        ??? App.css                # Component-scoped styles (dark theme)
        ??? index.css              # Global CSS variables & base styles
```

### Key files

| File | Responsibility |
|------|---------------|
| `simon.js` | Pure JS implementation of Simon's algorithm — bitstring utilities, oracle validation, GF(2) Gaussian elimination, quantum query simulation |
| `App.jsx` | All React components: `OracleTable` (editable mapping), `ResultsPanel` (equations, recovered secret, query log), `App` (top-level state) |
| `App.css` | Dark-theme design system using CSS custom properties |
| `index.css` | Root CSS variables (colors, fonts, spacing) forced to dark mode |
| `vite.config.js` | Sets `base` to `/Quantum-Computing-Final-Project/` for GitHub Pages deployment |

---

## How It Works

Simon's Algorithm solves the following problem:

> Given a function f : {0,1}? ? {0,1}? that is either 1-to-1 or 2-to-1 with a hidden string *s* such that f(x) = f(x XOR s) for all x, find *s*.

### Simulation steps

1. **Oracle definition** — the user fills in a mapping table for f. The app validates that it satisfies Simon's promise (2-to-1 with a consistent *s*, or 1-to-1).

2. **Quantum queries** — each query classically samples a uniformly random y ? {0,1}? satisfying `y · s = 0 (mod 2)`, mimicking what a real quantum computer produces after measuring the first register.

3. **Linear algebra over GF(2)** — collected y vectors are tested for linear independence via Gaussian elimination. Once n?1 independent equations are gathered, the system is solved to recover *s*.

4. **Results display** — the hidden string, all collected equations, the query log, and the full oracle table are shown. Results can be exported as JSON.

