// --- START api/routes/experts.ts --- //
// Experts routes for AI-InterviewSpark API
// Handles expert profile management and expert session booking

import { Router } from 'express';
import { z } from 'zod';
import { authenticateToken } from '../middleware/auth';
import { validateRequest } from '../types';
import { db } from '../database/connection';
import { expertProfiles, expertSessions, users, interviewSessions } from '../database/schema';
import { eq, and, desc, gte, lte } from 'drizzle-orm';

const router = Router();

// ============================================================================
// EXPERT DISCOVERY
// ============================================================================

// Get all available experts
router.get('/', 
  authenticateToken,
  async (req, res, next) => {
    try {
      const { 
        specialty, 
        minRating, 
        maxPrice, 
        limit = 20, 
        offset = 0 
      } = req.query;

      let whereConditions = [eq(expertProfiles.isVerified, true)];

      if (specialty && typeof specialty === 'string') {
        whereConditions.push(eq(expertProfiles.specialties, [specialty]));
      }

      if (minRating && typeof minRating === 'string') {
        whereConditions.push(gte(expertProfiles.rating, String(parseFloat(minRating))));
      }

      if (maxPrice && typeof maxPrice === 'string') {
        whereConditions.push(lte(expertProfiles.hourlyRate, String(parseFloat(maxPrice))));
      }

      const experts = await db.query.expertProfiles.findMany({
        where: and(...whereConditions),
        with: {
          user: {
            columns: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
              bio: true,
              location: true,
            }
          }
        },
        orderBy: [desc(expertProfiles.rating), desc(expertProfiles.totalSessions)],
        limit: Number(limit),
        offset: Number(offset),
      });

      res.json({
        success: true,
        data: experts,
        pagination: {
          limit: Number(limit),
          offset: Number(offset),
          total: experts.length
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get expert by ID
router.get('/:expertId', 
  authenticateToken,
  async (req, res, next) => {
    try {
      const { expertId } = req.params;

      const expert = await db.query.expertProfiles.findFirst({
        where: eq(expertProfiles.userId, expertId),
        with: {
          user: {
            columns: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
              bio: true,
              location: true,
              timezone: true,
            }
          }
        }
      });

      if (!expert) {
        return res.status(404).json({
          success: false,
          message: 'Expert not found'
        });
      }

      res.json({
        success: true,
        data: expert
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get expert availability
router.get('/:expertId/availability', 
  authenticateToken,
  async (req, res, next) => {
    try {
      const { expertId } = req.params;
      const { date } = req.query;

      const expert = await db.query.expertProfiles.findFirst({
        where: eq(expertProfiles.userId, expertId),
        columns: {
          availability: true,
        }
      });

      if (!expert) {
        return res.status(404).json({
          success: false,
          message: 'Expert not found'
        });
      }

      // TODO: Check existing bookings for the date
      const availability = expert.availability || [];

      res.json({
        success: true,
        data: {
          availability,
          date: date || new Date().toISOString().split('T')[0]
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// ============================================================================
// EXPERT SESSION BOOKING
// ============================================================================

// Book expert session
const bookSessionSchema = z.object({
  sessionId: z.string().uuid(),
  expertId: z.string().uuid(),
  scheduledAt: z.string().datetime(),
  duration: z.number().min(30).max(180), // 30-180 minutes
  notes: z.string().optional(),
});

router.post('/sessions', 
  authenticateToken,
  validateRequest(bookSessionSchema),
  async (req, res, next) => {
    try {
      const userId = req.user!.id;
      const { sessionId, expertId, scheduledAt, duration, notes } = req.body;

      // Verify the session exists and belongs to the user
      const session = await db.query.interviewSessions.findFirst({
        where: and(
          eq(interviewSessions.id, sessionId),
          eq(interviewSessions.userId, userId)
        )
      });

      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Interview session not found'
        });
      }

      // Create expert session booking
      const expertSession = await db.insert(expertSessions).values({
        sessionId,
        expertId,
        status: 'scheduled',
        notes,
      }).returning();

      res.status(201).json({
        success: true,
        data: expertSession[0],
        message: 'Expert session booked successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get user's expert sessions
router.get('/sessions', 
  authenticateToken,
  async (req, res, next) => {
    try {
      const userId = req.user!.id;
      const { status, limit = 10, offset = 0 } = req.query;

      let whereConditions = [eq(expertSessions.expertId, userId)];

      if (status && typeof status === 'string') {
        whereConditions.push(eq(expertSessions.status, status as any));
      }

      const sessions = await db.query.expertSessions.findMany({
        where: and(...whereConditions),
        with: {
          session: {
            with: {
              user: {
                columns: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  avatar: true,
                }
              }
            }
          }
        },
        orderBy: desc(expertSessions.createdAt),
        limit: Number(limit),
        offset: Number(offset),
      });

      res.json({
        success: true,
        data: sessions,
        pagination: {
          limit: Number(limit),
          offset: Number(offset),
          total: sessions.length
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// Update expert session status
router.put('/sessions/:sessionId/status', 
  authenticateToken,
  async (req, res, next) => {
    try {
      const { sessionId } = req.params;
      const { status } = req.body;
      const userId = req.user!.id;

      if (!['scheduled', 'confirmed', 'completed', 'cancelled'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status'
        });
      }

      const updatedSession = await db.update(expertSessions)
        .set({ 
          status,
          updatedAt: new Date()
        })
        .where(and(
          eq(expertSessions.sessionId, sessionId),
          eq(expertSessions.expertId, userId)
        ))
        .returning();

      if (updatedSession.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Expert session not found'
        });
      }

      res.json({
        success: true,
        data: updatedSession[0],
        message: 'Session status updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

// Rate expert session
router.post('/sessions/:sessionId/rate', 
  authenticateToken,
  async (req, res, next) => {
    try {
      const { sessionId } = req.params;
      const { rating, review } = req.body;
      const userId = req.user!.id;

      if (rating < 1 || rating > 5) {
        return res.status(400).json({
          success: false,
          message: 'Rating must be between 1 and 5'
        });
      }

      const updatedSession = await db.update(expertSessions)
        .set({ 
          rating,
          review,
          updatedAt: new Date()
        })
        .where(and(
          eq(expertSessions.sessionId, sessionId),
          eq(expertSessions.expertId, userId)
        ))
        .returning();

      if (updatedSession.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Expert session not found'
        });
      }

      // Update expert's average rating
      const expertSessionsList = await db.query.expertSessions.findMany({
        where: eq(expertSessions.expertId, userId),
        columns: {
          rating: true,
        }
      });

      const validRatings = expertSessionsList
        .map(s => s.rating)
        .filter(r => r !== null) as number[];

      if (validRatings.length > 0) {
        const averageRating = validRatings.reduce((sum, r) => sum + r, 0) / validRatings.length;
        
        await db.update(expertProfiles)
          .set({ rating: String(averageRating) })
          .where(eq(expertProfiles.userId, userId));
      }

      res.json({
        success: true,
        data: updatedSession[0],
        message: 'Session rated successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

// ============================================================================
// EXPERT SPECIALTIES
// ============================================================================

// Get all expert specialties
router.get('/specialties', 
  authenticateToken,
  async (req, res, next) => {
    try {
      const specialties = [
        'Software Engineering',
        'Data Science',
        'Product Management',
        'Marketing',
        'Sales',
        'Finance',
        'Human Resources',
        'Operations',
        'Design',
        'Customer Success',
        'Business Development',
        'Legal',
        'Healthcare',
        'Education',
        'Consulting',
        'Entrepreneurship',
        'Leadership',
        'Communication',
        'Negotiation',
        'Public Speaking'
      ];

      res.json({
        success: true,
        data: specialties
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router; 