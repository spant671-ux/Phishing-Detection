import React, { useState } from 'react'

const LiveScanner = ({ onScan, result, scanning, serverOnline }) => {
  const [url, setUrl] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (url.trim()) {
      onScan(url.trim())
    }
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
              onClick={() => { setUrl(t.url); onScan(t.url); }}
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

// --------------- Result Card ---------------
const ResultCard = ({ result }) => {
  const isPhishing = result.risk_level === 'phishing'
  const isSuspicious = result.risk_level === 'suspicious'
  const isSafe = result.risk_level === 'safe'
  const isError = result.risk_level === 'error' || result.error

  let config;
  if (isPhishing) {
    config = {
      icon: '🚨', label: 'PHISHING DETECTED', desc: 'This URL is highly likely a phishing page.',
      borderColor: 'border-danger/30', bgColor: 'bg-danger-bg', textColor: 'text-danger',
      barColor: 'bg-gradient-to-r from-red-500 to-red-400', glowColor: 'shadow-[0_0_24px_rgba(255,68,68,0.15)]'
    }
  } else if (isSuspicious) {
    config = {
      icon: '⚠️', label: 'SUSPICIOUS', desc: 'This URL shows some suspicious characteristics.',
      borderColor: 'border-warning/30', bgColor: 'bg-warning-bg', textColor: 'text-warning',
      barColor: 'bg-gradient-to-r from-amber-500 to-orange-400', glowColor: 'shadow-[0_0_24px_rgba(255,152,0,0.15)]'
    }
  } else if (isError) {
    config = {
      icon: '❌', label: 'SCAN ERROR', desc: 'Could not complete the analysis.',
      borderColor: 'border-border', bgColor: 'bg-bg-card', textColor: 'text-text-secondary',
      barColor: 'bg-gray-600', glowColor: ''
    }
  } else {
    config = {
      icon: '✅', label: 'SAFE', desc: 'No phishing indicators detected.',
      borderColor: 'border-safe/30', bgColor: 'bg-safe-bg', textColor: 'text-safe',
      barColor: 'bg-gradient-to-r from-green-500 to-emerald-400', glowColor: 'shadow-[0_0_24px_rgba(76,175,80,0.15)]'
    }
  }

  return (
    <div className={`rounded-2xl p-6 border ${config.borderColor} ${config.bgColor} ${config.glowColor} 
                      transition-all duration-500 animate-fade-in`}>
      {/* Status header */}
      <div className="flex items-center gap-4 mb-6">
        <span className="text-4xl">{config.icon}</span>
        <div>
          <div className={`text-lg font-bold ${config.textColor} tracking-wide`}>{config.label}</div>
          <div className="text-sm text-text-secondary">{config.desc}</div>
        </div>
      </div>

      {/* Score visualization */}
      {!isError && (
        <div className="mb-6">
          <div className="flex justify-between items-end mb-2">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Risk Score</span>
            <span className="text-3xl font-extrabold text-white">{result.final_score}%</span>
          </div>
          <div className="h-3 bg-bg-primary rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full ${config.barColor} transition-all duration-1000 ease-out`}
              style={{ width: `${result.final_score}%` }}
            ></div>
          </div>
          {/* Sub-scores */}
          <div className="flex gap-6 mt-3">
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <span className="text-sm">🤖</span>
              <span>LLM: <strong className="text-text-primary">{result.llm_score || 0}%</strong></span>
            </div>
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <span className="text-sm">📏</span>
              <span>Rules: <strong className="text-text-primary">{result.rule_score || 0}%</strong></span>
            </div>
            {result.llm_available === false && (
              <div className="flex items-center gap-1 text-xs text-warning">
                <span>⚡</span> LLM offline
              </div>
            )}
            {result.cached && (
              <div className="flex items-center gap-1 text-xs text-accent-light">
                <span>💾</span> Cached
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reasons */}
      {result.reasons && result.reasons.length > 0 && (
        <div className="border-t border-white/5 pt-4">
          <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Analysis Details</h4>
          <ul className="space-y-2">
            {result.reasons.map((reason, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                <span className="text-accent-light mt-0.5 text-xs">▸</span>
                {reason}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* URL */}
      <div className="mt-4 pt-3 border-t border-white/5 flex items-center gap-2 text-xs text-text-muted overflow-hidden">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
        </svg>
        <span className="truncate">{result.url}</span>
      </div>
    </div>
  )
}

export default LiveScanner
