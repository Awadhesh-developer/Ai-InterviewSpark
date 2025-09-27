-- Performance Optimization Migration
-- Adds comprehensive indexes for enhanced query performance

-- Questions table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_questions_session_id ON questions(session_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_questions_type ON questions(type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_questions_difficulty ON questions(difficulty);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_questions_source ON questions(source);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_questions_company_specific ON questions(company_specific);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_questions_llm_provider ON questions(llm_provider);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_questions_created_at ON questions(created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_questions_updated_at ON questions(updated_at);

-- Composite indexes for common query patterns
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_questions_session_type ON questions(session_id, type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_questions_type_difficulty ON questions(type, difficulty);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_questions_session_order ON questions(session_id, "order");

-- Partial indexes for high-quality questions
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_questions_fresh 
ON questions(freshness_score) 
WHERE freshness_score > 0.7;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_questions_relevant 
ON questions(relevance_score) 
WHERE relevance_score > 0.7;

-- Sample answers table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sample_answers_question_id ON sample_answers(question_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sample_answers_industry ON sample_answers(industry);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sample_answers_role ON sample_answers(role);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sample_answers_difficulty ON sample_answers(difficulty);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sample_answers_structure ON sample_answers(structure);

-- Composite indexes for sample answers
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sample_answers_industry_role ON sample_answers(industry, role);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sample_answers_difficulty_structure ON sample_answers(difficulty, structure);

-- Question trends table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_question_trends_industry ON question_trends(industry);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_question_trends_topic ON question_trends(topic);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_question_trends_timeframe ON question_trends(timeframe);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_question_trends_frequency ON question_trends(frequency);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_question_trends_last_updated ON question_trends(last_updated);

-- Composite indexes for question trends
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_question_trends_industry_timeframe ON question_trends(industry, timeframe);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_question_trends_topic_frequency ON question_trends(topic, frequency);

-- Unique constraint for question trends
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_question_trends_unique 
ON question_trends(industry, topic, timeframe);

-- Company insights table indexes
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_company_insights_company_name ON company_insights(company_name);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_company_insights_interview_style ON company_insights(interview_style);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_company_insights_last_updated ON company_insights(last_updated);

-- Interview sessions indexes (if not already present)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_interview_sessions_user_id ON interview_sessions(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_interview_sessions_status ON interview_sessions(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_interview_sessions_created_at ON interview_sessions(created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_interview_sessions_company ON interview_sessions(company);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_interview_sessions_industry ON interview_sessions(industry);

-- Users table indexes (if not already present)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Answers table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_answers_question_id ON answers(question_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_answers_user_id ON answers(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_answers_created_at ON answers(created_at);

-- GIN indexes for array and JSONB columns
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_questions_expected_keywords_gin ON questions USING GIN(expected_keywords);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_questions_industry_trends_gin ON questions USING GIN(industry_trends);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_questions_follow_up_questions_gin ON questions USING GIN(follow_up_questions);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_questions_tips_gin ON questions USING GIN(tips);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_questions_star_framework_gin ON questions USING GIN(star_framework);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sample_answers_key_points_gin ON sample_answers USING GIN(key_points);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sample_answers_tips_gin ON sample_answers USING GIN(tips);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sample_answers_common_mistakes_gin ON sample_answers USING GIN(common_mistakes);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_question_trends_related_skills_gin ON question_trends USING GIN(related_skills);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_company_insights_culture_gin ON company_insights USING GIN(culture);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_company_insights_values_gin ON company_insights USING GIN(values);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_company_insights_recent_news_gin ON company_insights USING GIN(recent_news);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_company_insights_common_questions_gin ON company_insights USING GIN(common_questions);

-- Full-text search indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_questions_text_fts 
ON questions USING GIN(to_tsvector('english', text));

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sample_answers_answer_fts 
ON sample_answers USING GIN(to_tsvector('english', answer));

-- Analyze tables to update statistics
ANALYZE questions;
ANALYZE sample_answers;
ANALYZE question_trends;
ANALYZE company_insights;
ANALYZE interview_sessions;
ANALYZE users;
ANALYZE answers;
