// --- START api/tests/services/userService.test.ts --- //
// Tests for user service functionality

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { UserService } from '../../services/userService';
import { db } from '../../database/connection';
import { users } from '../../database/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

// Mock database
vi.mock('../../database/connection', () => ({
  db: {
    insert: vi.fn(),
    query: {
      users: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
    },
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

// Mock bcrypt
vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn(),
  },
}));

// Mock auth middleware
vi.mock('../../middleware/auth', () => ({
  generateToken: vi.fn().mockReturnValue('mock-jwt-token'),
  validatePassword: vi.fn().mockReturnValue(true),
  validateEmail: vi.fn().mockReturnValue(true),
}));

describe('UserService', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mock implementations
    (db.insert as any).mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([]),
      }),
    });

    (db.update as any).mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([]),
        }),
      }),
    });

    (db.delete as any).mockReturnValue({
      where: vi.fn().mockResolvedValue({ rowCount: 1 }),
    });
  });

  describe('register', () => {
    it('should create a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
        role: 'job_seeker' as const,
      };

      const hashedPassword = 'hashedPassword123';
      const mockUser = {
        id: 'user-123',
        ...userData,
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock database query to return null (user doesn't exist)
      (db.query.users.findFirst as any).mockResolvedValue(null);

      // Mock bcrypt.hash
      (bcrypt.hash as any).mockResolvedValue(hashedPassword);

      // Mock database insert
      (db.insert as any).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockUser]),
        }),
      });

      const result = await UserService.register(userData);

      expect(bcrypt.hash).toHaveBeenCalledWith(userData.password, 12);
      expect(db.insert).toHaveBeenCalledWith(users);
      expect(result.user).toEqual(expect.objectContaining({
        id: mockUser.id,
        email: mockUser.email,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
      }));
      expect(result.token).toBeDefined();
    });

    it('should throw error if email already exists', async () => {
      const userData = {
        email: 'existing@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        role: 'job_seeker' as const,
      };

      // Mock existing user
      (db.query.users.findFirst as any).mockResolvedValue({
        id: 'existing-user',
        email: userData.email,
      });

      await expect(UserService.register(userData)).rejects.toThrow('User with this email already exists');
    });
  });

  describe('login', () => {
    it('should authenticate user with correct credentials', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      const hashedPassword = 'hashedPassword123';

      const mockUser = {
        id: 'user-123',
        email,
        password: hashedPassword,
        firstName: 'John',
        lastName: 'Doe',
        role: 'job_seeker',
      };

      // Mock database query
      (db.query.users.findFirst as any).mockResolvedValue(mockUser);

      // Mock bcrypt.compare
      (bcrypt.compare as any).mockResolvedValue(true);

      const result = await UserService.login(email, password);

      expect(db.query.users.findFirst).toHaveBeenCalledWith({
        where: eq(users.email, email),
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
      expect(result).toEqual({
        user: expect.objectContaining({
          id: mockUser.id,
          email: mockUser.email,
          firstName: mockUser.firstName,
          lastName: mockUser.lastName,
          role: mockUser.role
        }),
        token: 'mock-jwt-token'
      });
    });

    it('should throw error for invalid credentials', async () => {
      const email = 'test@example.com';
      const password = 'wrongpassword';

      // Mock user not found
      (db.query.users.findFirst as any).mockResolvedValue(null);

      await expect(UserService.login(email, password)).rejects.toThrow('Invalid email or password');
    });

    it('should throw error for incorrect password', async () => {
      const email = 'test@example.com';
      const password = 'wrongpassword';
      const hashedPassword = 'hashedPassword123';

      const mockUser = {
        id: 'user-123',
        email,
        password: hashedPassword,
      };

      // Mock database query
      (db.query.users.findFirst as any).mockResolvedValue(mockUser);

      // Mock bcrypt.compare
      (bcrypt.compare as any).mockResolvedValue(false);

      await expect(UserService.login(email, password)).rejects.toThrow('Invalid email or password');
    });
  });

  describe('getUserProfile', () => {
    it('should return user by id', async () => {
      const userId = 'user-123';
      const mockUser = {
        id: userId,
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'job_seeker',
      };

      (db.query.users.findFirst as any).mockResolvedValue(mockUser);

      const result = await UserService.getUserProfile(userId);

      expect(db.query.users.findFirst).toHaveBeenCalledWith({
        where: expect.any(Object),
      });
      expect(result).toEqual(expect.objectContaining({
        id: mockUser.id,
        email: mockUser.email,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
        role: mockUser.role
      }));
    });

    it('should return null for non-existent user', async () => {
      const userId = 'non-existent';

      (db.query.users.findFirst as any).mockResolvedValue(null);

      const result = await UserService.getUserProfile(userId);

      expect(result).toBeNull();
    });
  });

  describe('updateUserProfile', () => {
    it('should update user successfully', async () => {
      const userId = 'user-123';
      const updateData = {
        firstName: 'Jane',
        lastName: 'Smith',
        bio: 'Updated bio',
      };

      const updatedUser = {
        id: userId,
        email: 'test@example.com',
        ...updateData,
        updatedAt: new Date(),
      };

      (db.update as any).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([updatedUser]),
          }),
        }),
      });

      const result = await UserService.updateUserProfile(userId, updateData);

      expect(db.update).toHaveBeenCalledWith(users);
      expect(result).toEqual(expect.objectContaining({
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        bio: updatedUser.bio,
        updatedAt: expect.any(Date)
      }));
    });


  });

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      const userId = 'user-123';

      (db.delete as any).mockReturnValue({
        where: vi.fn().mockResolvedValue({ rowCount: 1 }),
      });

      await UserService.deleteUser(userId);

      expect(db.delete).toHaveBeenCalledWith(users);
    });
  });


});
