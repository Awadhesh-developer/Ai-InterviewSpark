// --- START api/services/notificationService.ts --- //
// Notification service for AI-InterviewSpark API
// Handles push notifications, SMS, and in-app notifications

import webpush from 'web-push';
import twilio from 'twilio';
import { config } from '../config';
import { db } from '../database/connection';
import { notifications, interviewSessions } from '../database/schema';
import { eq, and, desc } from 'drizzle-orm';
import { createError } from '../types';
import EmailService from './emailService';

// Notification types
export type NotificationType = 
  | 'session_reminder'
  | 'feedback_ready'
  | 'peer_request'
  | 'expert_confirmation'
  | 'system';

// Notification data interface
interface NotificationData {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
}

// Push subscription interface
interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export class NotificationService {
  private static twilioClient: twilio.Twilio | null = null;

  // Initialize notification service
  static async initialize(): Promise<void> {
    try {
      // Initialize web push
      if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
        webpush.setVapidDetails(
          'mailto:noreply@interviewspark.com',
          process.env.VAPID_PUBLIC_KEY,
          process.env.VAPID_PRIVATE_KEY
        );
        console.log('✅ Web push notifications initialized');
      }

      // Initialize Twilio
      if (config.services.twilio.enabled) {
        this.twilioClient = twilio(
          config.services.twilio.accountSid!,
          config.services.twilio.authToken!
        );
        console.log('✅ Twilio SMS service initialized');
      }
    } catch (error) {
      console.warn('⚠️ Notification service initialization failed:', error);
    }
  }

  // Create in-app notification
  static async createNotification(notificationData: NotificationData): Promise<string> {
    try {
      const [notification] = await db
        .insert(notifications)
        .values({
          userId: notificationData.userId,
          type: notificationData.type,
          title: notificationData.title,
          message: notificationData.message,
          data: notificationData.data || {},
          isRead: false,
          priority: 'normal',
          deliveryStatus: 'pending',
          deliveryAttempts: 0,
        })
        .returning();

      return notification.id;
    } catch (error) {
      console.error('Failed to create notification:', error);
      throw createError('Failed to create notification', 500);
    }
  }

  // Send push notification
  static async sendPushNotification(
    subscription: PushSubscription,
    payload: {
      title: string;
      body: string;
      icon?: string;
      badge?: string;
      data?: Record<string, any>;
    }
  ): Promise<boolean> {
    try {
      const pushPayload = JSON.stringify({
        title: payload.title,
        body: payload.body,
        icon: payload.icon || '/favicon.ico',
        badge: payload.badge || '/favicon.ico',
        data: payload.data || {},
      });

      await webpush.sendNotification(subscription, pushPayload);
      return true;
    } catch (error) {
      console.error('Push notification failed:', error);
      return false;
    }
  }

  // Send SMS notification
  static async sendSMS(phoneNumber: string, message: string): Promise<boolean> {
    try {
      if (!this.twilioClient) {
        console.warn('Twilio not configured, skipping SMS');
        return false;
      }

      await this.twilioClient.messages.create({
        body: message,
        from: config.services.twilio.phoneNumber!,
        to: phoneNumber,
      });

      return true;
    } catch (error) {
      console.error('SMS send failed:', error);
      return false;
    }
  }

  // Send comprehensive notification (in-app + email + push + SMS)
  static async sendNotification(
    notificationData: NotificationData,
    options: {
      email?: string;
      firstName?: string;
      phoneNumber?: string;
      pushSubscription?: PushSubscription;
      sendEmail?: boolean;
      sendPush?: boolean;
      sendSMS?: boolean;
    } = {}
  ): Promise<void> {
    try {
      // Create in-app notification
      await this.createNotification(notificationData);

      // Send email notification
      if (options.sendEmail && options.email && options.firstName) {
        await this.sendEmailNotification(
          notificationData.type,
          options.email,
          options.firstName,
          notificationData.title,
          notificationData.message,
          notificationData.data
        );
      }

      // Send push notification
      if (options.sendPush && options.pushSubscription) {
        await this.sendPushNotification(options.pushSubscription, {
          title: notificationData.title,
          body: notificationData.message,
          data: notificationData.data,
        });
      }

      // Send SMS notification
      if (options.sendSMS && options.phoneNumber) {
        await this.sendSMS(
          options.phoneNumber,
          `${notificationData.title}: ${notificationData.message}`
        );
      }
    } catch (error) {
      console.error('Comprehensive notification failed:', error);
      throw createError('Failed to send notification', 500);
    }
  }

  // Send email notification based on type
  private static async sendEmailNotification(
    type: NotificationType,
    email: string,
    firstName: string,
    title: string,
    message: string,
    data?: Record<string, any>
  ): Promise<void> {
    switch (type) {
      case 'session_reminder':
        if (data?.interviewTitle && data?.scheduledTime) {
          await EmailService.sendInterviewReminder(
            email,
            firstName,
            data.interviewTitle,
            new Date(data.scheduledTime)
          );
        }
        break;

      case 'feedback_ready':
        if (data?.interviewTitle) {
          await EmailService.sendFeedbackReady(email, firstName, data.interviewTitle);
        }
        break;

      default:
        // Send generic notification email
        await EmailService.sendEmail({
          to: email,
          subject: title,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #2563eb;">${title}</h1>
              <p>Hi ${firstName},</p>
              <p>${message}</p>
              <p>Visit your <a href="http://localhost:3000/dashboard" style="color: #2563eb;">dashboard</a> for more details.</p>
              <p>The AI-InterviewSpark Team</p>
            </div>
          `,
          text: `${title}\n\nHi ${firstName},\n\n${message}\n\nVisit your dashboard at http://localhost:3000/dashboard for more details.\n\nThe AI-InterviewSpark Team`,
        });
        break;
    }
  }

  // Get user notifications
  static async getUserNotifications(
    userId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<any[]> {
    try {
      return await db.query.notifications.findMany({
        where: eq(notifications.userId, userId),
        orderBy: [desc(notifications.createdAt)],
        limit,
        offset,
      });
    } catch (error) {
      console.error('Failed to get user notifications:', error);
      throw createError('Failed to get notifications', 500);
    }
  }

  // Mark notification as read
  static async markAsRead(notificationId: string, userId: string): Promise<void> {
    try {
      await db
        .update(notifications)
        .set({ isRead: true })
        .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      throw createError('Failed to update notification', 500);
    }
  }

  // Mark all notifications as read
  static async markAllAsRead(userId: string): Promise<void> {
    try {
      await db
        .update(notifications)
        .set({ isRead: true })
        .where(eq(notifications.userId, userId));
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      throw createError('Failed to update notifications', 500);
    }
  }

  // Get unread notification count
  static async getUnreadCount(userId: string): Promise<number> {
    try {
      const result = await db
        .select({ count: notifications.id })
        .from(notifications)
        .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));

      return result.length;
    } catch (error) {
      console.error('Failed to get unread count:', error);
      return 0;
    }
  }

  // Delete notification
  static async deleteNotification(notificationId: string, userId: string): Promise<void> {
    try {
      await db
        .delete(notifications)
        .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)));
    } catch (error) {
      console.error('Failed to delete notification:', error);
      throw createError('Failed to delete notification', 500);
    }
  }

  // Send interview reminder notifications
  static async sendInterviewReminders(): Promise<void> {
    try {
      // This would typically be called by a cron job
      // Find interviews scheduled in the next hour
      const upcomingInterviews = await db.query.interviewSessions.findMany({
        where: and(
          eq(interviewSessions.status, 'scheduled'),
          // Add date filtering logic here
        ),
        with: {
          user: true,
        },
      });

      for (const interview of upcomingInterviews) {
        await this.sendNotification(
          {
            userId: interview.userId,
            type: 'session_reminder',
            title: 'Interview Reminder',
            message: `Your interview "${interview.title}" is starting soon!`,
            data: {
              interviewId: interview.id,
              interviewTitle: interview.title,
              scheduledTime: interview.scheduledAt,
            },
          },
          {
            email: interview.user.email,
            firstName: interview.user.firstName,
            sendEmail: true,
            sendPush: true,
          }
        );
      }
    } catch (error) {
      console.error('Failed to send interview reminders:', error);
    }
  }

  // Check if notification services are available
  static getAvailableServices(): {
    email: boolean;
    push: boolean;
    sms: boolean;
  } {
    return {
      email: EmailService.isAvailable(),
      push: !!process.env.VAPID_PUBLIC_KEY,
      sms: !!this.twilioClient,
    };
  }
}

export default NotificationService;

// Initialize notification service on module load
NotificationService.initialize().catch(console.error);
