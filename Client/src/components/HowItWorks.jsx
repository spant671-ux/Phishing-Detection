import React from 'react'

const steps = [
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
      </svg>
    ),
    title: 'URL Detection',
    desc: 'Extension monitors every URL you visit in real-time via Chrome tabs API.'
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
    ),
    title: 'Content Extraction',
    desc: 'Content script extracts page text, form fields, and metadata for analysis.'
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
      </svg>
    ),
    title: 'AI + Rules Analysis',
    desc: 'Gemma LLM performs deep analysis while 12+ heuristic rules check URL patterns.'
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z"/>
      </svg>
    ),
    title: 'Decision & Alert',
    desc: 'Combined score (70% AI + 30% rules) determines risk level and triggers warnings.'
  }
]

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-16 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold text-white mb-3">How It Works</h2>
          <p className="text-sm text-text-secondary">Four-stage analysis pipeline for maximum protection</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {steps.map((step, i) => (
            <div key={i} 
                 className="relative p-6 rounded-2xl bg-bg-card border border-border hover:border-accent/20 
                            transition-all duration-300 group hover:shadow-[0_0_30px_rgba(99,102,241,0.08)]
                            animate-fade-in"
                 style={{ animationDelay: `${i * 100}ms` }}>
              {/* Step number */}
              <div className="absolute -top-3 -left-1 text-[60px] font-extrabold text-white/[0.03] leading-none select-none">
                {i + 1}
              </div>

              {/* Icon */}
              <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center 
                              text-accent-light mb-4 group-hover:bg-accent/15 group-hover:scale-105 transition-all duration-300">
                {step.icon}
              </div>

              <h3 className="text-sm font-bold text-white mb-2">{step.title}</h3>
              <p className="text-xs text-text-secondary leading-relaxed">{step.desc}</p>

              {/* Connector arrow (except last) */}
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-3 text-text-muted text-lg">→</div>
              )}
            </div>
          ))}
        </div>

        {/* Scoring formula */}
        <div className="mt-10 p-6 rounded-2xl bg-bg-card border border-border text-center">
          <div className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Decision Formula</div>
          <code className="text-lg text-accent-light font-mono">
            final_score = (0.7 × llm_score) + (0.3 × rule_score)
          </code>
          <div className="flex justify-center gap-8 mt-4 text-xs text-text-muted">
            <span><strong className="text-safe">Safe:</strong> 0-39%</span>
            <span><strong className="text-warning">Suspicious:</strong> 40-69%</span>
            <span><strong className="text-danger">Phishing:</strong> 70-100%</span>
          </div>
        </div>
      </div>
    </section>
  )
}

export default HowItWorks
