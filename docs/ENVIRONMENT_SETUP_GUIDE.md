# 🔧 Environment Variables Configuration Guide

## 📍 **FILE LOCATIONS**

### **Backend API Environment File**
**Location**: `apps/api/.env`
**Template**: `apps/api/env.example` (copy and rename)

### **Frontend Web Environment File**
**Location**: `apps/web/.env.local`
**Template**: Create new file (template provided below)

---

## 🚀 **QUICK SETUP COMMANDS**

```bash
# 1. Navigate to project root
cd C:\apps\Ai-InterviewSpark

# 2. Copy API environment template
copy apps\api\env.example apps\api\.env

# 3. Create frontend environment file
echo. > apps\web\.env.local

# 4. Edit the files with your actual values (instructions below)
```

---

## 🔑 **BACKEND API ENVIRONMENT VARIABLES**

### **File**: `apps/api/.env`

```bash
# ============================================================================
# CRITICAL PRODUCTION SETTINGS (Required for Production Interview System)
# ============================================================================

# Database Connection (Required)
DATABASE_URL=postgresql://username:password@localhost:5432/ai_interviewspark

# JWT Authentication (Required)
JWT_SECRET=your_super_secret_jwt_key_here_min_32_chars
JWT_EXPIRES_IN=7d

# Redis Caching (Required for Production Performance)
REDIS_URL=redis://localhost:6379

# ============================================================================
# AI/LLM API KEYS (At least ONE required for question generation)
# ============================================================================

# OpenAI (Recommended - Best overall performance)
OPENAI_API_KEY=sk-your_openai_api_key_here

# Perplexity (Recommended - Real-time questions with current data)
PERPLEXITY_API_KEY=pplx-your_perplexity_api_key_here
PERPLEXITY_MODEL=llama-3.1-sonar-small-128k-online
PERPLEXITY_MAX_TOKENS=4000

# Anthropic Claude (Optional - Excellent for technical questions)
CLAUDE_API_KEY=sk-ant-your_claude_api_key_here

# Google Gemini (Optional - Good for coding questions)
GEMINI_API_KEY=your_gemini_api_key_here

# ============================================================================
# SERVER CONFIGURATION
# ============================================================================

# Server Settings
PORT=3001
NODE_ENV=development

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# ============================================================================
# OPTIONAL SERVICES (Can be configured later)
# ============================================================================

# Email Service (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# OAuth Providers (Optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# File Storage (Optional)
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=ai-interviewspark-files

# Monitoring (Optional)
SENTRY_DSN=your_sentry_dsn
LOG_LEVEL=info

# WebRTC (Optional - for advanced video features)
WS_PORT=8080

# Additional JWT Secrets (Optional - for enhanced security)
JWT_REFRESH_SECRET=your_jwt_refresh_secret_here
JWT_ACCESS_SECRET=your_jwt_access_secret_here
JWT_VERIFICATION_SECRET=your_jwt_verification_secret_here
JWT_RESET_SECRET=your_jwt_reset_secret_here
JWT_SESSION_SECRET=your_jwt_session_secret_here
JWT_API_SECRET=your_jwt_api_secret_here
JWT_WEBSOCKET_SECRET=your_jwt_websocket_secret_here

# Push Notifications (Optional)
VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
VAPID_SUBJECT=mailto:your-email@example.com

# SMS Service (Optional)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number
```

---

## 🌐 **FRONTEND WEB ENVIRONMENT VARIABLES**

### **File**: `apps/web/.env.local`

```bash
# ============================================================================
# FRONTEND ENVIRONMENT VARIABLES
# ============================================================================

# API Configuration (Required)
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_WS_URL=ws://localhost:8080

# Application Settings
NEXT_PUBLIC_APP_NAME=AI InterviewSpark
NEXT_PUBLIC_APP_VERSION=2.0.0
NEXT_PUBLIC_ENVIRONMENT=development

# Feature Flags
NEXT_PUBLIC_ENABLE_PRODUCTION_INTERVIEWS=true
NEXT_PUBLIC_ENABLE_WEBRTC=true
NEXT_PUBLIC_ENABLE_REAL_TIME_ANALYSIS=true

# Analytics (Optional)
NEXT_PUBLIC_GA_ID=your_google_analytics_id
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn

# OAuth Redirect URLs (Optional)
NEXT_PUBLIC_GOOGLE_REDIRECT_URI=http://localhost:3000/auth/callback/google
NEXT_PUBLIC_LINKEDIN_REDIRECT_URI=http://localhost:3000/auth/callback/linkedin
```

---

## 🔐 **HOW TO OBTAIN API KEYS**

### **1. OpenAI API Key** (Recommended)
1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up/Login → Go to API Keys
3. Create new secret key
4. Copy the key (starts with `sk-`)
5. Add to `.env`: `OPENAI_API_KEY=sk-your_key_here`

### **2. Perplexity API Key** (Recommended for Real-time)
1. Go to [Perplexity AI](https://www.perplexity.ai/)
2. Sign up → Go to API section
3. Generate API key
4. Add to `.env`: `PERPLEXITY_API_KEY=pplx-your_key_here`

### **3. Claude API Key** (Optional)
1. Go to [Anthropic Console](https://console.anthropic.com/)
2. Sign up/Login → API Keys
3. Create new key
4. Add to `.env`: `CLAUDE_API_KEY=sk-ant-your_key_here`

### **4. Gemini API Key** (Optional)
1. Go to [Google AI Studio](https://makersuite.google.com/)
2. Create API key
3. Add to `.env`: `GEMINI_API_KEY=your_key_here`

---

## 🗄️ **DATABASE SETUP**

### **Option 1: Local PostgreSQL** (Recommended for Development)
```bash
# Install PostgreSQL
# Windows: Download from postgresql.org
# Mac: brew install postgresql
# Linux: sudo apt-get install postgresql

# Start PostgreSQL service
# Windows: Start from Services
# Mac/Linux: sudo service postgresql start

# Create database
createdb ai_interviewspark

# Set DATABASE_URL
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/ai_interviewspark
```

### **Option 2: Cloud Database** (For Production)
```bash
# Popular options:
# - Supabase (Free tier available)
# - Railway (Easy setup)
# - Heroku Postgres
# - AWS RDS

# Example Supabase URL format:
DATABASE_URL=postgresql://postgres:your_password@db.your_project.supabase.co:5432/postgres
```

---

## 🔴 **REDIS SETUP**

### **Local Redis Installation**
```bash
# Windows: Download Redis for Windows
# Or use Docker: docker run -d -p 6379:6379 redis:alpine

# Mac: brew install redis
# Linux: sudo apt-get install redis-server

# Start Redis
redis-server

# Set REDIS_URL
REDIS_URL=redis://localhost:6379
```

### **Cloud Redis** (For Production)
```bash
# Popular options:
# - Redis Cloud (Free tier available)
# - AWS ElastiCache
# - Railway Redis

# Example Redis Cloud URL:
REDIS_URL=redis://username:password@redis-host:port
```

---

## ✅ **MINIMUM REQUIRED CONFIGURATION**

For the production interview system to work, you **MUST** have:

### **Backend (`apps/api/.env`)**
```bash
DATABASE_URL=postgresql://username:password@localhost:5432/ai_interviewspark
JWT_SECRET=your_super_secret_jwt_key_min_32_characters
REDIS_URL=redis://localhost:6379
OPENAI_API_KEY=sk-your_openai_key_here
```

### **Frontend (`apps/web/.env.local`)**
```bash
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_ENABLE_PRODUCTION_INTERVIEWS=true
```

---

## 🧪 **TESTING YOUR CONFIGURATION**

### **1. Test API Server**
```bash
cd apps/api
npm run dev

# Should see:
# ✅ Performance configuration loaded and validated
# ✅ Database connected
# ✅ Server running on port 3001
```

### **2. Test Frontend**
```bash
cd apps/web  
npm run dev

# Should see:
# ✓ Ready in 2.3s
# - Local: http://localhost:3000
```

### **3. Test Production Endpoints**
```bash
# Test health endpoint
curl http://localhost:3001/api/production-interviews/health

# Should return JSON with system health status
```

---

## 🚨 **COMMON ISSUES & SOLUTIONS**

### **Issue**: "Cannot find module '../middleware/validation'"
**Solution**: Validation middleware has been created. Restart the API server.

### **Issue**: "Database connection failed"
**Solution**: 
1. Ensure PostgreSQL is running
2. Check DATABASE_URL format
3. Verify database exists

### **Issue**: "Redis connection failed"  
**Solution**:
1. Install and start Redis server
2. Check REDIS_URL format
3. For development, use: `REDIS_URL=redis://localhost:6379`

### **Issue**: "No LLM providers available"
**Solution**: Add at least one API key (OpenAI recommended)

---

## 🎯 **NEXT STEPS AFTER CONFIGURATION**

1. **Start Services**: Both API and frontend servers
2. **Run Migration**: Deploy database schema v2
3. **Test Production Routes**: Verify all endpoints work
4. **Create Test Interview**: Use the production interview system

---

## 📞 **SUPPORT**

If you encounter issues:
1. Check the server logs for specific error messages
2. Verify all required environment variables are set
3. Ensure all services (PostgreSQL, Redis) are running
4. Test API endpoints individually

**Your production interview system will be fully functional once these environment variables are properly configured!** 🚀
