/**
 * Environment Configuration
 * --------------------------
 * Centralizes all environment variable access.
 * Loads .env file and exports typed config values.
 */

import dotenv from 'dotenv';
dotenv.config();

export const PORT = process.env.PORT || 5000;
export const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434/api/generate';
export const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'gemma4';
