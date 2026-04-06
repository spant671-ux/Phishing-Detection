import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loadHistory, loadStats } from '../store/slices/scanSlice';
import Navbar from '../components/Navbar';

const f = { fontFamily: "'IBM Plex Sans', sans-serif" };
const fm = { fontFamily: "'IBM Plex Mono', monospace" };

const ReportsPage = () => {
  const dispatch = useDispatch();
  const { history: rawHistory, stats: rawStats } = useSelector((s) => s.scan);
  const history = Array.isArray(rawHistory) ? rawHistory : [];
  const stats = rawStats || { total: 0, phishing: 0, suspicious: 0, safe: 0 };
  const [expandedRow, setExpandedRow] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    dispatch(loadHistory()); dispatch(loadStats());
    const iv = setInterval(() => { dispatch(loadHistory()); dispatch(loadStats()); }, 10000);
    return () => clearInterval(iv);
  }, [dispatch]);

  const filtered = filter === 'all' ? history : history.filter(h => h.risk_level === filter);

  const exportCSV = () => {
    if (history.length === 0) return;
    const headers = 'Timestamp,URL,Risk Level,Score,LLM Score,Rule Score,Reasons\n';
    const rows = history.map(h =>
      `"${h.timestamp}","${h.url}","${h.risk_level}",${h.final_score},${h.llm_score || 0},${h.rule_score || 0},"${(h.reasons || []).join('; ')}"`
    ).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `phishguard-report-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
  };

  const getColor = (level) => {
    if (level === 'phishing') return '#c0504e';
    if (level === 'suspicious') return '#c98a4b';
    return '#6a9a6e';
  };

  return (
    <div className="min-h-screen pb-20 text-[#e8e0d4]">
      <Navbar />
      <main className="pt-28 pb-20 px-4 md:px-12 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-10">
          <div>
            <h2 className="text-4xl font-extrabold tracking-tight" style={f}>Threat Reports</h2>
            <p className="text-[#9a8e80] text-sm mt-1">Complete audit trail of all scanned URLs</p>
          </div>
          <button onClick={exportCSV} className="px-5 py-2.5 rounded-md font-bold text-xs uppercase tracking-widest transition-all active:scale-95 cursor-pointer flex items-center gap-2 text-[#f0ebe3]" style={{ ...f, background: '#c06050' }}>
            <span className="material-symbols-outlined text-sm">download</span> Export CSV
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { label: 'Total Scanned', value: stats.total, icon: 'radar', color: '#c06050' },
            { label: 'Phishing', value: stats.phishing, icon: 'gpp_bad', color: '#c0504e' },
            { label: 'Suspicious', value: stats.suspicious, icon: 'warning', color: '#c98a4b' },
            { label: 'Safe', value: stats.safe, icon: 'verified_user', color: '#6a9a6e' },
          ].map((s, i) => (
            <div key={i} className="glass-panel rounded-lg p-5 border-l-4 cursor-pointer hover:bg-white/[0.02] transition-all" style={{ borderLeftColor: s.color + '60' }}
              onClick={() => setFilter(i === 0 ? 'all' : i === 1 ? 'phishing' : i === 2 ? 'suspicious' : 'safe')}>
              <span className="material-symbols-outlined text-lg mb-1" style={{ color: s.color + '80' }}>{s.icon}</span>
              <p className="text-[10px] font-bold text-[#9a8e80] uppercase tracking-widest" style={f}>{s.label}</p>
              <p className="text-3xl font-bold tabular-nums" style={{ ...f, color: s.color }}>{(s.value || 0).toLocaleString()}</p>
            </div>
          ))}
        </div>

        {filter !== 'all' && (
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs text-[#9a8e80] uppercase tracking-widest" style={f}>Filtering: <strong className="text-[#e8e0d4]">{filter}</strong></span>
            <button onClick={() => setFilter('all')} className="text-xs text-[#c06050] hover:text-[#d4786a] cursor-pointer uppercase tracking-widest" style={f}>Clear</button>
          </div>
        )}

        <div className="overflow-x-auto rounded-lg glass-panel">
          <table className="w-full text-left border-collapse">
            <thead style={{ background: 'rgba(42,40,50,0.8)' }}>
              <tr>
                {['Timestamp', 'URL', 'Risk Level', 'Score', 'LLM', 'Rules', ''].map(h => (
                  <th key={h} className="p-4 text-[10px] font-bold uppercase tracking-widest text-[#9a8e80]" style={f}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#c06050]/5">
              {filtered.map((item, index) => {
                let domain = item.url || 'Unknown'; try { domain = new URL(item.url).hostname; } catch {}
                const color = getColor(item.risk_level);
                return (
                  <React.Fragment key={index}>
                    <tr className="hover:bg-white/[0.02] transition-colors cursor-pointer" onClick={() => setExpandedRow(expandedRow === index ? null : index)}>
                      <td className="p-4 text-xs text-[#9a8e80]" style={fm}>{new Date(item.timestamp).toLocaleString()}</td>
                      <td className="p-4">
                        <p className="text-sm font-medium text-[#e8e0d4] truncate max-w-[280px]" style={f}>{domain}</p>
                        <p className="text-[10px] text-[#6b6058] truncate max-w-[280px]" style={fm}>{item.url}</p>
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest border" style={{ color, borderColor: color + '30', background: color + '10', ...fm }}>
                          {item.risk_level}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-12 rounded-full overflow-hidden" style={{ background: 'rgba(192,110,90,0.1)' }}>
                            <div className="h-full rounded-full" style={{ width: `${item.final_score || 0}%`, background: color }}></div>
                          </div>
                          <span className="text-xs font-bold" style={{ ...fm, color }}>{item.final_score || 0}%</span>
                        </div>
                      </td>
                      <td className="p-4 text-xs text-[#c06050]" style={fm}>{item.llm_score || 0}%</td>
                      <td className="p-4 text-xs text-[#6a9a6e]" style={fm}>{item.rule_score || 0}%</td>
                      <td className="p-4"><span className="material-symbols-outlined text-[#6b6058] text-sm">{expandedRow === index ? 'expand_less' : 'expand_more'}</span></td>
                    </tr>
                    {expandedRow === index && (
                      <tr><td colSpan="7" className="p-5" style={{ background: '#1a1a22' }}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h4 className="text-xs font-bold uppercase tracking-widest text-[#c06050] mb-3" style={f}>Analysis Details</h4>
                            {item.reasons?.length > 0 ? (
                              <ul className="space-y-1.5">{item.reasons.map((r, ri) => (
                                <li key={ri} className="text-xs text-[#9a8e80] flex items-start gap-2"><span className="text-[#c06050] mt-0.5">•</span> {r}</li>
                              ))}</ul>
                            ) : <p className="text-xs text-[#6b6058]">No details available.</p>}
                          </div>
                          <div>
                            <h4 className="text-xs font-bold uppercase tracking-widest text-[#6a9a6e] mb-3" style={f}>Score Breakdown</h4>
                            <div className="space-y-3">
                              {[
                                { label: 'LLM AI Score', value: item.llm_score || 0, color: '#c06050' },
                                { label: 'Rule Engine Score', value: item.rule_score || 0, color: '#6a9a6e' },
                                { label: 'Final Combined', value: item.final_score || 0, color }
                              ].map((s, si) => (
                                <div key={si}>
                                  <div className="flex justify-between text-xs text-[#6b6058] mb-1"><span>{s.label}</span><span>{s.value}%</span></div>
                                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(192,110,90,0.08)' }}>
                                    <div className="h-full rounded-full" style={{ width: `${s.value}%`, background: s.color }}></div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </td></tr>
                    )}
                  </React.Fragment>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan="7" className="p-16 text-center text-[#6b6058] text-sm" style={f}>
                  <span className="material-symbols-outlined text-5xl text-[#c06050]/15 block mb-3">search_off</span>
                  {filter !== 'all' ? `No ${filter} results found.` : 'No scan history yet.'}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
};

export default ReportsPage;
