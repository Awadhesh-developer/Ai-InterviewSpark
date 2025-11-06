// --- START api/middleware/security.ts --- //
// Enhanced security middleware for XSS prevention and input sanitization

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * HTML entity encoding map
 */
const htmlEntities: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
};

/**
 * Escape HTML entities to prevent XSS
 */
export function escapeHtml(str: string): string {
  if (typeof str !== 'string') return str;
  return str.replace(/[&<>"'\/]/g, (char) => htmlEntities[char] || char);
}

/**
 * Strip HTML tags from string
 */
export function stripHtmlTags(str: string): string {
  if (typeof str !== 'string') return str;
  return str.replace(/<[^>]*>/g, '');
}

/**
 * Sanitize string input to prevent XSS
 */
export function sanitizeString(str: string, allowHtml = false): string {
  if (typeof str !== 'string') return str;

  // Remove null bytes
  str = str.replace(/\0/g, '');

  if (allowHtml) {
    // Allow limited HTML but escape dangerous attributes
    return str
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/data:text\/html/gi, ''); // Remove data URLs
  }

  // Strip all HTML and escape
  return escapeHtml(stripHtmlTags(str));
}

/**
 * Recursively sanitize object properties
 */
export function sanitizeObject(obj: any, allowHtml = false): any {
  if (obj === null || obj === undefined) return obj;

  if (typeof obj === 'string') {
    return sanitizeString(obj, allowHtml);
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item, allowHtml));
  }

  if (typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      // Sanitize key names too
      const sanitizedKey = sanitizeString(key, false);
      sanitized[sanitizedKey] = sanitizeObject(value, allowHtml);
    }
    return sanitized;
  }

  return obj;
}

/**
 * Middleware to sanitize request body, query, and params
 */
export function xssProtection(options: { allowHtml?: boolean } = {}) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Sanitize request body
      if (req.body && typeof req.body === 'object') {
        req.body = sanitizeObject(req.body, options.allowHtml);
      }

      // Sanitize query parameters
      if (req.query && typeof req.query === 'object') {
        req.query = sanitizeObject(req.query, false);
      }

      // Sanitize URL parameters
      if (req.params && typeof req.params === 'object') {
        req.params = sanitizeObject(req.params, false);
      }

      next();
    } catch (error) {
      logger.error('XSS protection error:', error);
      next(error);
    }
  };
}

/**
 * Detect potential XSS attacks in strings
 */
export function detectXssAttempt(str: string): boolean {
  if (typeof str !== 'string') return false;

  const xssPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe[^>]*>/gi,
    /<object[^>]*>/gi,
    /<embed[^>]*>/gi,
    /eval\(/gi,
    /expression\(/gi,
    /vbscript:/gi,
    /data:text\/html/gi,
  ];

  return xssPatterns.some(pattern => pattern.test(str));
}

/**
 * Middleware to detect and block XSS attempts
 */
export function xssDetection(req: Request, res: Response, next: NextFunction): void {
  try {
    const checkForXss = (obj: any, path = ''): boolean => {
      if (typeof obj === 'string') {
        if (detectXssAttempt(obj)) {
          logger.warn('XSS attempt detected', {
            path,
            value: obj.substring(0, 100),
            ip: req.ip,
            method: req.method,
            url: req.url,
          });
          return true;
        }
      } else if (Array.isArray(obj)) {
        return obj.some((item, index) => checkForXss(item, `${path}[${index}]`));
      } else if (obj && typeof obj === 'object') {
        return Object.entries(obj).some(([key, value]) =>
          checkForXss(value, path ? `${path}.${key}` : key)
        );
      }
      return false;
    };

    // Check body, query, and params
    const hasXss =
      checkForXss(req.body, 'body') ||
      checkForXss(req.query, 'query') ||
      checkForXss(req.params, 'params');

    if (hasXss) {
      return res.status(400).json({
        success: false,
        error: 'Invalid input detected',
        code: 'XSS_ATTEMPT_DETECTED',
      });
    }

    next();
  } catch (error) {
    logger.error('XSS detection error:', error);
    next(error);
  }
}

/**
 * Security headers configuration for Helmet
 */
export const securityHeaders = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      baseUri: ["'self'"],
      fontSrc: ["'self'", 'https:', 'data:'],
      formAction: ["'self'"],
      frameAncestors: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      objectSrc: ["'none'"],
      scriptSrc: ["'self'"],
      scriptSrcAttr: ["'none'"],
      styleSrc: ["'self'", 'https:', "'unsafe-inline'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: { policy: 'same-origin' },
  crossOriginResourcePolicy: { policy: 'same-origin' },
  dnsPrefetchControl: { allow: false },
  frameguard: { action: 'deny' },
  hidePoweredBy: true,
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  ieNoOpen: true,
  noSniff: true,
  originAgentCluster: true,
  permittedCrossDomainPolicies: { permittedPolicies: 'none' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xssFilter: true,
};

/**
 * SQL injection detection patterns
 */
const sqlInjectionPatterns = [
  /(\bOR\b|\bAND\b)\s+\d+\s*=\s*\d+/gi,
  /UNION\s+SELECT/gi,
  /DROP\s+TABLE/gi,
  /DELETE\s+FROM/gi,
  /INSERT\s+INTO/gi,
  /UPDATE\s+\w+\s+SET/gi,
  /--/g,
  /;[\s]*DROP/gi,
  /;[\s]*DELETE/gi,
  /\/\*.*\*\//g,
];

/**
 * Detect potential SQL injection attempts
 */
export function detectSqlInjection(str: string): boolean {
  if (typeof str !== 'string') return false;
  return sqlInjectionPatterns.some(pattern => pattern.test(str));
}

/**
 * Middleware to detect SQL injection attempts
 */
export function sqlInjectionProtection(req: Request, res: Response, next: NextFunction): void {
  try {
    const checkForSqlInjection = (obj: any, path = ''): boolean => {
      if (typeof obj === 'string') {
        if (detectSqlInjection(obj)) {
          logger.warn('SQL injection attempt detected', {
            path,
            value: obj.substring(0, 100),
            ip: req.ip,
            method: req.method,
            url: req.url,
          });
          return true;
        }
      } else if (Array.isArray(obj)) {
        return obj.some((item, index) => checkForSqlInjection(item, `${path}[${index}]`));
      } else if (obj && typeof obj === 'object') {
        return Object.entries(obj).some(([key, value]) =>
          checkForSqlInjection(value, path ? `${path}.${key}` : key)
        );
      }
      return false;
    };

    // Check body, query, and params
    const hasSqlInjection =
      checkForSqlInjection(req.body, 'body') ||
      checkForSqlInjection(req.query, 'query') ||
      checkForSqlInjection(req.params, 'params');

    if (hasSqlInjection) {
      return res.status(400).json({
        success: false,
        error: 'Invalid input detected',
        code: 'SQL_INJECTION_ATTEMPT_DETECTED',
      });
    }

    next();
  } catch (error) {
    logger.error('SQL injection detection error:', error);
    next(error);
  }
}

/**
 * Combined security middleware
 */
export function securityMiddleware(options: {
  xssProtection?: boolean;
  sqlInjectionProtection?: boolean;
  allowHtml?: boolean;
} = {}) {
  const middlewares = [];

  if (options.xssProtection !== false) {
    middlewares.push(xssDetection);
    middlewares.push(xssProtection({ allowHtml: options.allowHtml }));
  }

  if (options.sqlInjectionProtection !== false) {
    middlewares.push(sqlInjectionProtection);
  }

  return (req: Request, res: Response, next: NextFunction): void => {
    let index = 0;

    const runNext = (err?: any): void => {
      if (err) return next(err);

      if (index < middlewares.length) {
        const middleware = middlewares[index++];
        middleware(req, res, runNext);
      } else {
        next();
      }
    };

    runNext();
  };
}

/**
 * Validate file upload security
 */
export function validateFileUpload(file: any): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }

  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    return { valid: false, error: 'File size exceeds 10MB limit' };
  }

  // Allowed MIME types
  const allowedMimeTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/webm',
    'audio/mpeg',
    'audio/wav',
  ];

  if (!allowedMimeTypes.includes(file.mimetype)) {
    return { valid: false, error: 'File type not allowed' };
  }

  // Check for double extensions
  const filename = file.originalname || file.name;
  const extensions = filename.split('.').slice(1);
  if (extensions.length > 1) {
    const dangerousExtensions = ['exe', 'bat', 'cmd', 'sh', 'php', 'jsp', 'asp'];
    if (extensions.some((ext: string) => dangerousExtensions.includes(ext.toLowerCase()))) {
      return { valid: false, error: 'Dangerous file extension detected' };
    }
  }

  return { valid: true };
}

export default {
  escapeHtml,
  stripHtmlTags,
  sanitizeString,
  sanitizeObject,
  xssProtection,
  xssDetection,
  detectXssAttempt,
  sqlInjectionProtection,
  detectSqlInjection,
  securityMiddleware,
  securityHeaders,
  validateFileUpload,
};
