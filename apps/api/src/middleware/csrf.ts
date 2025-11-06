// --- START api/middleware/csrf.ts --- //
// CSRF (Cross-Site Request Forgery) protection middleware
// Implements Double Submit Cookie pattern for CSRF protection

import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { logger } from '../utils/logger';

// CSRF token storage (in production, use Redis or session store)
const csrfTokens = new Map<string, { token: string; expiresAt: number }>();

// Configuration
const CSRF_TOKEN_LENGTH = 32;
const CSRF_TOKEN_EXPIRY = 3600000; // 1 hour
const CSRF_HEADER_NAME = 'X-CSRF-Token';
const CSRF_COOKIE_NAME = 'csrf_token';

/**
 * Generate a cryptographically secure CSRF token
 */
export function generateCsrfToken(): string {
  return crypto.randomBytes(CSRF_TOKEN_LENGTH).toString('hex');
}

/**
 * Store CSRF token with expiration
 */
function storeCsrfToken(sessionId: string, token: string): void {
  csrfTokens.set(sessionId, {
    token,
    expiresAt: Date.now() + CSRF_TOKEN_EXPIRY,
  });
}

/**
 * Verify CSRF token
 */
function verifyCsrfToken(sessionId: string, token: string): boolean {
  const stored = csrfTokens.get(sessionId);

  if (!stored) {
    return false;
  }

  // Check expiration
  if (Date.now() > stored.expiresAt) {
    csrfTokens.delete(sessionId);
    return false;
  }

  // Constant-time comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(stored.token),
    Buffer.from(token)
  );
}

/**
 * Clean up expired tokens (run periodically)
 */
export function cleanupExpiredCsrfTokens(): void {
  const now = Date.now();
  let cleaned = 0;

  for (const [sessionId, data] of csrfTokens.entries()) {
    if (now > data.expiresAt) {
      csrfTokens.delete(sessionId);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    logger.debug(`Cleaned up ${cleaned} expired CSRF tokens`);
  }
}

// Run cleanup every 15 minutes
setInterval(cleanupExpiredCsrfTokens, 15 * 60 * 1000);

/**
 * Middleware to generate and set CSRF token
 * Should be used on routes that render forms or SPAs
 */
export function setCsrfToken(req: Request, res: Response, next: NextFunction): void {
  try {
    // Generate session ID from user ID or create one
    const sessionId = (req.user?.id || req.ip || 'anonymous') + '-' + Date.now();

    // Generate CSRF token
    const csrfToken = generateCsrfToken();

    // Store token
    storeCsrfToken(sessionId, csrfToken);

    // Set token in cookie (HttpOnly, Secure in production)
    res.cookie(CSRF_COOKIE_NAME, csrfToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: CSRF_TOKEN_EXPIRY,
    });

    // Also provide token in response header for SPA usage
    res.setHeader(CSRF_HEADER_NAME, csrfToken);

    // Attach to request for easy access
    (req as any).csrfToken = csrfToken;

    next();
  } catch (error) {
    logger.error('Error setting CSRF token:', error);
    next(error);
  }
}

/**
 * Middleware to verify CSRF token on state-changing requests
 * Should be used on POST, PUT, PATCH, DELETE routes
 */
export function verifyCsrfToken(req: Request, res: Response, next: NextFunction): void {
  try {
    // Skip CSRF verification for safe methods
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      return next();
    }

    // Get token from header or body
    const tokenFromHeader = req.headers[CSRF_HEADER_NAME.toLowerCase()] as string;
    const tokenFromBody = req.body?.csrf_token;
    const submittedToken = tokenFromHeader || tokenFromBody;

    // Get token from cookie
    const cookieToken = req.cookies?.[CSRF_COOKIE_NAME];

    if (!submittedToken) {
      logger.warn('CSRF token missing in request', {
        method: req.method,
        path: req.path,
        ip: req.ip,
      });

      return res.status(403).json({
        success: false,
        error: 'CSRF token missing',
        code: 'CSRF_TOKEN_MISSING',
      });
    }

    if (!cookieToken) {
      logger.warn('CSRF cookie missing', {
        method: req.method,
        path: req.path,
        ip: req.ip,
      });

      return res.status(403).json({
        success: false,
        error: 'CSRF cookie missing',
        code: 'CSRF_COOKIE_MISSING',
      });
    }

    // Verify tokens match (Double Submit Cookie pattern)
    if (submittedToken !== cookieToken) {
      logger.warn('CSRF token mismatch', {
        method: req.method,
        path: req.path,
        ip: req.ip,
      });

      return res.status(403).json({
        success: false,
        error: 'Invalid CSRF token',
        code: 'CSRF_TOKEN_INVALID',
      });
    }

    // Additional verification with stored token for extra security
    const sessionId = (req.user?.id || req.ip || 'anonymous') + '-' + Date.now();

    // For API routes, the Double Submit Cookie check is sufficient
    // In session-based apps, you'd also verify against server-side storage

    next();
  } catch (error) {
    logger.error('Error verifying CSRF token:', error);
    return res.status(500).json({
      success: false,
      error: 'CSRF verification failed',
    });
  }
}

/**
 * Middleware to verify CSRF token (simplified for stateless JWT auth)
 * Uses Double Submit Cookie pattern without server-side storage
 */
export function csrfProtection(req: Request, res: Response, next: NextFunction): void {
  // Skip for safe methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Skip for API routes with JWT auth (CSRF not needed for bearer token auth)
  // CSRF is mainly for cookie-based authentication
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return next();
  }

  // For cookie-based sessions, verify CSRF token
  return verifyCsrfToken(req, res, next);
}

/**
 * Get CSRF token from request (for rendering in forms)
 */
export function getCsrfToken(req: Request): string | null {
  return (req as any).csrfToken || req.cookies?.[CSRF_COOKIE_NAME] || null;
}

/**
 * Express middleware factory with options
 */
export interface CsrfOptions {
  ignoreMethods?: string[];
  ignoreRoutes?: string[];
  cookieName?: string;
  headerName?: string;
}

export function createCsrfProtection(options: CsrfOptions = {}) {
  const ignoreMethods = options.ignoreMethods || ['GET', 'HEAD', 'OPTIONS'];
  const ignoreRoutes = options.ignoreRoutes || [];

  return (req: Request, res: Response, next: NextFunction): void => {
    // Skip if method is in ignore list
    if (ignoreMethods.includes(req.method)) {
      return next();
    }

    // Skip if route is in ignore list
    if (ignoreRoutes.some(route => req.path.startsWith(route))) {
      return next();
    }

    // Skip for JWT bearer auth
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return next();
    }

    return verifyCsrfToken(req, res, next);
  };
}

export default {
  generateCsrfToken,
  setCsrfToken,
  verifyCsrfToken,
  csrfProtection,
  getCsrfToken,
  createCsrfProtection,
  cleanupExpiredCsrfTokens,
};
