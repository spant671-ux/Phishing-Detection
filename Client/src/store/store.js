/**
 * Redux Store
 * -------------
 * Centralized Redux store configuration
 * using Redux Toolkit's configureStore.
 */

import { configureStore } from '@reduxjs/toolkit';
import scanReducer from './slices/scanSlice';

const store = configureStore({
  reducer: {
    scan: scanReducer,
  },
});

export default store;
