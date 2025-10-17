/**
 * Simple script to create the comments table in Supabase database
 * This script creates just the basic table structure first
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createCommentsTable() {
  try {
    console.log('🚀 Creating comments table...');
    
    // First, let's check if the table already exists
    const { data: existingTable, error: checkError } = await supabase
      .from('comments')
      .select('*')
      .limit(1);
    
    if (!checkError) {
      console.log('✅ Comments table already exists!');
      return;
    }
    
    console.log('📝 Table does not exist, creating it...');
    
    // Create the table using a simple SQL command
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS public.comments (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        poll_id UUID NOT NULL,
        user_id UUID NOT NULL,
        parent_id UUID,
        content TEXT NOT NULL,
        is_edited BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    
    // Try to execute using the SQL editor approach
    console.log('⚠️ Please manually execute the following SQL in your Supabase dashboard:');
    console.log('='.repeat(60));
    console.log(createTableSQL);
    console.log('='.repeat(60));
    console.log('');
    console.log('Steps:');
    console.log('1. Go to https://supabase.com/dashboard');
    console.log('2. Select your project');
    console.log('3. Go to SQL Editor');
    console.log('4. Paste the SQL above and run it');
    console.log('');
    console.log('After running the SQL, the comments functionality should work!');
    
  } catch (error) {
    console.error('❌ Script execution failed:', error.message);
  }
}

createCommentsTable();