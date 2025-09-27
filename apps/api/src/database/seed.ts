// --- START api/database/seed-fixed.ts --- //
// Fixed Database seeding script for AI-InterviewSpark
// Populates the database with initial data using proper schema

import { db } from './connection';
import { users, interviewSessions, questions } from './schema';
import { UserRole } from '../types';
import bcrypt from 'bcryptjs';

async function seedDatabase() {
  console.log('🌱 Starting database seeding...');

  try {
    // Check if admin user already exists
    const existingAdmin = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, 'admin@interviewspark.com'),
    });

    if (existingAdmin) {
      console.log('⚠️  Admin user already exists, skipping creation');
    } else {
      // Create admin user with complete schema
      const adminPassword = await bcrypt.hash('Admin123!', 12);
      const adminUser = await db.insert(users).values({
        email: 'admin@interviewspark.com',
        firstName: 'Admin',
        lastName: 'User',
        password: adminPassword,
        role: 'admin',
        language: 'en',
        status: 'active',
        emailVerified: true,
        accessibility: {
          highContrast: false,
          screenReader: false,
          captions: true,
        },
        notificationPreferences: {
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
        },
        userSettings: {
          theme: 'light',
          timezone: 'UTC',
          dateFormat: 'MM/DD/YYYY',
          timeFormat: '12h',
          language: 'en',
          notifications: {
            email: true,
            push: true,
            sms: false,
          },
          privacy: {
            profileVisibility: 'public',
            showEmail: false,
            showPhone: false,
          },
          interview: {
            defaultDifficulty: 'intermediate',
            defaultDuration: 30,
            autoSave: true,
            showHints: true,
          },
        },
      }).returning();

      console.log('✅ Admin user created:', adminUser[0].email);
    }

    // Check if sample user already exists
    const existingUser = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, 'user@interviewspark.com'),
    });

    let sampleUserId: string;

    if (existingUser) {
      console.log('⚠️  Sample user already exists, skipping creation');
      sampleUserId = existingUser.id;
    } else {
      // Create sample job seeker with complete schema
      const userPassword = await bcrypt.hash('User123!', 12);
      const sampleUser = await db.insert(users).values({
        email: 'user@interviewspark.com',
        firstName: 'John',
        lastName: 'Doe',
        password: userPassword,
        role: 'job_seeker',
        language: 'en',
        status: 'active',
        emailVerified: true,
        bio: 'Software developer looking for new opportunities',
        location: 'San Francisco, CA',
        timezone: 'America/Los_Angeles',
        accessibility: {
          highContrast: false,
          screenReader: false,
          captions: true,
        },
        notificationPreferences: {
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
        },
        userSettings: {
          theme: 'dark',
          timezone: 'America/Los_Angeles',
          dateFormat: 'MM/DD/YYYY',
          timeFormat: '12h',
          language: 'en',
          notifications: {
            email: true,
            push: true,
            sms: false,
          },
          privacy: {
            profileVisibility: 'public',
            showEmail: false,
            showPhone: false,
          },
          interview: {
            defaultDifficulty: 'intermediate',
            defaultDuration: 30,
            autoSave: true,
            showHints: true,
          },
        },
      }).returning();

      console.log('✅ Sample user created:', sampleUser[0].email);
      sampleUserId = sampleUser[0].id;
    }

    // Create expert user
    const existingExpert = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, 'expert@interviewspark.com'),
    });

    if (!existingExpert) {
      const expertPassword = await bcrypt.hash('Expert123!', 12);
      const expertUser = await db.insert(users).values({
        email: 'expert@interviewspark.com',
        firstName: 'Sarah',
        lastName: 'Johnson',
        password: expertPassword,
        role: 'expert',
        language: 'en',
        status: 'active',
        emailVerified: true,
        bio: 'Senior Software Engineer with 10+ years of experience',
        location: 'New York, NY',
        timezone: 'America/New_York',
        accessibility: {
          highContrast: false,
          screenReader: false,
          captions: true,
        },
        notificationPreferences: {
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
            sessionReminders: true,
            urgentOnly: false,
          },
        },
        userSettings: {
          theme: 'light',
          timezone: 'America/New_York',
          dateFormat: 'MM/DD/YYYY',
          timeFormat: '12h',
          language: 'en',
          notifications: {
            email: true,
            push: true,
            sms: true,
          },
          privacy: {
            profileVisibility: 'public',
            showEmail: true,
            showPhone: false,
          },
          interview: {
            defaultDifficulty: 'advanced',
            defaultDuration: 45,
            autoSave: true,
            showHints: false,
          },
        },
      }).returning();

      console.log('✅ Expert user created:', expertUser[0].email);
    } else {
      console.log('⚠️  Expert user already exists, skipping creation');
    }

    // Check if sample interview session already exists
    const existingSession = await db.query.interviewSessions.findFirst({
      where: (sessions, { eq }) => eq(sessions.userId, sampleUserId),
    });

    let sessionId: string;

    if (existingSession) {
      console.log('⚠️  Sample interview session already exists, skipping creation');
      sessionId = existingSession.id;
    } else {
      // Create sample interview session with proper schema
      const sampleSession = await db.insert(interviewSessions).values({
        userId: sampleUserId,
        type: 'video',
        status: 'scheduled',
        title: 'Software Engineer Mock Interview',
        description: 'Comprehensive mock interview for software engineering position focusing on technical and behavioral questions',
        jobTitle: 'Senior Software Engineer',
        company: 'TechCorp Inc.',
        duration: 45,
        difficulty: 'intermediate',
        topics: ['JavaScript', 'React', 'Node.js', 'System Design'],
        scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        sessionState: {
          currentStep: 'waiting',
          questionIndex: 0,
          totalQuestions: 3,
          timeRemaining: 45 * 60, // 45 minutes in seconds
          isPaused: false,
          pausedAt: null,
          resumedAt: null,
        },
        realTimeData: {
          emotionData: [],
          voiceAnalysis: [],
          facialAnalysis: [],
          performanceMetrics: {},
          liveFeedback: [],
        },
      }).returning();

      console.log('✅ Sample interview session created');
      sessionId = sampleSession[0].id;
    }

    // Check if sample questions already exist
    const existingQuestions = await db.query.questions.findFirst({
      where: (questions, { eq }) => eq(questions.sessionId, sessionId),
    });

    if (!existingQuestions) {
      // Create sample questions with proper schema
      const sampleQuestions = [
        {
          sessionId: sessionId,
          type: 'behavioral',
          text: 'Tell me about a time when you had to solve a complex technical problem under pressure.',
          category: 'Problem Solving',
          difficulty: 'medium',
          expectedKeywords: ['problem', 'solution', 'approach', 'pressure', 'deadline'],
          timeLimit: 180, // 3 minutes
          order: 1,
          source: 'curated',
          freshnessScore: '0.95',
          relevanceScore: '0.90',
          companySpecific: false,
          industryTrends: ['remote-work', 'agile-development'],
          followUpQuestions: [
            'What was the outcome?',
            'What would you do differently?',
            'How did you manage the time pressure?'
          ],
          tips: [
            'Use the STAR method (Situation, Task, Action, Result)',
            'Be specific about your role and actions',
            'Focus on the problem-solving process'
          ],
        },
        {
          sessionId: sessionId,
          type: 'technical',
          text: 'Explain the difference between let, const, and var in JavaScript, including their scoping behavior.',
          category: 'JavaScript Fundamentals',
          difficulty: 'easy',
          expectedKeywords: ['scope', 'hoisting', 'block-scope', 'function-scope', 'temporal-dead-zone'],
          timeLimit: 120, // 2 minutes
          order: 2,
          source: 'curated',
          freshnessScore: '0.85',
          relevanceScore: '0.95',
          companySpecific: false,
          industryTrends: ['javascript', 'es6'],
          followUpQuestions: [
            'Can you give an example of when you would use each one?',
            'What happens if you try to reassign a const variable?',
            'Explain temporal dead zone with an example'
          ],
          tips: [
            'Provide clear examples for each declaration type',
            'Explain the practical differences in real code',
            'Mention when each should be used'
          ],
        },
        {
          sessionId: sessionId,
          type: 'situational',
          text: 'How would you handle a situation where you disagree with a senior team member about the technical approach to a project?',
          category: 'Teamwork & Communication',
          difficulty: 'medium',
          expectedKeywords: ['communication', 'collaboration', 'conflict-resolution', 'respectful', 'data-driven'],
          timeLimit: 150, // 2.5 minutes
          order: 3,
          source: 'curated',
          freshnessScore: '0.88',
          relevanceScore: '0.92',
          companySpecific: false,
          industryTrends: ['team-collaboration', 'technical-leadership'],
          followUpQuestions: [
            'What if the senior member insists on their approach?',
            'How would you present your alternative solution?',
            'Have you experienced this situation before?'
          ],
          tips: [
            'Emphasize respect and professionalism',
            'Focus on data and technical merits',
            'Show willingness to compromise and learn'
          ],
        },
      ];

      for (const questionData of sampleQuestions) {
        await db.insert(questions).values({
          sessionId: questionData.sessionId,
          type: questionData.type as 'behavioral' | 'technical' | 'situational' | 'company-specific',
          text: questionData.text,
          category: questionData.category,
          difficulty: questionData.difficulty as 'easy' | 'medium' | 'hard',
          expectedKeywords: questionData.expectedKeywords,
          timeLimit: questionData.timeLimit,
          order: questionData.order,
          source: questionData.source as 'ai-generated' | 'scraped' | 'curated',
          freshnessScore: questionData.freshnessScore,
          relevanceScore: questionData.relevanceScore,
          companySpecific: questionData.companySpecific,
          industryTrends: questionData.industryTrends,
          followUpQuestions: questionData.followUpQuestions,
          tips: questionData.tips,
        });
      }

      console.log('✅ Sample questions created');
    } else {
      console.log('⚠️  Sample questions already exist, skipping creation');
    }

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📋 Sample credentials:');
    console.log('👨‍💼 Admin: admin@interviewspark.com / Admin123!');
    console.log('👤 Job Seeker: user@interviewspark.com / User123!');
    console.log('🎓 Expert: expert@interviewspark.com / Expert123!');
    console.log('\n🔐 All passwords follow strong password requirements');
    console.log('✅ Email verification is set to true for all seed users');
    console.log('🎯 Users have complete profiles with preferences and settings');

  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    throw error;
  }
}

// Run seeding if called directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('✅ Seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    });
}

export { seedDatabase };