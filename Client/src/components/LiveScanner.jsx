import React, { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { scanUrl } from '../store/slices/scanSlice'
import ResultCard from './ResultCard'

const LiveScanner = () => {
  const [url, setUrl] = useState('')
  const dispatch = useDispatch()

  const { scanResult: result, scanning, serverOnline } = useSelector((state) => state.scan)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (url.trim()) {
      dispatch(scanUrl(url.trim()))
    }
  }

  const handleQuickTest = (testUrl) => {
    setUrl(testUrl)
    dispatch(scanUrl(testUrl))
  }

  // Example phishing URLs for quick testing
  const testUrls = [
    { label: '🔴 Phishing', url: 'http://paypal-secure-login.suspicious-domain.tk/verify-account' },
    { label: '🟡 Suspicious', url: 'http://192.168.1.1/@google-security-check' },
    { label: '🟢 Safe', url: 'https://www.google.com' },
  ]

  return (
    <section id="scanner" className="py-16 px-6">
      <div className="max-w-3xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-white mb-3">Live URL Scanner</h2>
          <p className="text-sm text-text-secondary">Paste any URL to analyze it for phishing indicators</p>
        </div>

        {/* Scanner Input */}
        <form onSubmit={handleSubmit} className="relative mb-6">
          <div className="flex items-center gap-3 p-2 rounded-2xl bg-bg-card border border-border 
                          focus-within:border-accent/40 focus-within:shadow-[0_0_24px_rgba(99,102,241,0.12)] 
                          transition-all duration-300">
            <div className="pl-3 text-text-muted">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </div>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com — Enter URL to scan"
              className="flex-1 bg-transparent text-white placeholder-text-muted text-sm py-3 outline-none"
              id="url-input"
            />
            <button
              type="submit"
              disabled={scanning || !url.trim()}
              className="px-6 py-3 bg-gradient-to-r from-accent to-purple-500 text-white text-sm font-semibold 
                         rounded-xl transition-all duration-200 hover:shadow-[0_4px_20px_rgba(99,102,241,0.4)] 
                         hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100
                         disabled:hover:shadow-none"
              id="scan-button"
            >
              {scanning ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4" strokeLinecap="round" />
                  </svg>
                  Scanning...
                </span>
              ) : 'Analyze'}
            </button>
          </div>
        </form>

        {/* Quick Test URLs */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          <span className="text-xs text-text-muted font-medium mr-1">Quick test:</span>
          {testUrls.map(t => (
            <button
              key={t.label}
              onClick={() => handleQuickTest(t.url)}
              className="px-3 py-1 text-xs rounded-full bg-bg-card border border-border text-text-secondary 
                         hover:border-accent/30 hover:text-accent-light transition-all cursor-pointer"
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Result Display */}
        {result && <ResultCard result={result} />}

        {/* Server offline warning */}
        {!serverOnline && (
          <div className="mt-6 p-4 rounded-xl bg-warning-bg border border-warning/20 text-sm text-warning flex items-start gap-3">
            <span className="text-lg">⚠️</span>
            <div>
              <strong>Backend server is offline.</strong>
              <p className="text-xs text-warning/70 mt-1">
                Start it with: <code className="bg-black/30 px-2 py-0.5 rounded">cd Server &amp;&amp; npm start</code>
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

export default LiveScanner
