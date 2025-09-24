/**
 * Test script for FastAPI client functions
 * This script tests all four required client functions:
 * 1. register - Register a new user
 * 2. getPolls - Fetch all polls
 * 3. vote - Cast a vote on a poll
 * 4. getPollResults - Get poll results
 */

import { fastAPIClient } from './lib/fastapi-client.ts';

async function testFastAPIClient() {
  console.log('🚀 Starting FastAPI Client Tests...\n');

  try {
    // Test 1: Register a new user
    console.log('📝 Test 1: Register User');
    const testUser = {
      username: `testuser_${Date.now()}`,
      email: `test_${Date.now()}@example.com`,
      password: 'testpassword123'
    };

    const registerResult = await fastAPIClient.register(testUser);
    console.log('✅ Register successful:', registerResult);
    console.log('🔑 Auth token set:', !!fastAPIClient.getToken());
    console.log('');

    // Test 2: Create a test poll (needed for voting tests)
    console.log('📊 Test 2: Create Poll');
    const testPoll = {
      title: `Test Poll ${Date.now()}`,
      description: 'This is a test poll created by the FastAPI client test',
      options: ['Option A', 'Option B', 'Option C'],
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours from now
    };

    const createdPoll = await fastAPIClient.createPoll(testPoll);
    console.log('✅ Poll created:', createdPoll);
    console.log('');

    // Test 3: Get all polls
    console.log('📋 Test 3: Get Polls');
    const polls = await fastAPIClient.getPolls();
    console.log('✅ Polls fetched:', polls.length, 'polls found');
    console.log('First poll:', polls[0]);
    console.log('');

    // Test 4: Cast a vote
    console.log('🗳️ Test 4: Cast Vote');
    if (createdPoll && createdPoll.options && createdPoll.options.length > 0) {
      const voteData = {
        option_id: createdPoll.options[0].id
      };
      
      const voteResult = await fastAPIClient.vote(createdPoll.id, voteData);
      console.log('✅ Vote cast successfully:', voteResult);
      console.log('');

      // Test 5: Get poll results
      console.log('📊 Test 5: Get Poll Results');
      const results = await fastAPIClient.getPollResults(createdPoll.id);
      console.log('✅ Poll results:', results);
      console.log('');
    } else {
      console.log('❌ Cannot test voting - no poll options available');
    }

    console.log('🎉 All FastAPI client tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the tests
testFastAPIClient();