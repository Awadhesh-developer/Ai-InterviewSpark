// --- START api/routes/oauth.ts --- //
// OAuth authentication routes for AI-InterviewSpark API
// Handles OAuth initiation, callbacks, and account linking

import { Router, Request, Response } from 'express';
import { body, query, validationResult } from 'express-validator';
import { isURL } from 'validator';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticate } from '../middleware/auth';
import OAuthService, { OAuthProvider } from '../services/oauthService';
import { logger } from '../utils/logger';
import { config } from '../config';
import {
  oauthRateLimits,
  oauthSecurityHeaders,
  validateOAuthState,
  oauthCSRFProtection,
  validateOAuthProvider,
  oauthErrorHandler,
  OAuthSecureRequest,
} from '../middleware/oauthSecurity';

const router = Router();

// Apply OAuth security headers to all routes
router.use(oauthSecurityHeaders);

// OAuth initiation endpoint
router.get('/auth/:provider',
  oauthRateLimits.general,
  validateOAuthProvider,
  oauthCSRFProtection,
  [
    query('redirect_url').optional().custom((value) => {
      if (!value) return true; // Optional field
      // Allow localhost URLs and proper URLs with TLD
      return isURL(value) || isURL(value, { require_tld: false }) && value.includes('localhost');
    }).withMessage('Invalid redirect URL'),
  ],
  asyncHandler(async (req: OAuthSecureRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array(),
    });
  }

  const provider = req.params.provider as OAuthProvider;
  const redirectUrl = req.query.redirect_url as string;

  try {
    const authorizationUrl = OAuthService.getAuthorizationUrl(provider, redirectUrl);
    
    logger.info('OAuth authorization initiated', {
      provider,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });

    res.json({
      success: true,
      message: 'OAuth authorization URL generated',
      data: {
        authorizationUrl,
        provider,
      },
    });
  } catch (error: any) {
    logger.error('OAuth initiation failed', {
      provider,
      error: error.message,
      ip: req.ip,
    });

    if (error.code) {
      return res.status(error.statusCode || 500).json({
        success: false,
        error: error.message,
        code: error.code,
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to initiate OAuth authentication',
    });
  }
}));

// OAuth callback endpoint
router.get('/auth/:provider/callback',
  oauthRateLimits.callback,
  validateOAuthProvider,
  validateOAuthState,
  [
    query('code').notEmpty().withMessage('Authorization code is required'),
    query('state').notEmpty().withMessage('State parameter is required'),
  ],
  asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorUrl = `${config.auth.oauth.failureRedirectUrl}?error=validation_failed`;
    return res.redirect(errorUrl);
  }

  const provider = req.params.provider as OAuthProvider;
  const code = req.query.code as string;
  const state = req.query.state as string;
  const error = req.query.error as string;

  // Handle OAuth errors
  if (error) {
    logger.warn('OAuth provider returned error', {
      provider,
      error,
      ip: req.ip,
    });
    
    const errorUrl = `${config.auth.oauth.failureRedirectUrl}?error=${encodeURIComponent(error)}`;
    return res.redirect(errorUrl);
  }

  try {
    // State is already validated by middleware
    const stateData = (req as any).oauthState;
    
    // Exchange code for token
    const tokenData = await OAuthService.exchangeCodeForToken(provider, code);
    
    // Fetch user profile
    const userProfile = await OAuthService.fetchUserProfile(provider, tokenData.access_token);
    
    // Authenticate or create user
    const authResult = await OAuthService.authenticateWithOAuth(userProfile, tokenData);
    
    logger.info('OAuth authentication successful', {
      provider,
      userId: authResult.user.id,
      email: authResult.user.email,
      isNewUser: authResult.isNewUser,
      ip: req.ip,
    });

    // Determine redirect URL
    const redirectUrl = stateData.redirectUrl || config.auth.oauth.successRedirectUrl;
    const successUrl = `${redirectUrl}?token=${authResult.token}&user=${encodeURIComponent(JSON.stringify(authResult.user))}&new_user=${authResult.isNewUser}`;
    
    res.redirect(successUrl);
  } catch (error: any) {
    logger.error('OAuth callback failed', {
      provider,
      error: error.message,
      ip: req.ip,
    });

    const errorUrl = `${config.auth.oauth.failureRedirectUrl}?error=${encodeURIComponent(error.message || 'authentication_failed')}`;
    res.redirect(errorUrl);
  }
}));

// Get user's OAuth providers (authenticated endpoint)
router.get('/providers', authenticate, asyncHandler(async (req: Request, res: Response) => {
  try {
    const providers = await OAuthService.getUserOAuthProviders(req.user!.id);
    
    res.json({
      success: true,
      message: 'OAuth providers retrieved successfully',
      data: {
        providers,
      },
    });
  } catch (error: any) {
    logger.error('Failed to fetch OAuth providers', {
      userId: req.user?.id,
      error: error.message,
    });

    res.status(500).json({
      success: false,
      error: 'Failed to fetch OAuth providers',
    });
  }
}));

// Link OAuth provider to existing account (authenticated endpoint)
router.post('/link/:provider',
  authenticate,
  oauthRateLimits.linking,
  validateOAuthProvider,
  oauthCSRFProtection,
  [
    query('redirect_url').optional().custom((value) => {
      if (!value) return true; // Optional field
      // Allow localhost URLs and proper URLs with TLD
      return isURL(value) || isURL(value, { require_tld: false }) && value.includes('localhost');
    }).withMessage('Invalid redirect URL'),
  ],
  asyncHandler(async (req: OAuthSecureRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array(),
    });
  }

  const provider = req.params.provider as OAuthProvider;
  const redirectUrl = req.query.redirect_url as string;

  try {
    // Check if provider is already linked
    const existingProviders = await OAuthService.getUserOAuthProviders(req.user!.id);
    const isAlreadyLinked = existingProviders.some(p => p.provider === provider);
    
    if (isAlreadyLinked) {
      return res.status(409).json({
        success: false,
        error: 'OAuth provider is already linked to this account',
      });
    }

    const authorizationUrl = OAuthService.getAuthorizationUrl(provider, redirectUrl);
    
    logger.info('OAuth account linking initiated', {
      provider,
      userId: req.user!.id,
      ip: req.ip,
    });

    res.json({
      success: true,
      message: 'OAuth account linking URL generated',
      data: {
        authorizationUrl,
        provider,
      },
    });
  } catch (error: any) {
    logger.error('OAuth account linking failed', {
      provider,
      userId: req.user?.id,
      error: error.message,
    });

    if (error.code) {
      return res.status(error.statusCode || 500).json({
        success: false,
        error: error.message,
        code: error.code,
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to initiate OAuth account linking',
    });
  }
}));

// Unlink OAuth provider from account (authenticated endpoint)
router.delete('/unlink/:provider',
  authenticate,
  oauthRateLimits.linking,
  validateOAuthProvider,
  [
    // No additional validation needed for DELETE
  ],
  asyncHandler(async (req: Request, res: Response) => {
  const provider = req.params.provider as OAuthProvider;

  try {
    const result = await OAuthService.unlinkOAuthProvider(req.user!.id, provider);
    
    logger.info('OAuth provider unlinked', {
      provider,
      userId: req.user!.id,
      ip: req.ip,
    });

    res.json({
      success: true,
      message: result.message,
    });
  } catch (error: any) {
    logger.error('OAuth provider unlinking failed', {
      provider,
      userId: req.user?.id,
      error: error.message,
    });

    if (error.code) {
      return res.status(error.statusCode || 500).json({
        success: false,
        error: error.message,
        code: error.code,
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to unlink OAuth provider',
    });
  }
}));

// Apply OAuth error handler at the end (for actual errors)
router.use(oauthErrorHandler);

export default router;
