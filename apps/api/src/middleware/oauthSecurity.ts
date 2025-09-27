// --- START api/middleware/oauthSecurity.ts --- //
// OAuth security middleware for AI-InterviewSpark API
// Provides CSRF protection, state validation, and security headers

import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import { logger } from '../utils/logger';

// Extended request interface for OAuth security
export interface OAuthSecureRequest extends Request {
  oauthSecurity?: {
    nonce: string;
    timestamp: number;
    fingerprint: string;
  };
}

// OAuth-specific rate limiting configurations
export const oauthRateLimits = {
  // General OAuth endpoints
  general: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 requests per window
    message: {
      success: false,
      error: 'Too many OAuth requests. Please try again later.',
      code: 'OAUTH_RATE_LIMIT_EXCEEDED',
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: Request) => {
      // Use IP + User-Agent for more specific rate limiting
      const ip = req.ip || req.connection.remoteAddress || 'unknown';
      const userAgent = req.get('User-Agent') || 'unknown';
      return crypto.createHash('sha256').update(`${ip}:${userAgent}`).digest('hex');
    },
    // onLimitReached is deprecated in express-rate-limit v7
    // Use skipSuccessfulRequests or custom handler instead
    skipSuccessfulRequests: false,
  }),

  // Stricter rate limiting for OAuth callbacks
  callback: rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 5, // 5 callback attempts per window
    message: {
      success: false,
      error: 'Too many OAuth callback attempts. Please try again later.',
      code: 'OAUTH_CALLBACK_RATE_LIMIT_EXCEEDED',
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: Request) => {
      const ip = req.ip || req.connection.remoteAddress || 'unknown';
      return `oauth_callback:${ip}`;
    },
    // onLimitReached is deprecated in express-rate-limit v7
    // Use skipSuccessfulRequests or custom handler instead
    skipSuccessfulRequests: false,
  }),

  // Account linking rate limiting
  linking: rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 3, // 3 linking attempts per window
    message: {
      success: false,
      error: 'Too many account linking attempts. Please try again later.',
      code: 'OAUTH_LINKING_RATE_LIMIT_EXCEEDED',
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: Request) => {
      const userId = req.user?.id || 'anonymous';
      return `oauth_linking:${userId}`;
    },
    // onLimitReached is deprecated in express-rate-limit v7
    // Use skipSuccessfulRequests or custom handler instead
    skipSuccessfulRequests: false,
  }),
};

// Security headers middleware for OAuth endpoints
export const oauthSecurityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Set security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // OAuth-specific headers
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  next();
};

// Generate browser fingerprint for additional security
export const generateBrowserFingerprint = (req: Request): string => {
  const components = [
    req.get('User-Agent') || '',
    req.get('Accept-Language') || '',
    req.get('Accept-Encoding') || '',
    req.ip || '',
  ];
  
  return crypto
    .createHash('sha256')
    .update(components.join('|'))
    .digest('hex')
    .substring(0, 16);
};

// OAuth state validation middleware
export const validateOAuthState = (req: Request, res: Response, next: NextFunction) => {
  const state = req.query.state as string;
  
  if (!state) {
    logger.warn('OAuth callback missing state parameter', {
      ip: req.ip,
      provider: req.params.provider,
    });
    
    return res.status(400).json({
      success: false,
      error: 'Missing state parameter',
      code: 'OAUTH_MISSING_STATE',
    });
  }

  try {
    // Decode and validate state
    const stateString = Buffer.from(state, 'base64url').toString();
    const stateData = JSON.parse(stateString);
    
    // Validate required fields
    if (!stateData.provider || !stateData.timestamp || !stateData.nonce) {
      throw new Error('Invalid state structure');
    }
    
    // Validate timestamp (state should not be older than 10 minutes)
    const maxAge = 10 * 60 * 1000; // 10 minutes
    if (Date.now() - stateData.timestamp > maxAge) {
      throw new Error('State has expired');
    }
    
    // Validate provider matches
    if (stateData.provider !== req.params.provider) {
      throw new Error('Provider mismatch');
    }
    
    // Store validated state data for use in route handler
    (req as any).oauthState = stateData;
    
    next();
  } catch (error: any) {
    logger.warn('OAuth state validation failed', {
      ip: req.ip,
      provider: req.params.provider,
      error: error.message,
    });
    
    return res.status(400).json({
      success: false,
      error: 'Invalid or expired state parameter',
      code: 'OAUTH_INVALID_STATE',
    });
  }
};

// OAuth CSRF protection middleware
export const oauthCSRFProtection = (req: OAuthSecureRequest, res: Response, next: NextFunction) => {
  // Generate security context
  const nonce = crypto.randomBytes(16).toString('hex');
  const timestamp = Date.now();
  const fingerprint = generateBrowserFingerprint(req);
  
  req.oauthSecurity = {
    nonce,
    timestamp,
    fingerprint,
  };
  
  // Log security context for audit
  logger.info('OAuth security context generated', {
    nonce,
    fingerprint,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    path: req.path,
  });
  
  next();
};

// Validate OAuth provider parameter
export const validateOAuthProvider = (req: Request, res: Response, next: NextFunction) => {
  const provider = req.params.provider;
  const validProviders = ['google', 'facebook', 'linkedin'];
  
  if (!provider || !validProviders.includes(provider)) {
    logger.warn('Invalid OAuth provider requested', {
      provider,
      ip: req.ip,
      path: req.path,
    });
    
    return res.status(400).json({
      success: false,
      error: 'Invalid or unsupported OAuth provider',
      code: 'OAUTH_INVALID_PROVIDER',
    });
  }
  
  next();
};

// OAuth error handler middleware
export const oauthErrorHandler = (error: any, req: Request, res: Response, next: NextFunction) => {
  logger.error('OAuth error occurred', {
    error: error.message,
    stack: error.stack,
    ip: req.ip,
    provider: req.params.provider,
    path: req.path,
    method: req.method,
  });
  
  // Don't expose internal errors in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  if (error.code && error.statusCode) {
    return res.status(error.statusCode).json({
      success: false,
      error: error.message,
      code: error.code,
      ...(isDevelopment && { stack: error.stack }),
    });
  }
  
  // Generic OAuth error response
  res.status(500).json({
    success: false,
    error: 'OAuth authentication failed',
    code: 'OAUTH_INTERNAL_ERROR',
    ...(isDevelopment && { 
      originalError: error.message,
      stack: error.stack 
    }),
  });
};

// Secure token storage utilities
export const secureTokenStorage = {
  // Encrypt sensitive token data
  encryptToken: (token: string, key?: string): string => {
    const encryptionKey = key || process.env.TOKEN_ENCRYPTION_KEY || 'default-key-change-in-production';
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', crypto.scryptSync(encryptionKey, 'salt', 32), iv);
    let encrypted = cipher.update(token, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  },
  
  // Decrypt token data
  decryptToken: (encryptedToken: string, key?: string): string => {
    const encryptionKey = key || process.env.TOKEN_ENCRYPTION_KEY || 'default-key-change-in-production';
    const [ivHex, encrypted] = encryptedToken.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', crypto.scryptSync(encryptionKey, 'salt', 32), iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  },
  
  // Hash token for storage (one-way)
  hashToken: (token: string): string => {
    return crypto.createHash('sha256').update(token).digest('hex');
  },
};

export default {
  oauthRateLimits,
  oauthSecurityHeaders,
  validateOAuthState,
  oauthCSRFProtection,
  validateOAuthProvider,
  oauthErrorHandler,
  secureTokenStorage,
  generateBrowserFingerprint,
};
