const { createClient } = require('@supabase/supabase-js')

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function migrateDatabase() {
  console.log('Starting database migration for anonymous comments...')

  try {
    // Execute the migration SQL
    const migrationSQL = `
      -- Add new columns to comments table
      ALTER TABLE comments 
      ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS anonymous_name TEXT;

      -- Make user_id nullable for anonymous comments
      ALTER TABLE comments 
      ALTER COLUMN user_id DROP NOT NULL;
    `

    const { error: migrationError } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    })

    if (migrationError) {
      console.error('Migration error:', migrationError)
      return
    }

    console.log('✅ Database schema updated successfully!')
    console.log('✅ Anonymous commenting is now supported!')

  } catch (error) {
    console.error('Migration failed:', error)
  }
}

migrateDatabase()