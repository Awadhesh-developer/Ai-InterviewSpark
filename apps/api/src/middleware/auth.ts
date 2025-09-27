// --- START api/middleware/auth.ts --- //
// Authentication middleware for AI-InterviewSpark API
// Handles JWT token validation, user authentication, and role-based access control

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { db } from '../database/connection';
import { users } from '../database/schema';
import { eq } from 'drizzle-orm';
import { UserRole } from '../types';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: UserRole;
        firstName: string;
        lastName: string;
      };
    }
  }
}

// JWT token interface
interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}

// Generate JWT token
export const generateToken = (payload: Omit<JWTPayload, 'iat' | 'exp'>): string => {
  // Ensure payload is a plain object and secret is a string
  const secret = config.auth.jwtSecret || process.env.JWT_SECRET || 'fallback-secret';
  return jwt.sign(payload as object, secret, { expiresIn: '24h' });
};

// Verify JWT token
export const verifyToken = (token: string): JWTPayload | null => {
  try {
    return jwt.verify(token, config.auth.jwtSecret) as JWTPayload;
  } catch (error) {
    return null;
  }
};

// Extract token from request headers
export const extractToken = (req: Request): string | null => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
};

// Main authentication middleware
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractToken(req);
    
    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Authentication token required',
      });
      return;
    }

    const payload = verifyToken(token);
    if (!payload) {
      res.status(401).json({
        success: false,
        error: 'Invalid or expired token',
      });
      return;
    }

    // Fetch user from database to ensure they still exist
    const user = await db.query.users.findFirst({
      where: eq(users.id, payload.userId),
      columns: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
      },
    });

    if (!user) {
      res.status(401).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role as UserRole,
      firstName: user.firstName,
      lastName: user.lastName,
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication failed',
    });
  }
};

// Alias for authenticate
export const authenticateToken = authenticate;

// Role-based access control middleware
export const requireRole = (allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
      });
      return;
    }

    next();
  };
};

// Require specific role middleware
export const requireJobSeeker = requireRole([UserRole.JOB_SEEKER]);
export const requireExpert = requireRole([UserRole.EXPERT]);
export const requireAdmin = requireRole([UserRole.ADMIN]);
export const requireExpertOrAdmin = requireRole([UserRole.EXPERT, UserRole.ADMIN]);

// Optional authentication middleware (doesn't fail if no token)
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractToken(req);
    
    if (!token) {
      next();
      return;
    }

    const payload = verifyToken(token);
    if (!payload) {
      next();
      return;
    }

    // Fetch user from database
    const user = await db.query.users.findFirst({
      where: eq(users.id, payload.userId),
      columns: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
      },
    });

    if (user) {
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role as UserRole,
        firstName: user.firstName,
        lastName: user.lastName,
      };
    }

    next();
  } catch (error) {
    console.error('Optional authentication error:', error);
    next();
  }
};

// Rate limiting helper for authentication endpoints
export const authRateLimit = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    success: false,
    error: 'Too many authentication attempts, please try again later',
  },
};

// Password validation helper
export const validatePassword = (password: string): boolean => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

// Email validation helper
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Export authentication utilities
export const authUtils = {
  generateToken,
  verifyToken,
  extractToken,
  validatePassword,
  validateEmail,
}; 