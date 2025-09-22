-- Polly Pro - Create Polls Tables
-- This script creates the polls, poll_options, and votes tables with proper RLS policies
-- Run this in your Supabase SQL Editor to set up the polling system

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

-- ============================================================================
-- SAMPLE DATA FOR TESTING
-- ============================================================================

-- Insert a sample poll for testing (requires at least one user to exist)
DO $$
DECLARE
    sample_user_id UUID;
    sample_poll_id UUID;
BEGIN
    -- Get the first user ID (if any users exist)
    SELECT id INTO sample_user_id FROM auth.users LIMIT 1;
    
    -- Only create sample data if a user exists
    IF sample_user_id IS NOT NULL THEN
        -- Insert sample poll
        INSERT INTO public.polls (id, title, description, created_by, allow_multiple_votes, is_anonymous) 
        VALUES (
            gen_random_uuid(),
            'What is your favorite programming language?', 
            'Choose your preferred programming language for web development', 
            sample_user_id, 
            false, 
            false
        ) RETURNING id INTO sample_poll_id;

        -- Insert sample poll options
        INSERT INTO public.poll_options (poll_id, text) VALUES
        (sample_poll_id, 'JavaScript'),
        (sample_poll_id, 'TypeScript'),
        (sample_poll_id, 'Python'),
        (sample_poll_id, 'Go'),
        (sample_poll_id, 'Rust');
        
        RAISE NOTICE 'Sample poll created with ID: %', sample_poll_id;
    ELSE
        RAISE NOTICE 'No users found - skipping sample data creation';
    END IF;
END $$;