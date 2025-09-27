// OAuth Configuration Checker
// Run this script to diagnose OAuth setup issues

require('dotenv').config();

console.log('🔍 OAuth Configuration Checker\n');

// Check environment variables
const requiredVars = [
  'OAUTH_GOOGLE_CLIENT_ID',
  'OAUTH_GOOGLE_CLIENT_SECRET',
  'OAUTH_FACEBOOK_APP_ID', 
  'OAUTH_FACEBOOK_APP_SECRET',
  'OAUTH_LINKEDIN_CLIENT_ID',
  'OAUTH_LINKEDIN_CLIENT_SECRET',
  'OAUTH_REDIRECT_BASE_URL',
  'OAUTH_SUCCESS_REDIRECT_URL',
  'OAUTH_FAILURE_REDIRECT_URL'
];

console.log('📋 Environment Variables Check:');
let hasPlaceholders = false;
let missingVars = false;

requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (!value) {
    console.log(`❌ ${varName}: NOT SET`);
    missingVars = true;
  } else if (value.includes('your-') || value.includes('-here')) {
    console.log(`⚠️  ${varName}: PLACEHOLDER VALUE (${value})`);
    hasPlaceholders = true;
  } else {
    console.log(`✅ ${varName}: CONFIGURED`);
  }
});

console.log('\n🔧 OAuth Provider Status:');

// Google OAuth
const googleClientId = process.env.OAUTH_GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.OAUTH_GOOGLE_CLIENT_SECRET;
const googleEnabled = !!(googleClientId && googleClientSecret && !googleClientId.includes('your-'));

console.log(`Google OAuth: ${googleEnabled ? '✅ READY' : '❌ NOT CONFIGURED'}`);
if (!googleEnabled) {
  if (!googleClientId || googleClientId.includes('your-')) {
    console.log('  - Need to set OAUTH_GOOGLE_CLIENT_ID');
  }
  if (!googleClientSecret || googleClientSecret.includes('your-')) {
    console.log('  - Need to set OAUTH_GOOGLE_CLIENT_SECRET');
  }
}

// Facebook OAuth
const facebookAppId = process.env.OAUTH_FACEBOOK_APP_ID;
const facebookAppSecret = process.env.OAUTH_FACEBOOK_APP_SECRET;
const facebookEnabled = !!(facebookAppId && facebookAppSecret && !facebookAppId.includes('your-'));

console.log(`Facebook OAuth: ${facebookEnabled ? '✅ READY' : '❌ NOT CONFIGURED'}`);
if (!facebookEnabled) {
  if (!facebookAppId || facebookAppId.includes('your-')) {
    console.log('  - Need to set OAUTH_FACEBOOK_APP_ID');
  }
  if (!facebookAppSecret || facebookAppSecret.includes('your-')) {
    console.log('  - Need to set OAUTH_FACEBOOK_APP_SECRET');
  }
}

// LinkedIn OAuth
const linkedinClientId = process.env.OAUTH_LINKEDIN_CLIENT_ID;
const linkedinClientSecret = process.env.OAUTH_LINKEDIN_CLIENT_SECRET;
const linkedinEnabled = !!(linkedinClientId && linkedinClientSecret && !linkedinClientId.includes('your-'));

console.log(`LinkedIn OAuth: ${linkedinEnabled ? '✅ READY' : '❌ NOT CONFIGURED'}`);
if (!linkedinEnabled) {
  if (!linkedinClientId || linkedinClientId.includes('your-')) {
    console.log('  - Need to set OAUTH_LINKEDIN_CLIENT_ID');
  }
  if (!linkedinClientSecret || linkedinClientSecret.includes('your-')) {
    console.log('  - Need to set OAUTH_LINKEDIN_CLIENT_SECRET');
  }
}

console.log('\n🌐 Redirect URLs:');
console.log(`Base URL: ${process.env.OAUTH_REDIRECT_BASE_URL || 'NOT SET'}`);
console.log(`Success URL: ${process.env.OAUTH_SUCCESS_REDIRECT_URL || 'NOT SET'}`);
console.log(`Failure URL: ${process.env.OAUTH_FAILURE_REDIRECT_URL || 'NOT SET'}`);

console.log('\n📝 Summary:');
if (hasPlaceholders) {
  console.log('❌ ISSUE: Placeholder values detected in OAuth configuration');
  console.log('   This will cause 400 errors from OAuth providers');
  console.log('   Please replace placeholder values with real OAuth credentials');
}

if (missingVars) {
  console.log('❌ ISSUE: Missing required environment variables');
  console.log('   Please set all required OAuth environment variables');
}

if (!hasPlaceholders && !missingVars) {
  console.log('✅ OAuth configuration looks good!');
} else {
  console.log('\n🔧 Next Steps:');
  console.log('1. Set up OAuth applications with providers (Google, Facebook, LinkedIn)');
  console.log('2. Replace placeholder values in apps/api/.env file');
  console.log('3. Restart the API server');
  console.log('4. Test OAuth endpoints');
  console.log('\nSee OAUTH_SETUP_GUIDE.md for detailed instructions');
}

console.log('\n🧪 Test OAuth Endpoints:');
console.log('curl -X GET "http://localhost:3001/api/oauth/auth/google"');
console.log('curl -X GET "http://localhost:3001/api/oauth/auth/facebook"');
console.log('curl -X GET "http://localhost:3001/api/oauth/auth/linkedin"');
