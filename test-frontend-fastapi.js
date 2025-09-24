/**
 * Frontend FastAPI Integration Test
 * Tests the FastAPI client functions through the frontend components
 */

const BASE_URL = 'http://127.0.0.1:8000';

async function testFrontendFastAPIIntegration() {
  console.log('🚀 Testing Frontend FastAPI Integration...\n');

  // Create a unique test user
  const timestamp = Date.now();
  const testUser = {
    username: `frontend_test_${timestamp}`,
    email: `frontend_test_${timestamp}@example.com`,
    password: 'testpass123'
  };

  try {
    // Test 1: Register a new user via FastAPI
    console.log('📝 Test 1: Register User via FastAPI');
    const registerResponse = await fetch(`${BASE_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testUser)
    });

    if (!registerResponse.ok) {
      const errorText = await registerResponse.text();
      throw new Error(`Register failed: ${registerResponse.status} - ${errorText}`);
    }

    const registerResult = await registerResponse.json();
    console.log('✅ User registered successfully:', registerResult);
    console.log('');

    // Test 2: Login via FastAPI
    console.log('🔐 Test 2: Login via FastAPI');
    const loginResponse = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `username=${testUser.username}&password=${testUser.password}`
    });

    if (!loginResponse.ok) {
      const errorText = await loginResponse.text();
      throw new Error(`Login failed: ${loginResponse.status} - ${errorText}`);
    }

    const loginResult = await loginResponse.json();
    console.log('✅ Login successful, token received');
    console.log('');

    // Test 3: Create a poll via FastAPI
    console.log('📊 Test 3: Create Poll via FastAPI');
    const pollData = {
      question: "What's your favorite frontend framework?",
      options: ["React", "Vue", "Angular", "Svelte"]
    };

    const createPollResponse = await fetch(`${BASE_URL}/polls`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${loginResult.access_token}`
      },
      body: JSON.stringify(pollData)
    });

    if (!createPollResponse.ok) {
      const errorText = await createPollResponse.text();
      throw new Error(`Create poll failed: ${createPollResponse.status} - ${errorText}`);
    }

    const pollResult = await createPollResponse.json();
    console.log('✅ Poll created successfully:', pollResult);
    console.log('');

    console.log('🎉 All FastAPI integration tests passed!');
    console.log(`\n📋 Test Summary:`);
    console.log(`   - User: ${testUser.username}`);
    console.log(`   - Email: ${testUser.email}`);
    console.log(`   - Poll ID: ${pollResult.id}`);
    console.log(`   - Poll Question: ${pollResult.question}`);
    console.log(`\n✨ The FastAPI backend is ready for frontend integration!`);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testFrontendFastAPIIntegration();