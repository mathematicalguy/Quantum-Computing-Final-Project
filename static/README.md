# Simon's Algorithm Simulator

An interactive quantum computing simulator for Simon's Algorithm built with React and Vite.

## Features

### 1. Interactive Simulator (`/`)
- Define custom oracle functions f: {0,1}^n ? {0,1}^n
- Supports n = 2, 3, and 4 qubits
- Visualize the quantum circuit
- Step-by-step execution of Simon's Algorithm
- Validation of oracle mappings
- Download results as JSON

### 2. Oracle Explorer (`/explorer`)
- **NEW**: Exhaustive listing of all valid 2-qubit Simon oracles
- View all 12 oracles for each hidden string (s = 01, 10, 11)
- Visual representation with color-coded outputs
- Interactive navigation between different secret strings

## Getting Started

```bash
npm install
npm run dev
```

Visit `http://localhost:5173/` for the simulator or `http://localhost:5173/#/explorer` for the oracle explorer.

**Note:** This app uses HashRouter for GitHub Pages compatibility, so routes use the `#` symbol (e.g., `/#/explorer`).

## Building for Production

```bash
npm run build
```

## React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

