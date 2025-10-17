// Test script for Adaptive Client functionality
// This script tests the adaptive client with both FastAPI and Supabase backends

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const BASE_URL_FASTAPI = 'http://127.0.0.1:8000';
const BASE_URL_SUPABASE = process.env.NEXT_PUBLIC_SUPABASE_URL;

// Simple fetch wrapper for testing
async function testRequest(endpoint, options = {}, baseUrl = BASE_URL_FASTAPI) {
  const url = `${baseUrl}${endpoint}`;
  
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
      error: response.ok ? null : data.detail || data.message || `HTTP ${response.status}`,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

// Test FastAPI backend health
async function testFastAPIHealth() {
  console.log('\n🔍 Testing FastAPI Backend Health...');
  
  // Try the docs endpoint first, then health if it exists
  let result = await testRequest('/docs');
  
  if (!result.success) {
    // Try a different endpoint that might exist
    result = await testRequest('/');
  }
  
  console.log('FastAPI Health Result:', result);
  return result.success;
}

// Test FastAPI authentication
async function testFastAPIAuth() {
  console.log('\n🔐 Testing FastAPI Authentication...');
  
  // Test registration
  const testUser = {
    username: `testuser_${Date.now()}`,
    password: 'testpassword123'
  };

  const registerResult = await testRequest('/register', {
    method: 'POST',
    body: JSON.stringify(testUser),
  });

  console.log('FastAPI Register Result:', registerResult);
  
  // Test login (if registration succeeded or user already exists)
  const loginResult = await testRequest('/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `username=${testUser.username}&password=${testUser.password}`,
  });

  console.log('FastAPI Login Result:', loginResult);
  
  return {
    register: registerResult.success,
    login: loginResult.success,
    token: loginResult.data?.access_token,
  };
}

// Test FastAPI polls
async function testFastAPIPolls(token = null) {
  console.log('\n📊 Testing FastAPI Polls...');
  
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  
  // Test get polls
  const pollsResult = await testRequest('/polls?skip=0&limit=10', {
    headers,
  });

  console.log('FastAPI Polls Result:', pollsResult);
  
  // Test get poll results (if polls exist)
  if (pollsResult.success && pollsResult.data && pollsResult.data.length > 0) {
    const firstPoll = pollsResult.data[0];
    const resultsResult = await testRequest(`/polls/${firstPoll.id}/results`, {
      headers,
    });
    
    console.log('FastAPI Poll Results:', resultsResult);
    
    return {
      getPolls: pollsResult.success,
      getPollResults: resultsResult.success,
    };
  }
  
  return {
    getPolls: pollsResult.success,
    getPollResults: false,
  };
}

// Test Supabase health (basic connection test)
async function testSupabaseHealth() {
  console.log('\n🔍 Testing Supabase Backend Health...');
  
  if (!BASE_URL_SUPABASE) {
    console.log('Supabase URL not configured');
    return false;
  }
  
  try {
    const response = await fetch(`${BASE_URL_SUPABASE}/rest/v1/`, {
      headers: {
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      },
    });
    
    const result = response.ok;
    console.log('Supabase Health Result:', result ? 'Connected' : 'Failed');
    return result;
  } catch (error) {
    console.log('Supabase Health Error:', error.message);
    return false;
  }
}

// Test environment configuration
async function testEnvironmentConfig() {
  console.log('\n⚙️ Testing Environment Configuration...');
  
  const config = {
    NEXT_PUBLIC_BACKEND_TYPE: process.env.NEXT_PUBLIC_BACKEND_TYPE,
    NEXT_PUBLIC_FASTAPI_URL: process.env.NEXT_PUBLIC_FASTAPI_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '[SET]' : '[NOT SET]',
  };
  
  console.log('Environment Configuration:', config);
  
  return config;
}

// Run comprehensive tests
async function runAdaptiveClientTests() {
  console.log('🚀 Starting Adaptive Client Tests...');
  console.log('='.repeat(50));
  
  try {
    // Test environment configuration
    const envConfig = await testEnvironmentConfig();
    
    // Test backend health
    const fastAPIHealthy = await testFastAPIHealth();
    const supabaseHealthy = await testSupabaseHealth();
    
    console.log('\n📋 Backend Health Summary:');
    console.log(`FastAPI: ${fastAPIHealthy ? '✅ Healthy' : '❌ Unavailable'}`);
    console.log(`Supabase: ${supabaseHealthy ? '✅ Healthy' : '❌ Unavailable'}`);
    
    // Test FastAPI functionality if available
    let fastAPIResults = null;
    if (fastAPIHealthy) {
      const authResults = await testFastAPIAuth();
      const pollsResults = await testFastAPIPolls(authResults.token);
      
      fastAPIResults = {
        auth: authResults,
        polls: pollsResults,
      };
    }
    
    // Summary
    console.log('\n📊 Test Results Summary:');
    console.log('='.repeat(30));
    console.log(`Backend Type: ${envConfig.NEXT_PUBLIC_BACKEND_TYPE}`);
    console.log(`FastAPI Available: ${fastAPIHealthy ? '✅' : '❌'}`);
    console.log(`Supabase Available: ${supabaseHealthy ? '✅' : '❌'}`);
    
    if (fastAPIResults) {
      console.log('\nFastAPI Tests:');
      console.log(`  Registration: ${fastAPIResults.auth.register ? '✅' : '❌'}`);
      console.log(`  Login: ${fastAPIResults.auth.login ? '✅' : '❌'}`);
      console.log(`  Get Polls: ${fastAPIResults.polls.getPolls ? '✅' : '❌'}`);
      console.log(`  Poll Results: ${fastAPIResults.polls.getPollResults ? '✅' : '❌'}`);
    }
    
    // Recommendations
    console.log('\n💡 Recommendations:');
    if (envConfig.NEXT_PUBLIC_BACKEND_TYPE === 'fastapi' && !fastAPIHealthy) {
      console.log('⚠️  Backend is set to FastAPI but FastAPI server is not available');
      console.log('   Consider starting the FastAPI server or switching to Supabase');
    }
    
    if (envConfig.NEXT_PUBLIC_BACKEND_TYPE === 'supabase' && !supabaseHealthy) {
      console.log('⚠️  Backend is set to Supabase but Supabase is not properly configured');
      console.log('   Check your Supabase environment variables');
    }
    
    if (fastAPIHealthy && supabaseHealthy) {
      console.log('✅ Both backends are available - adaptive client ready!');
    }
    
  } catch (error) {
    console.error('❌ Test execution failed:', error);
  }
}

// Run the tests
runAdaptiveClientTests();