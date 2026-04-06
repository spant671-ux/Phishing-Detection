/**
 * PhishGuard - Background Service Worker
 * ----------------------------------------
 * Listens for tab navigation events and coordinates
 * URL analysis between content scripts and the backend.
 */

const API_BASE = 'http://localhost:5000';

// --------------- State ---------------
let scanningEnabled = true;
const scanCache = new Map();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes
const DEBOUNCE_MS = 1500;
const pendingScans = new Map(); // Track debounce timers

// --------------- Initialization ---------------
// Load saved state
chrome.storage.local.get(['scanningEnabled'], (result) => {
  if (result.scanningEnabled !== undefined) {
    scanningEnabled = result.scanningEnabled;
  }
});

// --------------- Tab Update Listener ---------------
// Detect when user navigates to a new page
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Only trigger on completed page loads with valid URLs
  if (changeInfo.status !== 'complete' || !tab.url) return;
  if (!scanningEnabled) return;

  // Skip internal Chrome pages and extension pages
  if (tab.url.startsWith('chrome://') ||
      tab.url.startsWith('chrome-extension://') ||
      tab.url.startsWith('about:') ||
      tab.url.startsWith('edge://') ||
      tab.url.startsWith('devtools://')) {
    return;
  }

  // Debounce: cancel previous pending scan for this tab
  if (pendingScans.has(tabId)) {
    clearTimeout(pendingScans.get(tabId));
  }

  // Schedule scan with debounce
  const timerId = setTimeout(() => {
    pendingScans.delete(tabId);
    initiateScan(tabId, tab.url);
  }, DEBOUNCE_MS);

  pendingScans.set(tabId, timerId);
});

// --------------- Message Listener ---------------
// Handle messages from popup and content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'GET_STATUS':
      handleGetStatus(message.url, sendResponse);
      return true; // Async response

    case 'TOGGLE_SCANNING':
      scanningEnabled = message.enabled;
      chrome.storage.local.set({ scanningEnabled });
      sendResponse({ scanningEnabled });
      return false;

    case 'CONTENT_EXTRACTED':
      handleContentExtracted(sender.tab.id, message.url, message.content);
      return false;

    case 'GET_SCANNING_STATE':
      sendResponse({ scanningEnabled });
      return false;

    case 'MANUAL_SCAN':
      initiateScan(message.tabId, message.url);
      sendResponse({ started: true });
      return false;

    case 'GET_HISTORY':
      fetchHistory(sendResponse);
      return true; // Async response

    default:
      return false;
  }
});

// --------------- Core Functions ---------------

/**
 * Initiate a scan for a given tab/URL.
 * First extracts page content via content script, then sends to backend.
 */
async function initiateScan(tabId, url) {
  // Check cache first
  const cached = getCachedResult(url);
  if (cached) {
    broadcastResult(tabId, cached);
    return;
  }

  // Store URL state as "scanning"
  updateTabState(tabId, { url, status: 'scanning' });

  // Request content extraction from content script
  try {
    await chrome.tabs.sendMessage(tabId, {
      type: 'EXTRACT_CONTENT',
      url: url
    });
  } catch (error) {
    // Content script might not be ready — try injecting it
    console.warn('[BG] Content script not available, analyzing URL only');
    analyzeUrl(tabId, url, '');
  }
}

/**
 * Handle extracted content from content script.
 */
function handleContentExtracted(tabId, url, content) {
  analyzeUrl(tabId, url, content);
}

/**
 * Send URL + content to backend for analysis.
 */
async function analyzeUrl(tabId, url, content) {
  try {
    const response = await fetch(`${API_BASE}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: url,
        content: content.slice(0, 2000) // Limit content size
      })
    });

    if (!response.ok) {
      throw new Error(`Backend returned ${response.status}`);
    }

    const result = await response.json();

    // --- Cookie Analysis (runs alongside URL result) ---
    let cookieResult = { totalCookies: 0, suspiciousCookies: 0, cookieRisk: 'low' };
    try {
      const urlObj = new URL(url);
      const cookies = await chrome.cookies.getAll({ url: url });
      cookieResult = analyzeCookies(cookies, urlObj);
    } catch (cookieErr) {
      console.warn('[BG] Cookie analysis skipped:', cookieErr.message);
    }

    // Merge cookie analysis into the result
    result.cookieAnalysis = cookieResult;
    result.combined_risk = combineRisks(result.risk_level, cookieResult.cookieRisk);

    // Cache the result
    setCachedResult(url, result);

    // Store in local history
    saveToHistory(result);

    // Persist to chrome.storage.local
    chrome.storage.local.set({ lastScanResult: result });

    // Update tab state and notify content script
    updateTabState(tabId, { url, status: 'complete', result });
    broadcastResult(tabId, result);

  } catch (error) {
    console.error('[BG] Analysis failed:', error.message);

    const errorResult = {
      url,
      risk_level: 'error',
      final_score: 0,
      reasons: ['Backend unavailable — ensure server is running on port 5000'],
      error: true,
      timestamp: new Date().toISOString()
    };

    updateTabState(tabId, { url, status: 'error', result: errorResult });
    broadcastResult(tabId, errorResult);
  }
}

/**
 * Broadcast analysis result to content script for UI rendering.
 */
function broadcastResult(tabId, result) {
  chrome.tabs.sendMessage(tabId, {
    type: 'ANALYSIS_RESULT',
    result: result
  }).catch(() => {
    // Content script may not be available — that's OK
  });
  
  chrome.runtime.sendMessage({
    type: 'ANALYSIS_RESULT',
    tabId: tabId,
    result: result
  }).catch(() => {});
}

/**
 * Get status for popup requests.
 */
async function handleGetStatus(url, sendResponse) {
  const cached = getCachedResult(url);
  if (cached) {
    sendResponse({ result: cached, status: 'complete' });
  } else {
    // Check if it's actively being scanned in any tab
    const isScanning = Object.values(tabStates).some(
      state => state.url === url && state.status === 'scanning'
    );
    
    if (isScanning) {
      sendResponse({ result: null, status: 'scanning' });
    } else {
      sendResponse({ result: null, status: 'unknown' });
    }
  }
}

/**
 * Fetch history from backend.
 */
async function fetchHistory(sendResponse) {
  try {
    const response = await fetch(`${API_BASE}/history?limit=20`);
    const history = await response.json();
    sendResponse({ history });
  } catch {
    // Fallback to local storage
    chrome.storage.local.get(['scanHistory'], (data) => {
      sendResponse({ history: data.scanHistory || [] });
    });
  }
}

// --------------- Cache Helpers ---------------
function getCachedResult(url) {
  const entry = scanCache.get(url);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
    return entry.result;
  }
  scanCache.delete(url);
  return null;
}

function setCachedResult(url, result) {
  scanCache.set(url, { result, timestamp: Date.now() });
  if (scanCache.size > 200) {
    const oldest = scanCache.keys().next().value;
    scanCache.delete(oldest);
  }
}

// --------------- Cookie Analysis ---------------

/**
 * Analyze cookies for the current site and return a risk assessment.
 * @param {Array} cookies - Array of chrome.cookies.Cookie objects
 * @param {URL} currentUrl - Parsed URL object of the current page
 * @returns {{ totalCookies: number, suspiciousCookies: number, cookieRisk: 'low'|'medium'|'high' }}
 */
function analyzeCookies(cookies, currentUrl) {
  const currentDomain = currentUrl.hostname.replace(/^www\./, '');
  const isHttps = currentUrl.protocol === 'https:';
  const THIRTY_DAYS = 30 * 24 * 60 * 60; // seconds
  const SUSPICIOUS_NAMES = ['track', 'ad', 'token', 'session', 'id'];

  let suspiciousCount = 0;
  const flags = [];

  for (const cookie of cookies) {
    let isSuspicious = false;

    // 1. Third-party cookie check
    const cookieDomain = (cookie.domain || '').replace(/^\./, '').replace(/^www\./, '');
    if (cookieDomain && !currentDomain.endsWith(cookieDomain) && !cookieDomain.endsWith(currentDomain)) {
      isSuspicious = true;
    }

    // 2. Suspicious name check
    const nameLower = (cookie.name || '').toLowerCase();
    if (SUSPICIOUS_NAMES.some(keyword => nameLower.includes(keyword))) {
      isSuspicious = true;
    }

    // 3. Insecure cookie on HTTPS site
    if (isHttps && !cookie.secure) {
      isSuspicious = true;
    }

    // 4. Long expiry check (> 30 days)
    if (cookie.expirationDate) {
      const secondsUntilExpiry = cookie.expirationDate - (Date.now() / 1000);
      if (secondsUntilExpiry > THIRTY_DAYS) {
        isSuspicious = true;
      }
    }

    if (isSuspicious) suspiciousCount++;
  }

  // Determine risk level based on ratio and absolute count
  const total = cookies.length;
  let cookieRisk = 'low';

  if (total > 0) {
    const ratio = suspiciousCount / total;
    if (suspiciousCount >= 10 || ratio >= 0.6) {
      cookieRisk = 'high';
    } else if (suspiciousCount >= 4 || ratio >= 0.3) {
      cookieRisk = 'medium';
    }
  }

  return {
    totalCookies: total,
    suspiciousCookies: suspiciousCount,
    cookieRisk
  };
}

/**
 * Combine URL risk level with cookie risk level.
 * The higher risk always wins.
 */
function combineRisks(urlRisk, cookieRisk) {
  const riskOrder = { safe: 0, low: 0, suspicious: 1, medium: 1, phishing: 2, high: 2, error: -1 };
  const resultMap = ['safe', 'suspicious', 'phishing'];

  const urlLevel = riskOrder[urlRisk] ?? 0;
  const cookieLevel = riskOrder[cookieRisk] ?? 0;

  // If URL analysis errored, defer to cookie risk mapping
  if (urlRisk === 'error') return urlRisk;

  return resultMap[Math.max(urlLevel, cookieLevel)];
}

// --------------- Storage Helpers ---------------
let tabStates = {};

function updateTabState(tabId, state) {
  tabStates[tabId] = state;
}

function saveToHistory(result) {
  chrome.storage.local.get(['scanHistory'], (data) => {
    const history = data.scanHistory || [];
    history.unshift(result);
    // Keep only last 100 entries
    chrome.storage.local.set({
      scanHistory: history.slice(0, 100)
    });
  });
}

// Clean up when tab is closed
chrome.tabs.onRemoved.addListener((tabId) => {
  delete tabStates[tabId];
  pendingScans.delete(tabId);
});
