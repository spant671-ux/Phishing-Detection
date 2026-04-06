/**
 * PhishGuard Backend Server
 * -------------------------
 * Thin entry point — imports the configured Express app
 * and starts listening on the configured port.
 */

import app from './app.js';
import { PORT } from './config/env.js';

app.listen(PORT, () => {
  console.log("SERVER IS RUNNING ON PORT", PORT)
  console.log(`\n🛡️  PhishGuard Backend running on http://localhost:${PORT}`);
  console.log(`   POST /analyze  - Analyze URL for phishing`);
  console.log(`   GET  /history  - View scan history`);
  console.log(`   GET  /health   - Health check\n`);
});
