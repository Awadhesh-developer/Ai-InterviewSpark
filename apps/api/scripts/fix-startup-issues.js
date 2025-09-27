// --- START api/scripts/fix-startup-issues.js --- //
// Fix Startup Issues Script
// Addresses common startup issues for AI-InterviewSpark

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
require('dotenv').config();

class StartupIssueFixer {
  constructor() {
    this.envFile = path.join(__dirname, '../.env');
    this.rootDir = path.join(__dirname, '../../');
  }

  // Check if .env file exists
  checkEnvFile() {
    if (!fs.existsSync(this.envFile)) {
      console.log('❌ .env file not found');
      return false;
    }
    console.log('✅ .env file exists');
    return true;
  }

  // Fix database connection
  async fixDatabaseConnection() {
    console.log('\n🔧 Fixing database connection...');
    
    const databaseURL = process.env.DATABASE_URL;
    
    if (!databaseURL || databaseURL.includes('username:password')) {
      console.log('⚠️  Database URL contains placeholder values');
      console.log('💡 Run: node scripts/setup-database-connection.js');
      return false;
    }
    
    // Test database connection
    try {
      const { Pool } = require('postgres');
      const pool = new Pool({
        connectionString: databaseURL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      });
      
      const client = await pool.connect();
      await client.query('SELECT 1');
      client.release();
      await pool.end();
      
      console.log('✅ Database connection successful');
      return true;
    } catch (error) {
      console.log('❌ Database connection failed:', error.message);
      console.log('💡 Run: node scripts/setup-database-connection.js');
      return false;
    }
  }

  // Fix VAPID keys
  fixVAPIDKeys() {
    console.log('\n🔧 Fixing VAPID keys...');
    
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    
    if (!publicKey || !privateKey || publicKey.includes('your_') || privateKey.includes('your_')) {
      console.log('⚠️  VAPID keys are missing or contain placeholder values');
      console.log('💡 Run: node scripts/generate-vapid-keys.js');
      return false;
    }
    
    // Test VAPID keys
    try {
      const webpush = require('web-push');
      webpush.setVapidDetails(
        process.env.VAPID_SUBJECT || 'mailto:admin@ai-interviewspark.com',
        publicKey,
        privateKey
      );
      console.log('✅ VAPID keys are valid');
      return true;
    } catch (error) {
      console.log('❌ VAPID keys are invalid:', error.message);
      console.log('💡 Run: node scripts/generate-vapid-keys.js');
      return false;
    }
  }

  // Fix email configuration
  fixEmailConfiguration() {
    console.log('\n🔧 Fixing email configuration...');
    
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    
    if (!smtpUser || !smtpPass || smtpUser.includes('your_') || smtpPass.includes('your_')) {
      console.log('⚠️  Email configuration contains placeholder values');
      console.log('💡 Update SMTP_USER and SMTP_PASS in .env file');
      console.log('   For Gmail, use an App Password instead of your regular password');
      return false;
    }
    
    console.log('✅ Email configuration looks valid');
    return true;
  }

  // Fix JWT secrets
  fixJWTSecrets() {
    console.log('\n🔧 Fixing JWT secrets...');
    
    const jwtSecrets = [
      'JWT_SECRET',
      'JWT_REFRESH_SECRET',
      'JWT_ACCESS_SECRET',
      'JWT_VERIFICATION_SECRET',
      'JWT_RESET_SECRET',
      'JWT_SESSION_SECRET',
      'JWT_API_SECRET',
      'JWT_WEBSOCKET_SECRET'
    ];
    
    const missingSecrets = jwtSecrets.filter(secret => 
      !process.env[secret] || process.env[secret].length < 32
    );
    
    if (missingSecrets.length > 0) {
      console.log('⚠️  JWT secrets are missing or too short:', missingSecrets.join(', '));
      console.log('💡 Run: npm run jwt:generate');
      return false;
    }
    
    console.log('✅ JWT secrets are valid');
    return true;
  }

  // Update .env file with proper values
  updateEnvFile() {
    console.log('\n📝 Updating .env file with proper values...');
    
    const envContent = fs.readFileSync(this.envFile, 'utf8');
    const lines = envContent.split('\n');
    
    // Update database URL if it contains placeholders
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('DATABASE_URL=') && lines[i].includes('username:password')) {
        lines[i] = 'DATABASE_URL=postgresql://postgres:password@localhost:5432/ai_interviewspark';
        console.log('   Updated DATABASE_URL with default values');
      }
    }
    
    // Add missing environment variables
    const requiredVars = [
      'NODE_ENV=development',
      'PORT=3001',
      'HOST=localhost',
      'LOG_LEVEL=info'
    ];
    
    requiredVars.forEach(varLine => {
      const [key] = varLine.split('=');
      const exists = lines.some(line => line.startsWith(`${key}=`));
      if (!exists) {
        lines.push(varLine);
        console.log(`   Added ${varLine}`);
      }
    });
    
    fs.writeFileSync(this.envFile, lines.join('\n'));
    console.log('✅ .env file updated');
  }

  // Run all fixes
  async runAllFixes() {
    console.log('🚀 AI-InterviewSpark Startup Issue Fixer\n');
    console.log('This script will help fix common startup issues.\n');
    
    const results = {
      envFile: this.checkEnvFile(),
      database: false,
      vapid: false,
      email: false,
      jwt: false
    };
    
    if (!results.envFile) {
      console.log('❌ Cannot proceed without .env file');
      return;
    }
    
    // Update .env file
    this.updateEnvFile();
    
    // Test database connection
    results.database = await this.fixDatabaseConnection();
    
    // Test VAPID keys
    results.vapid = this.fixVAPIDKeys();
    
    // Test email configuration
    results.email = this.fixEmailConfiguration();
    
    // Test JWT secrets
    results.jwt = this.fixJWTSecrets();
    
    // Summary
    console.log('\n📊 Fix Results Summary');
    console.log('='.repeat(50));
    console.log(`Environment File: ${results.envFile ? '✅ OK' : '❌ FAIL'}`);
    console.log(`Database Connection: ${results.database ? '✅ OK' : '❌ FAIL'}`);
    console.log(`VAPID Keys: ${results.vapid ? '✅ OK' : '❌ FAIL'}`);
    console.log(`Email Configuration: ${results.email ? '✅ OK' : '❌ FAIL'}`);
    console.log(`JWT Secrets: ${results.jwt ? '✅ OK' : '❌ FAIL'}`);
    
    const allFixed = Object.values(results).every(result => result);
    
    if (allFixed) {
      console.log('\n🎉 All issues fixed! You can now start the application.');
      console.log('Run: npm run dev');
    } else {
      console.log('\n⚠️  Some issues remain. Please follow the suggestions above.');
      console.log('\n🔧 Quick Fix Commands:');
      if (!results.database) {
        console.log('   npm run db:setup');
      }
      if (!results.vapid) {
        console.log('   node scripts/generate-vapid-keys.js');
      }
      if (!results.jwt) {
        console.log('   npm run jwt:generate');
      }
    }
  }
}

// Main execution
async function main() {
  const fixer = new StartupIssueFixer();
  await fixer.runAllFixes();
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = StartupIssueFixer;
