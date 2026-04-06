/**
 * CORS Configuration
 * -------------------
 * Defines allowed origins, methods, and headers
 * for cross-origin requests.
 */

export const corsOptions = {
  origin: ['chrome-extension://*', 'http://localhost:3000', 'http://localhost:3001'],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
};
