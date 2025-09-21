/**
 * @fileoverview Custom hook for managing user profile data and role information
 * Provides user profile state management with role-based access control
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { supabase } from '@/lib/supabase';

/**
 * User profile interface extending basic user data with role information
 */
export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  role: 'admin' | 'moderator' | 'user';
  created_at: string;
  updated_at: string;
  last_login?: string;
  is_active: boolean;
}

/**
 * Hook return type for user profile management
 */
interface UseUserProfileReturn {
  /** Current user profile data */
  profile: UserProfile | null;
  /** Loading state for profile operations */
  isLoading: boolean;
  /** Error state for profile operations */
  error: string | null;
  /** Function to refresh profile data */
  refreshProfile: () => Promise<void>;
  /** Function to update profile data */
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  /** Check if user has admin role */
  isAdmin: boolean;
  /** Check if user has moderator or admin role */
  isModerator: boolean;
  /** Check if user can manage polls (admin or moderator) */
  canManagePolls: boolean;
}

/**
 * Custom hook for managing user profile data and role-based permissions
 * 
 * Features:
 * - Automatic profile loading when user is authenticated
 * - Role-based permission checks
 * - Profile update functionality
 * - Error handling and loading states
 * - Real-time profile synchronization
 * 
 * @returns Object containing profile data, loading state, and management functions
 * 
 * @example
 * ```tsx
 * function UserDashboard() {
 *   const { profile, isAdmin, canManagePolls, updateProfile } = useUserProfile();
 *   
 *   if (!profile) return <div>Please log in</div>;
 *   
 *   return (
 *     <div>
 *       <h1>Welcome, {profile.full_name || profile.email}!</h1>
 *       <p>Role: {profile.role}</p>
 *       {isAdmin && <AdminPanel />}
 *       {canManagePolls && <PollManagement />}
 *     </div>
 *   );
 * }
 * ```
 */
export function useUserProfile(): UseUserProfileReturn {
  const { user, session } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch user profile from the database
   */
  const fetchProfile = async () => {
    if (!user) {
      setProfile(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      setProfile(data);
    } catch (err) {
      console.error('Error fetching user profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch profile');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Refresh profile data
   */
  const refreshProfile = async () => {
    await fetchProfile();
  };

  /**
   * Update user profile
   */
  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user || !profile) {
      throw new Error('No user or profile available');
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: updateError } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      setProfile(data);
    } catch (err) {
      console.error('Error updating user profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to update profile');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Load profile when user changes
  useEffect(() => {
    fetchProfile();
  }, [user]);

  // Computed permission checks
  const isAdmin = profile?.role === 'admin';
  const isModerator = profile?.role === 'moderator' || profile?.role === 'admin';
  const canManagePolls = isModerator;

  return {
    profile,
    isLoading,
    error,
    refreshProfile,
    updateProfile,
    isAdmin,
    isModerator,
    canManagePolls,
  };
}