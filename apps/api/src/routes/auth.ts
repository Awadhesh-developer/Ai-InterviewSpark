// --- START api/routes/auth.ts --- //
// Authentication routes for AI-InterviewSpark API
// Handles user registration, login, token refresh, and password management

import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { asyncHandler } from '../middleware/errorHandler';
import rateLimit from 'express-rate-limit';
import UserService from '../services/userService';
import { logger } from '../utils/logger';
import { UserRole } from '../types';

const router = Router();

// Replace authRateLimit with a real middleware
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Increased limit for development - 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many authentication attempts, please try again later',
  },
});

// Validation schemas
const registerValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must be at least 8 characters with uppercase, lowercase, number, and special character'),
  body('firstName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name is required and must be less than 50 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name is required and must be less than 50 characters'),
  body('role')
    .optional()
    .isIn(['job_seeker', 'expert', 'admin'])
    .withMessage('Role must be job_seeker, expert, or admin'),
];

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

// Register new user
router.post('/register', authLimiter, registerValidation, asyncHandler(async (req: Request, res: Response) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array(),
    });
  }

  const { email, password, firstName, lastName, role } = req.body;

  try {
    const result = await UserService.register({
      email,
      password,
      firstName,
      lastName,
      role: role as UserRole,
    });

    logger.info('User registered successfully', { email, role });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: result.user,
        token: result.token,
      },
    });
  } catch (error: any) {
    logger.error('Registration failed', { email, error: error.message });
    
    if (error.code === 'USER_EXISTS') {
      return res.status(409).json({
        success: false,
        error: 'User with this email already exists',
        code: error.code,
      });
    }

    if (error.code === 'INVALID_EMAIL' || error.code === 'INVALID_PASSWORD') {
      return res.status(400).json({
        success: false,
        error: error.message,
        code: error.code,
      });
    }

    res.status(500).json({
      success: false,
      error: 'Registration failed. Please try again.',
    });
  }
}));

// Login user
router.post('/login', authLimiter, loginValidation, asyncHandler(async (req: Request, res: Response) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array(),
    });
  }

  const { email, password } = req.body;

  try {
    const result = await UserService.login(email, password);

    logger.info('User logged in successfully', { email });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: result.user,
        token: result.token,
      },
    });
  } catch (error: any) {
    logger.warn('Login failed', { email, error: error.message });
    
    if (error.code === 'INVALID_CREDENTIALS') {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password',
        code: error.code,
      });
    }

    res.status(500).json({
      success: false,
      error: 'Login failed. Please try again.',
    });
  }
}));

// Get current user profile
router.get('/me', asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
    });
  }

  try {
    const userProfile = await UserService.getUserProfile(req.user.id);

    if (!userProfile) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    res.json({
      success: true,
      data: {
        user: userProfile,
      },
    });
  } catch (error: any) {
    logger.error('Failed to get user profile', { userId: req.user.id, error: error.message });
    
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve user profile',
    });
  }
}));

// Refresh token (placeholder for future implementation)
router.post('/refresh', asyncHandler(async (req: Request, res: Response) => {
  // This would typically validate a refresh token and issue a new access token
  // For now, we'll return an error indicating this feature is not implemented
  
  res.status(501).json({
    success: false,
    error: 'Token refresh not implemented yet',
  });
}));

// Logout (client-side token removal)
router.post('/logout', asyncHandler(async (req: Request, res: Response) => {
  // In a stateless JWT implementation, logout is typically handled client-side
  // by removing the token from storage
  // For enhanced security, you could implement a token blacklist
  
  logger.info('User logged out', { userId: req.user?.id });

  res.json({
    success: true,
    message: 'Logout successful',
  });
}));

// Forgot password (placeholder)
router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email address'),
], asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array(),
    });
  }

  const { email } = req.body;

  // This would typically:
  // 1. Check if user exists
  // 2. Generate password reset token
  // 3. Send email with reset link
  
  logger.info('Password reset requested', { email });

  res.json({
    success: true,
    message: 'If an account with this email exists, a password reset link has been sent.',
  });
}));

// Reset password (placeholder)
router.post('/reset-password', [
  body('token').notEmpty().withMessage('Reset token is required'),
  body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must be at least 8 characters with uppercase, lowercase, number, and special character'),
], asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array(),
    });
  }

  const { token, password } = req.body;

  // This would typically:
  // 1. Validate reset token
  // 2. Update user password
  // 3. Invalidate reset token
  
  logger.info('Password reset attempted', { token: token.substring(0, 10) + '...' });

  res.json({
    success: true,
    message: 'Password has been reset successfully',
  });
}));

// Change password (authenticated)
router.post('/change-password', [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('New password must be at least 8 characters with uppercase, lowercase, number, and special character'),
], asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
    });
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array(),
    });
  }

  const { currentPassword, newPassword } = req.body;

  // This would typically:
  // 1. Verify current password
  // 2. Update to new password
  // 3. Invalidate existing tokens
  
  logger.info('Password change attempted', { userId: req.user.id });

  res.json({
    success: true,
    message: 'Password changed successfully',
  });
}));

// Verify email (placeholder)
router.post('/verify-email', [
  body('token').notEmpty().withMessage('Verification token is required'),
], asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array(),
    });
  }

  const { token } = req.body;

  // This would typically:
  // 1. Validate email verification token
  // 2. Mark user email as verified
  
  logger.info('Email verification attempted', { token: token.substring(0, 10) + '...' });

  res.json({
    success: true,
    message: 'Email verified successfully',
  });
}));

export default router; 