-- Migration to add anonymous commenting support
-- This script adds columns for anonymous commenting and updates RLS policies

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

-- Create new RLS policies that support anonymous comments
CREATE POLICY "Anyone can view comments" ON comments
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create comments" ON comments
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

-- Ensure RLS is enabled
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;