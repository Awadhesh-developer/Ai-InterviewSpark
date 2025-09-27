# 🚀 CONFIGURE ENVIRONMENT VARIABLES NOW

## 📍 **FILES CREATED & READY FOR EDITING**

### ✅ **Backend Environment File**
**Path**: `C:\apps\Ai-InterviewSpark\apps\api\.env`
**Status**: ✅ Created (copied from template)

### ✅ **Frontend Environment File**  
**Path**: `C:\apps\Ai-InterviewSpark\apps\web\.env.local`
**Status**: ✅ Created (empty, ready for content)

### ✅ **Validation Middleware**
**Path**: `C:\apps\Ai-InterviewSpark\apps\api\src\middleware\validation.ts`
**Status**: ✅ Created (fixes the import error)

---

## 🔧 **STEP 1: EDIT BACKEND ENVIRONMENT**

Open `apps\api\.env` in your text editor and update these **CRITICAL** values:

### **🔴 REQUIRED (Must Change)**
```bash
# Database - Replace with your actual database URL
DATABASE_URL=postgresql://username:password@localhost:5432/ai_interviewspark

# JWT Secret - Replace with a strong secret (32+ characters)
JWT_SECRET=your_super_secret_jwt_key_here_min_32_chars

# Redis - For caching and performance
REDIS_URL=redis://localhost:6379

# At least ONE AI API key (OpenAI recommended)
OPENAI_API_KEY=sk-your_openai_api_key_here
```

### **🟡 RECOMMENDED (For Full Features)**
```bash
# Perplexity - For real-time questions
PERPLEXITY_API_KEY=pplx-your_perplexity_api_key_here

# Claude - For technical questions  
CLAUDE_API_KEY=sk-ant-your_claude_api_key_here

# Gemini - For coding questions
GEMINI_API_KEY=your_gemini_api_key_here
```

---

## 🌐 **STEP 2: EDIT FRONTEND ENVIRONMENT**

Open `apps\web\.env.local` and add this content:

```bash
# API Configuration
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
```

---

## 🗄️ **STEP 3: DATABASE SETUP**

### **Option A: Quick Local Setup**
```bash
# 1. Install PostgreSQL (if not installed)
# Download from: https://www.postgresql.org/download/windows/

# 2. Create database
createdb ai_interviewspark

# 3. Update .env with your database URL
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/ai_interviewspark
```

### **Option B: Cloud Database (Recommended)**
1. Go to [Supabase](https://supabase.com/) (free tier available)
2. Create new project
3. Get connection string from Settings → Database
4. Update `DATABASE_URL` in `.env`

---

## 🔴 **STEP 4: REDIS SETUP**

### **Option A: Local Redis**
```bash
# Download Redis for Windows from:
# https://github.com/microsoftarchive/redis/releases

# Or use Docker:
docker run -d -p 6379:6379 redis:alpine

# Set in .env:
REDIS_URL=redis://localhost:6379
```

### **Option B: Cloud Redis**
1. Go to [Redis Cloud](https://redis.com/try-free/) (free tier available)
2. Create database
3. Get connection string
4. Update `REDIS_URL` in `.env`

---

## 🔑 **STEP 5: GET API KEYS**

### **OpenAI (Required)**
1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create API key
3. Copy key (starts with `sk-`)
4. Add to `.env`: `OPENAI_API_KEY=sk-your_key_here`

### **Perplexity (Recommended)**
1. Go to [Perplexity API](https://www.perplexity.ai/settings/api)
2. Generate key
3. Add to `.env`: `PERPLEXITY_API_KEY=pplx-your_key_here`

---

## ⚡ **STEP 6: GENERATE JWT SECRET**

Use this command to generate a secure JWT secret:

```bash
cd apps/api
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
```

Copy the output and replace `JWT_SECRET` in your `.env` file.

---

## 🧪 **STEP 7: TEST CONFIGURATION**

After editing the files, test your setup:

```bash
# 1. Start API server (in new terminal)
cd apps/api
npm run dev

# Should show:
# ✅ Database connected
# ✅ Server running on port 3001

# 2. Start frontend (in another terminal)
cd apps/web
npm run dev

# Should show:
# ✓ Ready in 2.3s

# 3. Test production endpoint
curl http://localhost:3001/api/production-interviews/health
```

---

## 📝 **EXAMPLE COMPLETED .ENV FILE**

Here's what your `apps\api\.env` should look like after editing:

```bash
# Database
DATABASE_URL=postgresql://postgres:mypassword@localhost:5432/ai_interviewspark

# JWT
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6

# Redis
REDIS_URL=redis://localhost:6379

# AI APIs
OPENAI_API_KEY=sk-proj-abc123xyz789...
PERPLEXITY_API_KEY=pplx-def456uvw012...

# Server
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000

# Other variables stay as defaults...
```

---

## 🚨 **TROUBLESHOOTING**

### **"Cannot find module validation"** 
✅ **Fixed**: Validation middleware created

### **"Database connection failed"**
- Check PostgreSQL is running
- Verify DATABASE_URL format
- Test connection: `psql $DATABASE_URL`

### **"Redis connection failed"**
- Check Redis is running: `redis-cli ping`
- Should return "PONG"

### **"No LLM providers available"**
- Add at least OPENAI_API_KEY
- Verify key format (starts with `sk-`)

---

## 🎯 **NEXT STEPS**

Once configured:

1. **Restart servers** to load new environment variables
2. **Run database migration** to deploy schema v2
3. **Test production endpoints** 
4. **Create your first AI-powered interview**

**Your production interview system will be fully functional once these environment variables are configured!** 🚀

---

## 📞 **NEED HELP?**

If you need assistance:
1. Check the server console for specific error messages
2. Verify all required variables are set correctly
3. Ensure PostgreSQL and Redis services are running
4. Test each service individually
