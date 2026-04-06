/**
 * LLM Service - Ollama/Gemma Integration
 * ----------------------------------------
 * Sends URL + content to Gemma via Ollama local API
 * for AI-powered phishing detection analysis.
 */

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434/api/generate';
const MODEL = process.env.OLLAMA_MODEL || 'gemma4';
const TIMEOUT_MS = 60000; // 60 second timeout for larger models

/**
 * Build the analysis prompt for the LLM.
 * Structured to maximize detection accuracy.
 */
function buildPrompt(url, content) {
  return `You are a cybersecurity system specialized in phishing detection.

Analyze the following URL and webpage content for phishing risk.

URL: ${url}
Content: ${content || 'No content available'}

Check for:
- Impersonation (banks, tech companies, login pages, payment portals)
- Urgency/threat language ("account suspended", "verify immediately", "limited time")
- Suspicious domains (misspellings, extra characters, unusual TLDs)
- Requests for sensitive information (passwords, SSN, credit card numbers)
- Mismatched branding vs domain
- Unusual URL patterns (excessive subdomains, encoded characters)

Return ONLY valid JSON, no markdown, no explanation:
{
  "is_phishing": true/false,
  "confidence": 0-100,
  "reasons": ["reason1", "reason2"]
}`;
}

/**
 * Parse the LLM response, extracting JSON from potentially messy output.
 * Handles: raw JSON, markdown code fences, nested text, etc.
 */
function parseLLMResponse(text) {
  if (!text || typeof text !== 'string') {
    return { is_phishing: false, confidence: 0, reasons: ['Empty LLM response'] };
  }

  // Strip markdown code fences if present (```json ... ``` or ``` ... ```)
  let cleaned = text.replace(/```(?:json)?\s*/gi, '').replace(/```/g, '').trim();

  // Try 1: Direct parse of cleaned text
  try {
    const parsed = JSON.parse(cleaned);
    if (parsed && typeof parsed === 'object') return parsed;
  } catch { /* continue */ }

  // Try 2: Extract JSON object using balanced brace matching
  const jsonStart = cleaned.indexOf('{');
  if (jsonStart !== -1) {
    let braceCount = 0;
    let jsonEnd = -1;
    for (let i = jsonStart; i < cleaned.length; i++) {
      if (cleaned[i] === '{') braceCount++;
      if (cleaned[i] === '}') braceCount--;
      if (braceCount === 0) { jsonEnd = i; break; }
    }
    if (jsonEnd !== -1) {
      try {
        return JSON.parse(cleaned.substring(jsonStart, jsonEnd + 1));
      } catch { /* continue */ }
    }
  }

  // Try 3: Regex fallback for individual fields
  try {
    const phishMatch = cleaned.match(/"is_phishing"\s*:\s*(true|false)/i);
    const confMatch = cleaned.match(/"confidence"\s*:\s*(\d+)/);
    const reasonsMatch = cleaned.match(/"reasons"\s*:\s*\[([\s\S]*?)\]/);

    if (phishMatch || confMatch) {
      return {
        is_phishing: phishMatch ? phishMatch[1].toLowerCase() === 'true' : false,
        confidence: confMatch ? parseInt(confMatch[1]) : 0,
        reasons: reasonsMatch
          ? reasonsMatch[1].match(/"([^"]+)"/g)?.map(s => s.replace(/"/g, '')) || []
          : []
      };
    }
  } catch { /* continue */ }

  // Fallback
  console.warn('[LLM] Could not parse response:', text.slice(0, 200));
  return {
    is_phishing: false,
    confidence: 0,
    reasons: ['Failed to parse LLM response']
  };
}

/**
 * Call Ollama API with the phishing analysis prompt.
 * Uses native fetch with AbortController for timeout.
 */
async function analyzWithLLM(url, content) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const prompt = buildPrompt(url, content);

    const response = await fetch(OLLAMA_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.1,   // Low temperature for consistent, factual output
          num_predict: 256     // Limit output length
        }
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`Ollama returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const parsed = parseLLMResponse(data.response || '');

    // Validate and clamp confidence
    return {
      is_phishing: Boolean(parsed.is_phishing),
      confidence: Math.max(0, Math.min(100, Number(parsed.confidence) || 0)),
      reasons: Array.isArray(parsed.reasons) ? parsed.reasons : []
    };

  } catch (error) {
    if (error.name === 'AbortError') {
      console.warn('[LLM] Request timed out after', TIMEOUT_MS, 'ms');
      throw new Error('LLM request timed out');
    }
    console.error('[LLM] Error:', error.message);
    throw error;

  } finally {
    clearTimeout(timeoutId);
  }
}

module.exports = { analyzWithLLM };
