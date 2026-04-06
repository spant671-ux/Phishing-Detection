import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { checkServerHealth } from '../store/slices/scanSlice';
import Navbar from '../components/Navbar';

const f = { fontFamily: "'IBM Plex Sans', sans-serif" };
const fm = { fontFamily: "'IBM Plex Mono', monospace" };

const SettingsPage = () => {
  const dispatch = useDispatch();
  const { serverOnline } = useSelector((s) => s.scan);

  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('phishguard_settings');
    return saved ? JSON.parse(saved) : {
      autoScan: true, notifications: true, blockPhishing: true,
      llmWeight: 70, ruleWeight: 30, phishingThreshold: 70, suspiciousThreshold: 40,
      serverUrl: import.meta.env.VITE_API_URL || 'http://localhost:5000',
      historyLimit: 200,
    };
  });

  const [saved, setSaved] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);

  useEffect(() => { dispatch(checkServerHealth()); }, [dispatch]);

  const updateSetting = (key, value) => { setSettings(prev => ({ ...prev, [key]: value })); setSaved(false); };

  const saveSettings = () => {
    localStorage.setItem('phishguard_settings', JSON.stringify(settings));
    setSaved(true); setTimeout(() => setSaved(false), 2500);
  };

  const resetSettings = () => {
    const defaults = { autoScan: true, notifications: true, blockPhishing: true, llmWeight: 70, ruleWeight: 30, phishingThreshold: 70, suspiciousThreshold: 40, serverUrl: import.meta.env.VITE_API_URL || 'http://localhost:5000', historyLimit: 200 };
    setSettings(defaults); localStorage.setItem('phishguard_settings', JSON.stringify(defaults));
    setSaved(true); setTimeout(() => setSaved(false), 2500);
  };

  const testConnection = async () => { setTestingConnection(true); await dispatch(checkServerHealth()); setTimeout(() => setTestingConnection(false), 1000); };

  const Toggle = ({ checked, onChange }) => (
    <button onClick={() => onChange(!checked)} className={`relative w-11 h-6 rounded-full transition-all cursor-pointer ${checked ? 'bg-[#c06050]' : 'bg-[#353540]'}`}>
      <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-[#f0ebe3] transition-all shadow-md ${checked ? 'left-[22px]' : 'left-0.5'}`}></div>
    </button>
  );

  const Slider = ({ value, onChange, min, max, label, color = '#c06050' }) => (
    <div>
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs text-[#9a8e80] uppercase tracking-widest" style={f}>{label}</span>
        <span className="text-sm font-bold" style={{ ...fm, color }}>{value}%</span>
      </div>
      <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
        style={{ background: `linear-gradient(to right, ${color} ${((value - min) / (max - min)) * 100}%, #353540 0%)` }} />
    </div>
  );

  return (
    <div className="min-h-screen pb-20 text-[#e8e0d4]">
      <Navbar />
      <main className="pt-28 pb-20 px-4 md:px-12 max-w-3xl mx-auto">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h2 className="text-4xl font-extrabold tracking-tight" style={f}>Settings</h2>
            <p className="text-[#9a8e80] text-sm mt-1">Configure PhishGuard defense parameters</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={resetSettings} className="border border-[#6b6058]/20 text-[#9a8e80] px-4 py-2 rounded-md font-bold text-xs uppercase tracking-widest hover:text-[#e8e0d4] transition-all cursor-pointer" style={f}>Reset</button>
            <button onClick={saveSettings} className="px-5 py-2 rounded-md font-bold text-xs uppercase tracking-widest transition-all active:scale-95 cursor-pointer flex items-center gap-2 text-[#f0ebe3]" style={{ ...f, background: '#c06050' }}>
              {saved ? <><span className="material-symbols-outlined text-sm">check</span> Saved</> : <><span className="material-symbols-outlined text-sm">save</span> Save</>}
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Server Connection */}
          <section className="glass-panel rounded-lg p-6 border-l-4 border-l-[#c06050]/40">
            <div className="flex items-center gap-2 mb-5">
              <span className="material-symbols-outlined text-[#c06050]">dns</span>
              <h3 className="text-lg font-bold" style={f}>Server Connection</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-[#9a8e80] uppercase tracking-widest block mb-2" style={f}>API Server URL</label>
                <div className="flex gap-3">
                  <input type="url" value={settings.serverUrl} onChange={(e) => updateSetting('serverUrl', e.target.value)}
                    className="flex-1 rounded-md px-4 py-2.5 text-sm text-[#e8e0d4] placeholder-[#6b6058]/50 focus:outline-none transition-all"
                    style={{ ...fm, background: '#1a1a22', border: '1px solid rgba(192,110,90,0.15)' }} />
                  <button onClick={testConnection} disabled={testingConnection}
                    className="px-4 py-2.5 border border-[#6a9a6e]/30 text-[#6a9a6e] rounded-md font-bold text-xs uppercase tracking-widest hover:bg-[#6a9a6e]/5 transition-all cursor-pointer disabled:opacity-40" style={f}>
                    {testingConnection ? 'Testing...' : 'Test'}
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-md" style={{ background: '#1a1a22' }}>
                <span className={`w-2.5 h-2.5 rounded-full ${serverOnline ? 'bg-[#6a9a6e]' : 'bg-[#c0504e]'}`}></span>
                <span className="text-sm" style={{ ...f, color: serverOnline ? '#6a9a6e' : '#c0504e' }}>
                  {serverOnline ? 'Server Online' : 'Server Offline'}
                </span>
              </div>
            </div>
          </section>

          {/* Protection */}
          <section className="glass-panel rounded-lg p-6 border-l-4 border-l-[#6a9a6e]/40">
            <div className="flex items-center gap-2 mb-5">
              <span className="material-symbols-outlined text-[#6a9a6e]">shield</span>
              <h3 className="text-lg font-bold" style={f}>Protection</h3>
            </div>
            <div className="space-y-5">
              {[
                { key: 'autoScan', title: 'Auto-Scan New Tabs', desc: 'Automatically analyze URLs when opening new pages' },
                { key: 'blockPhishing', title: 'Block Phishing Pages', desc: 'Automatically block confirmed phishing URLs' },
                { key: 'notifications', title: 'Desktop Notifications', desc: 'Show alerts when threats are detected' },
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[#e8e0d4]" style={f}>{item.title}</p>
                    <p className="text-[10px] text-[#6b6058]">{item.desc}</p>
                  </div>
                  <Toggle checked={settings[item.key]} onChange={(v) => updateSetting(item.key, v)} />
                </div>
              ))}
            </div>
          </section>

          {/* Analysis Engine */}
          <section className="glass-panel rounded-lg p-6 border-l-4 border-l-[#c98a4b]/40">
            <div className="flex items-center gap-2 mb-5">
              <span className="material-symbols-outlined text-[#c98a4b]">psychology</span>
              <h3 className="text-lg font-bold" style={f}>Analysis Engine</h3>
            </div>
            <div className="space-y-6">
              <Slider value={settings.llmWeight} onChange={(v) => { updateSetting('llmWeight', v); updateSetting('ruleWeight', 100 - v); }} min={0} max={100} label="LLM AI Weight" color="#c06050" />
              <Slider value={settings.ruleWeight} onChange={(v) => { updateSetting('ruleWeight', v); updateSetting('llmWeight', 100 - v); }} min={0} max={100} label="Rule Engine Weight" color="#6a9a6e" />
              <div className="h-px" style={{ background: 'rgba(192,110,90,0.08)' }}></div>
              <Slider value={settings.phishingThreshold} onChange={(v) => updateSetting('phishingThreshold', v)} min={50} max={95} label="Phishing Threshold" color="#c0504e" />
              <Slider value={settings.suspiciousThreshold} onChange={(v) => updateSetting('suspiciousThreshold', v)} min={20} max={60} label="Suspicious Threshold" color="#c98a4b" />
            </div>
          </section>

          {/* Data & Privacy */}
          <section className="glass-panel rounded-lg p-6 border-l-4 border-l-[#c0504e]/40">
            <div className="flex items-center gap-2 mb-5">
              <span className="material-symbols-outlined text-[#c0504e]">database</span>
              <h3 className="text-lg font-bold" style={f}>Data & Privacy</h3>
            </div>
            <div className="space-y-4">
              <Slider value={settings.historyLimit} onChange={(v) => updateSetting('historyLimit', v)} min={50} max={500} label="History Limit" color="#c0504e" />
              <button onClick={() => { localStorage.removeItem('phishguard_settings'); window.location.reload(); }}
                className="w-full mt-2 border border-[#c0504e]/20 text-[#c0504e] px-4 py-3 rounded-md font-bold text-xs uppercase tracking-widest hover:bg-[#c0504e]/5 transition-all cursor-pointer" style={f}>
                Clear All Local Data
              </button>
            </div>
          </section>

          {/* About */}
          <section className="glass-panel rounded-lg p-6 text-center">
            <span className="material-symbols-outlined text-[#c06050] text-3xl mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>security</span>
            <h3 className="text-lg font-bold text-[#c06050] tracking-wider uppercase" style={f}>PhishGuard</h3>
            <p className="text-[#6b6058] text-xs mt-1">v1.0.0 — AI-Powered Phishing Detection</p>
            <p className="text-[#6b6058]/50 text-[10px] mt-1" style={fm}>Built with Gemma + Rule Engine</p>
          </section>
        </div>
      </main>
    </div>
  );
};

export default SettingsPage;
