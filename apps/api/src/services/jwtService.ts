// --- START api/services/jwtService.ts --- //
// JWT Service for AI-InterviewSpark API
// Handles JWT token generation, validation, and management

import jwt from 'jsonwebtoken';
import { config } from '../config';
import { createError } from '../types';

// JWT payload interfaces
export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface RefreshTokenPayload {
  userId: string;
  tokenVersion: number;
  iat?: number;
  exp?: number;
}

export interface VerificationTokenPayload {
  userId: string;
  email: string;
  type: 'email_verification' | 'password_reset';
  iat?: number;
  exp?: number;
}

export interface SessionTokenPayload {
  userId: string;
  sessionId: string;
  iat?: number;
  exp?: number;
}

export interface APITokenPayload {
  userId: string;
  permissions: string[];
  iat?: number;
  exp?: number;
}

export interface WebSocketTokenPayload {
  userId: string;
  connectionId: string;
  iat?: number;
  exp?: number;
}

// JWT token types
export type TokenType = 
  | 'access'
  | 'refresh'
  | 'verification'
  | 'reset'
  | 'session'
  | 'api'
  | 'websocket';

// JWT configuration
interface JWTConfig {
  secret: string;
  expiresIn: string;
  algorithm: jwt.Algorithm;
}

export class JWTService {
  private static configs: Record<TokenType, JWTConfig> = {
    access: {
      secret: config.jwt.accessSecret || config.jwt.secret,
      expiresIn: '15m', // 15 minutes
      algorithm: 'HS256'
    },
    refresh: {
      secret: config.jwt.refreshSecret || config.jwt.secret,
      expiresIn: '7d', // 7 days
      algorithm: 'HS256'
    },
    verification: {
      secret: config.jwt.verificationSecret || config.jwt.secret,
      expiresIn: '24h', // 24 hours
      algorithm: 'HS256'
    },
    reset: {
      secret: config.jwt.resetSecret || config.jwt.secret,
      expiresIn: '1h', // 1 hour
      algorithm: 'HS256'
    },
    session: {
      secret: config.jwt.sessionSecret || config.jwt.secret,
      expiresIn: '30m', // 30 minutes
      algorithm: 'HS256'
    },
    api: {
      secret: config.jwt.apiSecret || config.jwt.secret,
      expiresIn: '1y', // 1 year
      algorithm: 'HS256'
    },
    websocket: {
      secret: config.jwt.websocketSecret || config.jwt.secret,
      expiresIn: '1h', // 1 hour
      algorithm: 'HS256'
    }
  };

  // Generate access token
  static generateAccessToken(payload: JWTPayload): string {
    try {
      const config = this.configs.access;
      const secret = config.secret || process.env.JWT_SECRET || 'fallback-secret';
      const options: jwt.SignOptions = {
        expiresIn: config.expiresIn as any,
        algorithm: config.algorithm as jwt.Algorithm,
        issuer: 'ai-interviewspark',
        audience: 'ai-interviewspark-users'
      };
      return jwt.sign(payload, secret, options);
    } catch (error) {
      console.error('Error generating access token:', error);
      throw createError('Failed to generate access token', 500);
    }
  }

  // Generate refresh token
  static generateRefreshToken(payload: RefreshTokenPayload): string {
    try {
      const config = this.configs.refresh;
      const secret = config.secret || process.env.JWT_SECRET || 'fallback-secret';
      const options: jwt.SignOptions = {
        expiresIn: config.expiresIn as any,
        algorithm: config.algorithm as jwt.Algorithm,
        issuer: 'ai-interviewspark',
        audience: 'ai-interviewspark-users'
      };
      return jwt.sign(payload, secret, options);
    } catch (error) {
      console.error('Error generating refresh token:', error);
      throw createError('Failed to generate refresh token', 500);
    }
  }

  // Generate verification token
  static generateVerificationToken(payload: VerificationTokenPayload): string {
    try {
      const config = this.configs.verification;
      const secret = config.secret || process.env.JWT_SECRET || 'fallback-secret';
      return jwt.sign(payload, secret, {
        expiresIn: config.expiresIn as any,
        algorithm: config.algorithm as jwt.Algorithm,
        issuer: 'ai-interviewspark',
        audience: 'ai-interviewspark-verification'
      });
    } catch (error) {
      console.error('Error generating verification token:', error);
      throw createError('Failed to generate verification token', 500);
    }
  }

  // Generate password reset token
  static generateResetToken(payload: VerificationTokenPayload): string {
    try {
      const config = this.configs.reset;
      const secret = config.secret || process.env.JWT_SECRET || 'fallback-secret';
      return jwt.sign(payload, secret, {
        expiresIn: config.expiresIn as any,
        algorithm: config.algorithm as jwt.Algorithm,
        issuer: 'ai-interviewspark',
        audience: 'ai-interviewspark-reset'
      });
    } catch (error) {
      console.error('Error generating reset token:', error);
      throw createError('Failed to generate reset token', 500);
    }
  }

  // Generate session token
  static generateSessionToken(payload: SessionTokenPayload): string {
    try {
      const config = this.configs.session;
      const secret = config.secret || process.env.JWT_SECRET || 'fallback-secret';
      return jwt.sign(payload, secret, {
        expiresIn: config.expiresIn as any,
        algorithm: config.algorithm as jwt.Algorithm,
        issuer: 'ai-interviewspark',
        audience: 'ai-interviewspark-sessions'
      });
    } catch (error) {
      console.error('Error generating session token:', error);
      throw createError('Failed to generate session token', 500);
    }
  }

  // Generate API token
  static generateAPIToken(payload: APITokenPayload): string {
    try {
      const config = this.configs.api;
      const secret = config.secret || process.env.JWT_SECRET || 'fallback-secret';
      return jwt.sign(payload, secret, {
        expiresIn: config.expiresIn as any,
        algorithm: config.algorithm as jwt.Algorithm,
        issuer: 'ai-interviewspark',
        audience: 'ai-interviewspark-api'
      });
    } catch (error) {
      console.error('Error generating API token:', error);
      throw createError('Failed to generate API token', 500);
    }
  }

  // Generate WebSocket token
  static generateWebSocketToken(payload: WebSocketTokenPayload): string {
    try {
      const config = this.configs.websocket;
      const secret = config.secret || process.env.JWT_SECRET || 'fallback-secret';
      return jwt.sign(payload, secret, {
        expiresIn: config.expiresIn as any,
        algorithm: config.algorithm as jwt.Algorithm,
        issuer: 'ai-interviewspark',
        audience: 'ai-interviewspark-websocket'
      });
    } catch (error) {
      console.error('Error generating WebSocket token:', error);
      throw createError('Failed to generate WebSocket token', 500);
    }
  }

  // Verify access token
  static verifyAccessToken(token: string): JWTPayload {
    try {
      const config = this.configs.access;
      const decoded = jwt.verify(token, config.secret, {
        algorithms: [config.algorithm],
        issuer: 'ai-interviewspark',
        audience: 'ai-interviewspark-users'
      }) as JWTPayload;
      
      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw createError('Access token expired', 401);
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw createError('Invalid access token', 401);
      } else {
        console.error('Error verifying access token:', error);
        throw createError('Failed to verify access token', 500);
      }
    }
  }

  // Verify refresh token
  static verifyRefreshToken(token: string): RefreshTokenPayload {
    try {
      const config = this.configs.refresh;
      const decoded = jwt.verify(token, config.secret, {
        algorithms: [config.algorithm],
        issuer: 'ai-interviewspark',
        audience: 'ai-interviewspark-users'
      }) as RefreshTokenPayload;
      
      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw createError('Refresh token expired', 401);
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw createError('Invalid refresh token', 401);
      } else {
        console.error('Error verifying refresh token:', error);
        throw createError('Failed to verify refresh token', 500);
      }
    }
  }

  // Verify verification token
  static verifyVerificationToken(token: string): VerificationTokenPayload {
    try {
      const config = this.configs.verification;
      const decoded = jwt.verify(token, config.secret, {
        algorithms: [config.algorithm],
        issuer: 'ai-interviewspark',
        audience: 'ai-interviewspark-verification'
      }) as VerificationTokenPayload;
      
      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw createError('Verification token expired', 401);
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw createError('Invalid verification token', 401);
      } else {
        console.error('Error verifying verification token:', error);
        throw createError('Failed to verify verification token', 500);
      }
    }
  }

  // Verify reset token
  static verifyResetToken(token: string): VerificationTokenPayload {
    try {
      const config = this.configs.reset;
      const decoded = jwt.verify(token, config.secret, {
        algorithms: [config.algorithm],
        issuer: 'ai-interviewspark',
        audience: 'ai-interviewspark-reset'
      }) as VerificationTokenPayload;
      
      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw createError('Reset token expired', 401);
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw createError('Invalid reset token', 401);
      } else {
        console.error('Error verifying reset token:', error);
        throw createError('Failed to verify reset token', 500);
      }
    }
  }

  // Verify session token
  static verifySessionToken(token: string): SessionTokenPayload {
    try {
      const config = this.configs.session;
      const decoded = jwt.verify(token, config.secret, {
        algorithms: [config.algorithm],
        issuer: 'ai-interviewspark',
        audience: 'ai-interviewspark-sessions'
      }) as SessionTokenPayload;
      
      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw createError('Session token expired', 401);
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw createError('Invalid session token', 401);
      } else {
        console.error('Error verifying session token:', error);
        throw createError('Failed to verify session token', 500);
      }
    }
  }

  // Verify API token
  static verifyAPIToken(token: string): APITokenPayload {
    try {
      const config = this.configs.api;
      const decoded = jwt.verify(token, config.secret, {
        algorithms: [config.algorithm],
        issuer: 'ai-interviewspark',
        audience: 'ai-interviewspark-api'
      }) as APITokenPayload;
      
      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw createError('API token expired', 401);
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw createError('Invalid API token', 401);
      } else {
        console.error('Error verifying API token:', error);
        throw createError('Failed to verify API token', 500);
      }
    }
  }

  // Verify WebSocket token
  static verifyWebSocketToken(token: string): WebSocketTokenPayload {
    try {
      const config = this.configs.websocket;
      const decoded = jwt.verify(token, config.secret, {
        algorithms: [config.algorithm],
        issuer: 'ai-interviewspark',
        audience: 'ai-interviewspark-websocket'
      }) as WebSocketTokenPayload;
      
      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw createError('WebSocket token expired', 401);
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw createError('Invalid WebSocket token', 401);
      } else {
        console.error('Error verifying WebSocket token:', error);
        throw createError('Failed to verify WebSocket token', 500);
      }
    }
  }

  // Decode token without verification (for debugging)
  static decodeToken(token: string): any {
    try {
      return jwt.decode(token, { complete: true });
    } catch (error) {
      console.error('Error decoding token:', error);
      throw createError('Failed to decode token', 500);
    }
  }

  // Get token expiration time
  static getTokenExpiration(token: string): Date | null {
    try {
      const decoded = jwt.decode(token) as any;
      if (decoded && decoded.exp) {
        return new Date(decoded.exp * 1000);
      }
      return null;
    } catch (error) {
      console.error('Error getting token expiration:', error);
      return null;
    }
  }

  // Check if token is expired
  static isTokenExpired(token: string): boolean {
    try {
      const expiration = this.getTokenExpiration(token);
      if (!expiration) return true;
      return expiration < new Date();
    } catch (error) {
      console.error('Error checking token expiration:', error);
      return true;
    }
  }

  // Generate token pair (access + refresh)
  static generateTokenPair(userPayload: JWTPayload, tokenVersion: number = 1): {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  } {
    try {
      const accessToken = this.generateAccessToken(userPayload);
      const refreshToken = this.generateRefreshToken({
        userId: userPayload.userId,
        tokenVersion
      });
      
      // Get expiration time in seconds
      const expiresIn = 15 * 60; // 15 minutes in seconds
      
      return {
        accessToken,
        refreshToken,
        expiresIn
      };
    } catch (error) {
      console.error('Error generating token pair:', error);
      throw createError('Failed to generate token pair', 500);
    }
  }

  // Refresh access token using refresh token
  static refreshAccessToken(refreshToken: string, userPayload: JWTPayload): {
    accessToken: string;
    expiresIn: number;
  } {
    try {
      // Verify refresh token
      const refreshPayload = this.verifyRefreshToken(refreshToken);
      
      // Generate new access token
      const accessToken = this.generateAccessToken(userPayload);
      const expiresIn = 15 * 60; // 15 minutes in seconds
      
      return {
        accessToken,
        expiresIn
      };
    } catch (error) {
      console.error('Error refreshing access token:', error);
      throw createError('Failed to refresh access token', 401);
    }
  }

  // Validate JWT configuration
  static validateConfiguration(): boolean {
    try {
      const requiredSecrets = [
        'accessSecret',
        'refreshSecret',
        'verificationSecret',
        'resetSecret',
        'sessionSecret',
        'apiSecret',
        'websocketSecret'
      ];
      
      for (const secret of requiredSecrets) {
        if (!config.jwt[secret as keyof typeof config.jwt]) {
          console.error(`Missing JWT secret: ${secret}`);
          return false;
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error validating JWT configuration:', error);
      return false;
    }
  }
}

export default JWTService;
