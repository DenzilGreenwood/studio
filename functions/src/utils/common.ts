/**
 * Shared utilities for Firebase Functions
 */

import * as logger from "firebase-functions/logger";
import { Request, Response } from "express";

export function setCorsHeaders(res: Response): void {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

export function handleCors(req: Request, res: Response): boolean {
  setCorsHeaders(res);
  
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return true;
  }
  return false;
}

export function validateMethod(req: Request, res: Response, allowedMethods: string[]): boolean {
  if (!allowedMethods.includes(req.method)) {
    res.status(405).json({ error: 'Method not allowed' });
    return false;
  }
  return true;
}

export function logError(functionName: string, error: unknown) {
  logger.error(`Error in ${functionName}:`, error);
}
