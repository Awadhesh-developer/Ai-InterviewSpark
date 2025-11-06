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
        refreshToken: result.refreshToken,
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

// Refresh token
router.post('/refresh', [
  body('refreshToken').notEmpty().withMessage('Refresh token is required'),
], asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array(),
    });
  }

  const { refreshToken } = req.body;

  try {
    // Verify the refresh token
    const { verifyToken } = await import('../middleware/auth');
    const decoded = verifyToken(refreshToken);

    // Verify it's a refresh token
    if (!decoded || decoded.type !== 'refresh') {
      return res.status(401).json({
        success: false,
        error: 'Invalid refresh token',
      });
    }

    // Generate new access token
    const { generateToken } = await import('../middleware/auth');
    const newAccessToken = generateToken({
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    });

    logger.info('Token refreshed successfully', { userId: decoded.userId });

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        token: newAccessToken,
      },
    });
  } catch (error: any) {
    logger.warn('Token refresh failed', { error: error.message });

    return res.status(401).json({
      success: false,
      error: 'Invalid or expired refresh token',
    });
  }
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

// Forgot password
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

  try {
    const result = await UserService.requestPasswordReset(email);

    // Send email if user exists
    if (result) {
      const { EmailService } = await import('../services/emailService');
      // Get user info for email
      const user = await UserService.getUserByEmail(email);
      if (user) {
        await EmailService.sendPasswordResetEmail(email, user.firstName, result.token);
      }
    }
  } catch (error) {
    logger.error('Password reset error:', error);
    // Don't reveal error to user
  }

  // Always return success (don't reveal if user exists)
  logger.info('Password reset requested', { email });

  res.json({
    success: true,
    message: 'If an account with this email exists, a password reset link has been sent.',
  });
}));

// Reset password
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

  try {
    await UserService.resetPassword(token, password);

    logger.info('Password reset successful');

    res.json({
      success: true,
      message: 'Password has been reset successfully. You can now log in with your new password.',
    });
  } catch (error: any) {
    logger.warn('Password reset failed', { error: error.message });

    return res.status(400).json({
      success: false,
      error: error.message || 'Failed to reset password',
    });
  }
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

  try {
    await UserService.changePassword(req.user.id, currentPassword, newPassword);

    logger.info('Password changed successfully', { userId: req.user.id });

    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error: any) {
    logger.warn('Password change failed', { userId: req.user.id, error: error.message });

    return res.status(error.statusCode || 400).json({
      success: false,
      error: error.message || 'Failed to change password',
    });
  }
}));

// Verify email
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

  try {
    await UserService.verifyEmail(token);

    logger.info('Email verified successfully');

    res.json({
      success: true,
      message: 'Email verified successfully! You can now access all features.',
    });
  } catch (error: any) {
    logger.warn('Email verification failed', { error: error.message });

    return res.status(400).json({
      success: false,
      error: error.message || 'Failed to verify email',
    });
  }
}));

export default router; 