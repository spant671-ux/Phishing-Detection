/**
 * Rule-Based Phishing Detection Engine
 * --------------------------------------
 * Heuristic analysis of URLs and content for phishing indicators.
 * Returns a score (0-1) and list of flagged issues.
 */

// Suspicious TLDs commonly used in phishing
const SUSPICIOUS_TLDS = [
  '.tk', '.ml', '.ga', '.cf', '.gq', '.buzz', '.top', '.xyz',
  '.club', '.work', '.click', '.link', '.info', '.online', '.site',
  '.icu', '.cam', '.rest', '.monster',
];

// Keywords that indicate phishing content
const PHISHING_KEYWORDS = [
  'verify your account', 'confirm your identity', 'update your payment',
  'account suspended', 'unusual activity', 'click here immediately',
  'limited time', 'act now', 'your account will be closed',
  'verify your information', 'confirm your password', 'security alert',
  'unauthorized access', 'reset your password', 'login attempt',
  'billing information', 'payment failed', 'update payment method',
  'social security', 'credit card number', 'bank account',
  'wire transfer', 'gift card', 'urgent action required',
  'dear customer', 'dear user', 'congratulations you won',
];

// Brands commonly impersonated in phishing
const IMPERSONATED_BRANDS = [
  'paypal', 'apple', 'microsoft', 'google', 'amazon', 'netflix',
  'facebook', 'instagram', 'whatsapp', 'dropbox', 'chase', 'wellsfargo',
  'bankofamerica', 'citibank', 'usps', 'fedex', 'dhl', 'irs',
  'linkedin', 'twitter', 'coinbase', 'blockchain', 'metamask',
  'binance', 'steam', 'roblox', 'epic games',
];

/**
 * Analyze a URL for phishing indicators.
 * Each check can add to the risk score and flag reasons.
 */
function analyzeUrl(url) {
  const flags = [];
  let score = 0;

  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();
    const fullUrl = url.toLowerCase();

    // 1. URL length check — phishing URLs tend to be long
    if (url.length > 100) {
      score += 0.1;
      flags.push(`Unusually long URL (${url.length} characters)`);
    }
    if (url.length > 200) {
      score += 0.1;
      flags.push('Extremely long URL — common in phishing');
    }

    // 2. IP address in URL — legitimate sites use domain names
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (ipRegex.test(hostname)) {
      score += 0.4;
      flags.push('URL uses IP address instead of domain name');
    }

    // 3. '@' symbol in URL — used to obfuscate real destination
    if (fullUrl.includes('@')) {
      score += 0.35;
      flags.push('URL contains @ symbol — may redirect to different site');
    }

    // 4. Excessive hyphens in domain — phishing mimicry tactic
    const hyphenCount = (hostname.match(/-/g) || []).length;
    if (hyphenCount >= 3) {
      score += 0.2;
      flags.push(`Domain contains ${hyphenCount} hyphens — suspicious`);
    }

    // 5. Suspicious TLD check
    const matchedTld = SUSPICIOUS_TLDS.find((tld) => hostname.endsWith(tld));
    if (matchedTld) {
      score += 0.25;
      flags.push(`Suspicious TLD: ${matchedTld}`);
    }

    // 6. Excessive subdomains — used to create fake legitimacy
    const subdomainCount = hostname.split('.').length - 2;
    if (subdomainCount >= 3) {
      score += 0.3;
      flags.push(`${subdomainCount} subdomains detected — possible obfuscation`);
    }

    // 7. Brand impersonation detection
    for (const brand of IMPERSONATED_BRANDS) {
      // Check if brand appears in subdomain but not as the actual domain
      if (hostname.includes(brand) && !hostname.endsWith(`${brand}.com`) && !hostname.endsWith(`${brand}.org`)) {
        score += 0.4;
        flags.push(`Possible ${brand} impersonation in URL`);
        break;
      }
    }

    // 8. Encoded/obfuscated characters in URL
    const encodedChars = (fullUrl.match(/%[0-9a-fA-F]{2}/g) || []).length;
    if (encodedChars > 3) {
      score += 0.15;
      flags.push(`URL contains ${encodedChars} encoded characters`);
    }

    // 9. Non-standard port usage
    if (parsed.port && !['80', '443', ''].includes(parsed.port)) {
      score += 0.1;
      flags.push(`Non-standard port: ${parsed.port}`);
    }

    // 10. HTTPS check — legitimate sites use HTTPS
    if (parsed.protocol === 'http:') {
      score += 0.1;
      flags.push('Site does not use HTTPS');
    }

    // 11. Punycode/IDN homograph attack detection
    if (hostname.startsWith('xn--')) {
      score += 0.35;
      flags.push('Internationalized domain name (IDN) — possible homograph attack');
    }

    // 12. Double extension in path (e.g., .html.php)
    const doubleExtRegex = /\.\w+\.\w+$/;
    if (doubleExtRegex.test(parsed.pathname)) {
      score += 0.1;
      flags.push('Double file extension in URL path');
    }
  } catch {
    // Invalid URL — that itself is suspicious
    score += 0.2;
    flags.push('URL format is invalid or malformed');
  }

  return { score: Math.min(score, 1), flags };
}

/**
 * Analyze page content for phishing indicators.
 */
function analyzeContent(content) {
  const flags = [];
  let score = 0;

  if (!content || content.trim().length === 0) {
    return { score: 0, flags: [] };
  }

  const lowerContent = content.toLowerCase();

  // 1. Check for phishing keywords
  let keywordHits = 0;
  for (const keyword of PHISHING_KEYWORDS) {
    if (lowerContent.includes(keyword)) {
      keywordHits++;
      if (keywordHits <= 3) {
        // Only flag first 3 for readability
        flags.push(`Suspicious phrase: "${keyword}"`);
      }
    }
  }
  if (keywordHits > 0) {
    score += Math.min(keywordHits * 0.15, 0.6);
  }
  if (keywordHits > 3) {
    flags.push(`...and ${keywordHits - 3} more suspicious phrases`);
  }

  // 2. Check for form fields requesting sensitive data
  const sensitiveInputPatterns = [
    'password', 'ssn', 'social security', 'credit card',
    'card number', 'cvv', 'expiration', 'pin', 'routing number',
  ];
  let sensitiveHits = 0;
  for (const pattern of sensitiveInputPatterns) {
    if (lowerContent.includes(pattern)) {
      sensitiveHits++;
      if (sensitiveHits <= 2) flags.push(`Page requests sensitive data: "${pattern}"`);
    }
  }
  if (sensitiveHits > 0) {
    score += Math.min(sensitiveHits * 0.15, 0.3);
  }

  // 3. Urgency/pressure language
  const urgencyPatterns = [
    'immediately', 'urgent', 'within 24 hours', 'within 48 hours',
    'right away', 'as soon as possible', 'account will be',
    'will be terminated', 'will be locked', 'will be suspended',
  ];
  let urgencyHits = 0;
  for (const pattern of urgencyPatterns) {
    if (lowerContent.includes(pattern)) {
      urgencyHits++;
    }
  }
  if (urgencyHits >= 1) {
    score += Math.min(urgencyHits * 0.12, 0.35);
    flags.push(`Page uses ${urgencyHits > 1 ? 'multiple' : ''} urgency/pressure phrases`);
  }

  return { score: Math.min(score, 1), flags };
}

/**
 * Combined rule-based analysis.
 * Returns { score: 0-1, flags: string[] }
 */
export function analyzeWithRules(url, content) {
  const urlResult = analyzeUrl(url);
  const contentResult = analyzeContent(content);

  // Additive scoring: URL and content scores stack (both contribute to risk)
  const combinedScore = Math.min(urlResult.score + contentResult.score * 0.7, 1);

  return {
    score: combinedScore,
    flags: [...urlResult.flags, ...contentResult.flags],
  };
}

export { analyzeUrl, analyzeContent };
