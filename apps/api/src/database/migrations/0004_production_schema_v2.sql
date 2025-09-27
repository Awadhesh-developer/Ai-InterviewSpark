-- Production Interview System v2.0 Migration
-- Implements optimized schema for enterprise scale

-- ============================================================================
-- BACKUP EXISTING DATA
-- ============================================================================

-- Create backup tables
CREATE TABLE interview_sessions_backup AS SELECT * FROM interview_sessions;
CREATE TABLE questions_backup AS SELECT * FROM questions;
CREATE TABLE answers_backup AS SELECT * FROM answers;

-- ============================================================================
-- DROP OLD CONSTRAINTS AND INDEXES
-- ============================================================================

-- Drop existing foreign key constraints
ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_session_id_interview_sessions_id_fk;
ALTER TABLE answers DROP CONSTRAINT IF EXISTS answers_question_id_questions_id_fk;
ALTER TABLE answers DROP CONSTRAINT IF EXISTS answers_session_id_interview_sessions_id_fk;

-- Drop old indexes
DROP INDEX IF EXISTS idx_questions_session_order;
DROP INDEX IF EXISTS idx_questions_type_skills;
DROP INDEX IF EXISTS idx_answers_session_question;

-- ============================================================================
-- CREATE PRODUCTION TABLES V2
-- ============================================================================

-- Enhanced Interview Sessions with time-series optimization
CREATE TABLE interview_sessions_v2 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    
    -- Core session metadata
    type TEXT NOT NULL CHECK (type IN ('video', 'audio', 'text', 'multimodal', 'hybrid')),
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'active', 'paused', 'completed', 'cancelled', 'failed')),
    
    -- Interview context (CO-STAR framework)
    interview_context JSONB NOT NULL DEFAULT '{
        "context": "",
        "objective": "",
        "style": "",
        "tone": "",
        "audience": "",
        "responseFormat": ""
    }'::jsonb,
    
    -- Position and company details
    job_title TEXT NOT NULL,
    company TEXT,
    industry TEXT NOT NULL,
    job_description TEXT,
    
    -- Session configuration
    difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    duration INTEGER NOT NULL, -- seconds
    question_types TEXT[] NOT NULL DEFAULT '{}',
    
    -- Multi-modal configuration
    modality_config JSONB NOT NULL DEFAULT '{
        "video": {"enabled": true, "quality": "hd", "analysis": true},
        "audio": {"enabled": true, "quality": "high", "transcription": true},
        "text": {"enabled": true, "realTime": true},
        "analysis": {
            "sentiment": true,
            "emotion": true,
            "voice": true,
            "facial": true,
            "bodyLanguage": true
        }
    }'::jsonb,
    
    -- Real-time state management
    session_state JSONB NOT NULL DEFAULT '{
        "currentStep": "setup",
        "currentQuestionIndex": 0,
        "totalQuestions": 0,
        "timeElapsed": 0,
        "timeRemaining": 0,
        "isPaused": false,
        "resumeCount": 0,
        "adaptiveLevel": "medium"
    }'::jsonb,
    
    -- Performance metrics
    performance_metrics JSONB DEFAULT '{}',
    
    -- Timestamps with timezone support
    scheduled_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enhanced Questions with metadata and versioning
CREATE TABLE questions_v2 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES interview_sessions_v2(id) ON DELETE CASCADE,
    
    -- Question content and metadata
    content TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('behavioral', 'technical', 'situational', 'system-design', 'coding', 'company-specific')),
    category TEXT NOT NULL,
    subcategory TEXT,
    
    -- Difficulty and complexity (1-5 scale)
    difficulty INTEGER NOT NULL CHECK (difficulty >= 1 AND difficulty <= 5),
    complexity JSONB NOT NULL DEFAULT '{
        "technical": 3,
        "behavioral": 3,
        "analytical": 3,
        "communication": 3
    }'::jsonb,
    
    -- Question generation metadata
    generation_context JSONB NOT NULL DEFAULT '{
        "llmProvider": "openai",
        "model": "gpt-4",
        "promptVersion": "1.0",
        "generationTime": 0,
        "tokens": {"input": 0, "output": 0},
        "cost": 0
    }'::jsonb,
    
    -- Question characteristics
    estimated_duration INTEGER NOT NULL DEFAULT 180, -- seconds
    expected_keywords TEXT[] DEFAULT '{}',
    skills_assessed TEXT[] NOT NULL DEFAULT '{}',
    
    -- Quality metrics
    quality_score DECIMAL(3,2) DEFAULT 0.80,
    relevance_score DECIMAL(3,2) DEFAULT 0.80,
    freshness_score DECIMAL(3,2) DEFAULT 0.90,
    
    -- Question ordering and flow
    "order" INTEGER NOT NULL,
    is_follow_up BOOLEAN DEFAULT FALSE,
    parent_question_id UUID REFERENCES questions_v2(id) ON DELETE CASCADE,
    
    -- Enhancement data
    tips TEXT[] DEFAULT '{}',
    follow_up_questions TEXT[] DEFAULT '{}',
    star_framework JSONB,
    
    -- Versioning and lifecycle
    version INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Multi-modal Answers with comprehensive analysis
CREATE TABLE answers_v2 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES questions_v2(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES interview_sessions_v2(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    
    -- Multi-modal content
    text_content TEXT,
    audio_url TEXT,
    video_url TEXT,
    
    -- Media metadata
    media_metadata JSONB DEFAULT '{}',
    
    -- Response timing and behavior
    response_metrics JSONB NOT NULL DEFAULT '{
        "thinkingTime": 0,
        "responseTime": 0,
        "pauseCount": 0,
        "avgPauseLength": 0,
        "speechRate": 0,
        "fillerWordCount": 0
    }'::jsonb,
    
    -- Multi-modal analysis results
    analysis_results JSONB DEFAULT '{}',
    
    -- Content analysis
    content_analysis JSONB DEFAULT '{}',
    
    -- Scoring and feedback
    scores JSONB NOT NULL DEFAULT '{
        "overall": 0,
        "technical": 0,
        "communication": 0,
        "structure": 0,
        "relevance": 0,
        "confidence": 0
    }'::jsonb,
    
    -- Answer state
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'analyzing', 'analyzed', 'reviewed')),
    
    submitted_at TIMESTAMPTZ,
    analyzed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ideal Answers for comparison and feedback
CREATE TABLE ideal_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES questions_v2(id) ON DELETE CASCADE,
    
    -- Ideal answer content
    content TEXT NOT NULL,
    key_points TEXT[] NOT NULL DEFAULT '{}',
    
    -- Scoring criteria
    scoring_criteria JSONB NOT NULL DEFAULT '{
        "technical": {"weight": 25, "description": "Technical accuracy and depth"},
        "communication": {"weight": 25, "description": "Clarity and structure"},
        "structure": {"weight": 25, "description": "Logical organization"},
        "relevance": {"weight": 25, "description": "Job relevance and examples"}
    }'::jsonb,
    
    -- Generation metadata
    generated_by TEXT NOT NULL CHECK (generated_by IN ('llm', 'expert', 'hybrid')),
    generation_metadata JSONB DEFAULT '{}',
    
    -- Improvement suggestions
    improvement_areas TEXT[] DEFAULT '{}',
    common_mistakes TEXT[] DEFAULT '{}',
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Real-time Session Analytics (time-series data)
CREATE TABLE session_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES interview_sessions_v2(id) ON DELETE CASCADE,
    
    -- Time-series metrics (stored every 30 seconds during interview)
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metrics JSONB NOT NULL DEFAULT '{
        "engagement": 0,
        "confidence": 0,
        "speechRate": 0,
        "eyeContact": 0,
        "facialSentiment": 0,
        "voiceEnergy": 0,
        "responseQuality": 0
    }'::jsonb,
    
    -- Cumulative statistics
    cumulative_stats JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Question cache for performance optimization
CREATE TABLE question_cache (
    id SERIAL PRIMARY KEY,
    cache_key TEXT NOT NULL UNIQUE,
    
    -- Cached content
    questions JSONB NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{
        "generatedAt": "",
        "llmProvider": "",
        "contextHash": "",
        "qualityScore": 0
    }'::jsonb,
    
    -- Cache management
    access_count INTEGER NOT NULL DEFAULT 0,
    last_accessed TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '1 hour'),
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- CREATE HIGH-PERFORMANCE INDEXES
-- ============================================================================

-- Interview Sessions Indexes
CREATE INDEX idx_sessions_v2_user_status ON interview_sessions_v2(user_id, status);
CREATE INDEX idx_sessions_v2_type_created ON interview_sessions_v2(type, created_at);
CREATE INDEX idx_sessions_v2_industry_difficulty ON interview_sessions_v2(industry, difficulty);
CREATE INDEX idx_sessions_v2_status_timestamp ON interview_sessions_v2(status, created_at);
CREATE INDEX idx_sessions_v2_company ON interview_sessions_v2(company) WHERE company IS NOT NULL;

-- Questions Indexes
CREATE INDEX idx_questions_v2_session_order ON questions_v2(session_id, "order");
CREATE INDEX idx_questions_v2_type_skills ON questions_v2 USING GIN(skills_assessed);
CREATE INDEX idx_questions_v2_difficulty_active ON questions_v2(difficulty, is_active);
CREATE INDEX idx_questions_v2_quality_score ON questions_v2(quality_score DESC);
CREATE INDEX idx_questions_v2_category ON questions_v2(category, type);

-- Answers Indexes
CREATE INDEX idx_answers_v2_session_question ON answers_v2(session_id, question_id);
CREATE INDEX idx_answers_v2_user_status ON answers_v2(user_id, status);
CREATE INDEX idx_answers_v2_submitted_at ON answers_v2(submitted_at) WHERE submitted_at IS NOT NULL;
CREATE INDEX idx_answers_v2_scores ON answers_v2 USING GIN(scores);

-- Analytics Indexes (time-series optimization)
CREATE INDEX idx_analytics_session_timestamp ON session_analytics(session_id, timestamp);
CREATE INDEX idx_analytics_timestamp ON session_analytics(timestamp);
CREATE INDEX idx_analytics_metrics ON session_analytics USING GIN(metrics);

-- Cache Indexes
CREATE INDEX idx_question_cache_expires ON question_cache(expires_at);
CREATE INDEX idx_question_cache_accessed ON question_cache(last_accessed);

-- ============================================================================
-- CREATE PARTITIONS FOR TIME-SERIES DATA
-- ============================================================================

-- Partition session_analytics by month for better performance
CREATE TABLE session_analytics_y2024m09 PARTITION OF session_analytics
    FOR VALUES FROM ('2024-09-01') TO ('2024-10-01');
CREATE TABLE session_analytics_y2024m10 PARTITION OF session_analytics
    FOR VALUES FROM ('2024-10-01') TO ('2024-11-01');
CREATE TABLE session_analytics_y2024m11 PARTITION OF session_analytics
    FOR VALUES FROM ('2024-11-01') TO ('2024-12-01');
CREATE TABLE session_analytics_y2024m12 PARTITION OF session_analytics
    FOR VALUES FROM ('2024-12-01') TO ('2025-01-01');

-- ============================================================================
-- CREATE FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Auto-update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_interview_sessions_v2_updated_at BEFORE UPDATE ON interview_sessions_v2 FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_questions_v2_updated_at BEFORE UPDATE ON questions_v2 FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_answers_v2_updated_at BEFORE UPDATE ON answers_v2 FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ideal_answers_updated_at BEFORE UPDATE ON ideal_answers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Cache cleanup function
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM question_cache WHERE expires_at < NOW();
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- MIGRATE EXISTING DATA
-- ============================================================================

-- Migrate interview sessions
INSERT INTO interview_sessions_v2 (
    id, user_id, type, status, job_title, company, industry, difficulty, 
    duration, question_types, scheduled_at, started_at, completed_at, created_at
)
SELECT 
    id, 
    user_id,
    COALESCE(type, 'video'),
    COALESCE(status, 'scheduled'),
    COALESCE(job_title, 'Software Engineer'),
    company,
    'technology', -- Default industry
    COALESCE(difficulty, 'intermediate'),
    COALESCE(duration * 60, 1800), -- Convert minutes to seconds
    COALESCE(topics, ARRAY['behavioral', 'technical']),
    scheduled_at,
    started_at,
    completed_at,
    created_at
FROM interview_sessions_backup
ON CONFLICT (id) DO NOTHING;

-- Migrate questions
INSERT INTO questions_v2 (
    id, session_id, content, type, category, difficulty, estimated_duration,
    expected_keywords, skills_assessed, "order", tips, follow_up_questions, created_at
)
SELECT 
    id,
    session_id,
    text,
    COALESCE(type, 'behavioral'),
    COALESCE(category, 'General'),
    CASE 
        WHEN difficulty = 'easy' THEN 2
        WHEN difficulty = 'hard' THEN 4
        ELSE 3
    END,
    COALESCE(time_limit, 180),
    COALESCE(expected_keywords::text[], ARRAY[]::text[]),
    ARRAY['communication', 'problem-solving'], -- Default skills
    COALESCE("order", 1),
    COALESCE(tips, ARRAY[]::text[]),
    COALESCE(follow_up_questions, ARRAY[]::text[]),
    created_at
FROM questions_backup
WHERE session_id IN (SELECT id FROM interview_sessions_v2)
ON CONFLICT (id) DO NOTHING;

-- Migrate answers
INSERT INTO answers_v2 (
    id, question_id, session_id, user_id, text_content, audio_url, video_url,
    status, submitted_at, created_at
)
SELECT 
    id,
    question_id,
    session_id,
    user_id,
    text,
    audio_url,
    video_url,
    'submitted',
    created_at,
    created_at
FROM answers_backup
WHERE question_id IN (SELECT id FROM questions_v2)
  AND session_id IN (SELECT id FROM interview_sessions_v2)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- CREATE VIEWS FOR COMMON QUERIES
-- ============================================================================

-- Interview session summary view
CREATE VIEW interview_session_summary AS
SELECT 
    s.id,
    s.user_id,
    s.job_title,
    s.company,
    s.industry,
    s.status,
    s.difficulty,
    s.duration,
    s.created_at,
    s.started_at,
    s.completed_at,
    COUNT(q.id) as total_questions,
    COUNT(a.id) as answered_questions,
    ROUND(AVG((a.scores->>'overall')::numeric), 2) as avg_score,
    ROUND(AVG((a.scores->>'confidence')::numeric), 2) as avg_confidence
FROM interview_sessions_v2 s
LEFT JOIN questions_v2 q ON s.id = q.session_id
LEFT JOIN answers_v2 a ON q.id = a.question_id
GROUP BY s.id, s.user_id, s.job_title, s.company, s.industry, s.status, 
         s.difficulty, s.duration, s.created_at, s.started_at, s.completed_at;

-- Question performance view
CREATE VIEW question_performance AS
SELECT 
    q.id,
    q.content,
    q.type,
    q.category,
    q.difficulty,
    q.quality_score,
    COUNT(a.id) as response_count,
    ROUND(AVG((a.scores->>'overall')::numeric), 2) as avg_response_score,
    ROUND(AVG(a.response_metrics->>'responseTime'::text)::numeric, 2) as avg_response_time
FROM questions_v2 q
LEFT JOIN answers_v2 a ON q.id = a.question_id
WHERE q.is_active = true
GROUP BY q.id, q.content, q.type, q.category, q.difficulty, q.quality_score;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant permissions to application user (adjust as needed)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO interview_app_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO interview_app_user;

-- ============================================================================
-- CLEANUP
-- ============================================================================

-- Schedule cache cleanup (run every hour)
-- This would typically be set up as a cron job or scheduled task
-- SELECT cron.schedule('cleanup-cache', '0 * * * *', 'SELECT cleanup_expired_cache();');

COMMIT;
