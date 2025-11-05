import { useState } from 'react'
import { Routes, Route, Link, useLocation } from 'react-router-dom'
import { WalletProvider } from './context/WalletProvider'
import Home from './pages/Home'
import Schedule from './pages/Schedule'
import About from './pages/About'
import Episodes from './pages/Episodes'
import Apply from './pages/Apply'
import Admin from './pages/Admin'
import Stream from './pages/Stream'
import './App.css'

function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()
  
  // Hide navigation on stream/OBS pages
  const isStreamPage = location.pathname.startsWith('/stream') || location.pathname.startsWith('/obs')

  return (
    <WalletProvider>
    <div className="app">
      {!isStreamPage && (
      <nav className="top-nav">
        <div className="nav-content">
          {/* Mobile Menu Button (left) */}
          <button 
            className="mobile-menu-btn" 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {mobileMenuOpen ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </>
              ) : (
                <>
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </>
              )}
            </svg>
          </button>

          {/* Logo (center) */}
          <Link to="/" className="logo-section">
            <img src="/memetalk.tv.png" alt="MemeTalk.TV" className="nav-logo" />
          </Link>

          {/* Desktop Menu */}
          <div className="nav-menu">
            <Link to="/" className="nav-link">Live</Link>
            <Link to="/episodes" className="nav-link">Episodes</Link>
            <Link to="/schedule" className="nav-link">Schedule</Link>
            <Link to="/apply" className="nav-link nav-link-apply">Apply</Link>
            <Link to="/about" className="nav-link">About</Link>
          </div>

          {/* Social Links (right) */}
          <div className="social-links">
            <a href="https://www.youtube.com/@memetalktv" target="_blank" rel="noopener noreferrer" className="social-link" title="YouTube">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
            </a>
            <a href="https://x.com/Memetalktv" target="_blank" rel="noopener noreferrer" className="social-link" title="X (Twitter)">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>
            <a href="https://t.me/+dpS-DfsZoPM1NWVk" target="_blank" rel="noopener noreferrer" className="social-link" title="Telegram">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
              </svg>
            </a>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="mobile-menu-dropdown">
            <Link to="/" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
              Live
            </Link>
            <Link to="/episodes" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
              Episodes
            </Link>
            <Link to="/schedule" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
              Schedule
            </Link>
            <Link to="/apply" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
              Apply
            </Link>
            <Link to="/about" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
              About
            </Link>
          </div>
        )}
      </nav>
      )}

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/episodes" element={<Episodes />} />
        <Route path="/schedule" element={<Schedule />} />
        <Route path="/apply" element={<Apply />} />
        <Route path="/about" element={<About />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/stream/:slotId?" element={<Stream />} />
        <Route path="/obs" element={<Stream />} />
      </Routes>
    </div>
    </WalletProvider>
  )
}

export default App
