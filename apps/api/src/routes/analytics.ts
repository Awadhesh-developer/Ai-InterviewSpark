// --- START api/routes/analytics.ts --- //
// Analytics routes for AI-InterviewSpark API
// Handles comprehensive analytics and reporting features

import { Router } from 'express';
import { z } from 'zod';
import { authenticateToken, requireRole } from '../middleware/auth';
import { validateRequest, UserRole } from '../types';
import { db } from '../database/connection';
import { 
  interviewSessions, 
  performanceMetrics, 
  feedback, 
  answers,
  users 
} from '../database/schema';
import { eq, and, desc, gte, lte, count, avg, sum } from 'drizzle-orm';

const router = Router();

// ============================================================================
// USER ANALYTICS
// ============================================================================

// Get user performance analytics
router.get('/user/:userId', 
  authenticateToken,
  async (req, res, next) => {
    try {
      const { userId } = req.params;
      const { startDate, endDate } = req.query;

      // Verify user access (user can only access their own analytics)
      if (req.user!.id !== userId && req.user!.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      let whereConditions = [eq(interviewSessions.userId, userId)];

      if (startDate && typeof startDate === 'string') {
        whereConditions.push(gte(interviewSessions.createdAt, new Date(startDate)));
      }

      if (endDate && typeof endDate === 'string') {
        whereConditions.push(lte(interviewSessions.createdAt, new Date(endDate)));
      }

      // Get user's interview sessions
      const sessions = await db.query.interviewSessions.findMany({
        where: and(...whereConditions),
        with: {
          performanceMetrics: true,
          answers: {
            with: {
              feedback: true
            }
          }
        },
        orderBy: desc(interviewSessions.createdAt)
      });

      // Calculate analytics
      const totalSessions = sessions.length;
      const completedSessions = sessions.filter(s => s.status === 'completed');
      const averageScore = completedSessions.length > 0 
        ? completedSessions.reduce((sum, s) => sum + Number(s.performanceMetrics?.[0]?.overallScore || 0), 0) / completedSessions.length
        : 0;

      // Category breakdown
      const categoryScores: Record<string, number[]> = {};
      completedSessions.forEach(session => {
        const metrics = session.performanceMetrics?.[0];
        if (metrics?.categoryScores) {
          Object.entries(metrics.categoryScores).forEach(([category, score]) => {
            if (!categoryScores[category]) {
              categoryScores[category] = [];
            }
            categoryScores[category].push(Number(score));
          });
        }
      });

      const categoryAverages: Record<string, number> = {};
      Object.entries(categoryScores).forEach(([category, scores]) => {
        categoryAverages[category] = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      });

      // Improvement trend
      const recentSessions = completedSessions.slice(0, 5);
      const olderSessions = completedSessions.slice(-5);
      
      const recentAvg = recentSessions.length > 0 
        ? recentSessions.reduce((sum, s) => sum + Number(s.performanceMetrics?.[0]?.overallScore || 0), 0) / recentSessions.length
        : 0;
      const olderAvg = olderSessions.length > 0
        ? olderSessions.reduce((sum, s) => sum + Number(s.performanceMetrics?.[0]?.overallScore || 0), 0) / olderSessions.length
        : 0;
      const improvementTrend = recentAvg - olderAvg;

      // Emotional insights
      const emotionalData = completedSessions
        .flatMap(s => s.performanceMetrics?.[0]?.emotionalTrends || [])
        .reduce((acc, trend) => {
          if (!acc[trend.emotion]) {
            acc[trend.emotion] = { frequency: 0, totalConfidence: 0 };
          }
          acc[trend.emotion].frequency += trend.frequency;
          acc[trend.emotion].totalConfidence += trend.averageConfidence;
          return acc;
        }, {} as Record<string, { frequency: number; totalConfidence: number }>);

      const emotionalInsights = Object.entries(emotionalData).map(([emotion, data]: [string, any]) => ({
        emotion,
        frequency: data.frequency,
        averageConfidence: data.totalConfidence / data.frequency
      })).sort((a, b) => b.frequency - a.frequency);

      res.json({
        success: true,
        data: {
          totalSessions,
          completedSessions: completedSessions.length,
          averageScore,
          categoryAverages,
          improvementTrend,
          emotionalInsights,
          recentSessions: recentSessions.map(s => ({
            id: s.id,
            title: s.title,
            score: Number(s.performanceMetrics?.[0]?.overallScore || 0),
            date: s.completedAt || s.createdAt
          }))
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// ============================================================================
// SESSION ANALYTICS
// ============================================================================

// Get session performance analytics
router.get('/sessions/:sessionId', 
  authenticateToken,
  async (req, res, next) => {
    try {
      const { sessionId } = req.params;
      const userId = req.user!.id;

      // Get session with all related data
      const session = await db.query.interviewSessions.findFirst({
        where: and(
          eq(interviewSessions.id, sessionId),
          eq(interviewSessions.userId, userId)
        ),
        with: {
          performanceMetrics: true,
          answers: {
            with: {
              question: true,
              feedback: true
            }
          }
        }
      });

      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Session not found'
        });
      }

      // Calculate detailed analytics
      const metrics = session.performanceMetrics?.[0];
      const answers = session.answers || [];

      const questionAnalytics = answers.map((answer: any) => {
        const feedback = answer.feedback?.[0];
        return {
          questionId: answer.questionId,
          questionText: answer.question?.text,
          questionType: answer.question?.type,
          answerText: answer.text,
          score: Number(feedback?.score || 0),
          feedback: feedback?.feedback || '',
          suggestions: feedback?.suggestions || [],
          duration: answer.duration || 0,
          emotionalAnalysis: feedback?.emotionalAnalysis || []
        };
      });

      const averageAnswerScore = answers.length > 0
        ? answers.reduce((sum: number, a: any) => sum + Number(a.feedback?.[0]?.score || 0), 0) / answers.length
        : 0;

      const totalDuration = answers.reduce((sum: number, a: any) => sum + (a.duration || 0), 0);

      res.json({
        success: true,
        data: {
          session: {
            id: session.id,
            title: session.title,
            status: session.status,
            difficulty: session.difficulty,
            duration: session.duration,
            createdAt: session.createdAt,
            completedAt: session.completedAt
          },
          performance: {
            overallScore: Number(metrics?.overallScore || 0),
            categoryScores: metrics?.categoryScores || {},
            emotionalTrends: metrics?.emotionalTrends || [],
            improvementAreas: metrics?.improvementAreas || [],
            strengths: metrics?.strengths || [],
            sessionDuration: Number(metrics?.sessionDuration || 0),
            questionsAnswered: Number(metrics?.questionsAnswered || 0)
          },
          answers: {
            total: answers.length,
            averageScore: averageAnswerScore,
            totalDuration,
            details: questionAnalytics
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// ============================================================================
// PLATFORM ANALYTICS (ADMIN ONLY)
// ============================================================================

// Get platform-wide analytics
router.get('/platform', 
  authenticateToken,
  requireRole([UserRole.ADMIN]),
  async (req, res, next) => {
    try {
      const { startDate, endDate } = req.query;

      let whereConditions = [];

      if (startDate && typeof startDate === 'string') {
        whereConditions.push(gte(interviewSessions.createdAt, new Date(startDate)));
      }

      if (endDate && typeof endDate === 'string') {
        whereConditions.push(lte(interviewSessions.createdAt, new Date(endDate)));
      }

      // Get platform statistics
      const totalUsers = await db.select({ count: count() }).from(users);
      const totalSessions = await db.select({ count: count() }).from(interviewSessions);
      const completedSessions = await db.select({ count: count() }).from(interviewSessions)
        .where(eq(interviewSessions.status, 'completed'));

      // Get average performance metrics
      const avgPerformance = await db.select({
        avgScore: avg(performanceMetrics.overallScore),
        avgDuration: avg(performanceMetrics.sessionDuration),
        avgQuestions: avg(performanceMetrics.questionsAnswered)
      }).from(performanceMetrics);

      // Get category performance
      const categoryPerformance = await db.select({
        category: feedback.category,
        avgScore: avg(feedback.score)
      }).from(feedback)
        .groupBy(feedback.category);

      // Get user engagement
      const userEngagement = await db.select({
        userId: interviewSessions.userId,
        sessionCount: count(interviewSessions.id)
      }).from(interviewSessions)
        .groupBy(interviewSessions.userId)
        .orderBy(desc(count(interviewSessions.id)))
        .limit(10);

      res.json({
        success: true,
        data: {
          overview: {
            totalUsers: totalUsers[0].count,
            totalSessions: totalSessions[0].count,
            completedSessions: completedSessions[0].count,
            completionRate: totalSessions[0].count > 0 
              ? (completedSessions[0].count / totalSessions[0].count) * 100 
              : 0
          },
          performance: {
            averageScore: avgPerformance[0].avgScore || 0,
            averageDuration: avgPerformance[0].avgDuration || 0,
            averageQuestions: avgPerformance[0].avgQuestions || 0
          },
          categories: categoryPerformance.map(cat => ({
            category: cat.category,
            averageScore: cat.avgScore || 0
          })),
          topUsers: userEngagement.map(user => ({
            userId: user.userId,
            sessionCount: user.sessionCount
          }))
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// ============================================================================
// TREND ANALYTICS
// ============================================================================

// Get performance trends over time
router.get('/trends', 
  authenticateToken,
  async (req, res, next) => {
    try {
      const { userId, period = '30d' } = req.query;
      const currentUserId = req.user!.id;

      // Verify access
      if (userId && userId !== currentUserId && req.user!.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const targetUserId = userId as string || currentUserId;

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      
      switch (period) {
        case '7d':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(endDate.getDate() - 90);
          break;
        default:
          startDate.setDate(endDate.getDate() - 30);
      }

      // Get sessions in date range
      const sessions = await db.query.interviewSessions.findMany({
        where: and(
          eq(interviewSessions.userId, targetUserId),
          gte(interviewSessions.createdAt, startDate),
          lte(interviewSessions.createdAt, endDate),
          eq(interviewSessions.status, 'completed')
        ),
        with: {
          performanceMetrics: true
        },
        orderBy: interviewSessions.createdAt
      });

      // Group by date and calculate daily averages
      const dailyData: Record<string, { scores: number[]; count: number }> = {};
      
      sessions.forEach(session => {
        const date = session.createdAt.toISOString().split('T')[0];
        const score = Number(session.performanceMetrics?.[0]?.overallScore || 0);
        
        if (!dailyData[date]) {
          dailyData[date] = { scores: [], count: 0 };
        }
        
        dailyData[date].scores.push(score);
        dailyData[date].count++;
      });

      const trends = Object.entries(dailyData).map(([date, data]) => ({
        date,
        averageScore: data.scores.reduce((sum, score) => sum + score, 0) / data.scores.length,
        sessionCount: data.count
      }));

      res.json({
        success: true,
        data: {
          period,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          trends
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// ============================================================================
// COMPARATIVE ANALYTICS
// ============================================================================

// Compare user performance with others
router.get('/compare', 
  authenticateToken,
  async (req, res, next) => {
    try {
      const { category, difficulty } = req.query;
      const userId = req.user!.id;

      let whereConditions = [eq(interviewSessions.status, 'completed')];

      if (difficulty && typeof difficulty === 'string') {
        whereConditions.push(eq(interviewSessions.difficulty, difficulty as any));
      }

      // Get user's performance
      const userSessions = await db.query.interviewSessions.findMany({
        where: and(
          eq(interviewSessions.userId, userId),
          ...whereConditions
        ),
        with: {
          performanceMetrics: true
        }
      });

      // Get all users' performance for comparison
      const allSessions = await db.query.interviewSessions.findMany({
        where: and(...whereConditions),
        with: {
          performanceMetrics: true
        }
      });

      // Calculate user's average
      const userScores = userSessions
        .map(s => Number(s.performanceMetrics?.[0]?.overallScore || 0))
        .filter(score => Number(score) > 0);
      
      const userAverage = userScores.length > 0 
        ? userScores.reduce((sum, score) => sum + score, 0) / userScores.length
        : 0;

      // Calculate overall average
      const allScores = allSessions
        .map(s => Number(s.performanceMetrics?.[0]?.overallScore || 0))
        .filter(score => Number(score) > 0);
      
      const overallAverage = allScores.length > 0
        ? allScores.reduce((sum, score) => sum + score, 0) / allScores.length
        : 0;

      // Calculate percentile
      const userPercentile = allScores.length > 0
        ? (allScores.filter(score => Number(score) < userAverage).length / allScores.length) * 100
        : 50;

      res.json({
        success: true,
        data: {
          user: {
            averageScore: userAverage,
            totalSessions: userSessions.length,
            percentile: userPercentile
          },
          comparison: {
            overallAverage,
            totalUsers: new Set(allSessions.map(s => s.userId)).size,
            totalSessions: allSessions.length
          },
          category: category || 'all',
          difficulty: difficulty || 'all'
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router; 