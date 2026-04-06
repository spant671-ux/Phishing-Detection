/**
 * History Routes
 * ----------------
 * GET /history — Retrieve recent scan history.
 * GET /history/stats — Aggregate scan statistics.
 */

import { Router } from 'express';
import { getHistory, getStats } from '../controllers/historyController.js';

const router = Router();

router.get('/', getHistory);
router.get('/stats', getStats);

export default router;
