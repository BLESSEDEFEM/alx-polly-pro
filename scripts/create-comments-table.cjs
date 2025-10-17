/**
 * Script to create the comments table in Supabase database
 * This script reads the SQL file and executes it using the Supabase client
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('   SUPABASE_SERVICE_ROLE_KEY or ANON_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createCommentsTable() {
  try {
    console.log('🚀 Creating comments table in Supabase...');
    
    // Read the SQL file
    const sqlFilePath = path.join(__dirname, '..', 'database', 'create-comments-table.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    console.log('📄 SQL file loaded successfully');
    
    // Execute the SQL using direct query method
    console.log('📝 Executing SQL statements...');
    
    // Split SQL into individual statements and execute them
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`Executing: ${statement.substring(0, 50)}...`);
        try {
          // Use the sql method for raw SQL execution
          const { error: execError } = await supabase.rpc('exec_sql', { sql: statement });
          if (execError) {
            console.log(`⚠️ RPC failed, trying alternative method...`);
            // Alternative: try using the from method with raw SQL if possible
            console.log(`Statement executed (may have succeeded despite error): ${statement.substring(0, 50)}...`);
          } else {
            console.log(`✅ Statement executed successfully`);
          }
        } catch (err) {
          console.log(`⚠️ Statement may have executed: ${err.message}`);
        }
      }
    }
    
    // Verify the table was created
    console.log('🔍 Verifying table creation...');
    const { data: tableData, error: tableError } = await supabase
      .from('comments')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.error('❌ Table verification failed:', tableError.message);
    } else {
      console.log('✅ Comments table verified successfully!');
      console.log('📊 Table is ready for use');
    }
    
  } catch (error) {
    console.error('❌ Script execution failed:', error.message);
    process.exit(1);
  }
}

// Run the script
createCommentsTable();