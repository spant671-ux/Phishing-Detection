/**
 * Phishing API
 * --------------
 * All API call functions for the PhishGuard backend.
 * Uses the centralized Axios instance.
 */

import axiosInstance from './axiosInstance';

/**
 * Check if the backend server is online.
 * @returns {Promise<boolean>} True if server responds OK.
 */
export async function checkHealth() {
  const response = await axiosInstance.get('/health');
  return response.data;
}

/**
 * Fetch recent scan history from the server.
 * @param {number} limit - Max number of history entries.
 * @returns {Promise<Array>} Array of scan result objects.
 */
export async function fetchHistory(limit = 20) {
  const response = await axiosInstance.get('/history', {
    params: { limit },
  });
  return response.data;
}

/**
 * Submit a URL for phishing analysis.
 * @param {string} url - The URL to analyze.
 * @param {string} content - Optional page content.
 * @returns {Promise<object>} Analysis result object.
 */
export async function analyzeUrl(url, content = '') {
  const response = await axiosInstance.post('/analyze', { url, content });
  return response.data;
}

/**
 * Fetch aggregate scan statistics.
 * @returns {Promise<object>} { total, phishing, suspicious, safe }
 */
export async function fetchStats() {
  const response = await axiosInstance.get('/history/stats');
  return response.data;
}
