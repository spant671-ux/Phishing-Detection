/**
 * PhishGuard Backend Server
 * -------------------------
 * Express server providing phishing analysis API.
 * Combines LLM analysis (Ollama/Gemma) with a rule-based engine
 * for comprehensive phishing detection.
 */

const express = require('express');
const cors = require('cors');
const { analyzWithLLM } = require('./services/llmService');
const { analyzeWithRules } = require('./services/ruleEngine');
const { sanitizeInput } = require('./utils/sanitize');

const app = express();
const PORT = process.env.PORT || 5000;

// --------------- Middleware ---------------
app.use(cors({
  origin: ['chrome-extension://*', 'http://localhost:3000'],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.json({ limit: '50kb' })); // Limit payload size for security

// --------------- In-Memory Cache ---------------
// Cache results to avoid redundant LLM calls for the same URL
const cache = new Map();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

function getCachedResult(url) {
  const entry = cache.get(url);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
    return entry.result;
  }
  cache.delete(url);
  return null;
}

function setCachedResult(url, result) {
  cache.set(url, { result, timestamp: Date.now() });
  // Evict old entries if cache grows too large
  if (cache.size > 500) {
    const oldestKey = cache.keys().next().value;
    cache.delete(oldestKey);
  }
}

// --------------- Scan History ---------------
const scanHistory = [];
const MAX_HISTORY = 200;

function addToHistory(entry) {
  scanHistory.unshift(entry);
  if (scanHistory.length > MAX_HISTORY) {
    scanHistory.pop();
  }
}

// --------------- Routes ---------------

/**
 * POST /analyze
 * Accepts { url, content } and returns phishing analysis.
 */
app.post('/analyze', async (req, res) => {
  try {
    const { url, content } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Sanitize inputs
    const sanitizedUrl = sanitizeInput(url, 2048);
    const sanitizedContent = sanitizeInput(content || '', 2000);

    // Check cache first
    const cached = getCachedResult(sanitizedUrl);
    if (cached) {
      console.log(`[CACHE HIT] ${sanitizedUrl}`);
      return res.json({ ...cached, cached: true });
    }

    console.log(`[ANALYZING] ${sanitizedUrl}`);

    // Run LLM analysis and rule-based analysis in parallel
    const [llmResult, ruleResult] = await Promise.allSettled([
      analyzWithLLM(sanitizedUrl, sanitizedContent),
      Promise.resolve(analyzeWithRules(sanitizedUrl, sanitizedContent))
    ]);

    // Extract results (with fallbacks if LLM fails)
    const llmData = llmResult.status === 'fulfilled'
      ? llmResult.value
      : { is_phishing: false, confidence: 0, reasons: ['LLM analysis unavailable'] };

    const ruleData = ruleResult.status === 'fulfilled'
      ? ruleResult.value
      : { score: 0, flags: [] };

    // --------------- Decision Engine ---------------
    // Weighted scoring: 70% LLM + 30% Rule-based (when both available)
    // Fallback: 100% rule-based when LLM is unavailable
    const llmAvailable = llmResult.status === 'fulfilled';
    const llmScore = llmData.confidence / 100; // Normalize to 0-1
    const ruleScore = ruleData.score;           // Already 0-1

    let finalScore;
    if (llmAvailable) {
      finalScore = Math.round((0.7 * llmScore + 0.3 * ruleScore) * 100);
    } else {
      // LLM offline — rely entirely on rule engine
      finalScore = Math.round(ruleScore * 100);
    }

    // Determine risk level
    let riskLevel;
    if (finalScore >= 70) {
      riskLevel = 'phishing';
    } else if (finalScore >= 40) {
      riskLevel = 'suspicious';
    } else {
      riskLevel = 'safe';
    }

    // Combine reasons from both engines
    const allReasons = [
      ...llmData.reasons,
      ...ruleData.flags
    ].filter(Boolean);

    const result = {
      url: sanitizedUrl,
      is_phishing: riskLevel === 'phishing',
      risk_level: riskLevel,
      final_score: finalScore,
      llm_score: llmData.confidence,
      rule_score: Math.round(ruleData.score * 100),
      reasons: allReasons,
      llm_available: llmResult.status === 'fulfilled',
      timestamp: new Date().toISOString()
    };

    // Cache and log
    setCachedResult(sanitizedUrl, result);
    addToHistory(result);

    console.log(`[RESULT] ${sanitizedUrl} => ${riskLevel} (score: ${finalScore})`);
    res.json(result);

  } catch (error) {
    console.error('[ERROR] Analysis failed:', error.message);
    res.status(500).json({
      error: 'Analysis failed',
      message: error.message
    });
  }
});

/**
 * GET /history
 * Returns recent scan history.
 */
app.get('/history', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 50, MAX_HISTORY);
  res.json(scanHistory.slice(0, limit));
});

/**
 * GET /health
 * Health check endpoint.
 */
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// --------------- Start ---------------
app.listen(PORT, () => {
  console.log(`\n🛡️  PhishGuard Backend running on http://localhost:${PORT}`);
  console.log(`   POST /analyze  - Analyze URL for phishing`);
  console.log(`   GET  /history  - View scan history`);
  console.log(`   GET  /health   - Health check\n`);
});
