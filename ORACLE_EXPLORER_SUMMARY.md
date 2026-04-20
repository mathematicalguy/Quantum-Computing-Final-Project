# Simon Oracle Explorer - Implementation Summary

## Overview
Added a new page to the Simon's Algorithm simulator that exhaustively displays all valid 2-qubit Simon oracles, organized by their hidden string (s).

## Changes Made

### 1. New Files Created

#### `static/src/SimonOracleExplorer.jsx`
- Main component for displaying all 2-qubit Simon oracles
- Shows 12 oracles for each hidden string (s = 01, 10, 11)
- Features:
  - Interactive selector to switch between different hidden strings
  - Grid layout showing oracle cards
  - Each card displays:
    - Oracle ID (#1-12)
    - Hidden string (s)
    - Collision pairs
    - Function mappings f(00), f(01), f(10), f(11)
    - Color-coded outputs for visual distinction

#### `static/src/SimonOracleExplorer.css`
- Styling for the oracle explorer page
- Features:
  - Dark gradient background matching the main app
  - Responsive grid layout
  - Hover effects on oracle cards
  - Color-coded output dots (00=green, 01=blue, 10=pink, 11=yellow)
  - Mobile-friendly responsive design

### 2. Modified Files

#### `static/src/main.jsx`
- Added React Router setup with BrowserRouter
- Defined two routes:
  - `/` - Main simulator (existing App component)
  - `/explorer` - New Oracle Explorer page
- Imported react-router-dom components

#### `static/src/App.jsx`
- Added React Router Link import
- Added navigation link in header to access the explorer page
- Link styled as a button: "View All 2-Qubit Oracles ?"

#### `static/src/App.css`
- Added styles for `.header-links` and `.explorer-link`
- Styled the navigation link with hover effects and transitions

#### `static/package.json`
- Added `react-router-dom` dependency (version ^7.14.1)

#### `static/README.md`
- Updated with feature documentation
- Added instructions for accessing both pages
- Documented the new Oracle Explorer feature

## Oracle Data Structure

### Hidden String s = 01
- Pairs: {00, 01} and {10, 11}
- 12 oracles with different output mappings

### Hidden String s = 10
- Pairs: {00, 10} and {01, 11}
- 12 oracles with different output mappings

### Hidden String s = 11
- Pairs: {00, 11} and {01, 10}
- 12 oracles with different output mappings

Total: 36 oracles displayed (12 for each non-trivial hidden string)

## Navigation

Users can:
1. Start at the main simulator (`/`)
2. Click "View All 2-Qubit Oracles ?" to navigate to `/explorer`
3. From the explorer, click "? Back to Simulator" to return to `/`

## Color Coding

Outputs are color-coded for easy visual distinction:
- `00` - Green
- `01` - Blue
- `10` - Pink
- `11` - Yellow

## Responsive Design

The explorer page is fully responsive:
- Desktop: Multi-column grid layout
- Tablet: Adjusted column count
- Mobile: Single or dual column layout with stacked controls

## Technical Implementation

- Uses React functional components with hooks (useState)
- Client-side routing with React Router
- No backend required - all data is statically defined
- CSS transitions and hover effects for improved UX
- Maintains the same design language as the main simulator
