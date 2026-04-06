/**
 * In-Memory Cache
 * ----------------
 * Caches analysis results to avoid redundant LLM calls
 * for the same URL. Entries expire after CACHE_TTL.
 */

const cache = new Map();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes
const MAX_CACHE_SIZE = 500;

/**
 * Retrieve a cached result if it exists and hasn't expired.
 * @param {string} url - The URL key to look up.
 * @returns {object|null} Cached result or null.
 */
export function getCachedResult(url) {
  const entry = cache.get(url);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
    return entry.result;
  }
  cache.delete(url);
  return null;
}

/**
 * Store a result in the cache, evicting oldest entry if full.
 * @param {string} url - The URL key.
 * @param {object} result - The analysis result to cache.
 */
export function setCachedResult(url, result) {
  cache.set(url, { result, timestamp: Date.now() });

  // Evict oldest entry if cache grows too large
  if (cache.size > MAX_CACHE_SIZE) {
    const oldestKey = cache.keys().next().value;
    cache.delete(oldestKey);
  }
}
