import { eq, and, desc, count, gte, lte } from 'drizzle-orm';
import { db } from '../connection';
import { interviewSessions, questions, feedback } from '../schema';
import type { InterviewSession, Question, Feedback } from '../../types';

export class InterviewRepository {
  async createSession(sessionData: Omit<InterviewSession, 'id' | 'createdAt' | 'updatedAt'>): Promise<InterviewSession> {
    const [session] = await db.insert(interviewSessions).values(sessionData).returning();
    return session;
  }

  async getSessionById(id: string): Promise<InterviewSession | null> {
    const [session] = await db
      .select()
      .from(interviewSessions)
      .where(eq(interviewSessions.id, id));
    return (session as InterviewSession) || null;
  }

  async getUserSessions(userId: string, limit: number = 10): Promise<InterviewSession[]> {
    const sessions = await db
      .select()
      .from(interviewSessions)
      .where(eq(interviewSessions.userId, userId))
      .orderBy(desc(interviewSessions.createdAt))
      .limit(limit);
    return sessions as InterviewSession[];
  }

  async addQuestionToSession(questionData: Omit<Question, 'id' | 'createdAt'>): Promise<Question> {
    const [question] = await db.insert(questions).values(questionData).returning();
    return question;
  }

  async getSessionQuestions(sessionId: string): Promise<Question[]> {
    const questionsResult = await db
      .select()
      .from(questions)
      .where(eq(questions.sessionId, sessionId))
      .orderBy(questions.order);
    return questionsResult as Question[];
  }

  async addFeedback(feedbackData: Omit<Feedback, 'id' | 'createdAt'>): Promise<Feedback> {
    const [feedbackResult] = await db.insert(feedback).values(feedbackData as any).returning();
    return feedbackResult as Feedback;
  }

  async getSessionFeedback(sessionId: string): Promise<Feedback[]> {
    const feedbackResults = await db
      .select()
      .from(feedback)
      .where(eq(feedback.sessionId, sessionId));
    return feedbackResults as Feedback[];
  }

  async updateSessionStatus(sessionId: string, status: string): Promise<InterviewSession | null> {
    const [session] = await db
      .update(interviewSessions)
      .set({ status, updatedAt: new Date() })
      .where(eq(interviewSessions.id, sessionId))
      .returning();
    return (session as InterviewSession) || null;
  }
}

export const interviewRepository = new InterviewRepository();
