// --- START api/middleware/errorHandler.ts --- //
// Error handling middleware for AI-InterviewSpark API
// Provides centralized error handling and logging

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

// Custom error interface
export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  isOperational?: boolean;
}

// Create custom error
export const createAppError = (
  message: string,
  statusCode: number = 500,
  code?: string,
  isOperational: boolean = true
): AppError => {
  const error = new Error(message) as AppError;
  error.statusCode = statusCode;
  error.code = code;
  error.isOperational = isOperational;
  return error;
};

// Error handler middleware
export const errorHandler = (
  error: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Log error
  logger.error('Error occurred:', {
    message: error.message,
    stack: error.stack,
    statusCode: error.statusCode,
    code: error.code,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  // Determine status code
  const statusCode = error.statusCode || 500;
  const isOperational = error.isOperational !== false;

  // Don't leak error details in production for non-operational errors
  const message = isOperational || process.env.NODE_ENV === 'development' 
    ? error.message 
    : 'Internal server error';

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: message,
    code: error.code,
    ...(process.env.NODE_ENV === 'development' && {
      stack: error.stack,
      details: error,
    }),
  });
};

// Async error wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 404 handler
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const error = createAppError(`Route ${req.originalUrl} not found`, 404, 'ROUTE_NOT_FOUND');
  next(error);
};

// Validation error handler
export const validationErrorHandler = (error: any, req: Request, res: Response, next: NextFunction) => {
  if (error.name === 'ValidationError') {
    const validationError = createAppError(
      'Validation failed',
      400,
      'VALIDATION_ERROR'
    );
    return next(validationError);
  }
  next(error);
};

// JWT error handler
export const jwtErrorHandler = (error: any, req: Request, res: Response, next: NextFunction) => {
  if (error.name === 'JsonWebTokenError') {
    const jwtError = createAppError(
      'Invalid token',
      401,
      'INVALID_TOKEN'
    );
    return next(jwtError);
  }
  
  if (error.name === 'TokenExpiredError') {
    const jwtError = createAppError(
      'Token expired',
      401,
      'TOKEN_EXPIRED'
    );
    return next(jwtError);
  }
  
  next(error);
};

// Database error handler
export const databaseErrorHandler = (error: any, req: Request, res: Response, next: NextFunction) => {
  if (error.code === '23505') { // Unique constraint violation
    const dbError = createAppError(
      'Resource already exists',
      409,
      'DUPLICATE_ENTRY'
    );
    return next(dbError);
  }
  
  if (error.code === '23503') { // Foreign key constraint violation
    const dbError = createAppError(
      'Referenced resource not found',
      404,
      'REFERENCE_NOT_FOUND'
    );
    return next(dbError);
  }
  
  if (error.code === '42P01') { // Undefined table
    const dbError = createAppError(
      'Database configuration error',
      500,
      'DATABASE_ERROR'
    );
    return next(dbError);
  }
  
  next(error);
}; 