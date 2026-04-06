import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { scanUrl } from '../store/slices/scanSlice';

const ScanModal = ({ isOpen, onClose }) => {
  const [url, setUrl] = useState('');
  const dispatch = useDispatch();
  const { scanning, scanResult } = useSelector((state) => state.scan);

  const handleScan = () => {
    if (!url.trim()) return;
    dispatch(scanUrl(url.trim()));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleScan();
  };

  if (!isOpen) return null;

  const result = scanResult;
  const getStatusColor = (level) => {
    if (level === 'phishing') return '#c0504e';
    if (level === 'suspicious') return '#c98a4b';
    if (level === 'safe') return '#6a9a6e';
    return '#6b6058';
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg mx-4 rounded-lg p-8 relative border shadow-2xl" style={{ background: '#222230', borderColor: 'rgba(192,110,90,0.15)' }} onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 material-symbols-outlined text-[#6b6058] hover:text-[#e8e0d4] transition-colors cursor-pointer">close</button>

        <div className="flex items-center gap-3 mb-6">
          <span className="material-symbols-outlined text-[#c06050] text-2xl">radar</span>
          <h2 style={{ fontFamily: "'IBM Plex Sans', sans-serif" }} className="text-xl font-bold text-[#e8e0d4] tracking-wide">Deep Scan</h2>
        </div>

        <div className="flex gap-3 mb-6">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter URL to scan (e.g. https://example.com)"
            className="flex-1 rounded-md px-4 py-3 text-sm text-[#e8e0d4] placeholder-[#6b6058]/50 focus:outline-none transition-all"
            style={{ background: '#1a1a22', border: '1px solid rgba(192,110,90,0.15)', fontFamily: "'IBM Plex Mono', monospace" }}
          />
          <button
            onClick={handleScan}
            disabled={scanning || !url.trim()}
            className="px-6 py-3 rounded-md font-bold text-xs uppercase tracking-widest transition-all active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed text-[#f0ebe3]"
            style={{ background: '#c06050', fontFamily: "'IBM Plex Sans', sans-serif" }}
          >
            {scanning ? 'Scanning...' : 'Scan'}
          </button>
        </div>

        {scanning && (
          <div className="text-center py-8">
            <span className="material-symbols-outlined text-[#c06050] text-5xl animate-spin block mb-3">radar</span>
            <p className="text-[#9a8e80] text-sm" style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>Analyzing URL...</p>
          </div>
        )}

        {result && !scanning && (
          <div className="mt-2 p-5 rounded-md" style={{ background: '#1a1a22', border: '1px solid rgba(192,110,90,0.1)' }}>
            <div className="flex items-center gap-3 mb-4">
              <span className="material-symbols-outlined text-3xl" style={{ color: getStatusColor(result.risk_level) }}>
                {result.risk_level === 'phishing' ? 'gpp_bad' : result.risk_level === 'suspicious' ? 'warning' : result.risk_level === 'safe' ? 'verified_user' : 'error'}
              </span>
              <div>
                <p className="font-bold text-lg tracking-wider" style={{ color: getStatusColor(result.risk_level), fontFamily: "'IBM Plex Sans', sans-serif" }}>
                  {(result.risk_level || 'unknown').toUpperCase()}
                </p>
                <p className="text-[#6b6058] text-xs truncate max-w-xs" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{result.url}</p>
              </div>
              <span className="ml-auto text-3xl font-bold text-[#e8e0d4]" style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>{result.final_score}%</span>
            </div>
            <div className="h-2 w-full rounded-full overflow-hidden mb-4" style={{ background: 'rgba(192,110,90,0.1)' }}>
              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${result.final_score}%`, background: `linear-gradient(90deg, #c06050, ${getStatusColor(result.risk_level)})` }}></div>
            </div>
            {result.reasons && result.reasons.length > 0 && (
              <div className="space-y-1.5">
                {result.reasons.slice(0, 5).map((r, i) => (
                  <p key={i} className="text-xs text-[#9a8e80] flex items-start gap-2">
                    <span className="text-[#c06050] mt-0.5">•</span> {r}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ScanModal;
