import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import SimonOracleExplorer from './SimonOracleExplorer.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HashRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/explorer" element={<SimonOracleExplorer />} />
      </Routes>
    </HashRouter>
  </StrictMode>,
)

