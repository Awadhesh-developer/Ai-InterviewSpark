-- Enhanced Questions Migration
-- Adds metadata fields for LLM integration and web scraping intelligence

-- Update questions table with enhanced metadata
ALTER TABLE questions 
ADD COLUMN source TEXT DEFAULT 'ai-generated' CHECK (source IN ('ai-generated', 'scraped', 'curated')),
ADD COLUMN freshness_score DECIMAL(3,2) CHECK (freshness_score >= 0 AND freshness_score <= 1),
ADD COLUMN relevance_score DECIMAL(3,2) CHECK (relevance_score >= 0 AND relevance_score <= 1),
ADD COLUMN company_specific BOOLEAN DEFAULT FALSE,
ADD COLUMN industry_trends TEXT[] DEFAULT '{}',
ADD COLUMN llm_provider TEXT CHECK (llm_provider IN ('openai', 'gemini', 'claude')),
ADD COLUMN star_framework JSONB,
ADD COLUMN follow_up_questions TEXT[] DEFAULT '{}',
ADD COLUMN tips TEXT[] DEFAULT '{}',
ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update question type enum to include company-specific
ALTER TABLE questions 
ALTER COLUMN type TYPE TEXT;

-- Update difficulty enum to use easy/medium/hard
ALTER TABLE questions 
ALTER COLUMN difficulty TYPE TEXT;

-- Add constraints back
ALTER TABLE questions 
ADD CONSTRAINT questions_type_check CHECK (type IN ('behavioral', 'technical', 'situational', 'company-specific'));

ALTER TABLE questions 
ADD CONSTRAINT questions_difficulty_check CHECK (difficulty IN ('easy', 'medium', 'hard'));

-- Create sample_answers table
CREATE TABLE IF NOT EXISTS sample_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  answer TEXT NOT NULL,
  structure TEXT NOT NULL CHECK (structure IN ('star', 'problem-solution', 'feature-benefit', 'comparison')),
  key_points TEXT[] DEFAULT '{}',
  estimated_duration INTEGER, -- seconds
  difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  industry TEXT NOT NULL,
  role TEXT NOT NULL,
  tips TEXT[] DEFAULT '{}',
  common_mistakes TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create question_trends table
CREATE TABLE IF NOT EXISTS question_trends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  industry TEXT NOT NULL,
  topic TEXT NOT NULL,
  frequency INTEGER NOT NULL,
  growth DECIMAL(5,2), -- percentage growth
  related_skills TEXT[] DEFAULT '{}',
  timeframe TEXT NOT NULL CHECK (timeframe IN ('week', 'month', 'quarter')),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create company_insights table
CREATE TABLE IF NOT EXISTS company_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  culture TEXT[] DEFAULT '{}',
  values TEXT[] DEFAULT '{}',
  recent_news TEXT[] DEFAULT '{}',
  interview_style TEXT NOT NULL,
  common_questions TEXT[] DEFAULT '{}',
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_questions_source ON questions(source);
CREATE INDEX IF NOT EXISTS idx_questions_freshness_score ON questions(freshness_score);
CREATE INDEX IF NOT EXISTS idx_questions_relevance_score ON questions(relevance_score);
CREATE INDEX IF NOT EXISTS idx_questions_company_specific ON questions(company_specific);
CREATE INDEX IF NOT EXISTS idx_questions_llm_provider ON questions(llm_provider);
CREATE INDEX IF NOT EXISTS idx_questions_updated_at ON questions(updated_at);

CREATE INDEX IF NOT EXISTS idx_sample_answers_question_id ON sample_answers(question_id);
CREATE INDEX IF NOT EXISTS idx_sample_answers_industry ON sample_answers(industry);
CREATE INDEX IF NOT EXISTS idx_sample_answers_role ON sample_answers(role);

CREATE INDEX IF NOT EXISTS idx_question_trends_industry ON question_trends(industry);
CREATE INDEX IF NOT EXISTS idx_question_trends_timeframe ON question_trends(timeframe);
CREATE INDEX IF NOT EXISTS idx_question_trends_last_updated ON question_trends(last_updated);

CREATE INDEX IF NOT EXISTS idx_company_insights_company_name ON company_insights(company_name);
CREATE INDEX IF NOT EXISTS idx_company_insights_last_updated ON company_insights(last_updated);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for questions table
CREATE TRIGGER update_questions_updated_at 
    BEFORE UPDATE ON questions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for testing
INSERT INTO question_trends (industry, topic, frequency, growth, related_skills, timeframe) VALUES
('technology', 'AI/Machine Learning', 85, 25.5, ARRAY['Python', 'TensorFlow', 'Data Analysis'], 'month'),
('technology', 'Cloud Computing', 78, 18.2, ARRAY['AWS', 'Azure', 'DevOps'], 'month'),
('technology', 'Cybersecurity', 65, 22.1, ARRAY['Security Protocols', 'Risk Assessment'], 'month'),
('finance', 'Digital Banking', 72, 15.8, ARRAY['Fintech', 'Compliance', 'Risk Management'], 'month'),
('finance', 'ESG Reporting', 58, 35.2, ARRAY['Sustainability', 'Data Analysis'], 'month'),
('healthcare', 'Telemedicine', 68, 28.3, ARRAY['Healthcare Technology', 'Patient Care'], 'month'),
('healthcare', 'Healthcare Analytics', 55, 31.7, ARRAY['Data Science', 'Healthcare Systems'], 'month');

INSERT INTO company_insights (company_name, culture, values, recent_news, interview_style, common_questions) VALUES
('Google', 
 ARRAY['Innovation', 'Collaboration', 'Data-driven'], 
 ARRAY['Focus on the user', 'Think big', 'Be bold'], 
 ARRAY['AI advancements', 'Sustainability initiatives', 'Product launches'],
 'behavioral-technical-mix',
 ARRAY['Why Google?', 'Tell me about a technical challenge', 'How do you handle ambiguity?']),
 
('Microsoft', 
 ARRAY['Respect', 'Integrity', 'Accountability'], 
 ARRAY['Empower every person', 'Achieve more together'], 
 ARRAY['Cloud growth', 'AI integration', 'Accessibility features'],
 'behavioral-focused',
 ARRAY['Why Microsoft?', 'Describe a leadership experience', 'How do you collaborate?']),
 
('Amazon', 
 ARRAY['Customer obsession', 'Ownership', 'Invent and simplify'], 
 ARRAY['Customer first', 'Long-term thinking'], 
 ARRAY['AWS expansion', 'Sustainability goals', 'Innovation in logistics'],
 'leadership-principles-based',
 ARRAY['Tell me about a time you failed', 'Customer obsession example', 'How do you handle pressure?']);

-- Add comments for documentation
COMMENT ON TABLE questions IS 'Enhanced questions table with LLM and web scraping metadata';
COMMENT ON TABLE sample_answers IS 'AI-generated sample answers for interview questions';
COMMENT ON TABLE question_trends IS 'Industry trends and topic frequency data';
COMMENT ON TABLE company_insights IS 'Company culture and interview style insights';

COMMENT ON COLUMN questions.source IS 'Source of the question: ai-generated, scraped, or curated';
COMMENT ON COLUMN questions.freshness_score IS 'Score indicating how recent/fresh the question is (0-1)';
COMMENT ON COLUMN questions.relevance_score IS 'Score indicating relevance to job/industry (0-1)';
COMMENT ON COLUMN questions.company_specific IS 'Whether question is specific to a particular company';
COMMENT ON COLUMN questions.industry_trends IS 'Array of related industry trends';
COMMENT ON COLUMN questions.llm_provider IS 'LLM provider used to generate the question';
COMMENT ON COLUMN questions.star_framework IS 'STAR method framework data for behavioral questions';
