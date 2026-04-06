/**
 * Axios Instance
 * ----------------
 * Centralized Axios instance configured with the
 * API base URL from environment variables.
 */

import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 90000, // 90s timeout (LLM can take up to 60s)
});

export default axiosInstance;
