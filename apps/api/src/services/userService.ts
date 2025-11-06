// --- START api/services/userService.ts --- //
// User service for AI-InterviewSpark API
// Handles user registration, authentication, profile management, and related operations

import bcrypt from 'bcryptjs';
import { db } from '../database/connection';
import { users, expertProfiles } from '../database/schema';
import { eq, and } from 'drizzle-orm';
import { generateToken, validatePassword, validateEmail } from '../middleware/auth';
import { UserRole, UserProfile, ExpertProfile, createError } from '../types';
import AuditService from './auditService';

// User service class
export class UserService {
  // Register a new user
  static async register(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: UserRole;
  }): Promise<{ user: UserProfile; token: string }> {
    try {
      // Validate input
      if (!validateEmail(userData.email)) {
        throw createError('Invalid email format', 400);
      }

      if (!validatePassword(userData.password)) {
        throw createError(
          'Password must be at least 8 characters with uppercase, lowercase, number, and special character',
          400
        );
      }

      // Check if user already exists
      const existingUser = await db.query.users.findFirst({
        where: eq(users.email, userData.email),
      });

      if (existingUser) {
        throw createError('User with this email already exists', 409);
      }

      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

      // Create user
      const [newUser] = await db
        .insert(users)
        .values({
          email: userData.email,
          password: hashedPassword,
          firstName: userData.firstName,
          lastName: userData.lastName,
          role: userData.role || 'job_seeker',
        })
        .returning();

      // Generate verification token
      const verificationToken = await this.generateEmailVerificationToken(newUser.id);

      // Send verification email
      try {
        const { EmailService } = await import('./emailService');
        await EmailService.sendVerificationEmail(newUser.email, newUser.firstName, verificationToken);
      } catch (emailError) {
        console.warn('Failed to send verification email:', emailError);
        // Continue with registration even if email fails
      }

      // Generate token
      const token = generateToken({
        userId: newUser.id,
        email: newUser.email,
        role: newUser.role as UserRole,
      });

      // Log user registration - temporarily disabled
      try {
        await AuditService.logActivity(
          newUser.id,
          'register',
          'User registered successfully',
          {
            email: newUser.email,
            role: newUser.role,
          }
        );
      } catch (auditError) {
        console.warn('Failed to log registration activity:', auditError);
        // Continue with registration even if audit logging fails
      }

      // Convert to UserProfile type
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
        notificationPreferences: newUser.notificationPreferences || undefined,
        userSettings: newUser.userSettings || undefined,
        status: newUser.status,
        createdAt: newUser.createdAt,
        updatedAt: newUser.updatedAt,
      };

      return { user: userProfile, token };
    } catch (error) {
      console.error('Detailed registration error:', error);
      if (error instanceof Error && (error as any).code) {
        throw error;
      }
      throw createError('Failed to register user', 500);
    }
  }

  // Authenticate user login
  static async login(email: string, password: string): Promise<{ user: UserProfile; token: string; refreshToken: string }> {
    try {
      // Find user by email
      const user = await db.query.users.findFirst({
        where: eq(users.email, email),
      });

      if (!user) {
        throw createError('Invalid email or password', 401);
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password || '');
      if (!isValidPassword) {
        throw createError('Invalid email or password', 401);
      }

      // Generate tokens
      const token = generateToken({
        userId: user.id,
        email: user.email,
        role: user.role as UserRole,
      });

      const refreshToken = this.generateRefreshToken(user.id, user.email);

      // Update last login
      await db
        .update(users)
        .set({ lastLoginAt: new Date() })
        .where(eq(users.id, user.id));

      // Convert to UserProfile type
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

      return { user: userProfile, token, refreshToken };
    } catch (error) {
      if (error instanceof Error && (error as any).code) {
        throw error;
      }
      throw createError('Failed to authenticate user', 401);
    }
  }

  // Get user profile by ID
  static async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
      });

      if (!user) {
        return null;
      }

      return {
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
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw createError('Failed to fetch user profile', 500);
    }
  }

  // Get user by email
  static async getUserByEmail(email: string): Promise<UserProfile | null> {
    try {
      const user = await db.query.users.findFirst({
        where: eq(users.email, email),
      });

      if (!user) {
        return null;
      }

      return {
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
    } catch (error) {
      console.error('Error fetching user by email:', error);
      throw createError('Failed to fetch user', 500);
    }
  }

  // Update user profile
  static async updateUserProfile(
    userId: string,
    updates: Partial<{
      firstName: string;
      lastName: string;
      avatar: string;
      bio: string;
      location: string;
      timezone: string;
      language: string;
      accessibility: {
        highContrast: boolean;
        screenReader: boolean;
        captions: boolean;
      };
    }>
  ): Promise<UserProfile> {
    try {
      const [updatedUser] = await db
        .update(users)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId))
        .returning();

      if (!updatedUser) {
        throw createError('User not found', 404);
      }

      return {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        role: updatedUser.role as UserRole,
        avatar: updatedUser.avatar || undefined,
        bio: updatedUser.bio || undefined,
        location: updatedUser.location || undefined,
        timezone: updatedUser.timezone || undefined,
        language: updatedUser.language,
        accessibility: updatedUser.accessibility || {
          highContrast: false,
          screenReader: false,
          captions: true,
        },
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
      };
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw createError('Failed to update user profile', 500);
    }
  }

  // Create or update expert profile
  static async createExpertProfile(
    userId: string,
    expertData: {
      specialties: string[];
      experience: number;
      hourlyRate: number;
      availability: Array<{
        day: number;
        startTime: string;
        endTime: string;
      }>;
    }
  ): Promise<ExpertProfile> {
    try {
      // Verify user exists and is an expert
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
      });

      if (!user) {
        throw createError('User not found', 404);
      }

      if (user.role !== 'expert') {
        throw createError('User must be an expert to create expert profile', 403);
      }

      // Check if expert profile already exists
      const existingProfile = await db.query.expertProfiles.findFirst({
        where: eq(expertProfiles.userId, userId),
      });

      let expertProfile: ExpertProfile;

      if (existingProfile) {
        // Update existing profile
        const [updatedProfile] = await db
          .update(expertProfiles)
          .set({
            specialties: expertData.specialties,
            experience: expertData.experience,
            hourlyRate: String(expertData.hourlyRate),
            availability: expertData.availability,
            updatedAt: new Date(),
          })
          .where(eq(expertProfiles.userId, userId))
          .returning();

        expertProfile = {
          id: updatedProfile.id,
          userId: updatedProfile.userId,
          specialties: updatedProfile.specialties,
          experience: updatedProfile.experience,
          hourlyRate: String(updatedProfile.hourlyRate),
          availability: updatedProfile.availability,
          rating: updatedProfile.rating || undefined,
          totalSessions: updatedProfile.totalSessions,
          isVerified: updatedProfile.isVerified,
          createdAt: updatedProfile.createdAt,
          updatedAt: updatedProfile.updatedAt,
        };
      } else {
        // Create new profile
        const [newProfile] = await db
          .insert(expertProfiles)
          .values({
            userId,
            specialties: expertData.specialties,
            experience: expertData.experience,
            hourlyRate: String(expertData.hourlyRate),
            availability: expertData.availability,
          })
          .returning();

        expertProfile = {
          id: newProfile.id,
          userId: newProfile.userId,
          specialties: newProfile.specialties,
          experience: newProfile.experience,
          hourlyRate: String(newProfile.hourlyRate),
          availability: newProfile.availability,
          rating: newProfile.rating || undefined,
          totalSessions: newProfile.totalSessions,
          isVerified: newProfile.isVerified,
          createdAt: newProfile.createdAt,
          updatedAt: newProfile.updatedAt,
        };
      }

      return expertProfile;
    } catch (error) {
      console.error('Error creating expert profile:', error);
      if (error instanceof Error && (error as any).code) {
        throw error;
      }
      throw createError('Failed to create expert profile', 500);
    }
  }

  // Get expert profile
  static async getExpertProfile(userId: string): Promise<ExpertProfile | null> {
    try {
      const profile = await db.query.expertProfiles.findFirst({
        where: eq(expertProfiles.userId, userId),
      });

      if (!profile) {
        return null;
      }

      return {
        id: profile.id,
        userId: profile.userId,
        specialties: profile.specialties,
        experience: profile.experience,
        hourlyRate: String(profile.hourlyRate),
        availability: profile.availability,
        rating: profile.rating || undefined,
        totalSessions: profile.totalSessions,
        isVerified: profile.isVerified,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt,
      };
    } catch (error) {
      console.error('Error fetching expert profile:', error);
      throw createError('Failed to fetch expert profile', 500);
    }
  }

  // Search experts
  static async searchExperts(filters: {
    specialties?: string[];
    maxHourlyRate?: number;
    minRating?: number;
    isVerified?: boolean;
  }): Promise<ExpertProfile[]> {
    try {
      let query = db.query.expertProfiles.findMany({
        with: {
          user: {
            columns: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
              bio: true,
            },
          },
        },
      });

      // Apply filters
      const conditions = [];

      if (filters.specialties && filters.specialties.length > 0) {
        // This would need to be implemented with proper array overlap checking
        // For now, we'll return all experts
      }

      if (filters.maxHourlyRate) {
        // Add hourly rate filter
      }

      if (filters.minRating) {
        // Add rating filter
      }

      if (filters.isVerified !== undefined) {
        // Add verification filter
      }

      const profiles = await query;

      return profiles.map(profile => ({
        id: profile.id,
        userId: profile.userId,
        specialties: profile.specialties,
        experience: profile.experience,
        hourlyRate: String(profile.hourlyRate),
        availability: profile.availability,
        rating: profile.rating || undefined,
        totalSessions: profile.totalSessions,
        isVerified: profile.isVerified,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt,
      }));
    } catch (error) {
      console.error('Error searching experts:', error);
      throw createError('Failed to search experts', 500);
    }
  }

  // Request password reset
  static async requestPasswordReset(email: string): Promise<{ token: string } | null> {
    try {
      // Find user by email
      const user = await db.query.users.findFirst({
        where: eq(users.email, email),
      });

      // Don't reveal if user exists (security best practice)
      if (!user) {
        return null;
      }

      // Generate reset token (32 bytes = 64 hex characters)
      const crypto = await import('crypto');
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetExpires = new Date(Date.now() + 3600000); // 1 hour from now

      // Store hashed token in database
      const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

      await db
        .update(users)
        .set({
          passwordResetToken: hashedToken,
          passwordResetExpiresAt: resetExpires,
        })
        .where(eq(users.id, user.id));

      // Return the unhashed token to send via email
      return { token: resetToken };
    } catch (error) {
      console.error('Error requesting password reset:', error);
      throw createError('Failed to process password reset request', 500);
    }
  }

  // Reset password with token
  static async resetPassword(token: string, newPassword: string): Promise<boolean> {
    try {
      // Validate password
      if (!validatePassword(newPassword)) {
        throw createError(
          'Password must be at least 8 characters with uppercase, lowercase, number, and special character',
          400
        );
      }

      // Hash the token to compare with database
      const crypto = await import('crypto');
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

      // Find user with valid reset token
      const user = await db.query.users.findFirst({
        where: and(
          eq(users.passwordResetToken, hashedToken),
        ),
      });

      if (!user || !user.passwordResetExpiresAt) {
        throw createError('Invalid or expired reset token', 400);
      }

      // Check if token is expired
      if (new Date() > user.passwordResetExpiresAt) {
        throw createError('Reset token has expired', 400);
      }

      // Hash new password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      // Update password and clear reset token
      await db
        .update(users)
        .set({
          password: hashedPassword,
          passwordResetToken: null,
          passwordResetExpiresAt: null,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));

      // Send password changed confirmation email
      try {
        const { EmailService } = await import('./emailService');
        await EmailService.sendPasswordChangedEmail(user.email);
      } catch (emailError) {
        console.warn('Failed to send password changed email:', emailError);
      }

      return true;
    } catch (error) {
      if (error instanceof Error && (error as any).code) {
        throw error;
      }
      console.error('Error resetting password:', error);
      throw createError('Failed to reset password', 500);
    }
  }

  // Generate email verification token
  static async generateEmailVerificationToken(userId: string): Promise<string> {
    try {
      const crypto = await import('crypto');
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(verificationToken).digest('hex');

      await db
        .update(users)
        .set({
          emailVerificationToken: hashedToken,
        })
        .where(eq(users.id, userId));

      return verificationToken;
    } catch (error) {
      console.error('Error generating verification token:', error);
      throw createError('Failed to generate verification token', 500);
    }
  }

  // Verify email with token
  static async verifyEmail(token: string): Promise<boolean> {
    try {
      // Hash the token to compare with database
      const crypto = await import('crypto');
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

      // Find user with matching verification token
      const user = await db.query.users.findFirst({
        where: eq(users.emailVerificationToken, hashedToken),
      });

      if (!user) {
        throw createError('Invalid verification token', 400);
      }

      // Mark email as verified and clear token
      await db
        .update(users)
        .set({
          emailVerified: true,
          emailVerificationToken: null,
          status: 'active',
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));

      return true;
    } catch (error) {
      if (error instanceof Error && (error as any).code) {
        throw error;
      }
      console.error('Error verifying email:', error);
      throw createError('Failed to verify email', 500);
    }
  }

  // Change password (authenticated user)
  static async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<boolean> {
    try {
      // Validate new password
      if (!validatePassword(newPassword)) {
        throw createError(
          'Password must be at least 8 characters with uppercase, lowercase, number, and special character',
          400
        );
      }

      // Find user
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
      });

      if (!user || !user.password) {
        throw createError('User not found', 404);
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, user.password);
      if (!isValidPassword) {
        throw createError('Current password is incorrect', 401);
      }

      // Hash new password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      // Update password
      await db
        .update(users)
        .set({
          password: hashedPassword,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      return true;
    } catch (error) {
      if (error instanceof Error && (error as any).code) {
        throw error;
      }
      console.error('Error changing password:', error);
      throw createError('Failed to change password', 500);
    }
  }

  // Generate refresh token
  static generateRefreshToken(userId: string, email: string): string {
    const crypto = require('crypto');
    const payload = {
      userId,
      email,
      type: 'refresh',
      exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7 days
      jti: crypto.randomUUID(), // Unique token ID
    };

    // Note: In production, you'd want to store refresh tokens in database
    // and implement proper token rotation
    return generateToken(payload);
  }

  // Delete user account
  static async deleteUser(userId: string): Promise<void> {
    try {
      // Check if user exists before deletion
      const userExists = await db.select({ id: users.id }).from(users).where(eq(users.id, userId)).limit(1);
      if (userExists.length === 0) {
        throw createError('User not found', 404);
      }

      await db.delete(users).where(eq(users.id, userId));
    } catch (error) {
      console.error('Error deleting user:', error);
      throw createError('Failed to delete user', 500);
    }
  }
}

export default UserService; 