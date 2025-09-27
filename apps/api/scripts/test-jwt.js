// --- START api/scripts/test-jwt.js --- //
// JWT Testing Script
// Tests JWT secret generation and token functionality

const crypto = require('crypto');
require('dotenv').config();

// Test JWT secret generation
function testJWTSecrets() {
  console.log('🔐 Testing JWT Secret Generation...\n');
  
  const secrets = {
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
    JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
    JWT_VERIFICATION_SECRET: process.env.JWT_VERIFICATION_SECRET,
    JWT_RESET_SECRET: process.env.JWT_RESET_SECRET,
    JWT_SESSION_SECRET: process.env.JWT_SESSION_SECRET,
    JWT_API_SECRET: process.env.JWT_API_SECRET,
    JWT_WEBSOCKET_SECRET: process.env.JWT_WEBSOCKET_SECRET,
  };
  
  let allValid = true;
  
  Object.entries(secrets).forEach(([key, value]) => {
    if (!value) {
      console.log(`❌ ${key}: Not set`);
      allValid = false;
    } else if (value.length < 32) {
      console.log(`❌ ${key}: Too short (${value.length} chars, need 32+)`);
      allValid = false;
    } else {
      console.log(`✅ ${key}: Valid (${value.length} chars)`);
    }
  });
  
  if (allValid) {
    console.log('\n🎉 All JWT secrets are valid!');
  } else {
    console.log('\n⚠️  Some JWT secrets are invalid. Run: npm run jwt:generate');
  }
  
  return allValid;
}

// Test JWT token generation (simplified)
function testJWTGeneration() {
  console.log('\n🔑 Testing JWT Token Generation...\n');
  
  try {
    const jwt = require('jsonwebtoken');
    
    // Test payload
    const payload = {
      userId: 'test123',
      email: 'test@example.com',
      role: 'job_seeker',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (15 * 60) // 15 minutes
    };
    
    // Test access token generation
    const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
      algorithm: 'HS256',
      issuer: 'ai-interviewspark',
      audience: 'ai-interviewspark-users'
    });
    
    console.log('✅ Access token generated successfully');
    console.log(`   Token: ${accessToken.substring(0, 50)}...`);
    
    // Test token verification
    const decoded = jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET, {
      algorithms: ['HS256'],
      issuer: 'ai-interviewspark',
      audience: 'ai-interviewspark-users'
    });
    
    console.log('✅ Access token verified successfully');
    console.log(`   User ID: ${decoded.userId}`);
    console.log(`   Email: ${decoded.email}`);
    console.log(`   Role: ${decoded.role}`);
    
    // Test refresh token
    const refreshPayload = {
      userId: 'test123',
      tokenVersion: 1,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
    };
    
    const refreshToken = jwt.sign(refreshPayload, process.env.JWT_REFRESH_SECRET, {
      algorithm: 'HS256',
      issuer: 'ai-interviewspark',
      audience: 'ai-interviewspark-users'
    });
    
    console.log('✅ Refresh token generated successfully');
    console.log(`   Token: ${refreshToken.substring(0, 50)}...`);
    
    // Test token expiration
    const isExpired = decoded.exp < Math.floor(Date.now() / 1000);
    console.log(`✅ Token expiration check: ${isExpired ? 'Expired' : 'Valid'}`);
    
    return true;
    
  } catch (error) {
    console.error('❌ JWT generation/verification failed:', error.message);
    return false;
  }
}

// Test JWT service integration
function testJWTService() {
  console.log('\n🔧 Testing JWT Service Integration...\n');
  
  try {
    // Try to require the JWT service
    const JWTService = require('../src/services/jwtService');
    
    console.log('✅ JWT Service loaded successfully');
    
    // Test token generation
    const payload = {
      userId: 'test123',
      email: 'test@example.com',
      role: 'job_seeker'
    };
    
    const accessToken = JWTService.generateAccessToken(payload);
    console.log('✅ JWT Service access token generation works');
    
    const refreshToken = JWTService.generateRefreshToken({
      userId: 'test123',
      tokenVersion: 1
    });
    console.log('✅ JWT Service refresh token generation works');
    
    // Test token verification
    const verifiedPayload = JWTService.verifyAccessToken(accessToken);
    console.log('✅ JWT Service token verification works');
    console.log(`   Verified User ID: ${verifiedPayload.userId}`);
    
    // Test token pair generation
    const tokenPair = JWTService.generateTokenPair(payload);
    console.log('✅ JWT Service token pair generation works');
    console.log(`   Access token length: ${tokenPair.accessToken.length}`);
    console.log(`   Refresh token length: ${tokenPair.refreshToken.length}`);
    console.log(`   Expires in: ${tokenPair.expiresIn} seconds`);
    
    return true;
    
  } catch (error) {
    console.error('❌ JWT Service integration failed:', error.message);
    return false;
  }
}

// Test JWT configuration
function testJWTConfig() {
  console.log('\n⚙️  Testing JWT Configuration...\n');
  
  try {
    const { config } = require('../src/config');
    
    console.log('✅ JWT Configuration loaded successfully');
    console.log(`   Main secret length: ${config.jwt.secret?.length || 0}`);
    console.log(`   Refresh secret length: ${config.jwt.refreshSecret?.length || 0}`);
    console.log(`   Access secret length: ${config.jwt.accessSecret?.length || 0}`);
    console.log(`   Verification secret length: ${config.jwt.verificationSecret?.length || 0}`);
    console.log(`   Reset secret length: ${config.jwt.resetSecret?.length || 0}`);
    console.log(`   Session secret length: ${config.jwt.sessionSecret?.length || 0}`);
    console.log(`   API secret length: ${config.jwt.apiSecret?.length || 0}`);
    console.log(`   WebSocket secret length: ${config.jwt.websocketSecret?.length || 0}`);
    console.log(`   Default expiration: ${config.jwt.expiresIn}`);
    
    // Validate configuration
    const isValid = JWTService.validateConfiguration();
    console.log(`   Configuration valid: ${isValid ? 'Yes' : 'No'}`);
    
    return true;
    
  } catch (error) {
    console.error('❌ JWT Configuration test failed:', error.message);
    return false;
  }
}

// Main test function
async function runTests() {
  console.log('🚀 Starting JWT Tests for AI-InterviewSpark...\n');
  
  const results = {
    secrets: testJWTSecrets(),
    generation: testJWTGeneration(),
    service: testJWTService(),
    config: testJWTConfig()
  };
  
  console.log('\n📊 Test Results Summary');
  console.log('='.repeat(50));
  console.log(`JWT Secrets: ${results.secrets ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`JWT Generation: ${results.generation ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`JWT Service: ${results.service ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`JWT Config: ${results.config ? '✅ PASS' : '❌ FAIL'}`);
  
  const allPassed = Object.values(results).every(result => result);
  
  if (allPassed) {
    console.log('\n🎉 All JWT tests passed! JWT setup is working correctly.');
  } else {
    console.log('\n⚠️  Some JWT tests failed. Please check the output above.');
    console.log('\n💡 Troubleshooting:');
    console.log('1. Run: npm run jwt:generate');
    console.log('2. Check your .env file');
    console.log('3. Restart the application');
  }
  
  return allPassed;
}

// Run tests if called directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests, testJWTSecrets, testJWTGeneration, testJWTService, testJWTConfig };
