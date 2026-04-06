/**
 * Express Application Setup
 * ---------------------------
 * Configures middleware (CORS, JSON parsing)
 * and mounts all route modules.
 */

import express from 'express';
import cors from 'cors';
import { corsOptions } from './config/cors.js';
import analyzeRoutes from './routes/analyzeRoutes.js';
import historyRoutes from './routes/historyRoutes.js';
import healthRoutes from './routes/healthRoutes.js';

const app = express();

// --------------- Middleware ---------------
app.use(cors(corsOptions));
app.use(express.json({ limit: '50kb' })); // Limit payload size for security

// --------------- Routes ---------------
app.use('/analyze', analyzeRoutes);
app.use('/history', historyRoutes);
app.use('/health', healthRoutes);

export default app;
