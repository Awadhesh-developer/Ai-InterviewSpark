# Database Migration Guide

This guide covers the enhanced database schema migration for InterviewSpark's advanced question generation features.

## Overview

The enhanced schema adds support for:
- Multiple LLM provider metadata
- Web scraping intelligence
- STAR framework sample answers
- Question quality metrics
- Company insights and industry trends

## Migration Process

### Prerequisites

1. **Database Setup**
   ```bash
   # Ensure PostgreSQL is running
   # Verify DATABASE_URL is configured
   npm run validate-config
   ```

2. **Backup Current Database** (Recommended)
   ```bash
   pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql
   ```

### Running the Migration

#### Option 1: Automated Migration (Recommended)

```bash
# Run the enhanced migration script
cd apps/api
npm run migrate

# With sample data seeding
npm run migrate:seed

# Force migration (if needed)
npm run migrate:force
```

#### Option 2: Manual Migration

```bash
# Generate migration files
cd apps/api
npm run db:generate

# Apply migrations
npm run db:migrate

# Seed enhanced data
npm run db:seed:enhanced
```

### Validation

After migration, validate the changes:

```bash
# Test migration success
npm run migrate:test

# Validate configuration
npm run validate-config
```

## Schema Changes

### Enhanced Questions Table

New columns added to `questions` table:

| Column | Type | Description |
|--------|------|-------------|
| `source` | ENUM | Question source: 'ai-generated', 'scraped', 'curated' |
| `freshness_score` | DECIMAL(3,2) | Question freshness (0.00-1.00) |
| `relevance_score` | DECIMAL(3,2) | Question relevance (0.00-1.00) |
| `company_specific` | BOOLEAN | Whether question is company-specific |
| `industry_trends` | TEXT[] | Related industry trends |
| `llm_provider` | ENUM | LLM provider: 'openai', 'gemini', 'claude' |
| `star_framework` | JSONB | STAR method framework data |
| `follow_up_questions` | TEXT[] | Follow-up questions |
| `tips` | TEXT[] | Interview tips |
| `updated_at` | TIMESTAMP | Last update timestamp |

### New Tables

#### Sample Answers Table
```sql
CREATE TABLE sample_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  answer TEXT NOT NULL,
  structure TEXT CHECK (structure IN ('star', 'problem-solution', 'feature-benefit', 'comparison')),
  key_points TEXT[],
  estimated_duration INTEGER,
  difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  industry TEXT NOT NULL,
  role TEXT NOT NULL,
  tips TEXT[],
  common_mistakes TEXT[],
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Question Trends Table
```sql
CREATE TABLE question_trends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  industry TEXT NOT NULL,
  topic TEXT NOT NULL,
  frequency INTEGER NOT NULL,
  growth DECIMAL(5,2),
  related_skills TEXT[],
  timeframe TEXT CHECK (timeframe IN ('week', 'month', 'quarter')),
  last_updated TIMESTAMP DEFAULT NOW()
);
```

#### Company Insights Table
```sql
CREATE TABLE company_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  culture TEXT[],
  values TEXT[],
  recent_news TEXT[],
  interview_style TEXT NOT NULL,
  common_questions TEXT[],
  last_updated TIMESTAMP DEFAULT NOW()
);
```

## Sample Data

The migration includes sample data for:

### Company Insights
- Google (behavioral-technical-mix style)
- Microsoft (behavioral-focused style)
- Amazon (leadership-principles-based style)
- Apple (design-thinking-focused style)

### Question Trends
- Technology: AI/ML, Cloud Computing, Cybersecurity
- Finance: Digital Banking, ESG Reporting
- Healthcare: Telemedicine, Healthcare Analytics

### Enhanced Question Metadata
- Source attribution
- Quality scores
- LLM provider information
- STAR framework examples

## Troubleshooting

### Common Issues

#### 1. Migration Fails with Foreign Key Error
```bash
# Check if referenced tables exist
npm run migrate:test

# If tables are missing, run base migration first
npm run db:setup
npm run migrate
```

#### 2. Permission Denied
```bash
# Ensure database user has proper permissions
GRANT ALL PRIVILEGES ON DATABASE interviewspark TO your_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_user;
```

#### 3. Column Already Exists
```bash
# Check current schema state
npm run db:studio

# Force migration if needed
npm run migrate:force
```

#### 4. Sample Data Insertion Fails
```bash
# Run enhanced seeding separately
npm run db:seed:enhanced

# Check for existing data conflicts
SELECT COUNT(*) FROM questions WHERE source IS NOT NULL;
```

### Validation Commands

```bash
# Test database connection
npm run migrate:test

# Validate table structure
psql $DATABASE_URL -c "\d questions"

# Check sample data
psql $DATABASE_URL -c "SELECT COUNT(*) FROM company_insights;"
```

## Rollback Procedure

If you need to rollback the migration:

### 1. Restore from Backup
```bash
# Drop current database
dropdb interviewspark

# Create new database
createdb interviewspark

# Restore from backup
psql $DATABASE_URL < backup-YYYYMMDD.sql
```

### 2. Manual Rollback
```bash
# Remove enhanced tables
DROP TABLE IF EXISTS sample_answers CASCADE;
DROP TABLE IF EXISTS question_trends CASCADE;
DROP TABLE IF EXISTS company_insights CASCADE;

# Remove enhanced columns from questions table
ALTER TABLE questions 
DROP COLUMN IF EXISTS source,
DROP COLUMN IF EXISTS freshness_score,
DROP COLUMN IF EXISTS relevance_score,
DROP COLUMN IF EXISTS company_specific,
DROP COLUMN IF EXISTS industry_trends,
DROP COLUMN IF EXISTS llm_provider,
DROP COLUMN IF EXISTS star_framework,
DROP COLUMN IF EXISTS follow_up_questions,
DROP COLUMN IF EXISTS tips,
DROP COLUMN IF EXISTS updated_at;
```

## Performance Considerations

### Indexes

The migration creates indexes for optimal performance:

```sql
-- Questions table indexes
CREATE INDEX idx_questions_source ON questions(source);
CREATE INDEX idx_questions_freshness_score ON questions(freshness_score);
CREATE INDEX idx_questions_relevance_score ON questions(relevance_score);
CREATE INDEX idx_questions_company_specific ON questions(company_specific);
CREATE INDEX idx_questions_llm_provider ON questions(llm_provider);

-- Sample answers indexes
CREATE INDEX idx_sample_answers_question_id ON sample_answers(question_id);
CREATE INDEX idx_sample_answers_industry ON sample_answers(industry);

-- Trends and insights indexes
CREATE INDEX idx_question_trends_industry ON question_trends(industry);
CREATE INDEX idx_company_insights_company_name ON company_insights(company_name);
```

### Query Optimization

For large datasets, consider:

1. **Partitioning** question_trends by timeframe
2. **Archiving** old sample_answers data
3. **Caching** frequently accessed company_insights

## Monitoring

After migration, monitor:

1. **Query Performance**
   ```sql
   SELECT query, mean_time, calls 
   FROM pg_stat_statements 
   WHERE query LIKE '%questions%' 
   ORDER BY mean_time DESC;
   ```

2. **Table Sizes**
   ```sql
   SELECT 
     tablename,
     pg_size_pretty(pg_total_relation_size(tablename)) as size
   FROM pg_tables 
   WHERE schemaname = 'public';
   ```

3. **Index Usage**
   ```sql
   SELECT 
     indexname,
     idx_tup_read,
     idx_tup_fetch
   FROM pg_stat_user_indexes;
   ```

## Next Steps

After successful migration:

1. **Restart API Server**
   ```bash
   npm run dev:api
   ```

2. **Test Enhanced Features**
   ```bash
   npm run test:enhanced
   ```

3. **Configure LLM Providers**
   - Add API keys to environment
   - Test question generation

4. **Enable Web Scraping** (Optional)
   - Configure scraping settings
   - Test trending questions

5. **Monitor Performance**
   - Check query performance
   - Monitor database growth
   - Set up alerts

For deployment considerations, see [DEPLOYMENT.md](./DEPLOYMENT.md).
