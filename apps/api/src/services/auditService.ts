// --- START api/services/auditService.ts --- //
// Audit service for AI-InterviewSpark API
// Handles user activity tracking and audit logging

import { db } from '../database/connection';
import { userActivities, auditLogs } from '../database/schema';
import { eq, and, desc, gte, lte } from 'drizzle-orm';
import { createError } from '../types';

// Activity types
export type ActivityType = 
  | 'login'
  | 'logout'
  | 'register'
  | 'profile_update'
  | 'session_start'
  | 'session_end'
  | 'question_answer'
  | 'feedback_received'
  | 'resume_upload'
  | 'resume_analysis'
  | 'notification_read'
  | 'preferences_update'
  | 'password_change'
  | 'email_verification'
  | 'password_reset'
  | 'oauth_link'
  | 'oauth_unlink'
  | 'expert_profile_create'
  | 'expert_profile_update'
  | 'session_booking'
  | 'payment_processed'
  | 'subscription_change'
  | 'admin_action'
  | 'system_error'
  | 'api_call';

// Audit action types
export type AuditAction = 
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'login'
  | 'logout'
  | 'export'
  | 'import'
  | 'approve'
  | 'reject'
  | 'suspend'
  | 'activate'
  | 'reset'
  | 'verify'
  | 'link'
  | 'unlink';

// Resource types
export type ResourceType = 
  | 'user'
  | 'session'
  | 'question'
  | 'answer'
  | 'feedback'
  | 'resume'
  | 'notification'
  | 'expert_profile'
  | 'payment'
  | 'subscription'
  | 'system_config'
  | 'audit_log';

export class AuditService {
  // Log user activity
  static async logActivity(
    userId: string,
    activityType: ActivityType,
    description: string,
    metadata: Record<string, any> = {},
    ipAddress?: string,
    userAgent?: string
  ): Promise<string> {
    try {
      const [activity] = await db
        .insert(userActivities)
        .values({
          userId,
          activityType,
          activityDescription: description,
          metadata,
          ipAddress,
          userAgent,
        })
        .returning();

      return activity.id;
    } catch (error) {
      console.error('Failed to log user activity:', error);
      throw createError('Failed to log user activity', 500);
    }
  }

  // Log audit event
  static async logAudit(
    userId: string | null,
    action: AuditAction,
    resourceType: ResourceType,
    resourceId: string | null,
    oldValues: Record<string, any> | null = null,
    newValues: Record<string, any> | null = null,
    ipAddress?: string,
    userAgent?: string
  ): Promise<string> {
    try {
      const [auditLog] = await db
        .insert(auditLogs)
        .values({
          userId,
          action,
          resourceType,
          resourceId,
          oldValues,
          newValues,
          ipAddress,
          userAgent,
        })
        .returning();

      return auditLog.id;
    } catch (error) {
      console.error('Failed to log audit event:', error);
      throw createError('Failed to log audit event', 500);
    }
  }

  // Get user activities
  static async getUserActivities(
    userId: string,
    limit: number = 50,
    offset: number = 0,
    activityType?: ActivityType,
    startDate?: Date,
    endDate?: Date
  ): Promise<Array<{
    id: string;
    activityType: string;
    activityDescription: string;
    metadata: Record<string, any>;
    ipAddress: string | null;
    userAgent: string | null;
    createdAt: Date;
  }>> {
    try {
      const whereConditions = [eq(userActivities.userId, userId)];

      if (activityType) {
        whereConditions.push(eq(userActivities.activityType, activityType));
      }

      if (startDate) {
        whereConditions.push(gte(userActivities.createdAt, startDate));
      }

      if (endDate) {
        whereConditions.push(lte(userActivities.createdAt, endDate));
      }

      const activities = await db.query.userActivities.findMany({
        where: and(...whereConditions),
        orderBy: [desc(userActivities.createdAt)],
        limit,
        offset,
      });
      
      return activities.map(activity => ({
        ...activity,
        metadata: activity.metadata || {}
      }));
    } catch (error) {
      console.error('Failed to get user activities:', error);
      throw createError('Failed to get user activities', 500);
    }
  }

  // Get audit logs
  static async getAuditLogs(
    userId?: string,
    resourceType?: ResourceType,
    action?: AuditAction,
    limit: number = 50,
    offset: number = 0,
    startDate?: Date,
    endDate?: Date
  ): Promise<Array<{
    id: string;
    userId: string | null;
    action: string;
    resourceType: string;
    resourceId: string | null;
    oldValues: Record<string, any> | null;
    newValues: Record<string, any> | null;
    ipAddress: string | null;
    userAgent: string | null;
    createdAt: Date;
  }>> {
    try {
      const whereConditions = [];

      if (userId) {
        whereConditions.push(eq(auditLogs.userId, userId));
      }

      if (resourceType) {
        whereConditions.push(eq(auditLogs.resourceType, resourceType));
      }

      if (action) {
        whereConditions.push(eq(auditLogs.action, action));
      }

      if (startDate) {
        whereConditions.push(gte(auditLogs.createdAt, startDate));
      }

      if (endDate) {
        whereConditions.push(lte(auditLogs.createdAt, endDate));
      }

      return await db.query.auditLogs.findMany({
        where: whereConditions.length > 0 ? and(...whereConditions) : undefined,
        orderBy: [desc(auditLogs.createdAt)],
        limit,
        offset,
      });
    } catch (error) {
      console.error('Failed to get audit logs:', error);
      throw createError('Failed to get audit logs', 500);
    }
  }

  // Get activity statistics
  static async getActivityStats(
    userId?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    totalActivities: number;
    activitiesByType: Record<string, number>;
    activitiesByDay: Array<{
      date: string;
      count: number;
    }>;
    topActivities: Array<{
      activityType: string;
      count: number;
    }>;
  }> {
    try {
      const whereConditions = [];

      if (userId) {
        whereConditions.push(eq(userActivities.userId, userId));
      }

      if (startDate) {
        whereConditions.push(gte(userActivities.createdAt, startDate));
      }

      if (endDate) {
        whereConditions.push(lte(userActivities.createdAt, endDate));
      }

      // Get all activities
      const activities = await db.query.userActivities.findMany({
        where: whereConditions.length > 0 ? and(...whereConditions) : undefined,
        columns: {
          activityType: true,
          createdAt: true,
        },
      });

      // Calculate statistics
      const totalActivities = activities.length;
      const activitiesByType: Record<string, number> = {};
      const activitiesByDay: Record<string, number> = {};

      activities.forEach(activity => {
        // Count by type
        activitiesByType[activity.activityType] = (activitiesByType[activity.activityType] || 0) + 1;

        // Count by day
        const date = activity.createdAt.toISOString().split('T')[0];
        activitiesByDay[date] = (activitiesByDay[date] || 0) + 1;
      });

      // Convert to array format
      const activitiesByDayArray = Object.entries(activitiesByDay)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));

      const topActivities = Object.entries(activitiesByType)
        .map(([activityType, count]) => ({ activityType, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      return {
        totalActivities,
        activitiesByType,
        activitiesByDay: activitiesByDayArray,
        topActivities,
      };
    } catch (error) {
      console.error('Failed to get activity statistics:', error);
      throw createError('Failed to get activity statistics', 500);
    }
  }

  // Clean up old audit logs
  static async cleanupOldLogs(olderThanDays: number = 90): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      // Delete old user activities
      const deletedActivities = await db
        .delete(userActivities)
        .where(lte(userActivities.createdAt, cutoffDate))
        .returning();

      // Delete old audit logs
      const deletedAuditLogs = await db
        .delete(auditLogs)
        .where(lte(auditLogs.createdAt, cutoffDate))
        .returning();

      return deletedActivities.length + deletedAuditLogs.length;
    } catch (error) {
      console.error('Failed to cleanup old logs:', error);
      throw createError('Failed to cleanup old logs', 500);
    }
  }

  // Track API calls
  static async trackApiCall(
    userId: string | null,
    endpoint: string,
    method: string,
    statusCode: number,
    responseTime: number,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      await this.logActivity(
        userId || 'system',
        'api_call',
        `${method} ${endpoint} - ${statusCode}`,
        {
          endpoint,
          method,
          statusCode,
          responseTime,
        },
        ipAddress,
        userAgent
      );
    } catch (error) {
      console.error('Failed to track API call:', error);
      // Don't throw error for API call tracking to avoid breaking the main request
    }
  }

  // Track user login
  static async trackLogin(
    userId: string,
    loginMethod: 'password' | 'oauth',
    provider?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      await this.logActivity(
        userId,
        'login',
        `User logged in via ${loginMethod}${provider ? ` (${provider})` : ''}`,
        {
          loginMethod,
          provider,
        },
        ipAddress,
        userAgent
      );
    } catch (error) {
      console.error('Failed to track login:', error);
    }
  }

  // Track user logout
  static async trackLogout(
    userId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      await this.logActivity(
        userId,
        'logout',
        'User logged out',
        {},
        ipAddress,
        userAgent
      );
    } catch (error) {
      console.error('Failed to track logout:', error);
    }
  }

  // Track profile update
  static async trackProfileUpdate(
    userId: string,
    updatedFields: string[],
    oldValues: Record<string, any>,
    newValues: Record<string, any>,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      await this.logActivity(
        userId,
        'profile_update',
        `User updated profile fields: ${updatedFields.join(', ')}`,
        {
          updatedFields,
          oldValues,
          newValues,
        },
        ipAddress,
        userAgent
      );

      await this.logAudit(
        userId,
        'update',
        'user',
        userId,
        oldValues,
        newValues,
        ipAddress,
        userAgent
      );
    } catch (error) {
      console.error('Failed to track profile update:', error);
    }
  }
}

export default AuditService;
