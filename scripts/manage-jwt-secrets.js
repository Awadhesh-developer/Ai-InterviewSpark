#!/usr/bin/env node

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

/**
 * JWT Secrets Management Tool for AI-InterviewSpark
 * Provides commands to generate, validate, and manage JWT secrets
 */

// Configuration
const CONFIG = {
  ENV_FILE_PATH: path.join(__dirname, '..', 'apps', 'api', '.env'),
  REQUIRED_JWT_SECRETS: [
    'JWT_SECRET',
    'JWT_REFRESH_SECRET', 
    'JWT_ACCESS_SECRET',
    'JWT_VERIFICATION_SECRET',
    'JWT_RESET_SECRET',
    'JWT_SESSION_SECRET',
    'JWT_API_SECRET',
    'JWT_WEBSOCKET_SECRET'
  ],
  MIN_SECRET_LENGTH: 32,
  RECOMMENDED_SECRET_LENGTH: 64
};

class JWTSecretsManager {
  
  /**
   * Generate a cryptographically secure random string
   */
  generateSecureSecret(length = CONFIG.RECOMMENDED_SECRET_LENGTH) {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Validate if a secret meets security requirements
   */
  isSecretValid(secret) {
    if (!secret || typeof secret !== 'string') return false;
    if (secret.length < CONFIG.MIN_SECRET_LENGTH) return false;
    if (secret.includes('your_') || secret.includes('_here')) return false;
    if (secret === 'default' || secret === 'change-me') return false;
    return true;
  }

  /**
   * Parse .env file into key-value pairs
   */
  parseEnvFile(filePath) {
    const envVars = {};
    
    if (!fs.existsSync(filePath)) {
      return envVars;
    }

    const content = fs.readFileSync(filePath, 'utf8');
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

  /**
   * Check current JWT secrets status
   */
  validateJWTSecrets() {
    console.log('🔍 JWT Secrets Validation Report');
    console.log('================================\n');

    const envVars = this.parseEnvFile(CONFIG.ENV_FILE_PATH);
    const results = {
      valid: [],
      invalid: [],
      missing: []
    };

    CONFIG.REQUIRED_JWT_SECRETS.forEach(secretName => {
      if (envVars.hasOwnProperty(secretName)) {
        const secret = envVars[secretName];
        if (this.isSecretValid(secret)) {
          results.valid.push(secretName);
          console.log(`✅ ${secretName}: Valid (${secret.length} chars)`);
        } else {
          results.invalid.push(secretName);
          console.log(`❌ ${secretName}: Invalid (${secret ? secret.length : 0} chars) - ${secret ? 'too short or placeholder' : 'empty'}`);
        }
      } else {
        results.missing.push(secretName);
        console.log(`❌ ${secretName}: Missing`);
      }
    });

    console.log('\n📊 Summary:');
    console.log(`   Valid: ${results.valid.length}/${CONFIG.REQUIRED_JWT_SECRETS.length}`);
    console.log(`   Invalid: ${results.invalid.length}`);
    console.log(`   Missing: ${results.missing.length}`);

    const needsUpdate = results.invalid.length > 0 || results.missing.length > 0;
    if (needsUpdate) {
      console.log('\n⚠️ Action Required: Run with --generate to fix issues');
    } else {
      console.log('\n🎉 All JWT secrets are properly configured!');
    }

    return { results, needsUpdate };
  }

  /**
   * Generate and update JWT secrets
   */
  async generateJWTSecrets(forceUpdate = false) {
    console.log('🔐 Generating JWT Secrets');
    console.log('=========================\n');

    // Read existing environment
    const existingEnvVars = this.parseEnvFile(CONFIG.ENV_FILE_PATH);
    let updatedCount = 0;
    let addedCount = 0;

    // Generate secrets for missing or invalid ones
    CONFIG.REQUIRED_JWT_SECRETS.forEach(secretName => {
      const existingSecret = existingEnvVars[secretName];
      const needsUpdate = !existingSecret || !this.isSecretValid(existingSecret) || forceUpdate;

      if (needsUpdate) {
        const newSecret = this.generateSecureSecret();
        existingEnvVars[secretName] = newSecret;
        
        if (existingSecret) {
          updatedCount++;
          console.log(`🔄 Updated ${secretName}`);
        } else {
          addedCount++;
          console.log(`➕ Added ${secretName}`);
        }
      } else {
        console.log(`✅ Keeping existing ${secretName}`);
      }
    });

    // Backup existing file
    if (fs.existsSync(CONFIG.ENV_FILE_PATH)) {
      const backupPath = `${CONFIG.ENV_FILE_PATH}.backup.${Date.now()}`;
      fs.copyFileSync(CONFIG.ENV_FILE_PATH, backupPath);
      console.log(`\n💾 Backup created: ${path.basename(backupPath)}`);
    }

    // Write updated .env file
    await this.writeEnvFile(existingEnvVars);

    console.log('\n🎉 JWT Secrets Update Complete!');
    console.log(`   • Updated: ${updatedCount}`);
    console.log(`   • Added: ${addedCount}`);
    console.log(`   • File: ${CONFIG.ENV_FILE_PATH}`);
  }

  /**
   * Write environment variables to .env file with proper formatting
   */
  async writeEnvFile(envVars) {
    const envLines = [];
    
    // Header
    envLines.push('# AI-InterviewSpark Backend Environment Variables');
    envLines.push('# Auto-generated JWT secrets - DO NOT SHARE THESE VALUES');
    envLines.push('');

    // Group variables for better organization
    const groups = {
      'Database': ['DATABASE_URL', 'DATABASE_SSL'],
      'JWT Secrets': CONFIG.REQUIRED_JWT_SECRETS,
      'AI Services': ['OPENAI_API_KEY', 'GEMINI_API_KEY', 'PERPLEXITY_API_KEY', 'ANTHROPIC_API_KEY'],
      'Server': ['PORT', 'NODE_ENV', 'CORS_ORIGIN', 'HOST'],
      'OAuth': [
        'OAUTH_GOOGLE_CLIENT_ID', 'OAUTH_GOOGLE_CLIENT_SECRET', 
        'OAUTH_FACEBOOK_APP_ID', 'OAUTH_FACEBOOK_APP_SECRET', 
        'OAUTH_LINKEDIN_CLIENT_ID', 'OAUTH_LINKEDIN_CLIENT_SECRET'
      ],
      'External Services': [
        'REDIS_URL', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 
        'SENDGRID_API_KEY', 'TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN'
      ]
    };

    // Add grouped variables
    for (const [groupName, groupVars] of Object.entries(groups)) {
      const groupHasVars = groupVars.some(varName => envVars.hasOwnProperty(varName));
      if (groupHasVars) {
        envLines.push(`# ${groupName}`);
        for (const varName of groupVars) {
          if (envVars.hasOwnProperty(varName)) {
            envLines.push(`${varName}=${envVars[varName]}`);
          }
        }
        envLines.push('');
      }
    }

    // Add ungrouped variables
    const groupedVars = new Set(Object.values(groups).flat());
    const ungroupedVars = Object.keys(envVars).filter(key => !groupedVars.has(key));
    if (ungroupedVars.length > 0) {
      envLines.push('# Other');
      ungroupedVars.forEach(key => {
        envLines.push(`${key}=${envVars[key]}`);
      });
    }

    fs.writeFileSync(CONFIG.ENV_FILE_PATH, envLines.join('\n'), 'utf8');
  }

  /**
   * Display usage information
   */
  showHelp() {
    console.log('JWT Secrets Management Tool');
    console.log('===========================\n');
    console.log('Usage: node manage-jwt-secrets.js [command]\n');
    console.log('Commands:');
    console.log('  --validate    Check current JWT secrets status');
    console.log('  --generate    Generate missing/invalid JWT secrets');
    console.log('  --force       Force regenerate all JWT secrets');
    console.log('  --help        Show this help message\n');
    console.log('Examples:');
    console.log('  node manage-jwt-secrets.js --validate');
    console.log('  node manage-jwt-secrets.js --generate');
    console.log('  node manage-jwt-secrets.js --force');
  }
}

// Main execution
async function main() {
  const manager = new JWTSecretsManager();
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help')) {
    manager.showHelp();
    return;
  }

  try {
    if (args.includes('--validate')) {
      manager.validateJWTSecrets();
    } else if (args.includes('--generate')) {
      await manager.generateJWTSecrets(false);
    } else if (args.includes('--force')) {
      await manager.generateJWTSecrets(true);
    } else {
      console.log('❌ Unknown command. Use --help for usage information.');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = JWTSecretsManager;
