// --- START api/scripts/generate-jwt-secret.js --- //
// JWT Secret Generation Script
// Generates secure JWT secrets for the AI-InterviewSpark application

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

class JWTSecretManager {
  constructor() {
    this.secretLength = 64; // 512 bits
    this.envFile = path.join(__dirname, '../.env');
    this.envExampleFile = path.join(__dirname, '../env.example');
  }

  // Generate a cryptographically secure random string
  generateSecret(length = this.secretLength) {
    return crypto.randomBytes(length).toString('hex');
  }

  // Generate multiple secrets for different purposes
  generateSecrets() {
    return {
      JWT_SECRET: this.generateSecret(64), // 512 bits for main JWT
      JWT_REFRESH_SECRET: this.generateSecret(64), // 512 bits for refresh tokens
      JWT_ACCESS_SECRET: this.generateSecret(64), // 512 bits for access tokens
      JWT_VERIFICATION_SECRET: this.generateSecret(32), // 256 bits for email verification
      JWT_RESET_SECRET: this.generateSecret(32), // 256 bits for password reset
      JWT_SESSION_SECRET: this.generateSecret(32), // 256 bits for session tokens
      JWT_API_SECRET: this.generateSecret(32), // 256 bits for API tokens
      JWT_WEBSOCKET_SECRET: this.generateSecret(32), // 256 bits for WebSocket auth
    };
  }

  // Read existing .env file
  readEnvFile() {
    if (!fs.existsSync(this.envFile)) {
      return {};
    }
    
    const content = fs.readFileSync(this.envFile, 'utf8');
    const envVars = {};
    
    content.split('\n').forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split('=');
        if (key && valueParts.length > 0) {
          envVars[key.trim()] = valueParts.join('=').trim();
        }
      }
    });
    
    return envVars;
  }

  // Write to .env file
  writeEnvFile(envVars) {
    const lines = [];
    
    // Add header comment
    lines.push('# AI-InterviewSpark Environment Variables');
    lines.push('# Generated on: ' + new Date().toISOString());
    lines.push('');
    
    // Add JWT secrets section
    lines.push('# JWT Secrets');
    lines.push('# Generated using cryptographically secure random bytes');
    lines.push(`JWT_SECRET=${envVars.JWT_SECRET}`);
    lines.push(`JWT_REFRESH_SECRET=${envVars.JWT_REFRESH_SECRET}`);
    lines.push(`JWT_ACCESS_SECRET=${envVars.JWT_ACCESS_SECRET}`);
    lines.push(`JWT_VERIFICATION_SECRET=${envVars.JWT_VERIFICATION_SECRET}`);
    lines.push(`JWT_RESET_SECRET=${envVars.JWT_RESET_SECRET}`);
    lines.push(`JWT_SESSION_SECRET=${envVars.JWT_SESSION_SECRET}`);
    lines.push(`JWT_API_SECRET=${envVars.JWT_API_SECRET}`);
    lines.push(`JWT_WEBSOCKET_SECRET=${envVars.JWT_WEBSOCKET_SECRET}`);
    lines.push('');
    
    // Add other environment variables
    const otherVars = Object.keys(envVars).filter(key => !key.startsWith('JWT_'));
    if (otherVars.length > 0) {
      lines.push('# Other Environment Variables');
      otherVars.forEach(key => {
        lines.push(`${key}=${envVars[key]}`);
      });
      lines.push('');
    }
    
    // Add database configuration
    lines.push('# Database Configuration');
    lines.push('DATABASE_URL=postgresql://username:password@localhost:5432/ai_interviewspark');
    lines.push('');
    
    // Add server configuration
    lines.push('# Server Configuration');
    lines.push('PORT=3001');
    lines.push('NODE_ENV=development');
    lines.push('');
    
    // Add AI service configuration
    lines.push('# AI Service Configuration');
    lines.push('OPENAI_API_KEY=your_openai_api_key_here');
    lines.push('GOOGLE_AI_API_KEY=your_google_ai_api_key_here');
    lines.push('ANTHROPIC_API_KEY=your_anthropic_api_key_here');
    lines.push('');
    
    // Add email configuration
    lines.push('# Email Configuration');
    lines.push('SMTP_HOST=smtp.gmail.com');
    lines.push('SMTP_PORT=587');
    lines.push('SMTP_USER=your_email@gmail.com');
    lines.push('SMTP_PASS=your_app_password');
    lines.push('');
    
    // Add OAuth configuration
    lines.push('# OAuth Configuration');
    lines.push('GOOGLE_CLIENT_ID=your_google_client_id');
    lines.push('GOOGLE_CLIENT_SECRET=your_google_client_secret');
    lines.push('LINKEDIN_CLIENT_ID=your_linkedin_client_id');
    lines.push('LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret');
    lines.push('FACEBOOK_APP_ID=your_facebook_app_id');
    lines.push('FACEBOOK_APP_SECRET=your_facebook_app_secret');
    lines.push('');
    
    // Add push notification configuration
    lines.push('# Push Notification Configuration');
    lines.push('VAPID_PUBLIC_KEY=your_vapid_public_key');
    lines.push('VAPID_PRIVATE_KEY=your_vapid_private_key');
    lines.push('VAPID_SUBJECT=mailto:your-email@example.com');
    lines.push('');
    
    // Add SMS configuration
    lines.push('# SMS Configuration');
    lines.push('TWILIO_ACCOUNT_SID=your_twilio_account_sid');
    lines.push('TWILIO_AUTH_TOKEN=your_twilio_auth_token');
    lines.push('TWILIO_PHONE_NUMBER=your_twilio_phone_number');
    lines.push('');
    
    // Add file storage configuration
    lines.push('# File Storage Configuration');
    lines.push('AWS_ACCESS_KEY_ID=your_aws_access_key');
    lines.push('AWS_SECRET_ACCESS_KEY=your_aws_secret_key');
    lines.push('AWS_REGION=us-east-1');
    lines.push('AWS_S3_BUCKET=ai-interviewspark-files');
    lines.push('');
    
    // Add Redis configuration
    lines.push('# Redis Configuration');
    lines.push('REDIS_URL=redis://localhost:6379');
    lines.push('');
    
    // Add monitoring configuration
    lines.push('# Monitoring Configuration');
    lines.push('SENTRY_DSN=your_sentry_dsn');
    lines.push('LOG_LEVEL=info');
    lines.push('');
    
    fs.writeFileSync(this.envFile, lines.join('\n'));
  }

  // Update existing .env file with new JWT secrets
  updateEnvFile() {
    const existingEnv = this.readEnvFile();
    const newSecrets = this.generateSecrets();
    
    // Merge existing environment variables with new JWT secrets
    const updatedEnv = {
      ...existingEnv,
      ...newSecrets
    };
    
    this.writeEnvFile(updatedEnv);
  }

  // Generate .env.example file
  generateEnvExample() {
    const exampleEnv = {
      JWT_SECRET: 'your_jwt_secret_here',
      JWT_REFRESH_SECRET: 'your_jwt_refresh_secret_here',
      JWT_ACCESS_SECRET: 'your_jwt_access_secret_here',
      JWT_VERIFICATION_SECRET: 'your_jwt_verification_secret_here',
      JWT_RESET_SECRET: 'your_jwt_reset_secret_here',
      JWT_SESSION_SECRET: 'your_jwt_session_secret_here',
      JWT_API_SECRET: 'your_jwt_api_secret_here',
      JWT_WEBSOCKET_SECRET: 'your_jwt_websocket_secret_here',
      DATABASE_URL: 'postgresql://username:password@localhost:5432/ai_interviewspark',
      PORT: '3001',
      NODE_ENV: 'development',
      OPENAI_API_KEY: 'your_openai_api_key_here',
      GOOGLE_AI_API_KEY: 'your_google_ai_api_key_here',
      ANTHROPIC_API_KEY: 'your_anthropic_api_key_here',
      SMTP_HOST: 'smtp.gmail.com',
      SMTP_PORT: '587',
      SMTP_USER: 'your_email@gmail.com',
      SMTP_PASS: 'your_app_password',
      GOOGLE_CLIENT_ID: 'your_google_client_id',
      GOOGLE_CLIENT_SECRET: 'your_google_client_secret',
      LINKEDIN_CLIENT_ID: 'your_linkedin_client_id',
      LINKEDIN_CLIENT_SECRET: 'your_linkedin_client_secret',
      FACEBOOK_APP_ID: 'your_facebook_app_id',
      FACEBOOK_APP_SECRET: 'your_facebook_app_secret',
      VAPID_PUBLIC_KEY: 'your_vapid_public_key',
      VAPID_PRIVATE_KEY: 'your_vapid_private_key',
      VAPID_SUBJECT: 'mailto:your-email@example.com',
      TWILIO_ACCOUNT_SID: 'your_twilio_account_sid',
      TWILIO_AUTH_TOKEN: 'your_twilio_auth_token',
      TWILIO_PHONE_NUMBER: 'your_twilio_phone_number',
      AWS_ACCESS_KEY_ID: 'your_aws_access_key',
      AWS_SECRET_ACCESS_KEY: 'your_aws_secret_key',
      AWS_REGION: 'us-east-1',
      AWS_S3_BUCKET: 'ai-interviewspark-files',
      REDIS_URL: 'redis://localhost:6379',
      SENTRY_DSN: 'your_sentry_dsn',
      LOG_LEVEL: 'info'
    };
    
    const lines = [];
    lines.push('# AI-InterviewSpark Environment Variables Example');
    lines.push('# Copy this file to .env and fill in your actual values');
    lines.push('');
    
    Object.entries(exampleEnv).forEach(([key, value]) => {
      lines.push(`${key}=${value}`);
    });
    
    fs.writeFileSync(this.envExampleFile, lines.join('\n'));
  }

  // Validate JWT secrets
  validateSecrets(secrets) {
    const requiredSecrets = [
      'JWT_SECRET',
      'JWT_REFRESH_SECRET',
      'JWT_ACCESS_SECRET',
      'JWT_VERIFICATION_SECRET',
      'JWT_RESET_SECRET',
      'JWT_SESSION_SECRET',
      'JWT_API_SECRET',
      'JWT_WEBSOCKET_SECRET'
    ];
    
    const missing = requiredSecrets.filter(secret => !secrets[secret]);
    const invalid = requiredSecrets.filter(secret => 
      secrets[secret] && secrets[secret].length < 32
    );
    
    return {
      valid: missing.length === 0 && invalid.length === 0,
      missing,
      invalid
    };
  }

  // Display secret information
  displaySecretInfo(secrets) {
    console.log('🔐 JWT Secret Information');
    console.log('='.repeat(50));
    
    Object.entries(secrets).forEach(([key, value]) => {
      const length = value.length;
      const bits = length * 4; // Each hex character is 4 bits
      console.log(`${key}: ${length} characters (${bits} bits)`);
    });
    
    console.log('\n✅ All secrets generated successfully!');
    console.log('🔒 Secrets are cryptographically secure');
    console.log('📝 Generated using Node.js crypto.randomBytes()');
  }
}

// Main execution
async function main() {
  const manager = new JWTSecretManager();
  
  try {
    console.log('🚀 Generating JWT secrets for AI-InterviewSpark...\n');
    
    // Generate new secrets
    const secrets = manager.generateSecrets();
    
    // Validate secrets
    const validation = manager.validateSecrets(secrets);
    
    if (!validation.valid) {
      console.error('❌ Secret validation failed:');
      if (validation.missing.length > 0) {
        console.error('Missing secrets:', validation.missing.join(', '));
      }
      if (validation.invalid.length > 0) {
        console.error('Invalid secrets (too short):', validation.invalid.join(', '));
      }
      process.exit(1);
    }
    
    // Display secret information
    manager.displaySecretInfo(secrets);
    
    // Update .env file
    console.log('\n📝 Updating .env file...');
    manager.updateEnvFile();
    console.log('✅ .env file updated successfully');
    
    // Generate .env.example
    console.log('\n📄 Generating .env.example file...');
    manager.generateEnvExample();
    console.log('✅ .env.example file generated successfully');
    
    console.log('\n🎉 JWT secret setup completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Review the generated .env file');
    console.log('2. Update any placeholder values with your actual credentials');
    console.log('3. Ensure .env is in your .gitignore file');
    console.log('4. Restart your application to use the new secrets');
    
  } catch (error) {
    console.error('❌ Error generating JWT secrets:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = JWTSecretManager;
