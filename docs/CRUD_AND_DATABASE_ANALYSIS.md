# AI-InterviewSpark: Complete CRUD Operations and Database Fields Analysis

## Executive Summary

This document provides a comprehensive analysis of all CRUD (Create, Read, Update, Delete) operations and database fields in the AI-InterviewSpark application. The system uses PostgreSQL with Drizzle ORM and includes 15 main database tables with complex relationships and extensive CRUD operations across multiple service layers.

## Database Schema Overview

### Core Tables (15 Total)

1. **users** - User accounts and profiles
2. **oauth_providers** - OAuth authentication providers
3. **interview_sessions** - Interview practice sessions
4. **questions** - Interview questions with metadata
5. **answers** - User responses to questions
6. **feedback** - AI-generated feedback on answers
7. **resumes** - User resume files and parsed data
8. **expert_profiles** - Expert coach profiles
9. **expert_sessions** - Expert coaching sessions
10. **peer_sessions** - Peer-to-peer interview sessions
11. **performance_metrics** - Session performance analytics
12. **notifications** - System notifications
13. **sample_answers** - Sample answers for questions
14. **question_trends** - Industry question trends
15. **company_insights** - Company-specific interview data

## Detailed Database Schema

### 1. Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password TEXT, -- Optional for OAuth-only users
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'job_seeker' CHECK (role IN ('job_seeker', 'expert', 'admin')),
  avatar TEXT,
  bio TEXT,
  location TEXT,
  timezone TEXT,
  language TEXT NOT NULL DEFAULT 'en',
  accessibility JSONB DEFAULT '{"highContrast":false,"screenReader":false,"captions":true}',
  email_verified BOOLEAN NOT NULL DEFAULT false,
  last_login_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);
```

**Fields:**
- `id`: UUID primary key
- `email`: Unique email address
- `password`: Hashed password (optional for OAuth users)
- `first_name`, `last_name`: User names
- `role`: User role (job_seeker, expert, admin)
- `avatar`: Profile image URL
- `bio`: User biography
- `location`: Geographic location
- `timezone`: User timezone
- `language`: Preferred language
- `accessibility`: JSON object with accessibility preferences
- `email_verified`: Email verification status
- `last_login_at`: Last login timestamp
- `created_at`, `updated_at`: Timestamps

### 2. OAuth Providers Table
```sql
CREATE TABLE oauth_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('google', 'facebook', 'linkedin')),
  provider_id TEXT NOT NULL,
  provider_email TEXT,
  access_token TEXT, -- Encrypted
  refresh_token TEXT, -- Encrypted
  token_expires_at TIMESTAMP,
  provider_data JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  UNIQUE(user_id, provider),
  UNIQUE(provider, provider_id)
);
```

**Fields:**
- `id`: UUID primary key
- `user_id`: Foreign key to users table
- `provider`: OAuth provider name
- `provider_id`: User ID from OAuth provider
- `provider_email`: Email from OAuth provider
- `access_token`, `refresh_token`: Encrypted OAuth tokens
- `token_expires_at`: Token expiration time
- `provider_data`: Additional provider-specific data
- `created_at`, `updated_at`: Timestamps

### 3. Interview Sessions Table
```sql
CREATE TABLE interview_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('video', 'audio', 'text', 'peer', 'expert')),
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  title TEXT NOT NULL,
  description TEXT,
  job_title TEXT,
  company TEXT,
  duration INTEGER NOT NULL, -- minutes
  difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  topics TEXT[] NOT NULL DEFAULT '{}',
  scheduled_at TIMESTAMP,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);
```

**Fields:**
- `id`: UUID primary key
- `user_id`: Foreign key to users table
- `type`: Session type (video, audio, text, peer, expert)
- `status`: Session status
- `title`: Session title
- `description`: Session description
- `job_title`: Target job title
- `company`: Target company
- `duration`: Session duration in minutes
- `difficulty`: Difficulty level
- `topics`: Array of interview topics
- `scheduled_at`, `started_at`, `completed_at`: Timestamps
- `created_at`, `updated_at`: Timestamps

### 4. Questions Table (Enhanced)
```sql
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES interview_sessions(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('behavioral', 'technical', 'situational', 'company-specific')),
  text TEXT NOT NULL,
  category TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  expected_keywords TEXT[],
  time_limit INTEGER, -- seconds
  "order" INTEGER NOT NULL,
  
  -- Enhanced metadata fields
  source TEXT DEFAULT 'ai-generated' CHECK (source IN ('ai-generated', 'scraped', 'curated')),
  freshness_score DECIMAL(3,2), -- 0.00 to 1.00
  relevance_score DECIMAL(3,2), -- 0.00 to 1.00
  company_specific BOOLEAN DEFAULT false,
  industry_trends TEXT[] DEFAULT '{}',
  llm_provider TEXT CHECK (llm_provider IN ('openai', 'gemini', 'claude')),
  
  -- STAR framework data
  star_framework JSONB,
  
  -- Follow-up questions and tips
  follow_up_questions TEXT[] DEFAULT '{}',
  tips TEXT[] DEFAULT '{}',
  
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);
```

**Fields:**
- `id`: UUID primary key
- `session_id`: Foreign key to interview_sessions
- `type`: Question type (behavioral, technical, situational, company-specific)
- `text`: Question text
- `category`: Question category
- `difficulty`: Difficulty level (easy, medium, hard)
- `expected_keywords`: Array of expected keywords
- `time_limit`: Time limit in seconds
- `order`: Question order in session
- `source`: Question source (ai-generated, scraped, curated)
- `freshness_score`: Freshness score (0.00-1.00)
- `relevance_score`: Relevance score (0.00-1.00)
- `company_specific`: Whether question is company-specific
- `industry_trends`: Related industry trends
- `llm_provider`: LLM provider used
- `star_framework`: JSON object with STAR framework data
- `follow_up_questions`: Array of follow-up questions
- `tips`: Array of tips
- `created_at`, `updated_at`: Timestamps

### 5. Answers Table
```sql
CREATE TABLE answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES interview_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  text TEXT,
  audio_url TEXT,
  video_url TEXT,
  duration INTEGER, -- seconds
  created_at TIMESTAMP NOT NULL DEFAULT now()
);
```

**Fields:**
- `id`: UUID primary key
- `question_id`: Foreign key to questions table
- `session_id`: Foreign key to interview_sessions table
- `user_id`: Foreign key to users table
- `text`: Text answer
- `audio_url`: Audio recording URL
- `video_url`: Video recording URL
- `duration`: Answer duration in seconds
- `created_at`: Timestamp

### 6. Feedback Table
```sql
CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  answer_id UUID NOT NULL REFERENCES answers(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES interview_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('content', 'delivery', 'confidence', 'clarity', 'relevance', 'emotional_state')),
  score DECIMAL(3,1) NOT NULL, -- 0.0 to 10.0
  feedback TEXT NOT NULL,
  suggestions JSONB NOT NULL DEFAULT '[]',
  emotional_analysis JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);
```

**Fields:**
- `id`: UUID primary key
- `answer_id`: Foreign key to answers table
- `session_id`: Foreign key to interview_sessions table
- `user_id`: Foreign key to users table
- `category`: Feedback category
- `score`: Score from 0.0 to 10.0
- `feedback`: Feedback text
- `suggestions`: Array of suggestions
- `emotional_analysis`: Emotional analysis data
- `created_at`: Timestamp

### 7. Resumes Table
```sql
CREATE TABLE resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  upload_date TIMESTAMP NOT NULL DEFAULT now(),
  parsed_data JSONB,
  ats_score DECIMAL(5,2), -- 0.00 to 100.00
  keywords JSONB
);
```

**Fields:**
- `id`: UUID primary key
- `user_id`: Foreign key to users table
- `file_name`: Original file name
- `file_url`: File storage URL
- `file_size`: File size in bytes
- `upload_date`: Upload timestamp
- `parsed_data`: Parsed resume data (skills, experience, education)
- `ats_score`: ATS optimization score (0.00-100.00)
- `keywords`: Extracted keywords

### 8. Expert Profiles Table
```sql
CREATE TABLE expert_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  specialties JSONB NOT NULL DEFAULT '[]',
  experience INTEGER NOT NULL, -- years
  hourly_rate DECIMAL(8,2) NOT NULL,
  availability JSONB NOT NULL DEFAULT '[]',
  rating DECIMAL(3,2), -- 0.00 to 5.00
  total_sessions INTEGER NOT NULL DEFAULT 0,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);
```

**Fields:**
- `id`: UUID primary key
- `user_id`: Foreign key to users table
- `specialties`: Array of specialties
- `experience`: Years of experience
- `hourly_rate`: Hourly rate
- `availability`: Availability schedule
- `rating`: Average rating (0.00-5.00)
- `total_sessions`: Total sessions conducted
- `is_verified`: Verification status
- `created_at`, `updated_at`: Timestamps

### 9. Performance Metrics Table
```sql
CREATE TABLE performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES interview_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  overall_score DECIMAL(5,2) NOT NULL, -- 0.00 to 100.00
  category_scores JSONB NOT NULL,
  emotional_trends JSONB NOT NULL DEFAULT '[]',
  improvement_areas JSONB NOT NULL DEFAULT '[]',
  strengths JSONB NOT NULL DEFAULT '[]',
  session_duration INTEGER NOT NULL, -- minutes
  questions_answered INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);
```

**Fields:**
- `id`: UUID primary key
- `session_id`: Foreign key to interview_sessions table
- `user_id`: Foreign key to users table
- `overall_score`: Overall performance score (0.00-100.00)
- `category_scores`: Scores by category
- `emotional_trends`: Emotional analysis trends
- `improvement_areas`: Areas for improvement
- `strengths`: Identified strengths
- `session_duration`: Session duration in minutes
- `questions_answered`: Number of questions answered
- `created_at`: Timestamp

### 10. Notifications Table
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('session_reminder', 'feedback_ready', 'peer_request', 'expert_confirmation', 'system')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);
```

**Fields:**
- `id`: UUID primary key
- `user_id`: Foreign key to users table
- `type`: Notification type
- `title`: Notification title
- `message`: Notification message
- `data`: Additional notification data
- `is_read`: Read status
- `created_at`: Timestamp

## CRUD Operations Analysis

### 1. User Management (UserService)

#### CREATE Operations
- **Register User**: `UserService.register()`
  - Creates new user account
  - Hashes password
  - Generates JWT token
  - Validates email format and password strength

- **Create Expert Profile**: `UserService.createExpertProfile()`
  - Creates expert profile for users
  - Sets specialties, experience, hourly rate
  - Configures availability schedule

#### READ Operations
- **Get User Profile**: `UserService.getUserProfile()`
  - Retrieves user profile by ID
  - Includes all user fields and preferences

- **Get Expert Profile**: `UserService.getExpertProfile()`
  - Retrieves expert profile data
  - Includes ratings and session history

#### UPDATE Operations
- **Update User Profile**: `UserService.updateUserProfile()`
  - Updates user information
  - Validates input data
  - Updates timestamp

- **Update Expert Profile**: `UserService.updateExpertProfile()`
  - Updates expert-specific information
  - Recalculates ratings

#### DELETE Operations
- **Delete User Account**: `UserService.deleteUser()`
  - Soft delete user account
  - Cascades to related data
  - Preserves data for analytics

### 2. Interview Management (InterviewService)

#### CREATE Operations
- **Create Interview Session**: `InterviewService.createInterviewSession()`
  - Creates new interview session
  - Generates AI questions
  - Sets up session configuration
  - Links to user and resume data

- **Generate Questions**: `InterviewService.generateQuestions()`
  - Uses AI service to generate questions
  - Applies difficulty and topic filters
  - Includes metadata and scoring

- **Submit Answer**: `InterviewService.submitAnswer()`
  - Records user answers
  - Stores text, audio, or video responses
  - Calculates duration

#### READ Operations
- **Get User Sessions**: `InterviewService.getUserSessions()`
  - Retrieves user's interview sessions
  - Includes pagination and filtering
  - Shows session status and metrics

- **Get Session Details**: `InterviewService.getSessionDetails()`
  - Retrieves complete session data
  - Includes questions, answers, and feedback
  - Shows performance metrics

- **Get Questions**: `InterviewService.getSessionQuestions()`
  - Retrieves questions for a session
  - Includes metadata and expected answers
  - Orders by sequence

#### UPDATE Operations
- **Update Session Status**: `InterviewService.updateSessionStatus()`
  - Updates session status (scheduled, in_progress, completed)
  - Records timestamps
  - Triggers notifications

- **Update Answer**: `InterviewService.updateAnswer()`
  - Updates user answers
  - Recalculates feedback
  - Updates performance metrics

#### DELETE Operations
- **Delete Session**: `InterviewService.deleteSession()`
  - Deletes interview session
  - Cascades to questions and answers
  - Preserves analytics data

### 3. AI Services (AIService)

#### CREATE Operations
- **Generate Questions**: `AIService.generateEnhancedQuestions()`
  - Uses multiple LLM providers
  - Includes web scraping
  - Generates sample answers
  - Applies industry trends

- **Generate Sample Answers**: `AIService.generateSampleAnswers()`
  - Creates sample answers for questions
  - Includes structure and tips
  - Covers different experience levels

#### READ Operations
- **Analyze Answer**: `AIService.analyzeAnswer()`
  - Analyzes user answers
  - Provides scoring and feedback
  - Identifies improvement areas

- **Get Industry Trends**: `AIService.getIndustryTrends()`
  - Retrieves current industry trends
  - Shows question frequency and growth
  - Identifies related skills

- **Get Company Insights**: `AIService.getCompanyInsights()`
  - Retrieves company-specific data
  - Shows culture and values
  - Lists common questions

#### UPDATE Operations
- **Update Question Metadata**: `AIService.updateQuestionMetadata()`
  - Updates question freshness scores
  - Recalculates relevance scores
  - Updates industry trends

### 4. Notification Management (NotificationService)

#### CREATE Operations
- **Create Notification**: `NotificationService.createNotification()`
  - Creates in-app notification
  - Sets notification type and data
  - Configures delivery channels

- **Send Notification**: `NotificationService.sendNotification()`
  - Sends multi-channel notifications
  - Includes email, push, and SMS
  - Handles delivery preferences

#### READ Operations
- **Get User Notifications**: `NotificationService.getUserNotifications()`
  - Retrieves user notifications
  - Supports pagination and filtering
  - Shows read/unread status

- **Get Unread Count**: `NotificationService.getUnreadCount()`
  - Returns unread notification count
  - Used for UI badges

#### UPDATE Operations
- **Mark as Read**: `NotificationService.markAsRead()`
  - Marks notification as read
  - Updates timestamp
  - Triggers UI updates

- **Mark All as Read**: `NotificationService.markAllAsRead()`
  - Marks all user notifications as read
  - Bulk update operation

#### DELETE Operations
- **Delete Notification**: `NotificationService.deleteNotification()`
  - Deletes specific notification
  - Verifies user ownership
  - Updates counts

### 5. OAuth Management (OAuthService)

#### CREATE Operations
- **Link OAuth Provider**: `OAuthService.authenticateWithOAuth()`
  - Links OAuth account to user
  - Creates or updates OAuth provider record
  - Handles token storage

#### READ Operations
- **Get OAuth Providers**: `OAuthService.getUserOAuthProviders()`
  - Retrieves user's linked OAuth providers
  - Excludes sensitive token data
  - Shows provider status

#### UPDATE Operations
- **Update OAuth Tokens**: `OAuthService.refreshOAuthTokens()`
  - Refreshes expired OAuth tokens
  - Updates token expiration
  - Handles token rotation

#### DELETE Operations
- **Unlink OAuth Provider**: `OAuthService.unlinkOAuthProvider()`
  - Unlinks OAuth provider from user
  - Verifies alternative authentication
  - Removes provider data

### 6. File Storage (StorageService)

#### CREATE Operations
- **Upload File**: `StorageService.uploadFile()`
  - Uploads file to AWS S3
  - Validates file type and size
  - Generates secure file keys
  - Sets metadata

- **Generate Presigned URL**: `StorageService.generatePresignedUploadUrl()`
  - Creates presigned upload URLs
  - Enables direct client uploads
  - Sets expiration time

#### READ Operations
- **List User Files**: `StorageService.listUserFiles()`
  - Lists user's uploaded files
  - Supports filtering by type
  - Shows file metadata

- **Get File Metadata**: `StorageService.getFileMetadata()`
  - Retrieves file information
  - Shows size, type, and timestamps
  - Includes custom metadata

#### DELETE Operations
- **Delete File**: `StorageService.deleteFile()`
  - Deletes file from S3
  - Verifies user ownership
  - Updates database records

## API Endpoints Summary

### Authentication Routes (`/api/auth`)
- `POST /register` - User registration
- `POST /login` - User login
- `POST /refresh` - Token refresh
- `POST /logout` - User logout
- `POST /forgot-password` - Password reset request
- `POST /reset-password` - Password reset

### OAuth Routes (`/api/oauth`)
- `GET /auth/:provider` - Initiate OAuth
- `GET /auth/:provider/callback` - OAuth callback
- `GET /providers` - Get user's OAuth providers
- `POST /link/:provider` - Link OAuth provider
- `DELETE /unlink/:provider` - Unlink OAuth provider

### User Routes (`/api/users`)
- `GET /me` - Get current user profile
- `PATCH /me` - Update user profile
- `POST /expert-profile` - Create expert profile
- `PATCH /expert-profile` - Update expert profile
- `DELETE /account` - Delete user account

### Interview Routes (`/api/interviews`)
- `POST /sessions` - Create interview session
- `GET /sessions` - Get user sessions
- `GET /sessions/:id` - Get session details
- `PATCH /sessions/:id` - Update session
- `DELETE /sessions/:id` - Delete session
- `POST /sessions/:id/start` - Start session
- `POST /sessions/:id/complete` - Complete session
- `POST /sessions/:id/questions` - Generate questions
- `GET /sessions/:id/questions` - Get session questions
- `POST /sessions/:id/answers` - Submit answer
- `GET /sessions/:id/answers` - Get session answers
- `POST /sessions/:id/feedback` - Generate feedback

### AI Routes (`/api/ai`)
- `POST /questions` - Generate questions
- `POST /answers` - Generate sample answers
- `POST /analyze-answer` - Analyze user answer
- `POST /analyze-resume` - Analyze resume
- `GET /trends` - Get industry trends
- `GET /company-insights` - Get company insights
- `POST /analyze-emotion/voice` - Analyze voice emotion
- `POST /analyze-emotion/facial` - Analyze facial emotion

### Resume Routes (`/api/resumes`)
- `POST /upload` - Upload resume
- `GET /` - Get user resumes
- `GET /:id` - Get specific resume
- `DELETE /:id` - Delete resume
- `POST /:id/analyze` - Analyze resume for job
- `GET /:id/suggestions` - Get optimization suggestions
- `GET /templates` - Get resume templates

### Notification Routes (`/api/notifications`)
- `GET /` - Get user notifications
- `PATCH /:id/read` - Mark notification as read
- `PATCH /read-all` - Mark all as read
- `DELETE /:id` - Delete notification
- `GET /unread-count` - Get unread count
- `POST /subscribe` - Subscribe to push notifications
- `POST /test-push` - Test push notification
- `GET /preferences` - Get notification preferences
- `PATCH /preferences` - Update preferences
- `POST /send-test` - Send test notification
- `GET /status` - Get service status

### Upload Routes (`/api/upload`)
- `POST /resume` - Upload resume file
- `POST /recording` - Upload interview recording
- `POST /avatar` - Upload profile avatar
- `POST /presigned-url` - Generate presigned URL
- `GET /download/:key` - Generate download URL
- `GET /files` - List user files
- `DELETE /files/:key` - Delete file
- `GET /files/:key/metadata` - Get file metadata
- `GET /health` - Check storage health

### Analytics Routes (`/api/analytics`)
- `GET /user/:userId` - Get user analytics
- `GET /sessions/:sessionId` - Get session analytics
- `GET /platform` - Get platform analytics (admin)
- `GET /trends` - Get performance trends
- `GET /compare` - Compare user performance

### Expert Routes (`/api/experts`)
- `GET /` - Get available experts
- `GET /:id` - Get expert profile
- `POST /:id/book` - Book expert session
- `GET /sessions` - Get expert sessions
- `PATCH /sessions/:id` - Update expert session
- `POST /sessions/:id/feedback` - Submit expert feedback

## Database Relationships

### Primary Relationships
1. **Users** → **Interview Sessions** (1:many)
2. **Users** → **OAuth Providers** (1:many)
3. **Users** → **Resumes** (1:many)
4. **Users** → **Expert Profiles** (1:1)
5. **Users** → **Notifications** (1:many)
6. **Interview Sessions** → **Questions** (1:many)
7. **Interview Sessions** → **Answers** (1:many)
8. **Interview Sessions** → **Performance Metrics** (1:1)
9. **Questions** → **Answers** (1:many)
10. **Answers** → **Feedback** (1:many)

### Foreign Key Constraints
- All foreign keys use CASCADE DELETE
- Ensures data integrity
- Prevents orphaned records
- Maintains referential integrity

### Indexes
- Primary keys on all tables
- Unique constraints on email and OAuth providers
- Performance indexes on frequently queried fields
- Composite indexes for complex queries
- Partial indexes for filtered queries

## Performance Optimizations

### Database Level
- Comprehensive indexing strategy
- Query optimization with Drizzle ORM
- Connection pooling
- Prepared statements
- Efficient pagination

### Application Level
- Service layer caching
- Redis integration for session data
- Rate limiting on API endpoints
- Background job processing
- Optimized query patterns

### Storage Level
- AWS S3 for file storage
- CDN integration for static assets
- Presigned URLs for direct uploads
- File compression and optimization
- Automatic cleanup of old files

## Security Considerations

### Authentication
- JWT token-based authentication
- OAuth 2.0 integration
- Password hashing with bcrypt
- Token refresh mechanisms
- Session management

### Authorization
- Role-based access control
- Resource ownership validation
- API endpoint protection
- Admin-only operations
- User data isolation

### Data Protection
- Encrypted OAuth tokens
- Secure file uploads
- Input validation and sanitization
- SQL injection prevention
- XSS protection

## Conclusion

The AI-InterviewSpark application implements a comprehensive CRUD system with 15 database tables, extensive API endpoints, and sophisticated business logic. The system supports user management, interview sessions, AI-powered question generation, real-time feedback, file storage, notifications, and analytics. The architecture follows modern best practices with proper separation of concerns, security measures, and performance optimizations.

The database schema is well-designed with proper relationships, constraints, and indexes. The CRUD operations are implemented across multiple service layers with proper error handling, validation, and security measures. The system is scalable and maintainable with clear separation between data access, business logic, and API presentation layers.
