// --- START api/database/seed.ts --- //
// Database seeding script for AI-InterviewSpark
// Populates the database with initial data

import { db } from './connection';
import { users, interviewSessions, questions } from './schema';
import { UserRole } from '../types';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

async function seedDatabase() {
  console.log('🌱 Starting database seeding...');

  try {
    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 12);
    const adminUser = await db.insert(users).values({
      id: uuidv4(),
      email: 'admin@interviewspark.com',
      firstName: 'Admin',
      lastName: 'User',
      password: adminPassword,
      role: UserRole.ADMIN,
      language: 'en',
      accessibility: {
        highContrast: false,
        screenReader: false,
        captions: true,
      },
    }).returning();

    console.log('✅ Admin user created:', adminUser[0].email);

    // Create sample job seeker
    const userPassword = await bcrypt.hash('user123', 12);
    const sampleUser = await db.insert(users).values({
      id: uuidv4(),
      email: 'user@interviewspark.com',
      firstName: 'John',
      lastName: 'Doe',
      password: userPassword,
      role: UserRole.JOB_SEEKER,
      language: 'en',
      accessibility: {
        highContrast: false,
        screenReader: false,
        captions: true,
      },
    }).returning();

    console.log('✅ Sample user created:', sampleUser[0].email);

    // Create sample interview session
    const sampleSession = await db.insert(interviewSessions).values({
      id: uuidv4(),
      userId: sampleUser[0].id,
      type: 'video',
      status: 'scheduled',
      title: 'Software Engineer Interview',
      description: 'Mock interview for software engineering position',
      jobTitle: 'Software Engineer',
      company: 'Tech Corp',
      duration: 30,
      difficulty: 'intermediate',
      topics: ['JavaScript', 'React', 'Node.js'],
      scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    }).returning();

    console.log('✅ Sample interview session created');

    // Create sample questions
    const sampleQuestions = [
      {
        sessionId: sampleSession[0].id,
        type: 'behavioral',
        text: 'Tell me about a time when you had to solve a complex problem.',
        category: 'Problem Solving',
        difficulty: 'intermediate',
        expectedKeywords: ['problem', 'solution', 'approach'],
        timeLimit: 120,
        order: 1,
      },
      {
        sessionId: sampleSession[0].id,
        type: 'technical',
        text: 'Explain the difference between let, const, and var in JavaScript.',
        category: 'JavaScript',
        difficulty: 'beginner',
        expectedKeywords: ['scope', 'hoisting', 'block'],
        timeLimit: 90,
        order: 2,
      },
      {
        sessionId: sampleSession[0].id,
        type: 'situational',
        text: 'How would you handle a disagreement with a team member?',
        category: 'Teamwork',
        difficulty: 'intermediate',
        expectedKeywords: ['communication', 'collaboration', 'resolution'],
        timeLimit: 120,
        order: 3,
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
      });
    }

    console.log('✅ Sample questions created');

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📋 Sample credentials:');
    console.log('Admin: admin@interviewspark.com / admin123');
    console.log('User: user@interviewspark.com / user123');

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