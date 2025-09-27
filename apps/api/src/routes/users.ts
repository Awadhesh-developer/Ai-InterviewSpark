// --- START api/routes/users.ts --- //
// Users routes for AI-InterviewSpark API
// Handles user profile management and user-related operations

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { UserService } from '../services/userService';
import { authenticateToken, requireRole } from '../middleware/auth';
import { validateRequest } from '../types';
import { db } from '../database/connection';
import { users } from '../database/schema';
import { eq } from 'drizzle-orm';
import { asyncHandler } from '../middleware/asyncHandler';
import { UserRole } from '../types';
import { InterviewService } from '../services/interviewService';

const router = Router();

// ============================================================================
// USER PROFILE MANAGEMENT
// ============================================================================

// Get current user profile
router.get('/me', 
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const user = await UserService.getUserProfile(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  })
);

// Update user profile
const updateProfileSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  bio: z.string().optional(),
  location: z.string().optional(),
  timezone: z.string().optional(),
  language: z.string().optional(),
  accessibility: z.object({
    highContrast: z.boolean().optional(),
    screenReader: z.boolean().optional(),
    captions: z.boolean().optional(),
  }).optional(),
});

router.put('/me', 
  authenticateToken,
  validateRequest(updateProfileSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const updatedUser = await UserService.updateUserProfile(userId, req.body);
    
    res.json({
      success: true,
      data: updatedUser,
      message: 'Profile updated successfully'
    });
  })
);

// Update user avatar
router.put('/me/avatar', 
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { avatarUrl } = req.body;

    if (!avatarUrl) {
      return res.status(400).json({
        success: false,
        message: 'Avatar URL is required'
      });
    }

    const updatedUser = await UserService.updateUserProfile(userId, { avatar: avatarUrl });
    
    res.json({
      success: true,
      data: updatedUser,
      message: 'Avatar updated successfully'
    });
  })
);

// ============================================================================
// USER STATISTICS
// ============================================================================

// Get user statistics
router.get('/me/stats', 
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const stats = await InterviewService.getUserAnalytics(userId);
    
    res.json({
      success: true,
      data: stats
    });
  })
);

// ============================================================================
// EXPERT PROFILE MANAGEMENT
// ============================================================================

// Get expert profile
router.get('/me/expert-profile', 
  authenticateToken,
  requireRole([UserRole.EXPERT]),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const expertProfile = await UserService.getExpertProfile(userId);
    
    res.json({
      success: true,
      data: expertProfile
    });
  })
);

// Create/update expert profile
const expertProfileSchema = z.object({
  specialties: z.array(z.string()).min(1),
  experience: z.number().min(0),
  hourlyRate: z.number().min(0),
  availability: z.array(z.object({
    day: z.number().min(0).max(6),
    startTime: z.string(),
    endTime: z.string(),
  })),
});

router.put('/me/expert-profile', 
  authenticateToken,
  requireRole([UserRole.EXPERT]),
  validateRequest(expertProfileSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const expertProfile = await UserService.createExpertProfile(userId, req.body);
    
    res.json({
      success: true,
      data: expertProfile,
      message: 'Expert profile updated successfully'
    });
  })
);

// ============================================================================
// ADMIN USER MANAGEMENT
// ============================================================================

// Get all users (admin only)
router.get('/',
  authenticateToken,
  requireRole([UserRole.ADMIN]),
  asyncHandler(async (req: Request, res: Response) => {
    const {
      limit = 50,
      offset = 0,
      page = 1,
      role,
      status,
      search
    } = req.query;

    // Calculate actual offset from page
    const actualOffset = page ? (Number(page) - 1) * Number(limit) : Number(offset);

    // Build where conditions
    let whereConditions: any = {};
    if (role && role !== 'all') {
      whereConditions.role = role as UserRole;
    }
    if (status && status !== 'all') {
      whereConditions.status = status;
    }

    // Get users from database
    const allUsers = await db.query.users.findMany({
      where: Object.keys(whereConditions).length > 0 ? whereConditions : undefined,
      limit: Number(limit),
      offset: actualOffset,
      orderBy: users.createdAt,
    });

    // Transform users to frontend format
    const transformedUsers = allUsers.map(user => ({
      id: user.id,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email,
      role: user.role,
      department: getDepartmentFromRole(user.role),
      status: user.status || 'active',
      avatar: user.avatar || '',
      phoneNumber: user.phoneNumber || '',
      lastLogin: user.lastLoginAt,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      permissions: getPermissionsFromRole(user.role)
    }));

    // Apply client-side search filter if needed (since database might not support full text search)
    let filteredUsers = transformedUsers;
    if (search) {
      const searchTerm = search.toString().toLowerCase();
      filteredUsers = transformedUsers.filter(user =>
        user.firstName.toLowerCase().includes(searchTerm) ||
        user.lastName.toLowerCase().includes(searchTerm) ||
        user.email.toLowerCase().includes(searchTerm) ||
        user.department.toLowerCase().includes(searchTerm)
      );
    }

    // Calculate stats
    const stats = {
      total: filteredUsers.length,
      active: filteredUsers.filter(u => u.status === 'active').length,
      pending: filteredUsers.filter(u => u.status === 'pending').length,
      inactive: filteredUsers.filter(u => u.status === 'inactive').length,
      admins: filteredUsers.filter(u => u.role === 'admin').length
    };

    res.json({
      success: true,
      users: filteredUsers,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: filteredUsers.length,
        totalPages: Math.ceil(filteredUsers.length / Number(limit))
      },
      stats
    });
  })
);

// Helper functions for user transformation
function getDepartmentFromRole(role: string): string {
  const departmentMap: { [key: string]: string } = {
    'admin': 'Administration',
    'expert': 'Coaching',
    'job_seeker': 'General',
    'user': 'General'
  };
  return departmentMap[role] || 'General';
}

function getPermissionsFromRole(role: string): string[] {
  const permissionMap: { [key: string]: string[] } = {
    'admin': ['all'],
    'expert': ['coaching', 'sessions', 'analytics'],
    'job_seeker': ['interviews', 'resume', 'basic_analytics'],
    'user': ['interviews', 'resume', 'basic_analytics']
  };
  return permissionMap[role] || ['interviews', 'resume'];
}

// Get user by ID (admin only)
router.get('/:userId', 
  authenticateToken,
  requireRole([UserRole.ADMIN]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.params;
      const user = await UserService.getUserProfile(userId);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  }
);

// Update user role (admin only)
router.put('/:userId/role', 
  authenticateToken,
  requireRole([UserRole.ADMIN]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.params;
      const { role } = req.body;

      if (!['job_seeker', 'expert', 'admin'].includes(role)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid role'
        });
      }

      // Update user role directly in database (admin only operation)
      const updatedUser = await db.update(users)
        .set({ role: role as 'job_seeker' | 'expert' | 'admin' })
        .where(eq(users.id, userId))
        .returning();
      
      res.json({
        success: true,
        data: updatedUser[0],
        message: 'User role updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

// Delete user (admin only)
router.delete('/:userId', 
  authenticateToken,
  requireRole([UserRole.ADMIN]),
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;

    // Check if user exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.id, userId)
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent admin from deleting themselves
    if (userId === req.user!.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    // Delete the user
    await db.delete(users).where(eq(users.id, userId));

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  })
);

export default router; 