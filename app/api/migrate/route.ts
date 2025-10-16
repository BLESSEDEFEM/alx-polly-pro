import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Check if user is authenticated and is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Execute migration SQL
    const migrationSQL = `
      -- Add new columns to comments table
      ALTER TABLE comments 
      ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS anonymous_name TEXT;

      -- Make user_id nullable for anonymous comments
      ALTER TABLE comments 
      ALTER COLUMN user_id DROP NOT NULL;

      -- Drop existing RLS policies
      DROP POLICY IF EXISTS "Users can view all comments" ON comments;
      DROP POLICY IF EXISTS "Users can create comments" ON comments;
      DROP POLICY IF EXISTS "Users can update their own comments" ON comments;
      DROP POLICY IF EXISTS "Users can delete their own comments" ON comments;
      DROP POLICY IF EXISTS "Admins and moderators can delete any comment" ON comments;
      DROP POLICY IF EXISTS "Anyone can view comments" ON comments;
      DROP POLICY IF EXISTS "Authenticated users can create comments" ON comments;
      DROP POLICY IF EXISTS "Users can update their own non-anonymous comments" ON comments;
      DROP POLICY IF EXISTS "Users can delete their own non-anonymous comments" ON comments;
      DROP POLICY IF EXISTS "Users can delete their own comments OR admins/moderators can delete any" ON comments;

      -- Create new RLS policies that support anonymous comments
      CREATE POLICY "Anyone can view comments" ON comments
          FOR SELECT USING (true);

      CREATE POLICY "Users can create comments" ON comments
          FOR INSERT WITH CHECK (
              (is_anonymous = false AND auth.uid() = user_id) OR
              (is_anonymous = true AND user_id IS NULL)
          );

      CREATE POLICY "Users can update their own non-anonymous comments" ON comments
          FOR UPDATE USING (
              is_anonymous = false AND 
              auth.uid() = user_id
          );

      CREATE POLICY "Users can delete their own non-anonymous comments" ON comments
          FOR DELETE USING (
              is_anonymous = false AND 
              auth.uid() = user_id
          );

      CREATE POLICY "Admins and moderators can delete any comment" ON comments
          FOR DELETE USING (
              EXISTS (
                  SELECT 1 FROM user_profiles 
                  WHERE id = auth.uid() 
                  AND (role = 'admin' OR role = 'moderator')
              )
          );
    `

    // Execute the migration
    const { error: migrationError } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    })

    if (migrationError) {
      console.error('Migration error:', migrationError)
      return NextResponse.json(
        { error: 'Migration failed', details: migrationError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Database migration completed successfully' 
    })

  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json(
      { error: 'Migration failed', details: error.message },
      { status: 500 }
    )
  }
}