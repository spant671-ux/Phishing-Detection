import React from 'react'

const Footer = () => {
  return (
    <footer className="border-t border-border py-8 px-6">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <defs>
              <linearGradient id="fg" x1="3" y1="2" x2="21" y2="24">
                <stop offset="0%" stopColor="#6366f1"/>
                <stop offset="100%" stopColor="#8b5cf6"/>
              </linearGradient>
            </defs>
            <path d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" 
                  fill="url(#fg)" opacity="0.7"/>
            <path d="M10 15.5l-3.5-3.5 1.41-1.41L10 12.67l5.59-5.59L17 8.5l-7 7z" 
                  fill="white" opacity="0.7"/>
          </svg>
          <span className="text-sm text-text-secondary">
            PhishGuard v1.0 — AI-Powered Phishing Detection
          </span>
        </div>
        <div className="text-xs text-text-muted">
          Built with React • Express • Ollama/Gemma • Chrome Extension MV3
        </div>
      </div>
    </footer>
  )
}

export default Footer
