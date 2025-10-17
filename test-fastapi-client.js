// Test script for FastAPI client functions
const BASE_URL = 'http://127.0.0.1:8000';

// Simple fetch wrapper for testing
async function testRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();
    
    return {
      success: response.ok,
      status: response.status,
      data: response.ok ? data : null,
      error: response.ok ? null : data.detail || `HTTP ${response.status}`,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

// Test functions
async function testRegisterUser() {
  console.log('\n🔐 Testing User Registration...');
  
  const testUser = {
    username: `testuser_${Date.now()}`,
    password: 'testpassword123'
  };

  const result = await testRequest('/register', {
    method: 'POST',
    body: JSON.stringify(testUser),
  });

  console.log('Register Result:', result);
  return result;
}

async function testFetchPolls() {
  console.log('\n📊 Testing Fetch Polls...');
  
  const result = await testRequest('/polls?skip=0&limit=10');
  
  console.log('Fetch Polls Result:', result);
  return result;
}

async function testCastVote(pollId = 1, optionId = 1) {
  console.log('\n🗳️ Testing Cast Vote...');
  
  const result = await testRequest(`/polls/${pollId}/vote`, {
    method: 'POST',
    body: JSON.stringify({ option_id: optionId }),
  });

  console.log('Cast Vote Result:', result);
  return result;
}

async function testGetPollResults(pollId = 1) {
  console.log('\n📈 Testing Get Poll Results...');
  
  const result = await testRequest(`/polls/${pollId}/results`);
  
  console.log('Poll Results:', result);
  return result;
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting FastAPI Client Tests...');
  console.log('Backend URL:', BASE_URL);
  
  try {
    // Test 1: Register User
    const registerResult = await testRegisterUser();
    
    // Test 2: Fetch Polls
    const pollsResult = await testFetchPolls();
    
    // Test 3: Cast Vote (only if polls exist)
    let voteResult = null;
    if (pollsResult.success && pollsResult.data && pollsResult.data.length > 0) {
      const firstPoll = pollsResult.data[0];
      if (firstPoll.options && firstPoll.options.length > 0) {
        voteResult = await testCastVote(firstPoll.id, firstPoll.options[0].id);
      }
    } else {
      console.log('\n🗳️ Skipping Cast Vote - No polls available');
    }
    
    // Test 4: Get Poll Results (only if polls exist)
    let resultsResult = null;
    if (pollsResult.success && pollsResult.data && pollsResult.data.length > 0) {
      resultsResult = await testGetPollResults(pollsResult.data[0].id);
    } else {
      console.log('\n📈 Skipping Poll Results - No polls available');
    }

    // Summary
    console.log('\n📋 Test Summary:');
    console.log('✅ Register User:', registerResult.success ? 'PASS' : 'FAIL');
    console.log('✅ Fetch Polls:', pollsResult.success ? 'PASS' : 'FAIL');
    console.log('✅ Cast Vote:', voteResult ? (voteResult.success ? 'PASS' : 'FAIL') : 'SKIPPED');
    console.log('✅ Poll Results:', resultsResult ? (resultsResult.success ? 'PASS' : 'FAIL') : 'SKIPPED');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run tests if this file is executed directly
if (typeof window === 'undefined') {
  runAllTests();
}