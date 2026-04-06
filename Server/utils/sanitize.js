/**
 * Input Sanitization Utilities
 * ----------------------------
 * Prevents injection attacks and ensures clean data processing.
 */

/**
 * Sanitize input string by removing dangerous characters
 * and limiting length.
 * @param {string} input - Raw input string
 * @param {number} maxLength - Maximum allowed length
 * @returns {string} Sanitized string
 */
function sanitizeInput(input, maxLength = 2048) {
  if (typeof input !== 'string') {
    return '';
  }

  return input
    .slice(0, maxLength)           // Enforce length limit
    .replace(/\0/g, '')            // Remove null bytes
    .replace(/<script[^>]*>.*?<\/script>/gi, '') // Strip script tags
    .replace(/<[^>]*>/g, '')       // Strip HTML tags
    .trim();
}

module.exports = { sanitizeInput };
