-- Polly Pro Database Schema
-- Complete schema for the polling application

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User Profiles Table
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Polls Table
CREATE TABLE IF NOT EXISTS public.polls (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    creator_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    is_public BOOLEAN DEFAULT true,
    allow_multiple_votes BOOLEAN DEFAULT false,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Poll Options Table
CREATE TABLE IF NOT EXISTS public.poll_options (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    poll_id UUID REFERENCES public.polls(id) ON DELETE CASCADE NOT NULL,
    option_text TEXT NOT NULL,
    option_order INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Votes Table
CREATE TABLE IF NOT EXISTS public.votes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    poll_id UUID REFERENCES public.polls(id) ON DELETE CASCADE NOT NULL,
    option_id UUID REFERENCES public.poll_options(id) ON DELETE CASCADE NOT NULL,
    voter_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    voter_ip INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique votes per user/IP per poll (if multiple votes not allowed)
    UNIQUE(poll_id, voter_id),
    UNIQUE(poll_id, voter_ip)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_polls_creator_id ON public.polls(creator_id);
CREATE INDEX IF NOT EXISTS idx_polls_created_at ON public.polls(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_poll_options_poll_id ON public.poll_options(poll_id);
CREATE INDEX IF NOT EXISTS idx_votes_poll_id ON public.votes(poll_id);
CREATE INDEX IF NOT EXISTS idx_votes_option_id ON public.votes(option_id);
CREATE INDEX IF NOT EXISTS idx_votes_voter_id ON public.votes(voter_id);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

-- User Profiles Policies
CREATE POLICY "Users can view their own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Polls Policies
CREATE POLICY "Anyone can view public polls" ON public.polls
    FOR SELECT USING (is_public = true);

CREATE POLICY "Users can view their own polls" ON public.polls
    FOR SELECT USING (auth.uid() = creator_id);

CREATE POLICY "Users can create polls" ON public.polls
    FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Users can update their own polls" ON public.polls
    FOR UPDATE USING (auth.uid() = creator_id);

CREATE POLICY "Users can delete their own polls" ON public.polls
    FOR DELETE USING (auth.uid() = creator_id);

-- Poll Options Policies
CREATE POLICY "Anyone can view options for public polls" ON public.poll_options
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.polls 
            WHERE polls.id = poll_options.poll_id 
            AND polls.is_public = true
        )
    );

CREATE POLICY "Users can view options for their own polls" ON public.poll_options
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.polls 
            WHERE polls.id = poll_options.poll_id 
            AND polls.creator_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage options for their own polls" ON public.poll_options
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.polls 
            WHERE polls.id = poll_options.poll_id 
            AND polls.creator_id = auth.uid()
        )
    );

-- Votes Policies
CREATE POLICY "Anyone can vote on public polls" ON public.votes
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.polls 
            WHERE polls.id = votes.poll_id 
            AND polls.is_public = true
            AND (polls.expires_at IS NULL OR polls.expires_at > NOW())
        )
    );

CREATE POLICY "Users can view votes for their own polls" ON public.votes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.polls 
            WHERE polls.id = votes.poll_id 
            AND polls.creator_id = auth.uid()
        )
    );

CREATE POLICY "Anyone can view vote counts for public polls" ON public.votes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.polls 
            WHERE polls.id = votes.poll_id 
            AND polls.is_public = true
        )
    );

-- Functions and Triggers

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON public.user_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_polls_updated_at 
    BEFORE UPDATE ON public.polls 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, full_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile on signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to get poll results
CREATE OR REPLACE FUNCTION get_poll_results(poll_uuid UUID)
RETURNS TABLE (
    option_id UUID,
    option_text TEXT,
    vote_count BIGINT,
    percentage NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    WITH vote_counts AS (
        SELECT 
            po.id as option_id,
            po.option_text,
            COUNT(v.id) as vote_count
        FROM public.poll_options po
        LEFT JOIN public.votes v ON po.id = v.option_id
        WHERE po.poll_id = poll_uuid
        GROUP BY po.id, po.option_text, po.option_order
        ORDER BY po.option_order
    ),
    total_votes AS (
        SELECT SUM(vote_count) as total FROM vote_counts
    )
    SELECT 
        vc.option_id,
        vc.option_text,
        vc.vote_count,
        CASE 
            WHEN tv.total = 0 THEN 0
            ELSE ROUND((vc.vote_count::NUMERIC / tv.total::NUMERIC) * 100, 2)
        END as percentage
    FROM vote_counts vc
    CROSS JOIN total_votes tv;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;