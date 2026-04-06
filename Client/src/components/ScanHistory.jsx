import React from 'react'
import { useSelector } from 'react-redux'

const ScanHistory = () => {
  const history = useSelector((state) => state.scan.history)

  if (!history || history.length === 0) return null

  const getRiskConfig = (level) => {
    switch (level) {
      case 'phishing': return { icon: '🚨', color: 'text-danger', bg: 'bg-danger/10', border: 'border-danger/20' }
      case 'suspicious': return { icon: '⚠️', color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/20' }
      default: return { icon: '✅', color: 'text-safe', bg: 'bg-safe/10', border: 'border-safe/20' }
    }
  }

  const formatTime = (ts) => {
    if (!ts) return ''
    try {
      const d = new Date(ts)
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } catch { return '' }
  }

  const truncate = (url) => {
    if (!url) return 'Unknown'
    return url.length > 60 ? url.slice(0, 57) + '...' : url
  }

  return (
    <section id="history" className="py-16 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-white mb-3">Scan History</h2>
          <p className="text-sm text-text-secondary">Recent URL scans and their results</p>
        </div>

        <div className="space-y-2">
          {history.slice(0, 15).map((item, i) => {
            const cfg = getRiskConfig(item.risk_level)
            return (
              <div key={i} 
                   className={`flex items-center gap-4 p-4 rounded-xl bg-bg-card border border-border 
                              hover:border-accent/20 hover:bg-bg-hover transition-all duration-200 group
                              animate-fade-in`}
                   style={{ animationDelay: `${i * 40}ms` }}>
                {/* Risk icon */}
                <span className="text-xl">{cfg.icon}</span>

                {/* URL & details */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-text-primary truncate group-hover:text-white transition-colors">
                    {truncate(item.url)}
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className={`text-xs font-semibold ${cfg.color} uppercase`}>
                      {item.risk_level || 'safe'}
                    </span>
                    <span className="text-xs text-text-muted">
                      {formatTime(item.timestamp)}
                    </span>
                  </div>
                </div>

                {/* Score badge */}
                <div className={`px-3 py-1 rounded-lg text-xs font-bold ${cfg.bg} ${cfg.color} border ${cfg.border}`}>
                  {item.final_score || 0}%
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default ScanHistory
