# JWT Secret Setup Guide for AI-InterviewSpark

## Overview
This guide will help you set up secure JWT secrets for the AI-InterviewSpark application. The system uses multiple JWT secrets for different purposes to enhance security.

## JWT Secret Types

### 🔐 **Primary Secrets**
- **JWT_SECRET** - Main JWT secret for general authentication
- **JWT_REFRESH_SECRET** - For refresh tokens (longer expiration)
- **JWT_ACCESS_SECRET** - For access tokens (shorter expiration)

### 🔑 **Specialized Secrets**
- **JWT_VERIFICATION_SECRET** - For email verification tokens
- **JWT_RESET_SECRET** - For password reset tokens
- **JWT_SESSION_SECRET** - For session management
- **JWT_API_SECRET** - For API authentication
- **JWT_WEBSOCKET_SECRET** - For WebSocket authentication

## Quick Setup

### Step 1: Generate JWT Secrets
Run the JWT secret generation script:

```bash
# From project root
npm run jwt:generate

# Or from API directory
cd apps/api
npm run jwt:generate
```

This will:
- Generate 8 cryptographically secure JWT secrets
- Update your `.env` file with the new secrets
- Create a `.env.example` file for reference
- Validate all secrets meet security requirements

### Step 2: Verify Setup
Check that the secrets were generated correctly:

```bash
# Check .env file
cat apps/api/.env | grep JWT_

# Should show 8 JWT secrets like:
# JWT_SECRET=abc123...
# JWT_REFRESH_SECRET=def456...
# JWT_ACCESS_SECRET=ghi789...
# JWT_VERIFICATION_SECRET=jkl012...
# JWT_RESET_SECRET=mno345...
# JWT_SESSION_SECRET=pqr678...
# JWT_API_SECRET=stu901...
# JWT_WEBSOCKET_SECRET=vwx234...
```

### Step 3: Test the Application
Start the application to ensure JWT secrets are working:

```bash
# Start the API server
npm run dev:api

# Check for JWT configuration warnings
# Should see no JWT-related warnings if setup is correct
```

## Manual Setup

If you prefer to set up JWT secrets manually:

### 1. Generate Secrets
Use Node.js crypto to generate secure secrets:

```javascript
const crypto = require('crypto');

// Generate 8 different secrets
const secrets = {
  JWT_SECRET: crypto.randomBytes(64).toString('hex'),
  JWT_REFRESH_SECRET: crypto.randomBytes(64).toString('hex'),
  JWT_ACCESS_SECRET: crypto.randomBytes(64).toString('hex'),
  JWT_VERIFICATION_SECRET: crypto.randomBytes(32).toString('hex'),
  JWT_RESET_SECRET: crypto.randomBytes(32).toString('hex'),
  JWT_SESSION_SECRET: crypto.randomBytes(32).toString('hex'),
  JWT_API_SECRET: crypto.randomBytes(32).toString('hex'),
  JWT_WEBSOCKET_SECRET: crypto.randomBytes(32).toString('hex'),
};

console.log(secrets);
```

### 2. Add to .env File
Add the generated secrets to your `apps/api/.env` file:

```bash
# JWT Secrets
JWT_SECRET=your_generated_secret_here
JWT_REFRESH_SECRET=your_generated_secret_here
JWT_ACCESS_SECRET=your_generated_secret_here
JWT_VERIFICATION_SECRET=your_generated_secret_here
JWT_RESET_SECRET=your_generated_secret_here
JWT_SESSION_SECRET=your_generated_secret_here
JWT_API_SECRET=your_generated_secret_here
JWT_WEBSOCKET_SECRET=your_generated_secret_here
```

## Security Features

### 🔒 **Cryptographic Security**
- All secrets are generated using `crypto.randomBytes()`
- Minimum 32 characters (256 bits) for specialized secrets
- Minimum 64 characters (512 bits) for primary secrets
- Hex encoding for maximum entropy

### 🛡️ **Token Separation**
- Different secrets for different token types
- Prevents token reuse across different purposes
- Limits blast radius if one secret is compromised

### ⏰ **Expiration Management**
- Access tokens: 15 minutes
- Refresh tokens: 7 days
- Verification tokens: 24 hours
- Reset tokens: 1 hour
- Session tokens: 30 minutes
- API tokens: 1 year
- WebSocket tokens: 1 hour

## JWT Service Usage

### Generate Tokens
```typescript
import JWTService from './services/jwtService';

// Generate access token
const accessToken = JWTService.generateAccessToken({
  userId: 'user123',
  email: 'user@example.com',
  role: 'job_seeker'
});

// Generate refresh token
const refreshToken = JWTService.generateRefreshToken({
  userId: 'user123',
  tokenVersion: 1
});

// Generate token pair
const { accessToken, refreshToken, expiresIn } = JWTService.generateTokenPair({
  userId: 'user123',
  email: 'user@example.com',
  role: 'job_seeker'
});
```

### Verify Tokens
```typescript
// Verify access token
const payload = JWTService.verifyAccessToken(accessToken);

// Verify refresh token
const refreshPayload = JWTService.verifyRefreshToken(refreshToken);

// Check if token is expired
const isExpired = JWTService.isTokenExpired(token);
```

## Environment Variables

### Required JWT Secrets
```bash
JWT_SECRET=your_jwt_secret_here
JWT_REFRESH_SECRET=your_jwt_refresh_secret_here
JWT_ACCESS_SECRET=your_jwt_access_secret_here
JWT_VERIFICATION_SECRET=your_jwt_verification_secret_here
JWT_RESET_SECRET=your_jwt_reset_secret_here
JWT_SESSION_SECRET=your_jwt_session_secret_here
JWT_API_SECRET=your_jwt_api_secret_here
JWT_WEBSOCKET_SECRET=your_jwt_websocket_secret_here
```

### Optional JWT Configuration
```bash
JWT_EXPIRES_IN=7d  # Default expiration for main JWT
```

## Production Considerations

### 🔐 **Secret Management**
- Store secrets in environment variables
- Use a secret management service (AWS Secrets Manager, Azure Key Vault, etc.)
- Never commit secrets to version control
- Rotate secrets regularly

### 🛡️ **Security Best Practices**
- Use different secrets for different environments
- Monitor for secret exposure
- Implement token blacklisting for compromised tokens
- Use HTTPS in production
- Set secure cookie flags

### 📊 **Monitoring**
- Log JWT-related errors
- Monitor token usage patterns
- Set up alerts for suspicious activity
- Track token expiration rates

## Troubleshooting

### Common Issues

#### 1. "JWT secrets must be set" Error
```bash
# Check if .env file exists
ls -la apps/api/.env

# Check if JWT secrets are set
grep JWT_ apps/api/.env

# Regenerate secrets
npm run jwt:generate
```

#### 2. "Invalid JWT secret" Error
```bash
# Check secret length (must be at least 32 characters)
node -e "console.log(process.env.JWT_SECRET?.length)"

# Regenerate with proper length
npm run jwt:generate
```

#### 3. "Token verification failed" Error
```bash
# Check if all JWT secrets are set
npm run jwt:generate

# Restart the application
npm run dev:api
```

### Validation Commands

#### Check JWT Configuration
```bash
# From API directory
cd apps/api
node -e "
const { config } = require('./src/config');
console.log('JWT Configuration:');
console.log('Secret length:', config.jwt.secret?.length);
console.log('Refresh secret length:', config.jwt.refreshSecret?.length);
console.log('Access secret length:', config.jwt.accessSecret?.length);
"
```

#### Test JWT Generation
```bash
# From API directory
cd apps/api
node -e "
const JWTService = require('./src/services/jwtService');
try {
  const token = JWTService.generateAccessToken({
    userId: 'test123',
    email: 'test@example.com',
    role: 'job_seeker'
  });
  console.log('JWT generation successful:', token.substring(0, 20) + '...');
} catch (error) {
  console.error('JWT generation failed:', error.message);
}
"
```

## Next Steps

After setting up JWT secrets:

1. **Test Authentication** - Verify login/logout functionality
2. **Test Token Refresh** - Ensure refresh tokens work
3. **Test API Access** - Verify API token authentication
4. **Test WebSocket** - Ensure WebSocket authentication works
5. **Monitor Security** - Set up logging and monitoring

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Verify all environment variables are set
3. Ensure secrets meet minimum length requirements
4. Check application logs for JWT-related errors
5. Test JWT generation manually

The JWT secret setup is now complete! Your application has secure, multi-purpose JWT authentication ready to use. 🎉
