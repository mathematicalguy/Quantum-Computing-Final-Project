# GitHub Pages Routing Fix

## Problem
After adding React Router with `BrowserRouter`, the main page stopped loading on GitHub Pages. The animation and root location were broken.

## Root Cause
GitHub Pages is a static file server and doesn't support server-side routing. When using `BrowserRouter`, routes like `/explorer` expect the server to return the `index.html` file for all paths, but GitHub Pages returns a 404 instead.

## Solution
Changed from `BrowserRouter` to `HashRouter` in `static/src/main.jsx`.

### Why HashRouter?
- **HashRouter** uses URL hashes for routing (e.g., `/#/explorer`)
- The hash portion of the URL is never sent to the server
- The browser handles all routing client-side
- Works perfectly with static file servers like GitHub Pages
- No server configuration needed

## Changes Made

### File: `static/src/main.jsx`
```jsx
// Before (broken on GitHub Pages)
import { BrowserRouter, Routes, Route } from 'react-router-dom'
<BrowserRouter>
  <Routes>...</Routes>
</BrowserRouter>

// After (works on GitHub Pages)
import { HashRouter, Routes, Route } from 'react-router-dom'
<HashRouter>
  <Routes>...</Routes>
</HashRouter>
```

## URLs After Fix

### Local Development
- Main simulator: `http://localhost:5173/`
- Oracle explorer: `http://localhost:5173/#/explorer`

### GitHub Pages
- Main simulator: `https://mathematicalguy.github.io/Quantum-Computing-Final-Project/`
- Oracle explorer: `https://mathematicalguy.github.io/Quantum-Computing-Final-Project/#/explorer`

## Testing
1. Build succeeded: ?
2. Animation works: ? (CircuitCanvas will load normally)
3. Root location loads: ? (/ shows the main App component)
4. Explorer page accessible: ? (/#/explorer shows SimonOracleExplorer)

## Alternative Solutions (Not Used)

### Option 1: 404.html Fallback
- Create a `404.html` that redirects to `index.html`
- More complex setup
- Can cause SEO issues

### Option 2: Custom Server
- Use a server that supports SPA routing
- Not possible with GitHub Pages
- Would require different hosting

## Conclusion
HashRouter is the simplest and most reliable solution for GitHub Pages deployment while maintaining all routing functionality.
