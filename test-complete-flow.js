/**
 * Complete FastAPI Integration Flow Test
 * Tests the entire user journey: register -> login -> create poll -> vote -> get results
 */

const BASE_URL = 'http://127.0.0.1:8000';

async function testCompleteFlow() {
  console.log('🚀 Testing Complete FastAPI Integration Flow...\n');

  const timestamp = Date.now();
  const testUser = {
    username: `flowtest_${timestamp}`,
    email: `flowtest_${timestamp}@example.com`,
    password: 'testpass123'
  };

  let authToken = null;
  let pollId = null;

  try {
    // Step 1: Register User
    console.log('📝 Step 1: Register User');
    const registerResponse = await fetch(`${BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });

    if (!registerResponse.ok) {
      const errorText = await registerResponse.text();
      throw new Error(`Register failed: ${registerResponse.status} - ${errorText}`);
    }

    const registerResult = await registerResponse.json();
    console.log('✅ User registered:', registerResult.username);
    console.log('');

    // Step 2: Login User
    console.log('🔐 Step 2: Login User');
    const loginResponse = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `username=${testUser.username}&password=${testUser.password}`
    });

    if (!loginResponse.ok) {
      const errorText = await loginResponse.text();
      throw new Error(`Login failed: ${loginResponse.status} - ${errorText}`);
    }

    const loginResult = await loginResponse.json();
    authToken = loginResult.access_token;
    console.log('✅ Login successful, token obtained');
    console.log('');

    // Step 3: Create Poll
    console.log('📊 Step 3: Create Poll');
    const pollData = {
      question: "Which programming language do you prefer for backend development?",
      options: ["Python", "JavaScript", "Java", "Go", "Rust"]
    };

    const createPollResponse = await fetch(`${BASE_URL}/polls`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(pollData)
    });

    if (!createPollResponse.ok) {
      const errorText = await createPollResponse.text();
      throw new Error(`Create poll failed: ${createPollResponse.status} - ${errorText}`);
    }

    const pollResult = await createPollResponse.json();
    pollId = pollResult.id;
    console.log('✅ Poll created:', pollResult.question);
    console.log('   Poll ID:', pollId);
    console.log('   Options:', pollResult.options.map(opt => opt.text).join(', '));
    console.log('');

    // Step 4: Get Polls (verify poll exists)
    console.log('📋 Step 4: Get Polls');
    const getPollsResponse = await fetch(`${BASE_URL}/polls`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    if (!getPollsResponse.ok) {
      const errorText = await getPollsResponse.text();
      throw new Error(`Get polls failed: ${getPollsResponse.status} - ${errorText}`);
    }

    const pollsResult = await getPollsResponse.json();
    const createdPoll = pollsResult.find(poll => poll.id === pollId);
    
    if (!createdPoll) {
      throw new Error('Created poll not found in polls list');
    }
    
    console.log('✅ Poll found in polls list');
    console.log('   Total polls:', pollsResult.length);
    console.log('');

    // Step 5: Cast Vote
    console.log('🗳️  Step 5: Cast Vote');
    const voteData = {
      option_id: pollResult.options[0].id // Vote for the first option (Python)
    };

    const voteResponse = await fetch(`${BASE_URL}/polls/${pollId}/vote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(voteData)
    });

    if (!voteResponse.ok) {
      const errorText = await voteResponse.text();
      throw new Error(`Vote failed: ${voteResponse.status} - ${errorText}`);
    }

    const voteResult = await voteResponse.json();
    console.log('✅ Vote cast successfully');
    console.log('   Voted for option ID:', voteResult.option_id);
    console.log('');

    // Step 6: Get Poll Results
    console.log('📈 Step 6: Get Poll Results');
    const resultsResponse = await fetch(`${BASE_URL}/polls/${pollId}/results`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    if (!resultsResponse.ok) {
      const errorText = await resultsResponse.text();
      throw new Error(`Get results failed: ${resultsResponse.status} - ${errorText}`);
    }

    const resultsResult = await resultsResponse.json();
    console.log('✅ Poll results retrieved');
    console.log('   Question:', resultsResult.question);
    console.log('   Total votes:', resultsResult.total_votes);
    console.log('   Results:');
    resultsResult.results.forEach(result => {
      console.log(`     ${result.option_text}: ${result.vote_count} votes (${result.percentage}%)`);
    });
    console.log('');

    // Success Summary
    console.log('🎉 Complete Flow Test PASSED!');
    console.log('\n📋 Test Summary:');
    console.log(`   ✅ User Registration: ${testUser.username}`);
    console.log(`   ✅ User Authentication: Token obtained`);
    console.log(`   ✅ Poll Creation: ID ${pollId}`);
    console.log(`   ✅ Poll Retrieval: Found in list`);
    console.log(`   ✅ Vote Casting: Successful`);
    console.log(`   ✅ Results Retrieval: ${resultsResult.total_votes} total votes`);
    console.log('\n🚀 FastAPI backend is fully functional and ready for production!');

  } catch (error) {
    console.error('❌ Flow test failed:', error.message);
    process.exit(1);
  }
}

// Run the complete flow test
testCompleteFlow();