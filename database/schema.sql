-- Polly Pro Database Schema
-- This file contains the SQL schema for the Polly Pro application
-- Run this in your Supabase SQL editor to create the required tables

-- Enable Row Level Security (RLS) for all tables
-- This ensures users can only access data they're authorized to see

-- ============================================================================
-- USER PROFILES TABLE (for role management)
-- ============================================================================

-- Create user_profiles table to extend auth.users with role information
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    full_name TEXT,
    role TEXT DEFAULT 'user' NOT NULL CHECK (role IN ('admin', 'moderator', 'user')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true NOT NULL
);

-- Enable RLS on user_profiles table
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for user_profiles table
-- Allow users to view their own profile
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = id);

-- Allow users to update their own profile (except role)
CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id AND role = (SELECT role FROM public.user_profiles WHERE id = auth.uid()));

-- Allow admins to view all profiles
CREATE POLICY "Admins can view all profiles" ON public.user_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Allow admins to update user roles
CREATE POLICY "Admins can update user roles" ON public.user_profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, full_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create user profile
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Comments table for poll discussions
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE, -- For nested replies
  content TEXT NOT NULL CHECK (length(content) > 0 AND length(content) <= 1000),
  is_edited BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security for comments
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Comments policies
CREATE POLICY "Anyone can view comments" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create comments" ON public.comments FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);
CREATE POLICY "Users can update their own comments" ON public.comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own comments OR admins/moderators can delete any" ON public.comments FOR DELETE USING (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'moderator')
  )
);

-- Indexes for comments performance
CREATE INDEX IF NOT EXISTS idx_comments_poll_id ON public.comments(poll_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON public.comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON public.comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON public.comments(created_at DESC);

-- Function to update updated_at timestamp for comments
CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- POLLS TABLE
-- ============================================================================

-- Create polls table
CREATE TABLE IF NOT EXISTS public.polls (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    allow_multiple_votes BOOLEAN DEFAULT false NOT NULL,
    is_anonymous BOOLEAN DEFAULT false NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    poll_category TEXT DEFAULT 'general' NOT NULL
);

-- Enable RLS on polls table
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;

-- Create policies for polls table
-- Allow users to read all active polls
CREATE POLICY "Anyone can view active polls" ON public.polls
    FOR SELECT USING (is_active = true);

-- Allow authenticated users to create polls
CREATE POLICY "Authenticated users can create polls" ON public.polls
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow poll creators to update their own polls, or admins to update any poll
CREATE POLICY "Users can update their own polls" ON public.polls
    FOR UPDATE USING (
        auth.uid() = created_by 
        OR EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'moderator')
        )
    );

-- Allow poll creators to delete their own polls, or admins to delete any poll
CREATE POLICY "Users can delete their own polls" ON public.polls
    FOR DELETE USING (
        auth.uid() = created_by 
        OR EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'moderator')
        )
    );

-- ============================================================================
-- POLL OPTIONS TABLE
-- ============================================================================

-- Create poll_options table
CREATE TABLE IF NOT EXISTS public.poll_options (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    poll_id UUID REFERENCES public.polls(id) ON DELETE CASCADE NOT NULL,
    text TEXT NOT NULL,
    vote_count INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS on poll_options table
ALTER TABLE public.poll_options ENABLE ROW LEVEL SECURITY;

-- Create policies for poll_options table
-- Allow users to read options for active polls
CREATE POLICY "Anyone can view poll options" ON public.poll_options
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.polls 
            WHERE polls.id = poll_options.poll_id 
            AND polls.is_active = true
        )
    );

-- Allow poll creators to manage their poll options, or admins to manage any options
CREATE POLICY "Poll creators can manage options" ON public.poll_options
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.polls 
            WHERE polls.id = poll_options.poll_id 
            AND (polls.created_by = auth.uid() 
                 OR EXISTS (
                     SELECT 1 FROM public.user_profiles 
                     WHERE id = auth.uid() AND role IN ('admin', 'moderator')
                 )
            )
        )
    );

-- ============================================================================
-- VOTES TABLE
-- ============================================================================

-- Create votes table
CREATE TABLE IF NOT EXISTS public.votes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    poll_id UUID REFERENCES public.polls(id) ON DELETE CASCADE NOT NULL,
    option_id UUID REFERENCES public.poll_options(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    voter_ip INET,
    voter_session TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Ensure unique votes per user per poll (for authenticated users)
    UNIQUE(poll_id, user_id),
    -- Ensure unique votes per IP per poll (for anonymous users)
    UNIQUE(poll_id, voter_ip, voter_session)
);

-- Enable RLS on votes table
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

-- Create policies for votes table
-- Allow users to view votes for active polls (if not anonymous)
CREATE POLICY "Users can view non-anonymous votes" ON public.votes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.polls 
            WHERE polls.id = votes.poll_id 
            AND polls.is_active = true 
            AND polls.is_anonymous = false
        )
    );

-- Allow authenticated users to create votes
CREATE POLICY "Authenticated users can vote" ON public.votes
    FOR INSERT WITH CHECK (
        -- Allow authenticated users to vote
        (auth.role() = 'authenticated' AND auth.uid() = user_id)
        OR
        -- Allow anonymous voting when poll allows it
        (user_id IS NULL AND voter_ip IS NOT NULL AND voter_session IS NOT NULL)
    );

-- Allow users to view their own votes
CREATE POLICY "Users can view their own votes" ON public.votes
    FOR SELECT USING (
        auth.uid() = user_id
        OR
        -- Anonymous users can view their votes via session
        (user_id IS NULL AND voter_session = current_setting('app.voter_session', true))
    );

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Indexes for better query performance

CREATE INDEX idx_poll_options_poll_id ON poll_options(poll_id);

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at timestamps
CREATE TRIGGER update_polls_updated_at 
    BEFORE UPDATE ON public.polls 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_poll_options_updated_at 
    BEFORE UPDATE ON public.poll_options 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON public.user_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to increment vote count when a vote is cast
CREATE OR REPLACE FUNCTION increment_vote_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.poll_options 
    SET vote_count = vote_count + 1 
    WHERE id = NEW.option_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to decrement vote count when a vote is removed
CREATE OR REPLACE FUNCTION decrement_vote_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.poll_options 
    SET vote_count = vote_count - 1 
    WHERE id = OLD.option_id;
    RETURN OLD;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update vote counts
CREATE TRIGGER increment_vote_count_trigger
    AFTER INSERT ON public.votes
    FOR EACH ROW EXECUTE FUNCTION increment_vote_count();

CREATE TRIGGER decrement_vote_count_trigger
    AFTER DELETE ON public.votes
    FOR EACH ROW EXECUTE FUNCTION decrement_vote_count();
    AFTER INSERT ON public.votes
    FOR EACH ROW EXECUTE FUNCTION increment_vote_count();

CREATE TRIGGER decrement_vote_count_trigger
    AFTER DELETE ON public.votes
    FOR EACH ROW EXECUTE FUNCTION decrement_vote_count();

-- ============================================================================
-- SAMPLE DATA (OPTIONAL)
-- ============================================================================

-- Insert sample polls for testing (uncomment if needed)
/*
INSERT INTO public.polls (title, description, created_by, allow_multiple_votes, is_anonymous) VALUES
('What is your favorite programming language?', 'Choose your preferred programming language for web development', 
 (SELECT id FROM auth.users LIMIT 1), false, false),
('Best time for team meetings?', 'Help us decide the optimal time for our weekly team meetings', 
 (SELECT id FROM auth.users LIMIT 1), false, false);

-- Insert sample poll options
INSERT INTO public.poll_options (poll_id, text) VALUES
((SELECT id FROM public.polls WHERE title = 'What is your favorite programming language?' LIMIT 1), 'JavaScript'),
((SELECT id FROM public.polls WHERE title = 'What is your favorite programming language?' LIMIT 1), 'TypeScript'),
((SELECT id FROM public.polls WHERE title = 'What is your favorite programming language?' LIMIT 1), 'Python'),
((SELECT id FROM public.polls WHERE title = 'What is your favorite programming language?' LIMIT 1), 'Go'),
((SELECT id FROM public.polls WHERE title = 'Best time for team meetings?' LIMIT 1), '9:00 AM'),
((SELECT id FROM public.polls WHERE title = 'Best time for team meetings?' LIMIT 1), '2:00 PM'),
((SELECT id FROM public.polls WHERE title = 'Best time for team meetings?' LIMIT 1), '4:00 PM');
*/