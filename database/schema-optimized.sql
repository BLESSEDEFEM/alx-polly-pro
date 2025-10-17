-- Polly Pro Database Schema - OPTIMIZED VERSION
-- This file contains the SQL schema with optimized RLS policies
-- Run this in your Supabase SQL editor to update the RLS policies

-- ============================================================================
-- OPTIMIZED RLS POLICIES FOR PERFORMANCE
-- ============================================================================

-- Drop existing policies to replace with optimized versions
DROP POLICY IF EXISTS "Authenticated users can create polls" ON public.polls;
DROP POLICY IF EXISTS "Users can update their own polls" ON public.polls;
DROP POLICY IF EXISTS "Users can delete their own polls" ON public.polls;
DROP POLICY IF EXISTS "Poll creators can manage options" ON public.poll_options;
DROP POLICY IF EXISTS "Authenticated users can vote" ON public.votes;
DROP POLICY IF EXISTS "Users can view their own votes" ON public.votes;

-- ============================================================================
-- OPTIMIZED POLLS TABLE POLICIES
-- ============================================================================

-- Allow authenticated users to create polls (OPTIMIZED)
CREATE POLICY "Authenticated users can create polls" ON public.polls
    FOR INSERT WITH CHECK ((select auth.role()) = 'authenticated');

-- Allow poll creators to update their own polls, or admins to update any poll (OPTIMIZED)
CREATE POLICY "Users can update their own polls" ON public.polls
    FOR UPDATE USING (
        (select auth.uid()) = created_by 
        OR EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = (select auth.uid()) AND role IN ('admin', 'moderator')
        )
    );

-- Allow poll creators to delete their own polls, or admins to delete any poll (OPTIMIZED)
CREATE POLICY "Users can delete their own polls" ON public.polls
    FOR DELETE USING (
        (select auth.uid()) = created_by 
        OR EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = (select auth.uid()) AND role IN ('admin', 'moderator')
        )
    );

-- ============================================================================
-- OPTIMIZED POLL OPTIONS TABLE POLICIES
-- ============================================================================

-- Allow poll creators to manage their poll options, or admins to manage any options (OPTIMIZED)
CREATE POLICY "Poll creators can manage options" ON public.poll_options
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.polls 
            WHERE polls.id = poll_options.poll_id 
            AND (polls.created_by = (select auth.uid()) 
                 OR EXISTS (
                     SELECT 1 FROM public.user_profiles 
                     WHERE id = (select auth.uid()) AND role IN ('admin', 'moderator')
                 )
            )
        )
    );

-- ============================================================================
-- OPTIMIZED VOTES TABLE POLICIES
-- ============================================================================

-- Allow authenticated users to create votes (OPTIMIZED)
CREATE POLICY "Authenticated users can vote" ON public.votes
    FOR INSERT WITH CHECK (
        -- Allow authenticated users to vote
        ((select auth.role()) = 'authenticated' AND (select auth.uid()) = user_id)
        OR
        -- Allow anonymous voting when poll allows it
        (user_id IS NULL AND voter_ip IS NOT NULL AND voter_session IS NOT NULL)
    );

-- Allow users to view their own votes (OPTIMIZED)
CREATE POLICY "Users can view their own votes" ON public.votes
    FOR SELECT USING (
        (select auth.uid()) = user_id
        OR
        -- Anonymous users can view their votes via session
        (user_id IS NULL AND voter_session = current_setting('app.voter_session', true))
    );

-- ============================================================================
-- ADDITIONAL OPTIMIZATIONS FOR USER PROFILES
-- ============================================================================

-- Drop and recreate user profile policies with optimizations
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can update user roles" ON public.user_profiles;

-- Allow users to view their own profile (OPTIMIZED)
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT USING ((select auth.uid()) = id);

-- Allow users to update their own profile (except role) (OPTIMIZED)
CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING ((select auth.uid()) = id)
    WITH CHECK ((select auth.uid()) = id AND role = (SELECT role FROM public.user_profiles WHERE id = (select auth.uid())));

-- Allow admins to view all profiles (OPTIMIZED)
CREATE POLICY "Admins can view all profiles" ON public.user_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = (select auth.uid()) AND role = 'admin'
        )
    );

-- Allow admins to update user roles (OPTIMIZED)
CREATE POLICY "Admins can update user roles" ON public.user_profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = (select auth.uid()) AND role = 'admin'
        )
    );

-- ============================================================================
-- OPTIMIZED COMMENTS POLICIES
-- ============================================================================

-- Drop and recreate comments policies with optimizations
DROP POLICY IF EXISTS "Authenticated users can create comments" ON public.comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON public.comments;
DROP POLICY IF EXISTS "Users can delete their own comments OR admins/moderators can delete any" ON public.comments;

-- Allow authenticated users to create comments (OPTIMIZED)
CREATE POLICY "Authenticated users can create comments" ON public.comments 
    FOR INSERT WITH CHECK ((select auth.uid()) IS NOT NULL AND (select auth.uid()) = user_id);

-- Allow users to update their own comments (OPTIMIZED)
CREATE POLICY "Users can update their own comments" ON public.comments 
    FOR UPDATE USING ((select auth.uid()) = user_id);

-- Allow users to delete their own comments OR admins/moderators can delete any (OPTIMIZED)
CREATE POLICY "Users can delete their own comments OR admins/moderators can delete any" ON public.comments 
    FOR DELETE USING (
        (select auth.uid()) = user_id OR 
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = (select auth.uid()) 
            AND role IN ('admin', 'moderator')
        )
    );

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_poll_options_poll_id ON public.poll_options(poll_id);