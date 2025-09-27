# OAuth Setup Guide for AI-InterviewSpark

## 🔍 Issue Diagnosis

The **400 error from OAuth providers** occurs because the application is using **placeholder OAuth credentials** instead of real ones. When OAuth providers (Google, Facebook, LinkedIn) receive requests with invalid client IDs like `your-google-client-id-here`, they return a 400 "malformed request" error.

### Current Configuration Issue
```bash
# Current .env values (INVALID)
OAUTH_GOOGLE_CLIENT_ID=your-google-client-id-here
OAUTH_GOOGLE_CLIENT_SECRET=your-google-client-secret-here
OAUTH_FACEBOOK_APP_ID=your-facebook-app-id-here
OAUTH_FACEBOOK_APP_SECRET=your-facebook-app-secret-here
OAUTH_LINKEDIN_CLIENT_ID=your-linkedin-client-id-here
OAUTH_LINKEDIN_CLIENT_SECRET=your-linkedin-client-secret-here
```

## 🚀 Solution: Set Up Real OAuth Credentials

### 1. Google OAuth Setup

#### Step 1: Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Google+ API and Google OAuth2 API

#### Step 2: Create OAuth 2.0 Credentials
1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth 2.0 Client IDs**
3. Choose **Web application**
4. Set **Authorized redirect URIs**:
   - Development: `http://localhost:3001/api/auth/oauth/google/callback`
   - Production: `https://yourdomain.com/api/auth/oauth/google/callback`

#### Step 3: Get Credentials
```bash
# Replace in .env file
OAUTH_GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
OAUTH_GOOGLE_CLIENT_SECRET=GOCSPX-abcdefghijklmnopqrstuvwxyz
```

### 2. Facebook OAuth Setup

#### Step 1: Create Facebook App
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click **Create App** > **Consumer** > **Next**
3. Enter app name and contact email

#### Step 2: Configure Facebook Login
1. Add **Facebook Login** product
2. Go to **Facebook Login** > **Settings**
3. Add **Valid OAuth Redirect URIs**:
   - Development: `http://localhost:3001/api/auth/oauth/facebook/callback`
   - Production: `https://yourdomain.com/api/auth/oauth/facebook/callback`

#### Step 3: Get Credentials
```bash
# Replace in .env file
OAUTH_FACEBOOK_APP_ID=1234567890123456
OAUTH_FACEBOOK_APP_SECRET=abcdefghijklmnopqrstuvwxyz123456
```

### 3. LinkedIn OAuth Setup

#### Step 1: Create LinkedIn App
1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/)
2. Click **Create App**
3. Fill in app details and verify

#### Step 2: Configure OAuth
1. Go to **Auth** tab
2. Add **Authorized redirect URLs**:
   - Development: `http://localhost:3001/api/auth/oauth/linkedin/callback`
   - Production: `https://yourdomain.com/api/auth/oauth/linkedin/callback`

#### Step 3: Get Credentials
```bash
# Replace in .env file
OAUTH_LINKEDIN_CLIENT_ID=abcdefghijklmn
OAUTH_LINKEDIN_CLIENT_SECRET=AbCdEfGhIjKlMnOp
```

## 🔧 Quick Fix for Development

### Option 1: Use Test Credentials (Recommended)
For development and testing, you can use these test credentials:

```bash
# Development-only test credentials (DO NOT USE IN PRODUCTION)
OAUTH_GOOGLE_CLIENT_ID=123456789-test.apps.googleusercontent.com
OAUTH_GOOGLE_CLIENT_SECRET=test-secret-key
OAUTH_FACEBOOK_APP_ID=123456789012345
OAUTH_FACEBOOK_APP_SECRET=test-facebook-secret
OAUTH_LINKEDIN_CLIENT_ID=testclientid
OAUTH_LINKEDIN_CLIENT_SECRET=testclientsecret
```

### Option 2: Disable OAuth Temporarily
Comment out OAuth credentials to disable OAuth:

```bash
# Disable OAuth for now
# OAUTH_GOOGLE_CLIENT_ID=your-google-client-id-here
# OAUTH_GOOGLE_CLIENT_SECRET=your-google-client-secret-here
```

## 🛠️ Implementation Steps

### 1. Update Environment Variables
```bash
# Edit apps/api/.env file
cd apps/api
nano .env  # or use your preferred editor

# Replace placeholder values with real credentials
OAUTH_GOOGLE_CLIENT_ID=your-real-google-client-id
OAUTH_GOOGLE_CLIENT_SECRET=your-real-google-client-secret
# ... etc for other providers
```

### 2. Restart API Server
```bash
# Restart the API server to load new environment variables
cd apps/api
npm run dev
```

### 3. Test OAuth Flow
```bash
# Test OAuth initiation
curl -X GET "http://localhost:3001/api/oauth/auth/google"

# Should return authorization URL instead of 400 error
```

## 🔒 Security Considerations

### Environment Variables
- ✅ **Never commit real credentials** to version control
- ✅ **Use different credentials** for development and production
- ✅ **Rotate credentials regularly** in production
- ✅ **Restrict redirect URIs** to your domains only

### OAuth Redirect URIs
```bash
# Development
http://localhost:3001/api/auth/oauth/{provider}/callback

# Production
https://yourdomain.com/api/auth/oauth/{provider}/callback
```

## 🧪 Testing OAuth Setup

### 1. Check Configuration
```bash
# Test if credentials are loaded
curl -X GET "http://localhost:3001/api/oauth/auth/google"

# Should return authorization URL, not 400 error
```

### 2. Test Authorization Flow
1. Click OAuth button in frontend
2. Should redirect to provider (Google/Facebook/LinkedIn)
3. After authorization, should redirect back to your app

### 3. Check Logs
```bash
# Check API server logs for OAuth errors
tail -f apps/api/logs/app.log
```

## 🎯 Expected Results

### Before Fix (400 Error)
```json
{
  "error": "400. That's an error. The server cannot process the request because it is malformed."
}
```

### After Fix (Working)
```json
{
  "success": true,
  "message": "OAuth authorization URL generated",
  "data": {
    "authorizationUrl": "https://accounts.google.com/o/oauth2/v2/auth?client_id=real-client-id...",
    "provider": "google"
  }
}
```

## 📋 Troubleshooting

### Common Issues

1. **Still getting 400 error**
   - Check if you restarted the API server
   - Verify credentials are not placeholder values
   - Check redirect URIs match exactly

2. **OAuth provider rejects redirect URI**
   - Add your redirect URI to provider settings
   - Ensure exact match (including http/https)
   - Check for trailing slashes

3. **Credentials not loading**
   - Check .env file location (apps/api/.env)
   - Verify no extra spaces in environment variables
   - Restart API server after changes

## 🎉 Next Steps

Once OAuth credentials are configured:

1. ✅ **OAuth buttons will work** in the frontend
2. ✅ **Users can sign in** with social providers
3. ✅ **Account linking** will function properly
4. ✅ **Production deployment** will be ready

The OAuth implementation is **fully functional** - it just needs real provider credentials to work! 🚀
