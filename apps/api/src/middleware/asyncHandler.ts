// --- START api/middleware/asyncHandler.ts --- //
// Async handler wrapper for Express routes
// Wraps async route handlers to handle promise rejections

import { Request, Response, NextFunction } from 'express';

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}; 