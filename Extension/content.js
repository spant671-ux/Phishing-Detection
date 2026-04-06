/**
 * PhishGuard - Content Script
 * ----------------------------
 * Injected into every webpage to:
 * 1. Extract visible text content for analysis
 * 2. Display warning overlays for phishing/suspicious pages
 */

// Prevent multiple injections
if (window.__phishguard_loaded) {
  // Already loaded — just listen
} else {
  window.__phishguard_loaded = true;

  // --------------- Message Listener ---------------
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.type) {
      case 'EXTRACT_CONTENT':
        const content = extractPageContent();
        chrome.runtime.sendMessage({
          type: 'CONTENT_EXTRACTED',
          url: message.url || window.location.href,
          content: content
        });
        sendResponse({ success: true });
        return false;

      case 'ANALYSIS_RESULT':
        displayResult(message.result);
        sendResponse({ success: true });
        return false;

      default:
        return false;
    }
  });

  // --------------- Content Extraction ---------------
  /**
   * Extract visible text from the page.
   * Limits to first 2000 characters for performance.
   */
  function extractPageContent() {
    try {
      // Get text from key elements
      const selectors = [
        'title',
        'h1', 'h2', 'h3',
        'p',
        'a',
        'button',
        'label',
        'input[placeholder]',
        'meta[name="description"]'
      ];

      let textParts = [];

      // Page title
      textParts.push(document.title || '');

      // Meta description
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) textParts.push(metaDesc.content || '');

      // Visible text from key elements
      selectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => {
          const text = el.textContent || el.placeholder || el.content || '';
          if (text.trim()) {
            textParts.push(text.trim());
          }
        });
      });

      // Form action URLs (can reveal phishing intent)
      document.querySelectorAll('form[action]').forEach(form => {
        textParts.push(`Form action: ${form.action}`);
      });

      // Combine, deduplicate, and limit
      const combined = [...new Set(textParts)]
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 2000);

      return combined;
    } catch (error) {
      console.error('[PhishGuard] Content extraction error:', error);
      return '';
    }
  }

  // --------------- Warning Overlay Display ---------------

  /**
   * Display appropriate warning based on analysis result.
   */
  function displayResult(result) {
    // Remove any existing overlay
    removeOverlay();

    if (!result || result.error) return;

    if (result.risk_level === 'phishing') {
      showBlockingWarning(result);
    } else if (result.risk_level === 'suspicious') {
      showWarningBanner(result);
    }
    // 'safe' — no interruption

    // Cookie risk banner (independent of URL risk)
    showCookieWarningBanner(result);
  }

  // --------------- Cookie Warning Banner ---------------

  /**
   * Show a red warning banner if cookie risk is high.
   * Reads cookieAnalysis from the result object.
   */
  function showCookieWarningBanner(result) {
    // Remove any existing cookie banner first
    removeCookieBanner();

    if (!result || !result.cookieAnalysis) return;
    if (result.cookieAnalysis.cookieRisk !== 'high') return;

    const banner = document.createElement('div');
    banner.id = 'phishguard-cookie-banner';
    banner.innerHTML = `
      <div style="
        position: fixed;
        top: 0; left: 0; right: 0;
        z-index: 2147483646;
        background: linear-gradient(135deg, #d32f2f, #b71c1c);
        padding: 0;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
        animation: phishguard-cookie-slide 0.35s ease-out;
      ">
        <div style="
          max-width: 1200px;
          margin: 0 auto;
          padding: 12px 20px;
          display: flex;
          align-items: center;
          gap: 10px;
        ">
          <span style="font-size: 18px; flex-shrink: 0;">⚠️</span>
          <div style="flex: 1; color: white;">
            <strong style="font-size: 13px;">Warning:</strong>
            <span style="font-size: 13px; opacity: 0.95; margin-left: 4px;">
              This site uses high-risk cookies and tracking
            </span>
            <span style="font-size: 11px; opacity: 0.7; margin-left: 6px;">
              (${result.cookieAnalysis.suspiciousCookies} suspicious of ${result.cookieAnalysis.totalCookies} cookies)
            </span>
          </div>
          <button id="phishguard-cookie-dismiss" style="
            background: rgba(255, 255, 255, 0.2);
            border: none;
            color: white;
            padding: 6px 14px;
            border-radius: 6px;
            font-size: 11px;
            cursor: pointer;
            font-weight: 600;
            white-space: nowrap;
            transition: background 0.2s;
          ">Dismiss</button>
        </div>
      </div>

      <style>
        @keyframes phishguard-cookie-slide {
          from { transform: translateY(-100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        #phishguard-cookie-dismiss:hover { background: rgba(255,255,255,0.35); }
      </style>
    `;

    document.documentElement.appendChild(banner);

    document.getElementById('phishguard-cookie-dismiss').addEventListener('click', () => {
      removeCookieBanner();
    });

    // Auto-dismiss after 15 seconds
    setTimeout(() => {
      const existing = document.getElementById('phishguard-cookie-banner');
      if (existing) {
        existing.style.transition = 'opacity 0.3s ease';
        existing.style.opacity = '0';
        setTimeout(removeCookieBanner, 300);
      }
    }, 15000);
  }

  /**
   * Remove cookie warning banner.
   */
  function removeCookieBanner() {
    const existing = document.getElementById('phishguard-cookie-banner');
    if (existing) existing.remove();
  }

  // --------------- Initial Storage Check ---------------
  // Check chrome.storage.local on load for existing cookie results
  // (handles case where analysis completed before content script loaded)
  chrome.storage.local.get(['lastScanResult'], (data) => {
    if (data.lastScanResult && data.lastScanResult.cookieAnalysis) {
      try {
        const resultHost = new URL(data.lastScanResult.url).hostname;
        const currentHost = window.location.hostname;
        if (resultHost === currentHost) {
          showCookieWarningBanner(data.lastScanResult);
        }
      } catch (e) {
        // URL parse failed — skip
      }
    }
  });

  /**
   * Full-page blocking warning for confirmed phishing.
   */
  function showBlockingWarning(result) {
    const overlay = document.createElement('div');
    overlay.id = 'phishguard-overlay';
    overlay.innerHTML = `
      <div id="phishguard-blocking" style="
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0, 0, 0, 0.97);
        z-index: 2147483647;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      ">
        <div style="
          max-width: 520px;
          padding: 48px;
          text-align: center;
          color: white;
        ">
          <div style="
            width: 80px; height: 80px;
            margin: 0 auto 24px;
            background: linear-gradient(135deg, #ff4444, #cc0000);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 40px;
            box-shadow: 0 0 40px rgba(255, 68, 68, 0.5);
            animation: phishguard-pulse 2s ease-in-out infinite;
          ">⚠️</div>
          
          <h1 style="
            font-size: 28px;
            font-weight: 700;
            margin: 0 0 12px;
            color: #ff4444;
          ">Phishing Detected!</h1>
          
          <p style="
            font-size: 16px;
            color: #ccc;
            margin: 0 0 24px;
            line-height: 1.6;
          ">
            PhishGuard has identified this website as a <strong style="color: #ff6666;">high-risk phishing page</strong>. 
            This site may steal your personal information.
          </p>
          
          <div style="
            background: rgba(255, 68, 68, 0.1);
            border: 1px solid rgba(255, 68, 68, 0.3);
            border-radius: 12px;
            padding: 16px;
            margin: 0 0 24px;
            text-align: left;
          ">
            <div style="font-size: 13px; color: #ff8888; font-weight: 600; margin-bottom: 8px;">
              Risk Score: ${result.final_score}%
            </div>
            <ul style="margin: 0; padding: 0 0 0 16px; font-size: 13px; color: #aaa; line-height: 1.8;">
              ${(result.reasons || []).slice(0, 4).map(r => `<li>${escapeHtml(r)}</li>`).join('')}
            </ul>
          </div>
          
          <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
            <button id="phishguard-goback" style="
              padding: 12px 32px;
              background: linear-gradient(135deg, #ff4444, #cc0000);
              color: white;
              border: none;
              border-radius: 8px;
              font-size: 15px;
              font-weight: 600;
              cursor: pointer;
              transition: all 0.2s;
            ">← Go Back to Safety</button>
            
            <button id="phishguard-proceed" style="
              padding: 12px 24px;
              background: transparent;
              color: #666;
              border: 1px solid #333;
              border-radius: 8px;
              font-size: 13px;
              cursor: pointer;
              transition: all 0.2s;
            ">Proceed anyway (unsafe)</button>
          </div>
        </div>
      </div>
      
      <style>
        @keyframes phishguard-pulse {
          0%, 100% { transform: scale(1); box-shadow: 0 0 40px rgba(255, 68, 68, 0.5); }
          50% { transform: scale(1.05); box-shadow: 0 0 60px rgba(255, 68, 68, 0.7); }
        }
        #phishguard-goback:hover { transform: scale(1.03); box-shadow: 0 4px 20px rgba(255, 68, 68, 0.4); }
        #phishguard-proceed:hover { color: #999; border-color: #666; }
      </style>
    `;

    document.documentElement.appendChild(overlay);

    // Event handlers
    document.getElementById('phishguard-goback').addEventListener('click', () => {
      window.history.back();
      setTimeout(() => { window.location.href = 'about:blank'; }, 200);
    });

    document.getElementById('phishguard-proceed').addEventListener('click', () => {
      removeOverlay();
    });
  }

  /**
   * Warning banner for suspicious pages (not confirmed phishing).
   */
  function showWarningBanner(result) {
    const banner = document.createElement('div');
    banner.id = 'phishguard-overlay';
    banner.innerHTML = `
      <div id="phishguard-banner" style="
        position: fixed;
        top: 0; left: 0; right: 0;
        z-index: 2147483647;
        background: linear-gradient(135deg, #ff9800, #f57c00);
        padding: 0;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3);
        animation: phishguard-slidedown 0.3s ease-out;
      ">
        <div style="
          max-width: 1200px;
          margin: 0 auto;
          padding: 12px 20px;
          display: flex;
          align-items: center;
          gap: 12px;
        ">
          <span style="font-size: 20px;">⚡</span>
          <div style="flex: 1;">
            <strong style="color: white; font-size: 14px;">PhishGuard Warning</strong>
            <span style="color: rgba(255,255,255,0.9); font-size: 13px; margin-left: 8px;">
              This page has suspicious characteristics (Score: ${result.final_score}%)
            </span>
          </div>
          <button id="phishguard-dismiss" style="
            background: rgba(255,255,255,0.2);
            border: none;
            color: white;
            padding: 6px 16px;
            border-radius: 6px;
            font-size: 12px;
            cursor: pointer;
            font-weight: 600;
          ">Dismiss</button>
        </div>
      </div>
      
      <style>
        @keyframes phishguard-slidedown {
          from { transform: translateY(-100%); }
          to { transform: translateY(0); }
        }
        #phishguard-dismiss:hover { background: rgba(255,255,255,0.3); }
      </style>
    `;

    document.documentElement.appendChild(banner);

    document.getElementById('phishguard-dismiss').addEventListener('click', () => {
      removeOverlay();
    });

    // Auto-dismiss after 10 seconds
    setTimeout(() => {
      const existing = document.getElementById('phishguard-overlay');
      if (existing) {
        existing.style.transition = 'opacity 0.3s';
        existing.style.opacity = '0';
        setTimeout(removeOverlay, 300);
      }
    }, 10000);
  }

  /**
   * Remove any existing overlay.
   */
  function removeOverlay() {
    const existing = document.getElementById('phishguard-overlay');
    if (existing) existing.remove();
  }

  /**
   * Escape HTML to prevent XSS in overlay content.
   */
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
