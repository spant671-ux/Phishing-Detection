/**
 * Analyze Routes
 * ----------------
 * POST /analyze — Analyze a URL for phishing indicators.
 */

import { Router } from 'express';
import { analyzeUrl } from '../controllers/analyzeController.js';

const router = Router();

router.post('/', analyzeUrl);

export default router;
