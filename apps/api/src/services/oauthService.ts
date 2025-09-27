// --- START api/services/oauthService.ts --- //
// OAuth service for AI-InterviewSpark API
// Handles OAuth authentication with Google, Facebook, and LinkedIn

import axios from 'axios';
import crypto from 'crypto';
import { db } from '../database/connection';
import { users, oauthProviders } from '../database/schema';
import { eq, and } from 'drizzle-orm';
import { generateToken } from '../middleware/auth';
import { UserRole, UserProfile, createError } from '../types';
import { config } from '../config';
import { logger } from '../utils/logger';

// OAuth provider types
export type OAuthProvider = 'google' | 'facebook' | 'linkedin';

// OAuth user profile interface
export interface OAuthUserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  emailVerified?: boolean;
  locale?: string;
  provider: OAuthProvider;
  providerData: Record<string, any>;
}

// OAuth token response interface
export interface OAuthTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type: string;
  scope?: string;
}

// OAuth state interface for CSRF protection
export interface OAuthState {
  provider: OAuthProvider;
  timestamp: number;
  nonce: string;
  redirectUrl?: string;
}

export class OAuthService {
  // Generate secure state for CSRF protection
  static generateState(provider: OAuthProvider, redirectUrl?: string): string {
    const state: OAuthState = {
      provider,
      timestamp: Date.now(),
      nonce: crypto.randomBytes(16).toString('hex'),
      redirectUrl,
    };
    
    const stateString = JSON.stringify(state);
    return Buffer.from(stateString).toString('base64url');
  }

  // Validate and parse OAuth state
  static validateState(stateParam: string, expectedProvider: OAuthProvider): OAuthState {
    try {
      const stateString = Buffer.from(stateParam, 'base64url').toString();
      const state: OAuthState = JSON.parse(stateString);
      
      // Validate provider
      if (state.provider !== expectedProvider) {
        throw createError('Invalid OAuth provider in state', 400);
      }
      
      // Validate timestamp (state should not be older than 10 minutes)
      const maxAge = 10 * 60 * 1000; // 10 minutes
      if (Date.now() - state.timestamp > maxAge) {
        throw createError('OAuth state has expired', 400);
      }
      
      return state;
    } catch (error) {
      logger.error('OAuth state validation failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      throw createError('Invalid OAuth state', 400);
    }
  }

  // Get OAuth authorization URL
  static getAuthorizationUrl(provider: OAuthProvider, redirectUrl?: string): string {
    const state = this.generateState(provider, redirectUrl);
    const baseUrl = config.auth.oauth.redirectBaseUrl;
    
    switch (provider) {
      case 'google':
        if (!config.auth.oauth.google.enabled) {
          throw createError('Google OAuth is not configured', 500);
        }

        // Check for placeholder values
        if (config.auth.oauth.google.clientId?.includes('your-google-client-id')) {
          throw createError('Google OAuth client ID is not configured. Please set OAUTH_GOOGLE_CLIENT_ID in your environment variables.', 500);
        }
        
        const googleParams = new URLSearchParams({
          client_id: config.auth.oauth.google.clientId!,
          redirect_uri: `${baseUrl}/api/auth/oauth/google/callback`,
          response_type: 'code',
          scope: 'openid email profile',
          state,
          access_type: 'offline',
          prompt: 'consent',
        });
        
        return `https://accounts.google.com/o/oauth2/v2/auth?${googleParams.toString()}`;
      
      case 'facebook':
        if (!config.auth.oauth.facebook.enabled) {
          throw createError('Facebook OAuth is not configured', 500);
        }

        // Check for placeholder values
        if (config.auth.oauth.facebook.appId?.includes('your-facebook-app-id')) {
          throw createError('Facebook OAuth app ID is not configured. Please set OAUTH_FACEBOOK_APP_ID in your environment variables.', 500);
        }
        
        const facebookParams = new URLSearchParams({
          client_id: config.auth.oauth.facebook.appId!,
          redirect_uri: `${baseUrl}/api/auth/oauth/facebook/callback`,
          response_type: 'code',
          scope: 'email,public_profile',
          state,
        });
        
        return `https://www.facebook.com/v18.0/dialog/oauth?${facebookParams.toString()}`;
      
      case 'linkedin':
        if (!config.auth.oauth.linkedin.enabled) {
          throw createError('LinkedIn OAuth is not configured', 500);
        }

        // Check for placeholder values
        if (config.auth.oauth.linkedin.clientId?.includes('your-linkedin-client-id')) {
          throw createError('LinkedIn OAuth client ID is not configured. Please set OAUTH_LINKEDIN_CLIENT_ID in your environment variables.', 500);
        }
        
        const linkedinParams = new URLSearchParams({
          client_id: config.auth.oauth.linkedin.clientId!,
          redirect_uri: `${baseUrl}/api/auth/oauth/linkedin/callback`,
          response_type: 'code',
          scope: 'r_liteprofile r_emailaddress',
          state,
        });
        
        return `https://www.linkedin.com/oauth/v2/authorization?${linkedinParams.toString()}`;
      
      default:
        throw createError(`Unsupported OAuth provider: ${provider}`, 400);
    }
  }

  // Exchange authorization code for access token
  static async exchangeCodeForToken(
    provider: OAuthProvider,
    code: string
  ): Promise<OAuthTokenResponse> {
    const baseUrl = config.auth.oauth.redirectBaseUrl;
    
    try {
      switch (provider) {
        case 'google':
          const googleResponse = await axios.post('https://oauth2.googleapis.com/token', {
            client_id: config.auth.oauth.google.clientId,
            client_secret: config.auth.oauth.google.clientSecret,
            code,
            grant_type: 'authorization_code',
            redirect_uri: `${baseUrl}/api/auth/oauth/google/callback`,
          });
          
          return googleResponse.data;
        
        case 'facebook':
          const facebookParams = new URLSearchParams({
            client_id: config.auth.oauth.facebook.appId!,
            client_secret: config.auth.oauth.facebook.appSecret!,
            code,
            redirect_uri: `${baseUrl}/api/auth/oauth/facebook/callback`,
          });
          
          const facebookResponse = await axios.get(
            `https://graph.facebook.com/v18.0/oauth/access_token?${facebookParams.toString()}`
          );
          
          return facebookResponse.data;
        
        case 'linkedin':
          const linkedinResponse = await axios.post(
            'https://www.linkedin.com/oauth/v2/accessToken',
            new URLSearchParams({
              client_id: config.auth.oauth.linkedin.clientId!,
              client_secret: config.auth.oauth.linkedin.clientSecret!,
              code,
              grant_type: 'authorization_code',
              redirect_uri: `${baseUrl}/api/auth/oauth/linkedin/callback`,
            }),
            {
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
              },
            }
          );
          
          return linkedinResponse.data;
        
        default:
          throw createError(`Unsupported OAuth provider: ${provider}`, 400);
      }
    } catch (error: any) {
      logger.error('OAuth token exchange failed', {
        provider,
        error: error.response?.data || error.message,
      });
      throw createError('Failed to exchange authorization code for token', 500);
    }
  }

  // Fetch user profile from OAuth provider
  static async fetchUserProfile(
    provider: OAuthProvider,
    accessToken: string
  ): Promise<OAuthUserProfile> {
    try {
      switch (provider) {
        case 'google':
          const googleResponse = await axios.get(
            'https://www.googleapis.com/oauth2/v2/userinfo',
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );
          
          const googleData = googleResponse.data;
          return {
            id: googleData.id,
            email: googleData.email,
            firstName: googleData.given_name || '',
            lastName: googleData.family_name || '',
            avatar: googleData.picture,
            emailVerified: googleData.verified_email,
            locale: googleData.locale,
            provider: 'google',
            providerData: googleData,
          };
        
        case 'facebook':
          const facebookResponse = await axios.get(
            'https://graph.facebook.com/v18.0/me?fields=id,email,first_name,last_name,picture',
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );
          
          const facebookData = facebookResponse.data;
          return {
            id: facebookData.id,
            email: facebookData.email,
            firstName: facebookData.first_name || '',
            lastName: facebookData.last_name || '',
            avatar: facebookData.picture?.data?.url,
            emailVerified: true, // Facebook emails are generally verified
            provider: 'facebook',
            providerData: facebookData,
          };
        
        case 'linkedin':
          // LinkedIn requires two API calls: one for profile, one for email
          const [profileResponse, emailResponse] = await Promise.all([
            axios.get('https://api.linkedin.com/v2/people/~', {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }),
            axios.get('https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))', {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }),
          ]);
          
          const linkedinProfile = profileResponse.data;
          const linkedinEmail = emailResponse.data.elements?.[0]?.['handle~']?.emailAddress;
          
          return {
            id: linkedinProfile.id,
            email: linkedinEmail || '',
            firstName: linkedinProfile.localizedFirstName || '',
            lastName: linkedinProfile.localizedLastName || '',
            avatar: linkedinProfile.profilePicture?.['displayImage~']?.elements?.[0]?.identifiers?.[0]?.identifier,
            emailVerified: true, // LinkedIn emails are generally verified
            provider: 'linkedin',
            providerData: { ...linkedinProfile, email: linkedinEmail },
          };
        
        default:
          throw createError(`Unsupported OAuth provider: ${provider}`, 400);
      }
    } catch (error: any) {
      logger.error('OAuth profile fetch failed', {
        provider,
        error: error.response?.data || error.message,
      });
      throw createError('Failed to fetch user profile from OAuth provider', 500);
    }
  }

  // Authenticate or create user with OAuth profile
  static async authenticateWithOAuth(
    oauthProfile: OAuthUserProfile,
    tokenData: OAuthTokenResponse
  ): Promise<{ user: UserProfile; token: string; isNewUser: boolean }> {
    try {
      // Check if OAuth provider account already exists
      const existingOAuthProvider = await db.query.oauthProviders.findFirst({
        where: and(
          eq(oauthProviders.provider, oauthProfile.provider),
          eq(oauthProviders.providerId, oauthProfile.id)
        ),
        with: {
          user: true,
        },
      });

      if (existingOAuthProvider) {
        // Update OAuth provider data and tokens
        await db
          .update(oauthProviders)
          .set({
            accessToken: tokenData.access_token,
            refreshToken: tokenData.refresh_token,
            tokenExpiresAt: tokenData.expires_in
              ? new Date(Date.now() + tokenData.expires_in * 1000)
              : null,
            providerData: oauthProfile.providerData,
            updatedAt: new Date(),
          })
          .where(eq(oauthProviders.id, existingOAuthProvider.id));

        // Update user's last login
        await db
          .update(users)
          .set({
            lastLoginAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(users.id, existingOAuthProvider.userId));

        const user = existingOAuthProvider.user as any;
        const userProfile: UserProfile = {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role as UserRole,
          avatar: user.avatar || undefined,
          bio: user.bio || undefined,
          location: user.location || undefined,
          timezone: user.timezone || undefined,
          language: user.language,
          accessibility: user.accessibility || {
            highContrast: false,
            screenReader: false,
            captions: true,
          },
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        };

        const token = generateToken({
          userId: userProfile.id,
          email: userProfile.email,
          role: userProfile.role,
        });

        return { user: userProfile, token, isNewUser: false };
      }

      // Check if user exists with the same email
      const existingUser = await db.query.users.findFirst({
        where: eq(users.email, oauthProfile.email),
      });

      if (existingUser) {
        // Link OAuth account to existing user
        await db.insert(oauthProviders).values({
          userId: existingUser.id,
          provider: oauthProfile.provider,
          providerId: oauthProfile.id,
          providerEmail: oauthProfile.email,
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          tokenExpiresAt: tokenData.expires_in
            ? new Date(Date.now() + tokenData.expires_in * 1000)
            : null,
          providerData: oauthProfile.providerData,
        });

        // Update user's email verification and last login if OAuth email is verified
        const updateData: any = {
          lastLoginAt: new Date(),
          updatedAt: new Date(),
        };

        if (oauthProfile.emailVerified && !existingUser.emailVerified) {
          updateData.emailVerified = true;
        }

        await db
          .update(users)
          .set(updateData)
          .where(eq(users.id, existingUser.id));

        const userProfile: UserProfile = {
          id: existingUser.id,
          email: existingUser.email,
          firstName: existingUser.firstName,
          lastName: existingUser.lastName,
          role: existingUser.role as UserRole,
          avatar: existingUser.avatar || undefined,
          bio: existingUser.bio || undefined,
          location: existingUser.location || undefined,
          timezone: existingUser.timezone || undefined,
          language: existingUser.language,
          accessibility: existingUser.accessibility || {
            highContrast: false,
            screenReader: false,
            captions: true,
          },
          createdAt: existingUser.createdAt,
          updatedAt: existingUser.updatedAt,
        };

        const token = generateToken({
          userId: userProfile.id,
          email: userProfile.email,
          role: userProfile.role,
        });

        return { user: userProfile, token, isNewUser: false };
      }

      // Create new user with OAuth profile
      const [newUser] = await db
        .insert(users)
        .values({
          email: oauthProfile.email,
          firstName: oauthProfile.firstName,
          lastName: oauthProfile.lastName,
          role: 'job_seeker',
          avatar: oauthProfile.avatar,
          emailVerified: oauthProfile.emailVerified || false,
          lastLoginAt: new Date(),
        })
        .returning();

      // Create OAuth provider record
      await db.insert(oauthProviders).values({
        userId: newUser.id,
        provider: oauthProfile.provider,
        providerId: oauthProfile.id,
        providerEmail: oauthProfile.email,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        tokenExpiresAt: tokenData.expires_in
          ? new Date(Date.now() + tokenData.expires_in * 1000)
          : null,
        providerData: oauthProfile.providerData,
      });

      const userProfile: UserProfile = {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role as UserRole,
        avatar: newUser.avatar || undefined,
        bio: newUser.bio || undefined,
        location: newUser.location || undefined,
        timezone: newUser.timezone || undefined,
        language: newUser.language,
        accessibility: newUser.accessibility || {
          highContrast: false,
          screenReader: false,
          captions: true,
        },
        createdAt: newUser.createdAt,
        updatedAt: newUser.updatedAt,
      };

      const token = generateToken({
        userId: userProfile.id,
        email: userProfile.email,
        role: userProfile.role,
      });

      logger.info('New user created via OAuth', {
        provider: oauthProfile.provider,
        email: oauthProfile.email,
        userId: newUser.id,
      });

      return { user: userProfile, token, isNewUser: true };
    } catch (error: any) {
      logger.error('OAuth authentication failed', {
        provider: oauthProfile.provider,
        email: oauthProfile.email,
        error: error.message,
      });
      throw createError('OAuth authentication failed', 500);
    }
  }

  // Get user's OAuth providers
  static async getUserOAuthProviders(userId: string) {
    try {
      return await db.query.oauthProviders.findMany({
        where: eq(oauthProviders.userId, userId),
        columns: {
          id: true,
          provider: true,
          providerEmail: true,
          createdAt: true,
          // Exclude sensitive data like tokens
        },
      });
    } catch (error: any) {
      logger.error('Failed to fetch user OAuth providers', {
        userId,
        error: error.message,
      });
      throw createError('Failed to fetch OAuth providers', 500);
    }
  }

  // Unlink OAuth provider from user account
  static async unlinkOAuthProvider(userId: string, provider: OAuthProvider) {
    try {
      // Check if user has a password or other OAuth providers
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
        with: {
          oauthProviders: true,
        },
      });

      if (!user) {
        throw createError('User not found', 404);
      }

      // Ensure user has alternative authentication method
      const hasPassword = !!user.password;
      const otherProviders = user.oauthProviders.filter(p => p.provider !== provider);

      if (!hasPassword && otherProviders.length === 0) {
        throw createError(
          'Cannot unlink the only authentication method. Please set a password first.',
          400
        );
      }

      // Remove OAuth provider
      const result = await db
        .delete(oauthProviders)
        .where(
          and(
            eq(oauthProviders.userId, userId),
            eq(oauthProviders.provider, provider)
          )
        )
        .returning();

      if (result.length === 0) {
        throw createError('OAuth provider not found', 404);
      }

      logger.info('OAuth provider unlinked', {
        userId,
        provider,
      });

      return { success: true, message: 'OAuth provider unlinked successfully' };
    } catch (error: any) {
      if (error.code) {
        throw error;
      }
      logger.error('Failed to unlink OAuth provider', {
        userId,
        provider,
        error: error.message,
      });
      throw createError('Failed to unlink OAuth provider', 500);
    }
  }
}

export default OAuthService;
