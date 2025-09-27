// Enhanced Database seeding script for AI-InterviewSpark
// Populates the database with enhanced question generation data

import { db } from './connection';
import { 
  users, 
  interviewSessions, 
  questions, 
  sampleAnswers, 
  questionTrends, 
  companyInsights 
} from './schema';
import { UserRole } from '../types';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { eq } from 'drizzle-orm';

async function seedEnhancedData() {
  console.log('🌱 Starting enhanced database seeding...');

  try {
    // Clear enhanced tables first
    console.log('🗑️  Clearing enhanced tables...');
    await db.delete(sampleAnswers);
    await db.delete(questionTrends);
    await db.delete(companyInsights);

    // Seed company insights
    console.log('🏢 Seeding company insights...');
    await db.insert(companyInsights).values([
      {
        companyName: 'Google',
        culture: ['Innovation', 'Collaboration', 'Data-driven'],
        values: ['Focus on the user', 'Think big', 'Be bold'],
        recentNews: ['AI advancements', 'Sustainability initiatives', 'Product launches'],
        interviewStyle: 'behavioral-technical-mix',
        commonQuestions: ['Why Google?', 'Tell me about a technical challenge', 'How do you handle ambiguity?'],
      },
      {
        companyName: 'Microsoft',
        culture: ['Respect', 'Integrity', 'Accountability'],
        values: ['Empower every person', 'Achieve more together'],
        recentNews: ['Cloud growth', 'AI integration', 'Accessibility features'],
        interviewStyle: 'behavioral-focused',
        commonQuestions: ['Why Microsoft?', 'Describe a leadership experience', 'How do you collaborate?'],
      },
      {
        companyName: 'Amazon',
        culture: ['Customer obsession', 'Ownership', 'Invent and simplify'],
        values: ['Customer first', 'Long-term thinking'],
        recentNews: ['AWS expansion', 'Sustainability goals', 'Innovation in logistics'],
        interviewStyle: 'leadership-principles-based',
        commonQuestions: ['Tell me about a time you failed', 'Customer obsession example', 'How do you handle pressure?'],
      },
      {
        companyName: 'Apple',
        culture: ['Innovation', 'Excellence', 'Privacy'],
        values: ['Think different', 'Privacy is a human right'],
        recentNews: ['New product launches', 'Environmental initiatives', 'Privacy features'],
        interviewStyle: 'design-thinking-focused',
        commonQuestions: ['Why Apple?', 'How do you approach design problems?', 'Tell me about innovation'],
      },
    ]);

    // Seed question trends
    console.log('📈 Seeding question trends...');
    await db.insert(questionTrends).values([
      {
        industry: 'technology',
        topic: 'AI/Machine Learning',
        frequency: 85,
        growth: '25.5',
        relatedSkills: ['Python', 'TensorFlow', 'Data Analysis'],
        timeframe: 'month',
      },
      {
        industry: 'technology',
        topic: 'Cloud Computing',
        frequency: 78,
        growth: '18.2',
        relatedSkills: ['AWS', 'Azure', 'DevOps'],
        timeframe: 'month',
      },
      {
        industry: 'technology',
        topic: 'Cybersecurity',
        frequency: 65,
        growth: '22.1',
        relatedSkills: ['Security Protocols', 'Risk Assessment'],
        timeframe: 'month',
      },
      {
        industry: 'finance',
        topic: 'Digital Banking',
        frequency: 72,
        growth: '15.8',
        relatedSkills: ['Fintech', 'Compliance', 'Risk Management'],
        timeframe: 'month',
      },
      {
        industry: 'finance',
        topic: 'ESG Reporting',
        frequency: 58,
        growth: '35.2',
        relatedSkills: ['Sustainability', 'Data Analysis'],
        timeframe: 'month',
      },
      {
        industry: 'healthcare',
        topic: 'Telemedicine',
        frequency: 68,
        growth: '28.3',
        relatedSkills: ['Healthcare Technology', 'Patient Care'],
        timeframe: 'month',
      },
    ]);

    // Get existing questions to add sample answers
    console.log('🔍 Finding existing questions...');
    const existingQuestions = await db.select().from(questions).limit(5);

    if (existingQuestions.length > 0) {
      console.log('💬 Seeding sample answers...');
      
      // Create sample answers for existing questions
      const sampleAnswersData = existingQuestions.map((question, index) => ({
        questionId: question.id,
        answer: generateSampleAnswer(question.type, question.text),
        structure: question.type === 'behavioral' ? 'star' as const : 'problem-solution' as const,
        keyPoints: generateKeyPoints(question.type),
        estimatedDuration: 120,
        difficulty: 'intermediate' as const,
        industry: 'technology',
        role: 'Software Engineer',
        tips: generateTips(question.type),
        commonMistakes: generateCommonMistakes(question.type),
      }));

      await db.insert(sampleAnswers).values(sampleAnswersData);
    }

    // Update existing questions with enhanced metadata
    console.log('🔄 Updating existing questions with enhanced metadata...');
    for (const question of existingQuestions) {
      await db.update(questions)
        .set({
          source: 'ai-generated',
          freshnessScore: '0.85',
          relevanceScore: '0.90',
          companySpecific: question.text.toLowerCase().includes('company') || question.text.toLowerCase().includes('team'),
          industryTrends: ['software development', 'technology'],
          llmProvider: (['openai', 'gemini', 'claude'] as const)[Math.floor(Math.random() * 3)],
          starFramework: question.type === 'behavioral' ? {
            situation: 'Example situation for this question type',
            task: 'Task that needed to be accomplished',
            action: 'Actions taken to address the situation',
            result: 'Positive outcome achieved',
            keyPoints: ['leadership', 'problem-solving', 'communication']
          } : null,
          followUpQuestions: generateFollowUpQuestions(question.type),
          tips: generateTips(question.type),
        })
        .where(eq(questions.id, question.id));
    }

    console.log('✅ Enhanced database seeding completed successfully!');
    console.log(`📊 Seeded data summary:`);
    console.log(`   - ${4} company insights`);
    console.log(`   - ${6} question trends`);
    console.log(`   - ${existingQuestions.length} sample answers`);
    console.log(`   - Updated ${existingQuestions.length} questions with enhanced metadata`);

  } catch (error) {
    console.error('❌ Enhanced database seeding failed:', error);
    throw error;
  }
}

function generateSampleAnswer(type: string, questionText: string): string {
  const answers = {
    behavioral: `In my previous role as a software engineer, I encountered a situation where ${questionText.toLowerCase().includes('team') ? 'our team faced a challenging deadline' : 'I had to solve a complex technical problem'}. My task was to ensure we delivered quality results while maintaining team morale. I took action by breaking down the problem, collaborating with stakeholders, and implementing a systematic approach. As a result, we successfully achieved our goals and learned valuable lessons for future projects.`,
    
    technical: `This is a fundamental concept in software development. ${questionText.toLowerCase().includes('javascript') ? 'In JavaScript, the key differences relate to scope, hoisting, and reassignment capabilities.' : 'The technical approach involves understanding the underlying principles and best practices.'} I would implement this by following established patterns and considering performance implications. This ensures maintainable and efficient code.`,
    
    situational: `In this scenario, I would first assess the situation by gathering all relevant information and understanding the stakeholders involved. Then I would develop a strategic approach that balances competing priorities and aligns with business objectives. My implementation would involve clear communication, setting expectations, and monitoring progress to ensure successful outcomes.`
  };

  return answers[type as keyof typeof answers] || answers.behavioral;
}

function generateKeyPoints(type: string): string[] {
  const keyPoints = {
    behavioral: ['leadership', 'communication', 'problem-solving', 'teamwork'],
    technical: ['technical expertise', 'best practices', 'performance', 'maintainability'],
    situational: ['strategic thinking', 'stakeholder management', 'decision-making', 'execution']
  };

  return keyPoints[type as keyof typeof keyPoints] || keyPoints.behavioral;
}

function generateTips(type: string): string[] {
  const tips = {
    behavioral: ['Use the STAR method', 'Be specific with examples', 'Show personal growth', 'Quantify results when possible'],
    technical: ['Explain your reasoning', 'Consider edge cases', 'Discuss trade-offs', 'Mention best practices'],
    situational: ['Think strategically', 'Consider multiple perspectives', 'Show decision-making process', 'Discuss implementation']
  };

  return tips[type as keyof typeof tips] || tips.behavioral;
}

function generateCommonMistakes(type: string): string[] {
  const mistakes = {
    behavioral: ['Being too vague', 'Not showing personal contribution', 'Focusing on negatives', 'Lack of structure'],
    technical: ['Not explaining reasoning', 'Ignoring edge cases', 'Over-complicating solutions', 'Missing best practices'],
    situational: ['Not considering stakeholders', 'Lack of strategic thinking', 'Poor prioritization', 'Vague implementation']
  };

  return mistakes[type as keyof typeof mistakes] || mistakes.behavioral;
}

function generateFollowUpQuestions(type: string): string[] {
  const followUps = {
    behavioral: ['What would you do differently?', 'How did this experience change your approach?'],
    technical: ['Can you explain the trade-offs?', 'How would you optimize this further?'],
    situational: ['What factors would influence your decision?', 'How would you measure success?']
  };

  return followUps[type as keyof typeof followUps] || followUps.behavioral;
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seedEnhancedData()
    .then(() => {
      console.log('🎉 Enhanced seeding process finished');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Enhanced seeding process failed:', error);
      process.exit(1);
    });
}

export { seedEnhancedData };
