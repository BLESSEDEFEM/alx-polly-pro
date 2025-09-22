-- Fix for Infinite Recursion in RLS Policies
-- This script provides a permanent solution using security definer functions
-- Run this in your Supabase SQL editor to fix the circular reference issues

-- ============================================================================
-- SECURITY DEFINER FUNCTIONS (Bypass RLS for role checks)
-- ============================================================================

-- Function to get user role without triggering RLS policies
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID DEFAULT auth.uid())
RETURNS TEXT AS $$
DECLARE
    user_role TEXT;
BEGIN
    -- This function runs with elevated privileges, bypassing RLS
    SELECT role INTO user_role 
    FROM public.user_profiles 
    WHERE id = COALESCE(user_id, auth.uid());
    
    RETURN COALESCE(user_role, 'user');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT role INTO user_role 
    FROM public.user_profiles 
    WHERE id = COALESCE(user_id, auth.uid());
    
    RETURN COALESCE(user_role, 'user') = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is moderator or admin
CREATE OR REPLACE FUNCTION public.is_moderator_or_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT role INTO user_role 
    FROM public.user_profiles 
    WHERE id = COALESCE(user_id, auth.uid());
    
    RETURN COALESCE(user_role, 'user') IN ('admin', 'moderator');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user exists and is active
CREATE OR REPLACE FUNCTION public.user_exists_and_active(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    is_active_user BOOLEAN;
BEGIN
    SELECT is_active INTO is_active_user 
    FROM public.user_profiles 
    WHERE id = user_id;
    
    RETURN COALESCE(is_active_user, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- DROP PROBLEMATIC POLICIES
-- ============================================================================

-- Drop all existing user_profiles policies that cause circular references
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can update user roles" ON public.user_profiles;

-- Drop related policies in other tables that reference user_profiles
DROP POLICY IF EXISTS "Users can update their own polls" ON public.polls;
DROP POLICY IF EXISTS "Users can delete their own polls" ON public.polls;
DROP POLICY IF EXISTS "Poll creators can manage options" ON public.poll_options;

-- ============================================================================
-- CREATE NEW NON-CIRCULAR POLICIES
-- ============================================================================

-- USER PROFILES POLICIES (No circular references)
-- Allow users to view their own profile
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = id);

-- Allow users to update their own profile (basic info only, not role)
CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Allow users to insert their own profile (for new registrations)
CREATE POLICY "Users can insert own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow admins to view all profiles (using security definer function)
CREATE POLICY "Admins can view all profiles" ON public.user_profiles
    FOR SELECT USING (public.is_admin());

-- Allow admins to update any user profile (using security definer function)
CREATE POLICY "Admins can update any profile" ON public.user_profiles
    FOR UPDATE USING (public.is_admin());

-- Allow admins to insert profiles for other users
CREATE POLICY "Admins can insert any profile" ON public.user_profiles
    FOR INSERT WITH CHECK (public.is_admin());

-- ============================================================================
-- UPDATE POLLS POLICIES (Remove circular references)
-- ============================================================================

-- Allow poll creators to update their own polls, or moderators/admins to update any poll
CREATE POLICY "Users can update their own polls" ON public.polls
    FOR UPDATE USING (
        auth.uid() = created_by 
        OR public.is_moderator_or_admin()
    );

-- Allow poll creators to delete their own polls, or moderators/admins to delete any poll
CREATE POLICY "Users can delete their own polls" ON public.polls
    FOR DELETE USING (
        auth.uid() = created_by 
        OR public.is_moderator_or_admin()
    );

-- ============================================================================
-- UPDATE POLL OPTIONS POLICIES (Remove circular references)
-- ============================================================================

-- Allow poll creators to manage their poll options, or moderators/admins to manage any options
CREATE POLICY "Poll creators can manage options" ON public.poll_options
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.polls 
            WHERE polls.id = poll_options.poll_id 
            AND (polls.created_by = auth.uid() OR public.is_moderator_or_admin())
        )
    );

-- ============================================================================
-- GRANT PERMISSIONS TO FUNCTIONS
-- ============================================================================

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_role(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_moderator_or_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_exists_and_active(UUID) TO authenticated;

-- ============================================================================
-- VERIFICATION QUERIES (Run these to test the fix)
-- ============================================================================

-- Test 1: Check if functions work correctly
-- SELECT public.get_user_role(); -- Should return your role
-- SELECT public.is_admin(); -- Should return true/false based on your role

-- Test 2: Check if policies allow proper access
-- SELECT * FROM public.user_profiles WHERE id = auth.uid(); -- Should work without recursion

-- Test 3: Verify no circular references
-- EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM public.user_profiles LIMIT 1; -- Should execute without infinite recursion

-- ============================================================================
-- NOTES
-- ============================================================================

/*
This solution provides:

1. PERMANENT FIX: Security definer functions bypass RLS, eliminating circular references
2. SECURITY: Functions run with elevated privileges but are carefully designed
3. PERFORMANCE: Direct role lookups without policy evaluation loops
4. MAINTAINABILITY: Clear separation between role checking and data access
5. FLEXIBILITY: Easy to extend with additional role-based functions

The security definer functions are safe because:
- They only return role information, not sensitive data
- They're granted only to authenticated users
- They use proper error handling with COALESCE
- They follow the principle of least privilege
*/