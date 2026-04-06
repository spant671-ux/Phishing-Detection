/**
 * PhishGuard - Extension Popup Dashboard
 * ----------------------------------------
 * Standalone popup UI (no build step required for extension).
 * Shows current URL risk, confidence score, reasons, and scan toggle.
 */

// --------------- State ---------------
let state = {
  scanningEnabled: true,
  currentResult: null,
  status: 'idle', // idle | scanning | complete | error
  history: [],
  darkMode: true, // Dark mode by default
  activeTab: 'dashboard' // dashboard | history
};

// --------------- Initialization ---------------
document.addEventListener('DOMContentLoaded', async () => {
  // Load scanning state
  chrome.runtime.sendMessage({ type: 'GET_SCANNING_STATE' }, (response) => {
    if (response) {
      state.scanningEnabled = response.scanningEnabled;
    }
    render();
  });

  // Get current tab and check status
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab && tab.url && !tab.url.startsWith('chrome://')) {
    state.status = 'scanning';
    render();

    chrome.runtime.sendMessage({ type: 'GET_STATUS', url: tab.url }, (response) => {
      if (response && response.result) {
        state.currentResult = response.result;
        state.status = 'complete';
      } else if (response && response.status === 'scanning') {
        state.status = 'scanning';
      } else {
        state.status = 'idle';
      }
      render();
    });
  }

  // Listen for broadcasted analysis results dynamically
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'ANALYSIS_RESULT' && message.result) {
      state.currentResult = message.result;
      state.status = 'complete';
      
      // Update history in background
      chrome.runtime.sendMessage({ type: 'GET_HISTORY' }, (response) => {
        if (response && response.history) {
          state.history = response.history;
        }
        render();
      });
    }
  });

  // Load history
  chrome.runtime.sendMessage({ type: 'GET_HISTORY' }, (response) => {
    if (response && response.history) {
      state.history = response.history;
      render();
    }
  });
});

// --------------- Render ---------------
function render() {
  const root = document.getElementById('root');
  root.innerHTML = `
    <div class="app">
      ${renderHeader()}
      ${renderTabNav()}
      <div class="content" style="position:relative; z-index:10;">
        ${state.activeTab === 'dashboard' ? renderDashboard() : renderHistory()}
      </div>
      ${renderFooter()}
    </div>
  `;
  attachEventListeners();
}

// --------------- Header ---------------
function renderHeader() {
  return `
    <header class="header" style="position:relative; z-index:10;">
      <div class="header-left">
        <div class="logo">
          <span class="material-symbols-outlined" style="font-size: 28px; color:#c06050;">security</span>
        </div>
        <div>
          <h1 class="app-title">PhishGuard</h1>
        </div>
      </div>
      <div class="header-right">
        <label class="toggle" title="${state.scanningEnabled ? 'Scanning ON' : 'Scanning OFF'}">
          <input type="checkbox" id="scan-toggle" ${state.scanningEnabled ? 'checked' : ''} />
          <span class="toggle-slider"></span>
        </label>
      </div>
    </header>
  `;
}

// --------------- Tab Navigation ---------------
function renderTabNav() {
  return `
    <nav class="tab-nav">
      <button class="tab-btn ${state.activeTab === 'dashboard' ? 'active' : ''}" data-tab="dashboard">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z"/>
        </svg>
        Dashboard
      </button>
      <button class="tab-btn ${state.activeTab === 'history' ? 'active' : ''}" data-tab="history">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
        </svg>
        History
      </button>
    </nav>
  `;
}

// --------------- Dashboard ---------------
function renderDashboard() {
  if (!state.scanningEnabled) {
    return `
      <div class="status-card disabled" style="padding: 32px 20px; text-align: center;">
        <div class="status-icon" style="opacity: 0.5;">⏸️</div>
        <h2 style="font-family:'IBM Plex Sans',sans-serif; color:#e8e0d4;">Scanning Paused</h2>
        <p style="font-size:12px; color:#9a8e80;">Toggle the switch above to enable real-time protection.</p>
      </div>
    `;
  }

  if (state.status === 'scanning') {
    return `
      <div class="status-card scanning" style="padding: 32px 20px; text-align: center; position:relative; overflow:hidden;">
        <div class="scanning-animation">
          <div class="scan-ring"></div>
          <div class="scan-ring delay-1"></div>
          <div class="scan-ring delay-2"></div>
          <span class="material-symbols-outlined" style="font-size:40px; color:#c06050;">radar</span>
        </div>
        <h2 style="font-family:'IBM Plex Sans',sans-serif; color:#e8e0d4;">Analyzing Page...</h2>
        <p style="font-size:12px; color:#c06050; opacity:0.8;">Checking URL patterns and page content</p>
      </div>
    `;
  }

  if (state.status === 'idle' || !state.currentResult) {
    return `
      <div class="status-card idle" style="padding: 32px 20px; text-align: center;">
        <span class="material-symbols-outlined" style="font-size:48px; margin-bottom:12px; color:rgba(192,96,80,0.4);">shield</span>
        <h2 style="font-family:'IBM Plex Sans',sans-serif; color:#e8e0d4; font-size: 20px;">Secure Status</h2>
        <p style="font-size:12px; color:#9a8e80; margin-bottom:16px;">Navigate to a website to start scanning</p>
        <button class="btn-scan" id="manual-scan" style="width:100%; border-radius:8px;">Scan Current Page</button>
      </div>
    `;
  }

  const result = state.currentResult;
  return renderResultCard(result);
}

// --------------- Result Card ---------------
function renderResultCard(result) {
  const isPhishing = result.risk_level === 'phishing';
  const isSuspicious = result.risk_level === 'suspicious';
  const isSafe = result.risk_level === 'safe';
  const isError = result.risk_level === 'error';

  let statusClass, statusIcon, statusText, statusDesc, accentColor;

  if (isPhishing) {
    statusClass = 'danger';
    statusIcon = 'gpp_bad';
    statusText = 'PHISHING DETECTED';
    statusDesc = 'This website is likely a phishing page.';
    accentColor = '#c0504e';
  } else if (isSuspicious) {
    statusClass = 'warning';
    statusIcon = 'warning';
    statusText = 'SUSPICIOUS';
    statusDesc = 'This website shows suspicious characteristics.';
    accentColor = '#c98a4b';
  } else if (isError) {
    statusClass = 'error';
    statusIcon = 'error';
    statusText = 'SCAN ERROR';
    statusDesc = 'Could not complete the analysis.';
    accentColor = '#6b6058';
  } else {
    statusClass = 'safe';
    statusIcon = 'verified_user';
    statusText = 'SAFE';
    statusDesc = 'No phishing indicators detected.';
    accentColor = '#6a9a6e';
  }

  return `
    <div class="result-card ${statusClass}" style="position:relative; overflow:hidden;">
      <div class="result-header" style="gap:14px;">
        <span class="material-symbols-outlined" style="font-size:36px; color:${accentColor};">${statusIcon}</span>
        <div>
          <div class="result-status" style="font-family:'IBM Plex Sans',sans-serif; letter-spacing:1px; font-size:16px; color:${accentColor};">${statusText}</div>
          <div class="result-desc" style="color:#9a8e80; font-size:11px;">${statusDesc}</div>
        </div>
      </div>

      ${!isError ? `
        <div class="score-section">
          <div class="score-label" style="font-family:'IBM Plex Sans',sans-serif; letter-spacing:0.5px;">Risk Score</div>
          <div class="score-bar-bg">
            <div class="score-bar-fill ${statusClass}" style="width: ${result.final_score}%; background: linear-gradient(90deg, #c06050, ${accentColor});"></div>
          </div>
          <div class="score-numbers">
            <span class="score-value" style="font-family:'IBM Plex Sans',sans-serif; color:#e8e0d4;">${result.final_score}%</span>
            <div class="score-breakdown" style="font-family:'IBM Plex Mono',monospace;">
              <span title="LLM Analysis Score"><span class="material-symbols-outlined" style="font-size:12px; vertical-align:middle; color:#c06050;">smart_toy</span> ${result.llm_score || 0}%</span>
              <span title="Rule Engine Score"><span class="material-symbols-outlined" style="font-size:12px; vertical-align:middle; color:#6a9a6e;">rule</span> ${result.rule_score || 0}%</span>
            </div>
          </div>
        </div>

        ${result.llm_available === false ? `
          <div class="llm-badge offline" style="border-radius:8px;">
            <span class="material-symbols-outlined" style="font-size:14px;">flash_off</span> LLM Offline — Using rule-based analysis only
          </div>
        ` : `
          <div class="llm-badge online" style="border-radius:8px;">
            <span class="material-symbols-outlined" style="font-size:14px;">psychology</span> AI + Rule Engine Analysis
          </div>
        `}
      ` : ''}

      ${result.reasons && result.reasons.length > 0 ? `
        <div class="reasons-section">
          <div class="reasons-title" style="font-family:'IBM Plex Sans',sans-serif;">Analysis Details</div>
          <ul class="reasons-list">
            ${result.reasons.map(r => `<li>${escapeHtml(r)}</li>`).join('')}
          </ul>
        </div>
      ` : ''}

      ${result.cookieAnalysis ? (() => {
        const cr = result.cookieAnalysis;
        const riskClass = cr.cookieRisk;
        const riskIcon = riskClass === 'high' ? 'cookie_off' : riskClass === 'medium' ? 'cookie' : 'verified';
        const riskColor = riskClass === 'high' ? '#c0504e' : riskClass === 'medium' ? '#c98a4b' : '#6a9a6e';
        const riskMsg = riskClass === 'high'
          ? 'High-risk tracking cookies detected'
          : riskClass === 'medium'
          ? 'This site uses tracking cookies'
          : 'This site looks safe';
        return `
        <div class="cookie-section ${riskClass}" style="border:1px solid ${riskColor}20; border-radius:12px;">
          <div class="cookie-title" style="font-family:'IBM Plex Sans',sans-serif;"><span class="material-symbols-outlined" style="font-size:14px; vertical-align:middle;">cookie</span> Cookie Analysis</div>
          <div class="cookie-message ${riskClass}" style="border-radius:10px;">
            <span class="material-symbols-outlined" style="font-size:16px; color:${riskColor};">${riskIcon}</span>
            <span class="cookie-message-text">${riskMsg}</span>
          </div>
          <div class="cookie-stats">
            <div class="cookie-stat">
              <span class="cookie-stat-value">${cr.totalCookies}</span>
              <span class="cookie-stat-label">Total</span>
            </div>
            <div class="cookie-stat">
              <span class="cookie-stat-value suspicious-count">${cr.suspiciousCookies}</span>
              <span class="cookie-stat-label">Suspicious</span>
            </div>
            <div class="cookie-stat">
              <span class="cookie-risk-badge ${riskClass}">${riskClass.toUpperCase()}</span>
              <span class="cookie-stat-label">Cookie Risk</span>
            </div>
          </div>
          ${result.combined_risk && result.combined_risk !== result.risk_level ? `
            <div class="combined-risk-note">
              <span class="material-symbols-outlined" style="font-size:12px; vertical-align:middle;">bolt</span> Combined risk elevated to <strong>${result.combined_risk.toUpperCase()}</strong> due to cookie analysis
            </div>
          ` : ''}
        </div>`;
      })() : ''}

      <div class="url-display" title="${escapeHtml(result.url || '')}">
        <span class="material-symbols-outlined" style="font-size:12px; color:#c06050;">link</span>
        <span>${truncateUrl(result.url || 'Unknown URL')}</span>
      </div>
    </div>
  `;
}

// --------------- History ---------------
function renderHistory() {
  if (state.history.length === 0) {
    return `
      <div class="status-card idle" style="padding: 32px 20px; text-align: center;">
        <span class="material-symbols-outlined" style="font-size:48px; color:rgba(192,96,80,0.25); margin-bottom:12px;">history</span>
        <h2 style="font-family:'IBM Plex Sans',sans-serif; color:#e8e0d4; font-size:16px;">No History Yet</h2>
        <p style="font-size:12px; color:#9a8e80;">Scanned pages will appear here</p>
      </div>
    `;
  }

  return `
    <div class="history-list">
      ${state.history.slice(0, 15).map(item => {
        const isPhishing = item.risk_level === 'phishing';
        const isSuspicious = item.risk_level === 'suspicious';
        const iconName = isPhishing ? 'gpp_bad' : isSuspicious ? 'warning' : 'verified_user';
        const accentColor = isPhishing ? '#c0504e' : isSuspicious ? '#c98a4b' : '#6a9a6e';
        const cls = item.risk_level || 'safe';
        const time = formatTime(item.timestamp);
        return `
          <div class="history-item ${cls}" style="border-left: 3px solid ${accentColor};">
            <span class="material-symbols-outlined" style="font-size:18px; color:${accentColor};">${iconName}</span>
            <div class="history-details">
              <div class="history-url">${truncateUrl(item.url || 'Unknown')}</div>
              <div class="history-meta">
                <span class="history-score">${item.final_score || 0}%</span>
                <span class="history-time">${time}</span>
              </div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

// --------------- Footer ---------------
function renderFooter() {
  return `
    <footer class="footer" style="z-index:10; position:relative;">
      <span style="font-family:'IBM Plex Sans',sans-serif; letter-spacing:0.5px; color:#6b6058;">PhishGuard v1.0</span>
      <span class="dot">·</span>
      <span class="footer-status ${state.scanningEnabled ? 'on' : 'off'}">
        ${state.scanningEnabled ? '● Active' : '○ Paused'}
      </span>
    </footer>
  `;
}

// --------------- Event Listeners ---------------
function attachEventListeners() {
  // Scan toggle
  const toggle = document.getElementById('scan-toggle');
  if (toggle) {
    toggle.addEventListener('change', (e) => {
      state.scanningEnabled = e.target.checked;
      chrome.runtime.sendMessage({
        type: 'TOGGLE_SCANNING',
        enabled: state.scanningEnabled
      });
      render();
    });
  }

  // Tab nav
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      state.activeTab = btn.dataset.tab;
      render();
    });
  });

  // Manual scan
  const scanBtn = document.getElementById('manual-scan');
  if (scanBtn) {
    scanBtn.addEventListener('click', async () => {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab) {
        state.status = 'scanning';
        render();
        chrome.runtime.sendMessage({
          type: 'MANUAL_SCAN',
          tabId: tab.id,
          url: tab.url
        });
        // No need to poll anymore; chrome.runtime.onMessage handles the broadcast!
      }
    });
  }
}

// --------------- Utilities ---------------
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function truncateUrl(url) {
  if (url.length > 50) {
    return url.slice(0, 47) + '...';
  }
  return url;
}

function formatTime(timestamp) {
  if (!timestamp) return '';
  try {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}
