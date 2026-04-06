import React from 'react'

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

export default ResultCard
