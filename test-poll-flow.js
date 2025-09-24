// Test script to verify poll creation flow
// Run this with: node test-poll-flow.js

const testPollCreation = async () => {
  console.log('🧪 Testing Poll Creation Flow...\n');
  
  // Test 1: Check environment variables
  console.log('1. Environment Variables:');
  console.log('   SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing');
  console.log('   SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing');
  console.log('   BACKEND_TYPE:', process.env.NEXT_PUBLIC_BACKEND_TYPE || 'Not set');
  console.log();
  
  // Test 2: Check if backend is running
  console.log('2. Backend Connectivity:');
  try {
    const response = await fetch('http://localhost:3001/api/polls');
    console.log('   Backend Status:', response.status === 401 ? '✅ Running (Auth required)' : `Status: ${response.status}`);
  } catch (error) {
    console.log('   Backend Status: ❌ Not running or not accessible');
    console.log('   Error:', error.message);
  }
  console.log();
  
  // Test 3: Check Supabase connectivity (this would need proper auth)
  console.log('3. Supabase Configuration:');
  console.log('   URL Format:', process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('supabase.co') ? '✅ Valid' : '❌ Invalid');
  console.log('   Key Format:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.startsWith('eyJ') ? '✅ Valid JWT' : '❌ Invalid');
  console.log();
  
  console.log('📋 Summary:');
  console.log('   - Your backend must be running (npm run dev)');
  console.log('   - You must be authenticated to create polls');
  console.log('   - Check browser console for detailed debug logs');
  console.log('   - Check terminal logs for backend debug output');
};

// Load environment variables if available
try {
  require('dotenv').config({ path: '.env.local' });
} catch (e) {
  console.log('Note: dotenv not available, using process.env directly');
}

testPollCreation();