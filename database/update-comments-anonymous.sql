-- Update comments table to support anonymous commenting
-- This script modifies the existing comments table to allow anonymous users to comment

-- First, drop existing policies that require authentication
DROP POLICY IF EXISTS "Authenticated users can create comments" ON public.comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON public.comments;
DROP POLICY IF EXISTS "Users can delete their own comments OR admins/moderators can delete any" ON public.comments;

-- Modify the comments table to support anonymous commenting
ALTER TABLE public.comments 
  ALTER COLUMN user_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS anonymous_name VARCHAR(50),
  ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT FALSE;

-- Add a check constraint to ensure either user_id is provided OR it's anonymous
ALTER TABLE public.comments 
  ADD CONSTRAINT check_user_or_anonymous 
  CHECK (
    (user_id IS NOT NULL AND is_anonymous = FALSE) OR 
    (user_id IS NULL AND is_anonymous = TRUE AND anonymous_name IS NOT NULL)
  );

-- Create new policies for anonymous commenting
CREATE POLICY "Anyone can view comments" ON public.comments FOR SELECT USING (true);

CREATE POLICY "Anyone can create comments" ON public.comments FOR INSERT WITH CHECK (
  -- Either authenticated user
  (auth.uid() IS NOT NULL AND auth.uid() = user_id AND is_anonymous = FALSE) OR
  -- Or anonymous user
  (auth.uid() IS NULL AND user_id IS NULL AND is_anonymous = TRUE AND anonymous_name IS NOT NULL)
);

CREATE POLICY "Users can update their own comments" ON public.comments FOR UPDATE USING (
  -- Only authenticated users can update their own comments
  auth.uid() IS NOT NULL AND auth.uid() = user_id AND is_anonymous = FALSE
);

CREATE POLICY "Users can delete their own comments OR admins/moderators can delete any" ON public.comments FOR DELETE USING (
  -- Authenticated users can delete their own comments
  (auth.uid() IS NOT NULL AND auth.uid() = user_id AND is_anonymous = FALSE) OR
  -- Admins/moderators can delete any comment
  EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'moderator')
  )
);

-- Add index for anonymous comments
CREATE INDEX IF NOT EXISTS idx_comments_anonymous ON public.comments(is_anonymous, anonymous_name);

-- Update the trigger to handle anonymous comments
-- (The existing trigger should work fine as it only updates the updated_at field)