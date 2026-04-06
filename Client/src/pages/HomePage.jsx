import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { checkServerHealth, loadHistory, loadStats } from '../store/slices/scanSlice';
import Navbar from '../components/Navbar';
import ScanModal from '../components/ScanModal';

const f = { fontFamily: "'IBM Plex Sans', sans-serif" };
const fm = { fontFamily: "'IBM Plex Mono', monospace" };

const HomePage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { history: rawHistory, stats: rawStats, serverOnline } = useSelector((state) => state.scan);
  const history = Array.isArray(rawHistory) ? rawHistory : [];
  const stats = rawStats || { total: 0, phishing: 0, suspicious: 0, safe: 0 };
  const [scanModalOpen, setScanModalOpen] = useState(false);
  const [expandedDetail, setExpandedDetail] = useState(null);

  useEffect(() => {
    dispatch(checkServerHealth());
    dispatch(loadHistory());
    dispatch(loadStats());
    const interval = setInterval(() => { dispatch(loadHistory()); dispatch(loadStats()); }, 10000);
    return () => clearInterval(interval);
  }, [dispatch]);

  const exportCSV = () => {
    if (history.length === 0) return;
    const headers = 'Timestamp,URL,Risk Level,Score,Reasons\n';
    const rows = history.map(h =>
      `"${h.timestamp}","${h.url}","${h.risk_level}",${h.final_score},"${(h.reasons || []).join('; ')}"`
    ).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `phishguard-audit-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  const getColor = (level) => {
    if (level === 'phishing') return '#c0504e';
    if (level === 'suspicious') return '#c98a4b';
    return '#6a9a6e';
  };

  return (
    <div className="min-h-screen pb-20 text-[#e8e0d4]">
      <Navbar />
      <ScanModal isOpen={scanModalOpen} onClose={() => setScanModalOpen(false)} />

      <main className="pt-28 pb-20 px-4 md:px-12 max-w-7xl mx-auto">
        {/* Main Status Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-12">
          {/* Active Defense Card */}
          <div className="lg:col-span-8 relative overflow-hidden rounded-lg p-8 border border-[#c06050]/12" style={{ background: '#222230' }}>
            <div className="pulse-scanner"></div>
            <div className="flex flex-col h-full justify-between gap-12 relative z-10">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: serverOnline ? '#6a9a6e' : '#c98a4b' }}></span>
                  <span className="text-xs font-bold uppercase tracking-widest" style={{ ...f, color: serverOnline ? '#6a9a6e' : '#c98a4b' }}>
                    {serverOnline ? 'Live Protection Engine' : 'Engine Offline'}
                  </span>
                </div>
                <h2 className="text-4xl md:text-5xl font-extrabold text-[#e8e0d4] tracking-tight leading-tight" style={f}>
                  System Status: <br/>
                  <span style={{ color: serverOnline ? '#6a9a6e' : '#c98a4b' }}>
                    {serverOnline ? 'Active Defense' : 'Server Offline'}
                  </span>
                </h2>
              </div>
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={() => setScanModalOpen(true)}
                  className="px-6 py-3 rounded-md font-bold text-xs uppercase tracking-widest transition-all active:scale-95 cursor-pointer flex items-center gap-2 text-[#f0ebe3]"
                  style={{ ...f, background: '#c06050' }}
                >
                  <span className="material-symbols-outlined text-sm">radar</span> Run Deep Scan
                </button>
                <button
                  onClick={() => navigate('/reports')}
                  className="px-6 py-3 rounded-md font-bold text-xs uppercase tracking-widest transition-all cursor-pointer flex items-center gap-2 text-[#c06050] border border-[#c06050]/30 hover:bg-[#c06050]/5"
                  style={f}
                >
                  <span className="material-symbols-outlined text-sm">description</span> View Shield Logs
                </button>
              </div>
            </div>
            <div className="absolute top-8 right-8 opacity-[0.04] z-0">
              <span className="material-symbols-outlined text-[140px]" style={{ fontVariationSettings: "'wght' 200" }}>shield</span>
            </div>
          </div>

          {/* Metrics Cards */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="glass-panel rounded-lg p-6 flex flex-col justify-between border-l-4 border-l-[#c06050]/40 h-1/2">
              <span className="material-symbols-outlined text-[#c06050]/50 mb-2">radar</span>
              <div>
                <p className="text-[10px] font-bold text-[#9a8e80] uppercase tracking-widest" style={f}>Total URLs Scanned</p>
                <p className="text-4xl font-bold text-[#e8e0d4] tabular-nums" style={f}>{(stats.total || 0).toLocaleString()}</p>
              </div>
            </div>
            <div className="glass-panel rounded-lg p-6 flex flex-col justify-between border-l-4 border-l-[#c0504e]/40 h-1/2">
              <span className="material-symbols-outlined text-[#c0504e]/50 mb-2">gpp_maybe</span>
              <div>
                <p className="text-[10px] font-bold text-[#9a8e80] uppercase tracking-widest" style={f}>Malicious Links Blocked</p>
                <p className="text-4xl font-bold text-[#c0504e] tabular-nums" style={f}>{(stats.phishing || 0).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Threats Table */}
        <section className="space-y-6">
          <div className="flex justify-between items-end px-2">
            <div>
              <h3 className="text-2xl font-bold text-[#e8e0d4]" style={f}>Recent Threats Blocked</h3>
              <p className="text-[#9a8e80] text-sm">Real-time neural network detection analysis</p>
            </div>
            <button onClick={exportCSV} className="text-xs font-bold uppercase tracking-widest text-[#c06050] hover:text-[#d4786a] transition-colors flex items-center gap-1 cursor-pointer" style={f}>
              Export Full Audit <span className="material-symbols-outlined text-sm">download</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-lg glass-panel">
            <table className="w-full text-left border-collapse">
              <thead style={{ background: 'rgba(42,40,50,0.8)' }}>
                <tr>
                  {['Timestamp', 'Target Domain / Vector', 'Threat Score', 'Action Taken', 'Details'].map(h => (
                    <th key={h} className="p-5 text-[10px] font-bold uppercase tracking-widest text-[#9a8e80]" style={f}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#c06050]/5">
                {history.slice(0, 5).map((item, index) => {
                  let domain = 'Unknown Domain';
                  try { domain = new URL(item.url).hostname; } catch {}
                  const color = getColor(item.risk_level);
                  return (
                    <React.Fragment key={index}>
                      <tr className="hover:bg-white/[0.02] transition-colors">
                        <td className="p-5 text-xs text-[#9a8e80]" style={fm}>{new Date(item.timestamp).toLocaleString()}</td>
                        <td className="p-5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded flex items-center justify-center" style={{ background: color + '15', color }}>
                              <span className="material-symbols-outlined text-sm">
                                {item.risk_level === 'phishing' ? 'link_off' : item.risk_level === 'suspicious' ? 'warning' : 'verified_user'}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-[#e8e0d4]" style={f}>{domain}</p>
                              <p className="text-[10px] text-[#6b6058] uppercase tracking-wider" style={fm}>
                                {item.risk_level === 'phishing' ? "PHISHING VECTOR IDENTIFIED" : item.risk_level === 'suspicious' ? "SUSPICIOUS ACTIVITY" : "SAFE — NO THREATS"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="p-5">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-16 rounded-full overflow-hidden" style={{ background: 'rgba(192,110,90,0.1)' }}>
                              <div className="h-full rounded-full" style={{ width: `${item.final_score || 0}%`, background: color }}></div>
                            </div>
                            <span className="text-xs font-bold" style={{ ...fm, color }}>{item.final_score || 0}%</span>
                          </div>
                        </td>
                        <td className="p-5">
                          <span className="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest border" style={{ color, borderColor: color + '30', background: color + '10', ...fm }}>
                            {item.risk_level === 'phishing' ? 'AUTO-BLOCKED' : item.risk_level === 'suspicious' ? 'FLAGGED' : 'CLEARED'}
                          </span>
                        </td>
                        <td className="p-5">
                          <button onClick={() => setExpandedDetail(expandedDetail === index ? null : index)} className="material-symbols-outlined text-[#6b6058] hover:text-[#e8e0d4] transition-colors cursor-pointer">
                            {expandedDetail === index ? 'expand_less' : 'info'}
                          </button>
                        </td>
                      </tr>
                      {expandedDetail === index && (
                        <tr><td colSpan="5" className="p-5" style={{ background: '#1a1a22' }}>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <p className="text-[10px] text-[#c06050] uppercase tracking-widest font-bold mb-2" style={f}>Full URL</p>
                              <p className="text-xs text-[#9a8e80] break-all" style={fm}>{item.url}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-[#c06050] uppercase tracking-widest font-bold mb-2" style={f}>Score Sources</p>
                              <p className="text-xs text-[#9a8e80]" style={fm}>LLM: {item.llm_score || 0}% · Rules: {item.rule_score || 0}%</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-[#c06050] uppercase tracking-widest font-bold mb-2" style={f}>Reasons</p>
                              {item.reasons?.length > 0 ? item.reasons.map((r, ri) => (
                                <p key={ri} className="text-xs text-[#9a8e80] mb-1">• {r}</p>
                              )) : <p className="text-xs text-[#6b6058]">No details.</p>}
                            </div>
                          </div>
                        </td></tr>
                      )}
                    </React.Fragment>
                  );
                })}
                {history.length === 0 && (
                  <tr><td colSpan="5" className="p-12 text-center text-[#6b6058] text-sm" style={f}>
                    <span className="material-symbols-outlined text-4xl text-[#c06050]/20 block mb-3">shield</span>
                    No threats detected yet. Scan a URL to begin monitoring.
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
          {history.length > 5 && (
            <div className="text-center">
              <button onClick={() => navigate('/reports')} className="text-xs font-bold uppercase tracking-widest text-[#c06050] hover:text-[#d4786a] cursor-pointer flex items-center gap-1 mx-auto" style={f}>
                View All {history.length} Entries <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default HomePage;
