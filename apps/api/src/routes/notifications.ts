// --- START api/routes/notifications.ts --- //
// Notification routes for AI-InterviewSpark API
// Handles push notifications, email preferences, and notification management

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticateToken } from '../middleware/auth';
import { validateRequest } from '../types';
import NotificationService from '../services/notificationService';
import PushNotificationService from '../services/pushNotificationService';
import { db } from '../database/connection';
import { notifications, users } from '../database/schema';
import { eq, and, desc } from 'drizzle-orm';

const router = Router();

// ============================================================================
// NOTIFICATION MANAGEMENT
// ============================================================================

// Get user notifications
router.get('/',
  authenticateToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { limit = 20, offset = 0, unreadOnly = false } = req.query;

      const whereConditions = [eq(notifications.userId, userId)];
      if (unreadOnly === 'true') {
        whereConditions.push(eq(notifications.isRead, false));
      }

      const userNotifications = await db.query.notifications.findMany({
        where: and(...whereConditions),
        orderBy: [desc(notifications.createdAt)],
        limit: Number(limit),
        offset: Number(offset),
      });

      const unreadCount = await NotificationService.getUnreadCount(userId);

      res.json({
        success: true,
        data: {
          notifications: userNotifications,
          unreadCount,
        },
        pagination: {
          limit: Number(limit),
          offset: Number(offset),
          total: userNotifications.length,
        },
        message: 'Notifications retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

// Mark notification as read
router.patch('/:notificationId/read',
  authenticateToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { notificationId } = req.params;

      await NotificationService.markAsRead(notificationId, userId);

      res.json({
        success: true,
        message: 'Notification marked as read'
      });
    } catch (error) {
      next(error);
    }
  }
);

// Mark all notifications as read
router.patch('/read-all',
  authenticateToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;

      await NotificationService.markAllAsRead(userId);

      res.json({
        success: true,
        message: 'All notifications marked as read'
      });
    } catch (error) {
      next(error);
    }
  }
);

// Delete notification
router.delete('/:notificationId',
  authenticateToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { notificationId } = req.params;

      await NotificationService.deleteNotification(notificationId, userId);

      res.json({
        success: true,
        message: 'Notification deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get unread notification count
router.get('/unread-count',
  authenticateToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const unreadCount = await NotificationService.getUnreadCount(userId);

      res.json({
        success: true,
        data: { unreadCount },
        message: 'Unread count retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

// ============================================================================
// PUSH NOTIFICATION SUBSCRIPTION
// ============================================================================

// Subscribe to push notifications
const subscribeSchema = z.object({
  subscription: z.object({
    endpoint: z.string().url(),
    keys: z.object({
      p256dh: z.string(),
      auth: z.string(),
    }),
  }),
});

router.post('/subscribe',
  authenticateToken,
  validateRequest(subscribeSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { subscription } = req.body;

      // Store subscription in database
      const subscriptionId = await PushNotificationService.subscribeUser(
        userId,
        subscription,
        req.get('User-Agent')
      );
      
      res.json({
        success: true,
        data: { subscriptionId },
        message: 'Push notification subscription successful'
      });
    } catch (error) {
      next(error);
    }
  }
);

// Test push notification
router.post('/test-push',
  authenticateToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { subscription } = req.body;

      if (!subscription) {
        return res.status(400).json({
          success: false,
          message: 'Push subscription required'
        });
      }

      const success = await NotificationService.sendPushNotification(subscription, {
        title: 'Test Notification',
        body: 'This is a test push notification from AI-InterviewSpark!',
        icon: '/favicon.ico',
      });

      res.json({
        success,
        message: success ? 'Test push notification sent' : 'Failed to send push notification'
      });
    } catch (error) {
      next(error);
    }
  }
);

// ============================================================================
// NOTIFICATION PREFERENCES
// ============================================================================

// Get notification preferences
router.get('/preferences',
  authenticateToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;

      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
        columns: {
          id: true,
          email: true,
          notificationPreferences: true,
        },
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Get preferences from database
      const preferences = user.notificationPreferences || {
        email: {
          sessionReminders: true,
          feedbackReady: true,
          peerRequests: true,
          expertMessages: true,
          weeklyReports: true,
        },
        push: {
          sessionReminders: true,
          feedbackReady: true,
          peerRequests: true,
          expertMessages: true,
        },
        sms: {
          sessionReminders: false,
          urgentOnly: true,
        },
      };

      res.json({
        success: true,
        data: preferences,
        message: 'Notification preferences retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

// Update notification preferences
const updatePreferencesSchema = z.object({
  email: z.object({
    sessionReminders: z.boolean().optional(),
    feedbackReady: z.boolean().optional(),
    peerRequests: z.boolean().optional(),
    expertMessages: z.boolean().optional(),
    weeklyReports: z.boolean().optional(),
  }).optional(),
  push: z.object({
    sessionReminders: z.boolean().optional(),
    feedbackReady: z.boolean().optional(),
    peerRequests: z.boolean().optional(),
    expertMessages: z.boolean().optional(),
  }).optional(),
  sms: z.object({
    sessionReminders: z.boolean().optional(),
    urgentOnly: z.boolean().optional(),
  }).optional(),
});

router.patch('/preferences',
  authenticateToken,
  validateRequest(updatePreferencesSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const preferences = req.body;

      // Update user's notification preferences in the database
      await db
        .update(users)
        .set({
          notificationPreferences: preferences,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      res.json({
        success: true,
        data: preferences,
        message: 'Notification preferences updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

// ============================================================================
// MANUAL NOTIFICATION SENDING (Admin/Testing)
// ============================================================================

// Send test notification
const sendTestNotificationSchema = z.object({
  type: z.enum(['session_reminder', 'feedback_ready', 'peer_request', 'expert_confirmation', 'system']),
  title: z.string().min(1),
  message: z.string().min(1),
  data: z.record(z.any()).optional(),
  channels: z.object({
    email: z.boolean().default(false),
    push: z.boolean().default(true),
    sms: z.boolean().default(false),
  }).optional(),
});

router.post('/send-test',
  authenticateToken,
  validateRequest(sendTestNotificationSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { type, title, message, data, channels = { push: true } } = req.body;

      // Get user info for email/SMS
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
        columns: {
          email: true,
          firstName: true,
        },
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      await NotificationService.sendNotification(
        {
          userId,
          type,
          title,
          message,
          data,
        },
        {
          email: user.email,
          firstName: user.firstName,
          sendEmail: channels.email,
          sendPush: channels.push,
          sendSMS: channels.sms,
        }
      );

      res.json({
        success: true,
        message: 'Test notification sent successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

// ============================================================================
// SERVICE STATUS
// ============================================================================

// Get notification service status
router.get('/status',
  authenticateToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const services = NotificationService.getAvailableServices();

      res.json({
        success: true,
        data: {
          services,
          timestamp: new Date().toISOString(),
        },
        message: 'Notification service status retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
