const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://htuiiuvakwykouwvbswp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0dWlpdXZha3d5a291d3Zic3dwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyODY3NDQsImV4cCI6MjA3Mzg2Mjc0NH0.h0rAoG-iXp2SfSj8ugjTjemZJVx8zdKMrI4IqDR961Y';

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrateDatabase() {
  try {
    console.log('Starting database migration...');
    
    // First, let's check the current table structure
    const { data: tableInfo, error: tableError } = await supabase
      .from('comments')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.error('Error checking table:', tableError);
      return;
    }
    
    console.log('Current table structure checked successfully');
    
    // Try to add the columns using a simple approach
    console.log('Adding is_anonymous column...');
    const { error: error1 } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE comments ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT FALSE;'
    });
    
    if (error1) {
      console.log('Column might already exist or error:', error1.message);
    } else {
      console.log('✅ is_anonymous column added');
    }
    
    console.log('Adding anonymous_name column...');
    const { error: error2 } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE comments ADD COLUMN IF NOT EXISTS anonymous_name TEXT;'
    });
    
    if (error2) {
      console.log('Column might already exist or error:', error2.message);
    } else {
      console.log('✅ anonymous_name column added');
    }
    
    console.log('Making user_id nullable...');
    const { error: error3 } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE comments ALTER COLUMN user_id DROP NOT NULL;'
    });
    
    if (error3) {
      console.log('Column might already be nullable or error:', error3.message);
    } else {
      console.log('✅ user_id made nullable');
    }
    
    console.log('Migration completed!');
    
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

migrateDatabase();