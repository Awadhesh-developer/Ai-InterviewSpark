# InterviewSpark Configuration Guide

This guide will help you configure InterviewSpark with enhanced AI question generation capabilities.

## Quick Setup

### 1. Interactive Setup (Recommended)

Run the interactive setup script to configure your environment:

```bash
npm run setup-env
```

This script will guide you through:
- LLM provider API key configuration
- Database setup
- Optional services (Redis, analytics, etc.)
- Security settings

### 2. Manual Setup

Copy the example environment files and configure them manually:

```bash
# Web app configuration
cp apps/web/.env.example apps/web/.env

# API configuration  
cp apps/api/.env.example apps/api/.env
```

### 3. Validate Configuration

After setup, validate your configuration:

```bash
npm run validate-config
```

## LLM Providers Configuration

InterviewSpark supports multiple LLM providers for optimal question generation:

### OpenAI GPT-4
- **Best for**: Behavioral and complex reasoning questions
- **API Key**: Get from [OpenAI Platform](https://platform.openai.com/api-keys)
- **Environment Variables**:
  ```env
  OPENAI_API_KEY=your_openai_api_key_here
  OPENAI_MODEL=gpt-4-turbo-preview
  OPENAI_MAX_TOKENS=3000
  OPENAI_TEMPERATURE=0.7
  ```

### Google Gemini Pro
- **Best for**: Technical and analytical questions
- **API Key**: Get from [Google AI Studio](https://makersuite.google.com/app/apikey)
- **Environment Variables**:
  ```env
  GEMINI_API_KEY=your_gemini_api_key_here
  GEMINI_MODEL=gemini-pro
  GEMINI_MAX_TOKENS=3000
  GEMINI_TEMPERATURE=0.7
  ```

### Anthropic Claude
- **Best for**: Company-specific and nuanced questions
- **API Key**: Get from [Anthropic Console](https://console.anthropic.com/account/keys)
- **Environment Variables**:
  ```env
  ANTHROPIC_API_KEY=your_anthropic_api_key_here
  ANTHROPIC_MODEL=claude-3-sonnet-20240229
  ANTHROPIC_MAX_TOKENS=3000
  ANTHROPIC_TEMPERATURE=0.7
  ```

### Provider Selection Strategy

The system automatically selects the optimal provider based on:
- Question type (behavioral, technical, situational, company-specific)
- Complexity level (easy, medium, hard)
- Provider availability and health

You can also set a default provider:
```env
NEXT_PUBLIC_DEFAULT_LLM_PROVIDER=auto  # or openai, gemini, claude
```

## Database Configuration

### PostgreSQL Setup

1. **Install PostgreSQL** (if not already installed)
2. **Create Database**:
   ```sql
   CREATE DATABASE interviewspark;
   CREATE USER interviewspark_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE interviewspark TO interviewspark_user;
   ```

3. **Configure Environment**:
   ```env
   DATABASE_URL=postgresql://interviewspark_user:your_password@localhost:5432/interviewspark
   ```

4. **Run Migrations**:
   ```bash
   npm run db:migrate
   ```

## Enhanced Features Configuration

### Web Scraping Intelligence

Enable real-time question intelligence from job platforms:

```env
NEXT_PUBLIC_ENABLE_WEB_SCRAPING=true
WEB_SCRAPING_RATE_LIMIT=2000
WEB_SCRAPING_MAX_RETRIES=3
LINKEDIN_SCRAPING_ENABLED=true
INDEED_SCRAPING_ENABLED=true
GLASSDOOR_SCRAPING_ENABLED=true
```

### STAR Framework Answers

Configure AI-generated sample answers:

```env
NEXT_PUBLIC_ENABLE_STAR_FRAMEWORK=true
STAR_ANSWER_MIN_LENGTH=200
STAR_ANSWER_MAX_LENGTH=800
STAR_ANSWER_TARGET_DURATION=120
```

### Question Quality Settings

Configure quality thresholds:

```env
NEXT_PUBLIC_QUESTION_FRESHNESS_THRESHOLD=0.7
NEXT_PUBLIC_QUESTION_RELEVANCE_THRESHOLD=0.7
NEXT_PUBLIC_ENABLE_COMPANY_SPECIFIC_QUESTIONS=true
NEXT_PUBLIC_ENABLE_INDUSTRY_TRENDS=true
```

## Performance Optimization

### Redis Caching

Enable Redis for improved performance:

```env
REDIS_URL=redis://localhost:6379
CACHE_TTL=3600
QUESTION_CACHE_TTL=86400
COMPANY_INSIGHTS_CACHE_TTL=604800
```

### Rate Limiting

Configure API rate limiting:

```env
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Monitoring and Analytics

### Performance Monitoring

```env
NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING=true
PERFORMANCE_SAMPLE_RATE=0.1
SLOW_QUERY_THRESHOLD=1000
```

### Question Quality Metrics

```env
NEXT_PUBLIC_ENABLE_QUESTION_METRICS=true
QUESTION_FEEDBACK_COLLECTION=true
QUALITY_SCORE_THRESHOLD=0.8
```

### Error Reporting

```env
ERROR_REPORTING_ENABLED=true
ERROR_REPORTING_API_KEY=your_error_reporting_key_here
```

## Security Configuration

### JWT Settings

```env
JWT_SECRET=your_secure_jwt_secret_here  # Min 32 characters
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d
```

### GDPR Compliance

```env
GDPR_COMPLIANCE_MODE=true
DATA_RETENTION_DAYS=30
ANONYMIZE_DATA=true
ENCRYPT_SENSITIVE_DATA=true
```

## Development vs Production

### Development Settings

```env
NODE_ENV=development
NEXT_PUBLIC_DEBUG_MODE=true
VERBOSE_LOGGING=true
HOT_RELOAD_ENABLED=true
```

### Production Settings

```env
NODE_ENV=production
NEXT_PUBLIC_DEBUG_MODE=false
VERBOSE_LOGGING=false
LOG_LEVEL=warn
```

## Troubleshooting

### Common Issues

1. **No LLM providers configured**
   - Ensure at least one API key is set
   - Run `npm run validate-config` to check

2. **Database connection failed**
   - Verify PostgreSQL is running
   - Check DATABASE_URL format
   - Ensure database exists

3. **Redis connection failed**
   - Install and start Redis server
   - Verify REDIS_URL is correct
   - Caching will be disabled if Redis is unavailable

4. **Web scraping not working**
   - Check rate limits and timeouts
   - Verify platform-specific settings
   - Some platforms may block automated requests

### Validation Commands

```bash
# Validate all configuration
npm run validate-config

# Test database connection
npm run db:setup

# Check LLM provider connectivity
npm run test:enhanced
```

## Environment Variables Reference

See the complete list of environment variables in:
- `apps/web/.env.example` - Frontend configuration
- `apps/api/.env.example` - Backend configuration

## Next Steps

After configuration:

1. **Run validation**: `npm run validate-config`
2. **Migrate database**: `npm run db:migrate`
3. **Start development**: `npm run dev`
4. **Run tests**: `npm run test:enhanced`

For deployment configuration, see [DEPLOYMENT.md](./DEPLOYMENT.md).
