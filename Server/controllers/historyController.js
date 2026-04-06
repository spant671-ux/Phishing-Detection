/**
 * History Controller
 * -------------------
 * Manages in-memory scan history and handles
 * the GET /history endpoint.
 */

// --------------- In-Memory Scan History ---------------
const scanHistory = [];
const MAX_HISTORY = 200;

/**
 * Add an entry to the scan history (most recent first).
 * @param {object} entry - The scan result to store.
 */
export function addToHistory(entry) {
  scanHistory.unshift(entry);
  if (scanHistory.length > MAX_HISTORY) {
    scanHistory.pop();
  }
}

/**
 * GET /history
 * Returns recent scan history, limited by query param.
 */
export function getHistory(req, res) {
  const limit = Math.min(parseInt(req.query.limit) || 50, MAX_HISTORY);
  res.json(scanHistory.slice(0, limit));
}

/**
 * GET /history/stats
 * Returns aggregate stats for the dashboard.
 */
export function getStats(req, res) {
  const total = scanHistory.length;
  const phishing = scanHistory.filter(e => e.risk_level === 'phishing').length;
  const suspicious = scanHistory.filter(e => e.risk_level === 'suspicious').length;
  const safe = scanHistory.filter(e => e.risk_level === 'safe').length;
  res.json({ total, phishing, suspicious, safe });
}
