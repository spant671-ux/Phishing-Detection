import React from 'react'

const Header = ({ serverOnline }) => {
  return (
    <header className="sticky top-0 z-50 border-b border-border backdrop-blur-xl bg-bg-primary/80">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" className="drop-shadow-lg">
              <defs>
                <linearGradient id="hg" x1="3" y1="2" x2="21" y2="24">
                  <stop offset="0%" stopColor="#6366f1"/>
                  <stop offset="100%" stopColor="#8b5cf6"/>
                </linearGradient>
              </defs>
              <path d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" 
                    fill="url(#hg)" opacity="0.9"/>
              <path d="M10 15.5l-3.5-3.5 1.41-1.41L10 12.67l5.59-5.59L17 8.5l-7 7z" 
                    fill="white" opacity="0.9"/>
            </svg>
            {/* Glow effect */}
            <div className="absolute inset-0 blur-xl bg-accent/20 rounded-full -z-10"></div>
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">PhishGuard</h1>
            <p className="text-[10px] font-medium text-accent-light tracking-widest uppercase">AI Protection</p>
          </div>
        </div>

        {/* Status & Nav */}
        <div className="flex items-center gap-6">
          <nav className="hidden md:flex items-center gap-1">
            {['Scanner', 'History', 'How It Works'].map(item => (
              <a key={item} 
                 href={`#${item.toLowerCase().replace(/\s+/g, '-')}`}
                 className="px-3 py-1.5 text-sm text-text-secondary hover:text-white transition-colors rounded-lg hover:bg-bg-hover">
                {item}
              </a>
            ))}
          </nav>

          {/* Server Status Badge */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border
            ${serverOnline 
              ? 'bg-safe-bg border-safe/20 text-safe' 
              : 'bg-danger-bg border-danger/20 text-danger'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${serverOnline ? 'bg-safe animate-pulse' : 'bg-danger'}`}></span>
            {serverOnline ? 'Server Online' : 'Server Offline'}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
