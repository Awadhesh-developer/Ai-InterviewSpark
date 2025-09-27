// --- START api/scripts/generate-vapid-keys.js --- //
// VAPID Key Generation Script
// Generates VAPID keys for push notifications

const webpush = require('web-push');
const fs = require('fs');
const path = require('path');

class VAPIDKeyGenerator {
  constructor() {
    this.envFile = path.join(__dirname, '../.env');
  }

  // Generate VAPID keys
  generateVAPIDKeys() {
    const vapidKeys = webpush.generateVAPIDKeys();
    return {
      publicKey: vapidKeys.publicKey,
      privateKey: vapidKeys.privateKey
    };
  }

  // Update .env file with VAPID keys
  updateEnvFile(vapidKeys) {
    // Read existing .env file
    let envContent = '';
    if (fs.existsSync(this.envFile)) {
      envContent = fs.readFileSync(this.envFile, 'utf8');
    }

    const lines = envContent.split('\n');
    let updatedPublic = false;
    let updatedPrivate = false;
    let updatedSubject = false;
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('VAPID_PUBLIC_KEY=')) {
        lines[i] = `VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`;
        updatedPublic = true;
      } else if (lines[i].startsWith('VAPID_PRIVATE_KEY=')) {
        lines[i] = `VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`;
        updatedPrivate = true;
      } else if (lines[i].startsWith('VAPID_SUBJECT=')) {
        lines[i] = `VAPID_SUBJECT=mailto:admin@ai-interviewspark.com`;
        updatedSubject = true;
      }
    }
    
    // Add missing keys
    if (!updatedPublic) {
      lines.push(`VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
    }
    if (!updatedPrivate) {
      lines.push(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
    }
    if (!updatedSubject) {
      lines.push(`VAPID_SUBJECT=mailto:admin@ai-interviewspark.com`);
    }

    // Write back to .env file
    fs.writeFileSync(this.envFile, lines.join('\n'));
  }

  // Generate and save VAPID keys
  generateAndSave() {
    try {
      console.log('🔑 Generating VAPID keys for push notifications...\n');
      
      const vapidKeys = this.generateVAPIDKeys();
      
      console.log('✅ VAPID keys generated successfully!');
      console.log(`📋 Public Key: ${vapidKeys.publicKey}`);
      console.log(`🔐 Private Key: ${vapidKeys.privateKey.substring(0, 20)}...`);
      
      // Update .env file
      this.updateEnvFile(vapidKeys);
      console.log('📝 Updated .env file with VAPID keys');
      
      console.log('\n🎉 VAPID key setup completed!');
      console.log('💡 Next steps:');
      console.log('1. The public key will be used in your frontend');
      console.log('2. The private key is used by your backend');
      console.log('3. Update VAPID_SUBJECT with your actual email');
      
      return vapidKeys;
      
    } catch (error) {
      console.error('❌ Failed to generate VAPID keys:', error.message);
      throw error;
    }
  }

  // Validate existing VAPID keys
  validateExistingKeys() {
    try {
      const publicKey = process.env.VAPID_PUBLIC_KEY;
      const privateKey = process.env.VAPID_PRIVATE_KEY;
      
      if (!publicKey || !privateKey) {
        return { valid: false, message: 'VAPID keys not found in environment variables' };
      }
      
      // Test if keys are valid
      webpush.setVapidDetails(
        'mailto:test@example.com',
        publicKey,
        privateKey
      );
      
      return { valid: true, message: 'VAPID keys are valid' };
      
    } catch (error) {
      return { valid: false, message: `Invalid VAPID keys: ${error.message}` };
    }
  }
}

// Main execution
async function main() {
  const generator = new VAPIDKeyGenerator();
  
  try {
    // Check if keys already exist
    const validation = generator.validateExistingKeys();
    
    if (validation.valid) {
      console.log('✅ VAPID keys already exist and are valid');
      console.log('💡 If you want to regenerate them, delete the existing keys from .env first');
    } else {
      console.log(`⚠️  ${validation.message}`);
      console.log('🔧 Generating new VAPID keys...\n');
      generator.generateAndSave();
    }
    
  } catch (error) {
    console.error('❌ VAPID key generation failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = VAPIDKeyGenerator;
