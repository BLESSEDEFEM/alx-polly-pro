/**
 * Simple FastAPI Client Test using Node.js fetch
 * Tests the four required client functions directly with HTTP requests
 */

const BASE_URL = 'http://127.0.0.1:8000';

async function testFastAPIEndpoints() {
  console.log('🚀 Starting FastAPI Endpoint Tests...\n');

  let authToken = null;
  let createdPollId = null;

  try {
    // Test 1: Register a new user
    console.log('📝 Test 1: Register User');
    const testUser = {
      username: `testuser_${Date.now()}`,
      email: `test_${Date.now()}@example.com`,
      password: 'testpassword123'
    };

    const registerResponse = await fetch(`${BASE_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testUser)
    });

    if (!registerResponse.ok) {
      throw new Error(`Register failed: ${registerResponse.status} ${registerResponse.statusText}`);
    }

    const registerResult = await registerResponse.json();
    console.log('✅ Register successful:', registerResult);
    console.log('');

    // Test 1b: Login to get auth token
    console.log('🔐 Test 1b: Login User');
    const loginResponse = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `username=${testUser.username}&password=${testUser.password}`
    });

    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status} ${loginResponse.statusText}`);
    }

    const loginResult = await loginResponse.json();
    authToken = loginResult.access_token;
    console.log('✅ Login successful, token received:', !!authToken);
    console.log('');

    // Test 2: Create a test poll (needed for voting tests)
    console.log('📊 Test 2: Create Poll');
    const testPoll = {
      question: `Test Poll ${Date.now()}`,
      options: ['Option A', 'Option B', 'Option C']
    };

    const createPollResponse = await fetch(`${BASE_URL}/polls`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(testPoll)
    });

    if (!createPollResponse.ok) {
      throw new Error(`Create poll failed: ${createPollResponse.status} ${createPollResponse.statusText}`);
    }

    const createdPoll = await createPollResponse.json();
    createdPollId = createdPoll.id;
    console.log('✅ Poll created:', createdPoll);
    console.log('');

    // Test 3: Get all polls
    console.log('📋 Test 3: Get Polls');
    const getPollsResponse = await fetch(`${BASE_URL}/polls`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (!getPollsResponse.ok) {
      throw new Error(`Get polls failed: ${getPollsResponse.status} ${getPollsResponse.statusText}`);
    }

    const polls = await getPollsResponse.json();
    console.log('✅ Polls fetched:', polls.length, 'polls found');
    if (polls.length > 0) {
      console.log('First poll:', polls[0]);
    }
    console.log('');

    // Test 4: Cast a vote
    console.log('🗳️ Test 4: Cast Vote');
    if (createdPoll && createdPoll.options && createdPoll.options.length > 0) {
      const voteData = {
        option_id: createdPoll.options[0].id
      };
      
      const voteResponse = await fetch(`${BASE_URL}/polls/${createdPollId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(voteData)
      });

      if (!voteResponse.ok) {
        throw new Error(`Vote failed: ${voteResponse.status} ${voteResponse.statusText}`);
      }

      const voteResult = await voteResponse.json();
      console.log('✅ Vote cast successfully:', voteResult);
      console.log('');

      // Test 5: Get poll results
      console.log('📊 Test 5: Get Poll Results');
      const resultsResponse = await fetch(`${BASE_URL}/polls/${createdPollId}/results`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (!resultsResponse.ok) {
        throw new Error(`Get results failed: ${resultsResponse.status} ${resultsResponse.statusText}`);
      }

      const results = await resultsResponse.json();
      console.log('✅ Poll results:', results);
      console.log('');
    } else {
      console.log('❌ Cannot test voting - no poll options available');
    }

    console.log('🎉 All FastAPI endpoint tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    // Try to get more details from the response
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', await error.response.text());
    }
  }
}

// Run the tests
testFastAPIEndpoints();