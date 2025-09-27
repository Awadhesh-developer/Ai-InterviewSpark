// --- START api/scripts/create-tables.js --- //
// Manual table creation script for AI-InterviewSpark
// Creates all tables directly using SQL

const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

// Database configuration
const DB_CONFIG = {
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'password',
  database: 'interviewspark'
};

// SQL to create tables
const CREATE_TABLES_SQL = `
-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'job_seeker',
  avatar VARCHAR(500),
  bio TEXT,
  location VARCHAR(200),
  timezone VARCHAR(50),
  language VARCHAR(10) NOT NULL DEFAULT 'en',
  accessibility JSONB NOT NULL DEFAULT '{"highContrast": false, "screenReader": false, "captions": true}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create interview_sessions table
CREATE TABLE IF NOT EXISTS interview_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'scheduled',
  title VARCHAR(200) NOT NULL,
  description TEXT,
  job_title VARCHAR(200),
  company VARCHAR(200),
  duration INTEGER NOT NULL,
  difficulty VARCHAR(20) NOT NULL,
  topics TEXT[] DEFAULT '{}',
  scheduled_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create questions table
CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES interview_sessions(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL,
  text TEXT NOT NULL,
  category VARCHAR(100) NOT NULL,
  difficulty VARCHAR(20) NOT NULL,
  expected_keywords TEXT[],
  time_limit INTEGER,
  "order" INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create answers table
CREATE TABLE IF NOT EXISTS answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES interview_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  text TEXT,
  audio_url VARCHAR(500),
  video_url VARCHAR(500),
  duration INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create feedback table
CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  answer_id UUID NOT NULL REFERENCES answers(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES interview_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category VARCHAR(20) NOT NULL,
  score DECIMAL(3,1) NOT NULL,
  feedback TEXT NOT NULL,
  suggestions TEXT[] DEFAULT '{}',
  emotional_analysis JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create resumes table
CREATE TABLE IF NOT EXISTS resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_url VARCHAR(500) NOT NULL,
  file_size INTEGER NOT NULL,
  upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  parsed_data JSONB,
  ats_score INTEGER,
  keywords TEXT[]
);

-- Create expert_profiles table
CREATE TABLE IF NOT EXISTS expert_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  specialties TEXT[] DEFAULT '{}',
  experience INTEGER NOT NULL,
  hourly_rate DECIMAL(10,2) NOT NULL,
  availability JSONB DEFAULT '[]',
  rating DECIMAL(3,2),
  total_sessions INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create expert_sessions table
CREATE TABLE IF NOT EXISTS expert_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES interview_sessions(id) ON DELETE CASCADE,
  expert_id UUID NOT NULL REFERENCES expert_profiles(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'scheduled',
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  duration INTEGER NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create peer_sessions table
CREATE TABLE IF NOT EXISTS peer_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES interview_sessions(id) ON DELETE CASCADE,
  peer_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create performance_metrics table
CREATE TABLE IF NOT EXISTS performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES interview_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  overall_score DECIMAL(5,2) NOT NULL,
  category_scores JSONB NOT NULL,
  emotional_trends JSONB DEFAULT '[]',
  improvement_areas TEXT[] DEFAULT '{}',
  strengths TEXT[] DEFAULT '{}',
  session_duration INTEGER NOT NULL,
  questions_answered INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
`;

async function createTables() {
  console.log('🗄️  Creating database tables...');
  
  try {
    // Set password environment variable for psql
    process.env.PGPASSWORD = DB_CONFIG.password;
    
    const command = `psql -h ${DB_CONFIG.host} -p ${DB_CONFIG.port} -U ${DB_CONFIG.user} -d ${DB_CONFIG.database} -c "${CREATE_TABLES_SQL}"`;
    
    const { stdout, stderr } = await execAsync(command);
    
    if (stdout) console.log('✅ Tables created successfully');
    if (stderr) console.log('⚠️  Warnings:', stderr);
    
    console.log('🎉 Database tables setup completed!');
    
  } catch (error) {
    console.error('❌ Failed to create tables:', error.message);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  createTables()
    .then(() => {
      console.log('✅ Table creation completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Table creation failed:', error);
      process.exit(1);
    });
}

module.exports = { createTables }; 