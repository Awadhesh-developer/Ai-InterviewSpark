// Simple test script to test user registration API
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testRegistration() {
  const testUser = {
    email: 'test@example.com',
    password: 'testpassword123',
    firstName: 'Test',
    lastName: 'User'
  };

  try {
    console.log('Testing user registration...');

    const response = await fetch('http://localhost:3001/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testUser)
    });

    const data = await response.json();

    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(data, null, 2));

    if (data.success && data.data.token) {
      console.log('\n✅ Registration successful!');
      console.log('User ID:', data.data.user.id);
      console.log('Token received:', data.data.token.substring(0, 20) + '...');

      // Test login with the same credentials
      console.log('\nTesting login...');

      const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: testUser.email,
          password: testUser.password
        })
      });

      const loginData = await loginResponse.json();

      console.log('Login response status:', loginResponse.status);
      console.log('Login response data:', JSON.stringify(loginData, null, 2));

      if (loginData.success) {
        console.log('✅ Login successful!');

        // Test getting current user
        console.log('\nTesting get current user...');

        const meResponse = await fetch('http://localhost:3001/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${loginData.data.token}`
          }
        });

        const meData = await meResponse.json();

        console.log('Me response status:', meResponse.status);
        console.log('Me response data:', JSON.stringify(meData, null, 2));

        if (meData.success) {
          console.log('✅ Get current user successful!');
        } else {
          console.log('❌ Get current user failed:', meData.message);
        }
      } else {
        console.log('❌ Login failed:', loginData.message);
      }
    } else {
      console.log('❌ Registration failed:', data.message);
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

testRegistration();