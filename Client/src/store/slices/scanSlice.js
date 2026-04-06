/**
 * Scan Slice
 * ------------
 * Redux Toolkit slice managing all scan-related state:
 * - scanResult: current scan analysis result
 * - scanning: loading state for active scans
 * - history: array of past scan results
 * - serverOnline: backend health status
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { checkHealth, fetchHistory, analyzeUrl, fetchStats } from '../../api/phishingApi';

// --------------- Async Thunks ---------------

/**
 * Check if the backend server is online.
 */
export const checkServerHealth = createAsyncThunk(
  'scan/checkServerHealth',
  async () => {
    await checkHealth();
    return true;
  }
);

/**
 * Load scan history from the server.
 */
export const loadHistory = createAsyncThunk(
  'scan/loadHistory',
  async () => {
    const data = await fetchHistory(20);
    return data;
  }
);

/**
 * Load aggregate statistics from the server.
 */
export const loadStats = createAsyncThunk(
  'scan/loadStats',
  async () => {
    const data = await fetchStats();
    return data;
  }
);

/**
 * Submit a URL for phishing analysis.
 */
export const scanUrl = createAsyncThunk(
  'scan/scanUrl',
  async (url, { dispatch }) => {
    const result = await analyzeUrl(url);
    // Refresh history after successful scan
    dispatch(loadHistory());
    return result;
  }
);

// --------------- Slice ---------------

const initialState = {
  scanResult: null,
  scanning: false,
  history: [],
  stats: { total: 0, phishing: 0, suspicious: 0, safe: 0 },
  serverOnline: false,
};

const scanSlice = createSlice({
  name: 'scan',
  initialState,
  reducers: {
    clearScanResult(state) {
      state.scanResult = null;
    },
  },
  extraReducers: (builder) => {
    // --- checkServerHealth ---
    builder.addCase(checkServerHealth.fulfilled, (state) => {
      state.serverOnline = true;
    });
    builder.addCase(checkServerHealth.rejected, (state) => {
      state.serverOnline = false;
    });

    // --- loadHistory ---
    builder.addCase(loadHistory.fulfilled, (state, action) => {
      state.history = action.payload;
    });
    builder.addCase(loadHistory.rejected, (state) => {
      // Server offline — keep existing history
      console.log('SERVER IS OFFLINE');
    });

    // --- loadStats ---
    builder.addCase(loadStats.fulfilled, (state, action) => {
      state.stats = action.payload;
    });

    // --- scanUrl ---
    builder.addCase(scanUrl.pending, (state) => {
      state.scanning = true;
      state.scanResult = null;
    });
    builder.addCase(scanUrl.fulfilled, (state, action) => {
      state.scanning = false;
      state.scanResult = action.payload;
    });
    builder.addCase(scanUrl.rejected, (state, action) => {
      state.scanning = false;
      state.scanResult = {
        url: action.meta.arg,
        risk_level: 'error',
        final_score: 0,
        reasons: [
          'Backend server is not running. Start it with: cd Server && npm start',
        ],
        error: true,
      };
    });
  },
});

export const { clearScanResult } = scanSlice.actions;
export default scanSlice.reducer;
