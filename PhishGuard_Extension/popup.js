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
    <div class="app ${state.darkMode ? 'dark' : 'light'}">
      ${renderHeader()}
      ${renderTabNav()}
      <div class="content">
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
    <header class="header">
      <div class="header-left">
        <div class="logo">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" 
                  fill="url(#shield-gradient)" opacity="0.9"/>
            <path d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" 
                  stroke="url(#shield-stroke)" stroke-width="1" fill="none"/>
            <path d="M10 15.5l-3.5-3.5 1.41-1.41L10 12.67l5.59-5.59L17 8.5l-7 7z" 
                  fill="white" opacity="0.9"/>
            <defs>
              <linearGradient id="shield-gradient" x1="3" y1="2" x2="21" y2="24">
                <stop offset="0%" stop-color="#6366f1"/>
                <stop offset="100%" stop-color="#8b5cf6"/>
              </linearGradient>
              <linearGradient id="shield-stroke" x1="3" y1="2" x2="21" y2="24">
                <stop offset="0%" stop-color="#818cf8"/>
                <stop offset="100%" stop-color="#a78bfa"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
        <div>
          <h1 class="app-title">PhishGuard</h1>
          <p class="app-subtitle">AI-Powered Protection</p>
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
      <div class="status-card disabled">
        <div class="status-icon">⏸️</div>
        <h2>Scanning Paused</h2>
        <p>Toggle the switch above to enable real-time protection.</p>
      </div>
    `;
  }

  if (state.status === 'scanning') {
    return `
      <div class="status-card scanning">
        <div class="scanning-animation">
          <div class="scan-ring"></div>
          <div class="scan-ring delay-1"></div>
          <div class="scan-ring delay-2"></div>
          <svg class="scan-icon" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </div>
        <h2>Analyzing Page...</h2>
        <p>Checking URL patterns and page content</p>
      </div>
    `;
  }

  if (state.status === 'idle' || !state.currentResult) {
    return `
      <div class="status-card idle">
        <div class="status-icon">🔍</div>
        <h2>No Scan Data</h2>
        <p>Navigate to a website to start scanning</p>
        <button class="btn-scan" id="manual-scan">Scan Current Page</button>
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

  let statusClass, statusIcon, statusText, statusDesc;

  if (isPhishing) {
    statusClass = 'danger';
    statusIcon = '🚨';
    statusText = 'PHISHING DETECTED';
    statusDesc = 'This website is likely a phishing page.';
  } else if (isSuspicious) {
    statusClass = 'warning';
    statusIcon = '⚠️';
    statusText = 'SUSPICIOUS';
    statusDesc = 'This website shows suspicious characteristics.';
  } else if (isError) {
    statusClass = 'error';
    statusIcon = '❌';
    statusText = 'SCAN ERROR';
    statusDesc = 'Could not complete the analysis.';
  } else {
    statusClass = 'safe';
    statusIcon = '✅';
    statusText = 'SAFE';
    statusDesc = 'No phishing indicators detected.';
  }

  return `
    <div class="result-card ${statusClass}">
      <div class="result-header">
        <span class="result-icon">${statusIcon}</span>
        <div>
          <div class="result-status">${statusText}</div>
          <div class="result-desc">${statusDesc}</div>
        </div>
      </div>

      ${!isError ? `
        <div class="score-section">
          <div class="score-label">Risk Score</div>
          <div class="score-bar-bg">
            <div class="score-bar-fill ${statusClass}" style="width: ${result.final_score}%"></div>
          </div>
          <div class="score-numbers">
            <span class="score-value">${result.final_score}%</span>
            <div class="score-breakdown">
              <span title="LLM Analysis Score">🤖 ${result.llm_score || 0}%</span>
              <span title="Rule Engine Score">📏 ${result.rule_score || 0}%</span>
            </div>
          </div>
        </div>

        ${result.llm_available === false ? `
          <div class="llm-badge offline">
            <span>⚡</span> LLM Offline — Using rule-based analysis only
          </div>
        ` : `
          <div class="llm-badge online">
            <span>🧠</span> AI + Rule Engine Analysis
          </div>
        `}
      ` : ''}

      ${result.reasons && result.reasons.length > 0 ? `
        <div class="reasons-section">
          <div class="reasons-title">Analysis Details</div>
          <ul class="reasons-list">
            ${result.reasons.map(r => `<li>${escapeHtml(r)}</li>`).join('')}
          </ul>
        </div>
      ` : ''}

      <div class="url-display" title="${escapeHtml(result.url || '')}">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
        </svg>
        <span>${truncateUrl(result.url || 'Unknown URL')}</span>
      </div>
    </div>
  `;
}

// --------------- History ---------------
function renderHistory() {
  if (state.history.length === 0) {
    return `
      <div class="status-card idle">
        <div class="status-icon">📋</div>
        <h2>No History Yet</h2>
        <p>Scanned pages will appear here</p>
      </div>
    `;
  }

  return `
    <div class="history-list">
      ${state.history.slice(0, 15).map(item => {
        const icon = item.risk_level === 'phishing' ? '🚨' :
                     item.risk_level === 'suspicious' ? '⚠️' : '✅';
        const cls = item.risk_level || 'safe';
        const time = formatTime(item.timestamp);
        return `
          <div class="history-item ${cls}">
            <span class="history-icon">${icon}</span>
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
    <footer class="footer">
      <span>PhishGuard v1.0</span>
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
