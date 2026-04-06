/**
 * Health Controller
 * ------------------
 * Handles the GET /health endpoint for
 * server health checks.
 */

/**
 * GET /health
 * Returns server status and uptime.
 */
export function getHealth(req, res) {
  res.json({ status: 'ok', uptime: process.uptime() });
}
