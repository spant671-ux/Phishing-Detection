/**
 * Analyze Controller
 * --------------------
 * Handles the POST /analyze endpoint.
 * Orchestrates LLM analysis, rule-based analysis,
 * caching, and the weighted decision engine.
 */

import { analyzWithLLM } from '../services/llmService.js';
import { analyzeWithRules } from '../services/ruleEngine.js';
import { sanitizeInput } from '../utils/sanitize.js';
import { getCachedResult, setCachedResult } from '../config/cache.js';
import { addToHistory } from './historyController.js';

/**
 * POST /analyze
 * Accepts { url, content } and returns phishing analysis.
 */
export async function analyzeUrl(req, res) {
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
      Promise.resolve(analyzeWithRules(sanitizedUrl, sanitizedContent)),
    ]);

    // Extract results (with fallbacks if LLM fails)
    const llmData =
      llmResult.status === 'fulfilled'
        ? llmResult.value
        : { is_phishing: false, confidence: 0, reasons: ['LLM analysis unavailable'] };

    const ruleData =
      ruleResult.status === 'fulfilled'
        ? ruleResult.value
        : { score: 0, flags: [] };

    // --------------- Decision Engine ---------------
    // Weighted scoring: 70% LLM + 30% Rule-based (when both available)
    // Fallback: 100% rule-based when LLM is unavailable
    const llmAvailable = llmResult.status === 'fulfilled';
    const llmScore = llmData.confidence / 100; // Normalize to 0-1
    const ruleScore = ruleData.score; // Already 0-1

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
    const allReasons = [...llmData.reasons, ...ruleData.flags].filter(Boolean);

    const result = {
      url: sanitizedUrl,
      is_phishing: riskLevel === 'phishing',
      risk_level: riskLevel,
      final_score: finalScore,
      llm_score: llmData.confidence,
      rule_score: Math.round(ruleData.score * 100),
      reasons: allReasons,
      llm_available: llmAvailable,
      timestamp: new Date().toISOString(),
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
      message: error.message,
    });
  }
}
