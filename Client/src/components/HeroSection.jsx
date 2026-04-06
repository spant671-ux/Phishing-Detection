import React from 'react'

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden py-20 px-6">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl"></div>
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]" 
             style={{
               backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
               backgroundSize: '64px 64px'
             }}></div>
      </div>

      <div className="relative max-w-4xl mx-auto text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent-light text-xs font-medium mb-8 animate-fade-in">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
          </svg>
          Powered by Gemma AI + Heuristic Engine
        </div>

        {/* Main headline */}
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white mb-6 animate-fade-in leading-tight">
          Stop Phishing
          <span className="block bg-gradient-to-r from-accent via-accent-light to-purple-400 bg-clip-text text-transparent">
            Before It Starts
          </span>
        </h1>

        <p className="text-lg text-text-secondary max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-in-delay">
          Real-time AI-powered phishing detection that scans every URL you visit. 
          Combining <strong className="text-text-primary">LLM intelligence</strong> with 
          <strong className="text-text-primary"> rule-based analysis</strong> for comprehensive protection.
        </p>

        {/* Stats row */}
        <div className="flex justify-center gap-8 md:gap-16 animate-fade-in-delay-2">
          {[
            { value: '12+', label: 'Detection Rules' },
            { value: '70/30', label: 'AI/Rule Scoring' },
            { value: '<2s', label: 'Analysis Time' }
          ].map(stat => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-white">{stat.value}</div>
              <div className="text-xs text-text-muted mt-1 font-medium">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default HeroSection
