# Startup Issues Fix Guide

## Issues Identified and Fixed

Based on the terminal output, I've identified and created fixes for the following issues:

### 1. ❌ **Database Connection Error**
**Error:** `password authentication failed for user "username"`

**Cause:** The DATABASE_URL contains placeholder values instead of real database credentials.

**Fix:**
```bash
# Run the database setup script
npm run db:setup-connection

# Or run the comprehensive fix script
npm run fix:startup
```

### 2. ❌ **VAPID Key Error**
**Error:** `Vapid public key should be 65 bytes long when decoded`

**Cause:** VAPID keys for push notifications are missing or invalid.

**Fix:**
```bash
# Generate VAPID keys
npm run vapid:generate
```

### 3. ❌ **Email Authentication Error**
**Error:** `535 Authentication failed: The provided authorization grant is invalid`

**Cause:** SMTP credentials are placeholder values.

**Fix:**
1. Update your `.env` file with real SMTP credentials:
```bash
SMTP_USER=your_actual_email@gmail.com
SMTP_PASS=your_app_password
```

2. For Gmail, use an App Password instead of your regular password.

### 4. ⚠️ **Rate Limiting Deprecation Warning**
**Warning:** `onLimitReached configuration option is deprecated`

**Cause:** Using deprecated express-rate-limit configuration.

**Fix:** ✅ **Already fixed** - Updated the middleware to use the new configuration.

## Quick Fix Commands

### 🚀 **One-Command Fix**
```bash
# Run the comprehensive fix script
npm run fix:startup
```

### 🔧 **Individual Fixes**

#### Fix Database Connection
```bash
# Interactive setup
npm run db:setup-connection -- --interactive

# Quick setup with defaults
npm run db:setup-connection
```

#### Fix VAPID Keys
```bash
npm run vapid:generate
```

#### Fix JWT Secrets
```bash
npm run jwt:generate
```

#### Test Everything
```bash
npm run jwt:test
```

## Step-by-Step Fix Process

### Step 1: Run the Comprehensive Fix Script
```bash
npm run fix:startup
```

This will:
- Check all configuration issues
- Update .env file with proper values
- Test database connection
- Validate VAPID keys
- Check JWT secrets
- Provide specific fix recommendations

### Step 2: Set Up Database
If database connection fails:
```bash
# Option 1: Interactive setup
npm run db:setup-connection -- --interactive

# Option 2: Quick setup (uses defaults)
npm run db:setup-connection
```

### Step 3: Generate Missing Keys
```bash
# Generate JWT secrets
npm run jwt:generate

# Generate VAPID keys
npm run vapid:generate
```

### Step 4: Update Email Configuration
Edit your `.env` file and update:
```bash
SMTP_USER=your_actual_email@gmail.com
SMTP_PASS=your_app_password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
```

### Step 5: Test the Application
```bash
# Test JWT functionality
npm run jwt:test

# Start the application
npm run dev
```

## Expected Results After Fixes

### ✅ **Successful Startup**
```
🚀 AI-InterviewSpark API server running on http://localhost:3001
📊 Environment: development
🔐 Authentication: JWT
🤖 AI Services: OpenAI=true, Gemini=true
🎭 Emotional Analysis: Motivel=true, Moodme=true
🔌 WebSocket: Real-time features enabled
📁 Storage: AWS S3=true
```

### ✅ **No More Errors**
- No database connection errors
- No VAPID key errors
- No email authentication errors
- No rate limiting deprecation warnings

## Troubleshooting

### If Database Setup Fails
1. **Check PostgreSQL is running:**
   ```bash
   # Windows
   net start postgresql
   
   # macOS/Linux
   sudo service postgresql start
   ```

2. **Create the database:**
   ```sql
   CREATE DATABASE ai_interviewspark;
   CREATE USER postgres WITH PASSWORD 'password';
   GRANT ALL PRIVILEGES ON DATABASE ai_interviewspark TO postgres;
   ```

3. **Test connection manually:**
   ```bash
   psql -h localhost -U postgres -d ai_interviewspark
   ```

### If VAPID Keys Still Don't Work
1. **Check key format:**
   ```bash
   # Public key should be 65 characters
   echo $VAPID_PUBLIC_KEY | wc -c
   
   # Private key should be 43 characters
   echo $VAPID_PRIVATE_KEY | wc -c
   ```

2. **Regenerate keys:**
   ```bash
   npm run vapid:generate
   ```

### If Email Still Fails
1. **Use Gmail App Password:**
   - Go to Google Account settings
   - Enable 2-factor authentication
   - Generate an App Password
   - Use the App Password in SMTP_PASS

2. **Check SMTP settings:**
   ```bash
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   ```

## Environment Variables Checklist

Make sure your `.env` file contains:

### Database
```bash
DATABASE_URL=postgresql://postgres:password@localhost:5432/ai_interviewspark
```

### JWT Secrets
```bash
JWT_SECRET=your_64_character_secret
JWT_REFRESH_SECRET=your_64_character_secret
JWT_ACCESS_SECRET=your_64_character_secret
JWT_VERIFICATION_SECRET=your_32_character_secret
JWT_RESET_SECRET=your_32_character_secret
JWT_SESSION_SECRET=your_32_character_secret
JWT_API_SECRET=your_32_character_secret
JWT_WEBSOCKET_SECRET=your_32_character_secret
```

### VAPID Keys
```bash
VAPID_PUBLIC_KEY=your_65_character_public_key
VAPID_PRIVATE_KEY=your_43_character_private_key
VAPID_SUBJECT=mailto:admin@ai-interviewspark.com
```

### Email Configuration
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

## Next Steps

After fixing all issues:

1. **Run the migration:**
   ```bash
   npm run db:migrate
   ```

2. **Verify the migration:**
   ```bash
   npm run db:verify
   ```

3. **Start the application:**
   ```bash
   npm run dev
   ```

4. **Test the application:**
   - Open http://localhost:3000 (web app)
   - Open http://localhost:3001 (API)
   - Check that no errors appear in the console

## Support

If you still encounter issues:

1. **Check the logs** for specific error messages
2. **Run the fix script** again: `npm run fix:startup`
3. **Verify environment variables** are set correctly
4. **Check that all services** (PostgreSQL, etc.) are running
5. **Review the troubleshooting section** above

The startup issues should now be resolved! 🎉
