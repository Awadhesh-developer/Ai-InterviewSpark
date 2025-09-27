# 🤖 AI QUESTION GENERATION - CONFIGURATION GUIDE

## 🚨 **CRITICAL ISSUE IDENTIFIED**

Your AI interview system is **NOT generating questions** because **NO AI API KEYS are configured**.

The system is falling back to hardcoded sample questions instead of using AI models.

---

## ✅ **IMMEDIATE FIX REQUIRED**

### **Step 1: Create Environment File**

Create `apps/api/.env` with at least ONE of these AI services:

```bash
# Copy and paste this into apps/api/.env

# Database (REQUIRED)
DATABASE_URL=postgresql://username:password@localhost:5432/ai_interviewspark

# JWT Secrets (REQUIRED - will auto-generate if missing)
JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters

# AI Services (ADD AT LEAST ONE)
OPENAI_API_KEY=sk-your_openai_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
PERPLEXITY_API_KEY=pplx-your_perplexity_key_here

# Basic Configuration
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

---

## 🔑 **GET YOUR AI API KEYS**

### **Option 1: OpenAI (Recommended)**
1. Go to [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Create new API key
3. Copy key (starts with `sk-`)
4. Add to `.env`: `OPENAI_API_KEY=sk-your_key_here`

### **Option 2: Google Gemini (Free Tier Available)**
1. Go to [aistudio.google.com](https://aistudio.google.com)
2. Get API key
3. Add to `.env`: `GEMINI_API_KEY=your_key_here`

### **Option 3: Perplexity (Real-time Data)**
1. Go to [perplexity.ai](https://www.perplexity.ai/settings/api)
2. Get API key
3. Add to `.env`: `PERPLEXITY_API_KEY=pplx-your_key_here`

---

## 🧪 **TEST AI CONFIGURATION**

After adding API keys:

1. **Restart API Server**:
   ```bash
   cd apps/api
   npm run dev
   ```

2. **Run Test**:
   ```bash
   node test-ai-question-generation.js
   ```

3. **Expected Output**:
   ```
   ✅ API server is running
   ✅ OpenAI: Configured (or whichever service you added)
   ✅ AI services are configured and ready!
   ```

---

## 🚀 **HOW THE AI SYSTEM WORKS**

### **Without API Keys (Current State)**
```
User requests questions → System has no AI access → Returns sample questions
```

### **With API Keys (After Fix)**
```
User requests questions → AI generates custom questions → Stores in database → Returns AI questions
```

---

## 📋 **QUESTION GENERATION FLOW**

1. **User selects**: Role, difficulty, question types
2. **AI generates**: Custom questions based on context
3. **System stores**: Questions and ideal answers in database
4. **User gets**: Real AI-generated interview questions
5. **Feedback**: AI compares user answers to ideal answers

---

## 🎯 **PRIORITY SERVICES**

**For Testing**: Use **OpenAI** (most reliable)
**For Production**: Use **OpenAI + Gemini** (redundancy)
**For Real-time**: Add **Perplexity** (current data)

---

## ⚠️ **CURRENT SYSTEM STATUS**

- ✅ **API Server**: Running
- ✅ **Database**: Connected
- ✅ **Question Engine**: Built and ready
- ❌ **AI Services**: NO API KEYS CONFIGURED
- ❌ **Question Generation**: Using fallback samples

---

## 🔧 **AFTER CONFIGURATION**

Once you add API keys and restart:

1. **Frontend will get real AI questions** instead of samples
2. **Questions will be stored** in database with metadata
3. **Ideal answers will be generated** for comparison
4. **System will adapt** to user's role and experience level

---

## 🚨 **THIS IS THE MISSING PIECE**

**Everything else is working perfectly** - the only reason you're not getting AI-generated questions is the missing API keys.

**Add just ONE API key and restart the server** - your AI interview system will immediately start working! 🚀
