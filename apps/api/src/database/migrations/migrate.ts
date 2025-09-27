import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { db, postgresClient } from '../connection';
import { config } from '../../config';
import path from 'path';

export const runMigrations = async (): Promise<void> => {
  try {
    console.log('🔄 Running database migrations...');
    
    const migrationsFolder = path.join(__dirname, './');
    
    await migrate(db, { migrationsFolder });
    
    console.log('✅ Database migrations completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
};

export const validateSchema = async (): Promise<boolean> => {
  try {
    console.log('🔍 Validating database schema...');
    
    // Check if all required tables exist
    const requiredTables = [
      'users', 'expert_profiles', 'interview_sessions', 
      'questions', 'feedback', 'analytics_events'
    ];
    
    const result = await postgresClient`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = ANY(${requiredTables})
    `;
    
    const existingTables = result.map(row => row.table_name);
    const missingTables = requiredTables.filter(table => !existingTables.includes(table));
    
    if (missingTables.length > 0) {
      console.error('❌ Missing tables:', missingTables);
      return false;
    }
    
    console.log('✅ Schema validation passed');
    return true;
  } catch (error) {
    console.error('❌ Schema validation failed:', error);
    return false;
  }
};

export const createIndexes = async (): Promise<void> => {
  try {
    console.log('🔄 Creating performance indexes...');
    
    const indexes = [
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email ON users(email)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_interview_sessions_user_id ON interview_sessions(user_id)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_questions_session_id ON questions(session_id)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_feedback_session_id ON feedback(session_id)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analytics_events_timestamp ON analytics_events(timestamp)',
    ];
    
    for (const indexQuery of indexes) {
      await postgresClient.unsafe(indexQuery);
    }
    
    console.log('✅ Performance indexes created');
  } catch (error) {
    console.error('❌ Index creation failed:', error);
    throw error;
  }
};
