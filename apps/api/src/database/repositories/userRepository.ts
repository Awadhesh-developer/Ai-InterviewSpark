import { eq, and, desc, count } from 'drizzle-orm';
import { db } from '../connection';
import { users, expertProfiles } from '../schema';
import type { User, ExpertProfile } from '../../types';

export class UserRepository {
  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const [user] = await db.insert(users).values(userData as any).returning();
    return user as User;
  }

  async getUserById(id: string): Promise<User | null> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user ? (user as User) : null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user ? (user as User) : null;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user ? (user as User) : null;
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return (result as any).rowCount > 0;
  }

  async getUsersWithPagination(page: number = 1, limit: number = 10) {
    const offset = (page - 1) * limit;
    
    const [usersData, totalCount] = await Promise.all([
      db.select().from(users).limit(limit).offset(offset).orderBy(desc(users.createdAt)),
      db.select({ count: count() }).from(users)
    ]);

    return {
      users: usersData,
      total: totalCount[0].count,
      page,
      limit,
      totalPages: Math.ceil(totalCount[0].count / limit)
    };
  }
}

export const userRepository = new UserRepository();