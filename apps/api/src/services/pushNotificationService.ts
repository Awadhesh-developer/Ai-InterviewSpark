// --- START api/services/pushNotificationService.ts --- //
// Push notification service for AI-InterviewSpark API
// Handles push notification subscriptions and delivery

import { db } from '../database/connection';
import { pushSubscriptions, users } from '../database/schema';
import { eq, and } from 'drizzle-orm';
import { createError } from '../types';
import webpush from 'web-push';

// Push subscription interface
export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

// Push notification payload interface
export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: Record<string, any>;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

export class PushNotificationService {
  // Subscribe user to push notifications
  static async subscribeUser(
    userId: string,
    subscription: PushSubscription,
    userAgent?: string
  ): Promise<string> {
    try {
      // Check if subscription already exists
      const existingSubscription = await db.query.pushSubscriptions.findFirst({
        where: and(
          eq(pushSubscriptions.userId, userId),
          eq(pushSubscriptions.endpoint, subscription.endpoint)
        ),
      });

      if (existingSubscription) {
        // Update existing subscription
        const [updated] = await db
          .update(pushSubscriptions)
          .set({
            p256dhKey: subscription.keys.p256dh,
            authKey: subscription.keys.auth,
            userAgent,
            isActive: true,
            updatedAt: new Date(),
          })
          .where(eq(pushSubscriptions.id, existingSubscription.id))
          .returning();

        return updated.id;
      }

      // Create new subscription
      const [newSubscription] = await db
        .insert(pushSubscriptions)
        .values({
          userId,
          endpoint: subscription.endpoint,
          p256dhKey: subscription.keys.p256dh,
          authKey: subscription.keys.auth,
          userAgent,
          isActive: true,
        })
        .returning();

      return newSubscription.id;
    } catch (error) {
      console.error('Failed to subscribe user to push notifications:', error);
      throw createError('Failed to subscribe to push notifications', 500);
    }
  }

  // Unsubscribe user from push notifications
  static async unsubscribeUser(userId: string, endpoint: string): Promise<void> {
    try {
      await db
        .update(pushSubscriptions)
        .set({
          isActive: false,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(pushSubscriptions.userId, userId),
            eq(pushSubscriptions.endpoint, endpoint)
          )
        );
    } catch (error) {
      console.error('Failed to unsubscribe user from push notifications:', error);
      throw createError('Failed to unsubscribe from push notifications', 500);
    }
  }

  // Get user's active push subscriptions
  static async getUserSubscriptions(userId: string): Promise<Array<{
    id: string;
    endpoint: string;
    isActive: boolean;
    createdAt: Date;
  }>> {
    try {
      return await db.query.pushSubscriptions.findMany({
        where: eq(pushSubscriptions.userId, userId),
        columns: {
          id: true,
          endpoint: true,
          isActive: true,
          createdAt: true,
        },
        orderBy: (pushSubscriptions, { desc }) => [desc(pushSubscriptions.createdAt)],
      });
    } catch (error) {
      console.error('Failed to get user push subscriptions:', error);
      throw createError('Failed to get push subscriptions', 500);
    }
  }

  // Send push notification to user
  static async sendToUser(
    userId: string,
    payload: PushNotificationPayload
  ): Promise<{ sent: number; failed: number }> {
    try {
      // Get user's active subscriptions
      const subscriptions = await db.query.pushSubscriptions.findMany({
        where: and(
          eq(pushSubscriptions.userId, userId),
          eq(pushSubscriptions.isActive, true)
        ),
      });

      if (subscriptions.length === 0) {
        return { sent: 0, failed: 0 };
      }

      let sent = 0;
      let failed = 0;

      // Send to all active subscriptions
      for (const subscription of subscriptions) {
        try {
          const pushSubscription = {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dhKey,
              auth: subscription.authKey,
            },
          };

          const pushPayload = JSON.stringify({
            title: payload.title,
            body: payload.body,
            icon: payload.icon || '/favicon.ico',
            badge: payload.badge || '/favicon.ico',
            data: payload.data || {},
            actions: payload.actions || [],
          });

          await webpush.sendNotification(pushSubscription, pushPayload);
          sent++;

          // Update last accessed time
          await db
            .update(pushSubscriptions)
            .set({
              lastAccessedAt: new Date(),
            })
            .where(eq(pushSubscriptions.id, subscription.id));
        } catch (error) {
          console.error('Failed to send push notification to subscription:', error);
          failed++;

          // Mark subscription as inactive if it's invalid
          if ((error as any).statusCode === 410) {
            await db
              .update(pushSubscriptions)
              .set({
                isActive: false,
                updatedAt: new Date(),
              })
              .where(eq(pushSubscriptions.id, subscription.id));
          }
        }
      }

      return { sent, failed };
    } catch (error) {
      console.error('Failed to send push notification to user:', error);
      throw createError('Failed to send push notification', 500);
    }
  }

  // Send push notification to all users
  static async sendToAllUsers(payload: PushNotificationPayload): Promise<{
    sent: number;
    failed: number;
    totalUsers: number;
  }> {
    try {
      // Get all active subscriptions
      const subscriptions = await db.query.pushSubscriptions.findMany({
        where: eq(pushSubscriptions.isActive, true),
        with: {
          user: {
            columns: {
              id: true,
              email: true,
            },
          },
        },
      });

      const totalUsers = new Set(subscriptions.map(s => s.userId)).size;
      let sent = 0;
      let failed = 0;

      // Send to all subscriptions
      for (const subscription of subscriptions) {
        try {
          const pushSubscription = {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dhKey,
              auth: subscription.authKey,
            },
          };

          const pushPayload = JSON.stringify({
            title: payload.title,
            body: payload.body,
            icon: payload.icon || '/favicon.ico',
            badge: payload.badge || '/favicon.ico',
            data: payload.data || {},
            actions: payload.actions || [],
          });

          await webpush.sendNotification(pushSubscription, pushPayload);
          sent++;

          // Update last accessed time
          await db
            .update(pushSubscriptions)
            .set({
              lastAccessedAt: new Date(),
            })
            .where(eq(pushSubscriptions.id, subscription.id));
        } catch (error) {
          console.error('Failed to send push notification to subscription:', error);
          failed++;

          // Mark subscription as inactive if it's invalid
          if ((error as any).statusCode === 410) {
            await db
              .update(pushSubscriptions)
              .set({
                isActive: false,
                updatedAt: new Date(),
              })
              .where(eq(pushSubscriptions.id, subscription.id));
          }
        }
      }

      return { sent, failed, totalUsers };
    } catch (error) {
      console.error('Failed to send push notification to all users:', error);
      throw createError('Failed to send push notification to all users', 500);
    }
  }

  // Clean up inactive subscriptions
  static async cleanupInactiveSubscriptions(daysInactive: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysInactive);

      const result = await db
        .update(pushSubscriptions)
        .set({
          isActive: false,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(pushSubscriptions.isActive, true),
            // Add condition for last accessed time
          )
        )
        .returning();

      return result.length;
    } catch (error) {
      console.error('Failed to cleanup inactive subscriptions:', error);
      throw createError('Failed to cleanup inactive subscriptions', 500);
    }
  }

  // Get subscription statistics
  static async getSubscriptionStats(): Promise<{
    totalSubscriptions: number;
    activeSubscriptions: number;
    inactiveSubscriptions: number;
    uniqueUsers: number;
  }> {
    try {
      const [totalSubscriptions, activeSubscriptions, inactiveSubscriptions, uniqueUsers] = await Promise.all([
        db.select({ count: pushSubscriptions.id }).from(pushSubscriptions),
        db.select({ count: pushSubscriptions.id }).from(pushSubscriptions).where(eq(pushSubscriptions.isActive, true)),
        db.select({ count: pushSubscriptions.id }).from(pushSubscriptions).where(eq(pushSubscriptions.isActive, false)),
        db.select({ count: pushSubscriptions.userId }).from(pushSubscriptions).where(eq(pushSubscriptions.isActive, true)),
      ]);

      return {
        totalSubscriptions: totalSubscriptions.length,
        activeSubscriptions: activeSubscriptions.length,
        inactiveSubscriptions: inactiveSubscriptions.length,
        uniqueUsers: uniqueUsers.length,
      };
    } catch (error) {
      console.error('Failed to get subscription statistics:', error);
      throw createError('Failed to get subscription statistics', 500);
    }
  }
}

export default PushNotificationService;
