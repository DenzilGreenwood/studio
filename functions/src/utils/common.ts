/**
 * Shared utilities for Firebase Functions
 */

import * as logger from "firebase-functions/logger";

export function setCorsHeaders(res: any) {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

export function handleCors(req: any, res: any): boolean {
  setCorsHeaders(res);
  
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return true;
  }
  return false;
}

export function validateMethod(req: any, res: any, allowedMethods: string[]): boolean {
  if (!allowedMethods.includes(req.method)) {
    res.status(405).json({ error: 'Method not allowed' });
    return false;
  }
  return true;
}

export function logError(functionName: string, error: unknown) {
  logger.error(`Error in ${functionName}:`, error);
}
