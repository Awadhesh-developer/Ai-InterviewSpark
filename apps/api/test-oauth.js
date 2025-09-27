// Comprehensive OAuth testing script
const axios = require('axios');

const API_BASE = 'http://localhost:3001';

async function testOAuth() {
  console.log('🧪 Testing OAuth Implementation After URL Validation Fix...\n');

  try {
    // Test 1: OAuth initiation endpoints
    console.log('1. Testing OAuth initiation endpoints...');
    
    const providers = ['google', 'facebook', 'linkedin'];
    for (const provider of providers) {
      try {
        const response = await axios.get(`${API_BASE}/api/oauth/auth/${provider}`);
        console.log(`✅ ${provider} OAuth initiation: ${response.status}`);
        console.log(`   Authorization URL generated: ${response.data.data.authorizationUrl.length > 0 ? 'Yes' : 'No'}`);
      } catch (error) {
        console.log(`❌ ${provider} OAuth initiation failed: ${error.response?.status || error.message}`);
      }
    }

    // Test 2: Invalid provider
    console.log('\n2. Testing invalid provider...');
    try {
      await axios.get(`${API_BASE}/api/oauth/auth/invalid`);
      console.log('❌ Should have rejected invalid provider');
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Invalid provider correctly rejected');
      } else {
        console.log(`❌ Unexpected error: ${error.response?.status || error.message}`);
      }
    }

    // Test 3: OAuth providers endpoint (without auth)
    console.log('\n3. Testing OAuth providers endpoint without authentication...');
    try {
      await axios.get(`${API_BASE}/api/oauth/providers`);
      console.log('❌ Should have required authentication');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Authentication correctly required');
      } else {
        console.log(`❌ Unexpected error: ${error.response?.status || error.message}`);
      }
    }

    // Test 4: Login to get token
    console.log('\n4. Testing login to get authentication token...');
    let authToken = null;
    try {
      const loginResponse = await axios.post(`${API_BASE}/api/auth/login`, {
        email: 'demo@example.com',
        password: 'password123'
      });
      
      if (loginResponse.data.success) {
        authToken = loginResponse.data.data.token;
        console.log('✅ Login successful, token obtained');
      } else {
        console.log('❌ Login failed');
      }
    } catch (error) {
      console.log(`❌ Login error: ${error.response?.data?.error || error.message}`);
    }

    // Test 5: OAuth providers endpoint (with auth)
    if (authToken) {
      console.log('\n5. Testing OAuth providers endpoint with authentication...');
      try {
        const response = await axios.get(`${API_BASE}/api/oauth/providers`, {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
        
        if (response.data.success) {
          console.log('✅ OAuth providers endpoint accessible');
          console.log(`   Providers found: ${response.data.data.providers.length}`);
        } else {
          console.log('❌ OAuth providers endpoint failed');
        }
      } catch (error) {
        console.log(`❌ OAuth providers error: ${error.response?.data?.error || error.message}`);
      }

      // Test 6: OAuth linking endpoints
      console.log('\n6. Testing OAuth linking endpoints...');
      for (const provider of providers) {
        try {
          const response = await axios.post(`${API_BASE}/api/oauth/link/${provider}`, {}, {
            headers: {
              'Authorization': `Bearer ${authToken}`
            }
          });
          
          if (response.data.success) {
            console.log(`✅ ${provider} OAuth linking endpoint accessible`);
          } else {
            console.log(`❌ ${provider} OAuth linking failed`);
          }
        } catch (error) {
          console.log(`❌ ${provider} OAuth linking error: ${error.response?.data?.error || error.message}`);
        }
      }

      // Test 7: OAuth unlinking endpoints
      console.log('\n7. Testing OAuth unlinking endpoints...');
      for (const provider of providers) {
        try {
          await axios.delete(`${API_BASE}/api/oauth/unlink/${provider}`, {
            headers: {
              'Authorization': `Bearer ${authToken}`
            }
          });
          console.log(`❌ ${provider} OAuth unlinking should have failed (no linked account)`);
        } catch (error) {
          if (error.response?.status === 404) {
            console.log(`✅ ${provider} OAuth unlinking correctly failed (no linked account)`);
          } else {
            console.log(`❌ ${provider} OAuth unlinking unexpected error: ${error.response?.data?.error || error.message}`);
          }
        }
      }
    }

    // Test 8: Rate limiting
    console.log('\n8. Testing rate limiting...');
    let rateLimitHit = false;
    for (let i = 0; i < 12; i++) {
      try {
        await axios.get(`${API_BASE}/api/oauth/auth/google`);
      } catch (error) {
        if (error.response?.status === 429) {
          console.log(`✅ Rate limit hit after ${i + 1} requests`);
          rateLimitHit = true;
          break;
        }
      }
    }
    
    if (!rateLimitHit) {
      console.log('⚠️  Rate limit not hit (may need more requests or different window)');
    }

    // Test 9: Security headers
    console.log('\n9. Testing security headers...');
    try {
      const response = await axios.get(`${API_BASE}/api/oauth/auth/google`);
      const headers = response.headers;
      
      const securityHeaders = [
        'x-content-type-options',
        'x-frame-options',
        'x-xss-protection',
        'referrer-policy',
        'cache-control'
      ];
      
      let headersPresent = 0;
      securityHeaders.forEach(header => {
        if (headers[header]) {
          headersPresent++;
        }
      });
      
      console.log(`✅ Security headers present: ${headersPresent}/${securityHeaders.length}`);
      
      if (headers['cache-control'] && headers['cache-control'].includes('no-store')) {
        console.log('✅ OAuth-specific cache control headers set');
      }
    } catch (error) {
      console.log(`❌ Security headers test failed: ${error.message}`);
    }

    console.log('\n🎉 OAuth testing completed!');
    
  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
  }
}

// Run tests
testOAuth().catch(console.error);
