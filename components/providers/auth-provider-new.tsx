'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Session, User, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

/**
 * Authentication context type definition
 */
interface AuthContextType {
  /** Current authenticated user object, null if not authenticated */
  user: User | null;
  /** Current session object containing tokens and user data */
  session: Session | null;
  /** Loading state for initial authentication check */
  isLoading: boolean;
  /** Authentication error if any occurred */
  error: AuthError | null;
  /** Function to sign out the current user */
  signOut: () => Promise<void>;
  /** Function to refresh the current session */
  refreshSession: () => Promise<Session | null>;
  /** Function to check if the user is authenticated */
  isAuthenticated: () => boolean;
  /** Last time the session was refreshed */
  lastRefreshed: number | null;
}

/**
 * Authentication context
 */
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Authentication provider component props
 */
interface AuthProviderProps {
  /** Child components that will have access to authentication context */
  children: React.ReactNode;
}

/**
 * Enhanced authentication provider component with improved session management
 */
export function AuthProvider({ children }: AuthProviderProps) {
  // State for authentication data
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<number | null>(null);
  
  // Check if user is authenticated
  const isAuthenticated = useCallback(() => {
    return !!user && !!session;
  }, [user, session]);

  /**
   * Sign out the current user with improved error handling
   */
  const signOut = useCallback(async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Error signing out:', error);
        setError(error);
        return;
      }
      
      // Clear any stored redirect paths
      try {
        sessionStorage.removeItem('authRedirectPath');
        localStorage.removeItem('authRedirectPath');
        sessionStorage.removeItem('isRedirecting');
        
        // Clear any auth-related cookies
        document.cookie = 'authRedirect=; path=/; max-age=0';
        document.cookie = 'redirectAttempt=; path=/; max-age=0';
        document.cookie = 'authSuccess=; path=/; max-age=0';
      } catch (e) {
        console.error('Error clearing storage:', e);
      }
      
      // State will be updated by the auth state change listener
    } catch (error) {
      console.error('Unexpected error during sign out:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Refresh the session data with improved reliability
   */
  const refreshSession = useCallback(async () => {
    console.log('Refreshing session...');
    setIsLoading(true);
    
    try {
      // First try to refresh the session
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('Error refreshing session:', error);
        setError(error);
        
        // If refresh fails, try to get the current session as fallback
        console.log('Falling back to getSession...');
        const { data: fallbackData, error: fallbackError } = await supabase.auth.getSession();
        
        if (fallbackError) {
          console.error('Error getting session:', fallbackError);
          setError(fallbackError);
          throw fallbackError;
        }
        
        console.log('Session retrieved via fallback');
        setSession(fallbackData.session);
        setUser(fallbackData.session?.user ?? null);
        setLastRefreshed(Date.now());
        return fallbackData.session;
      }
      
      console.log('Session refreshed successfully:', data.session?.user?.email);
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setError(null);
      setLastRefreshed(Date.now());
      return data.session;
    } catch (error) {
      console.error('Error in refreshSession:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initialize authentication state
  useEffect(() => {
    let mounted = true;
    
    const initializeAuth = async () => {
      console.log('AuthProvider - Initializing');
      setIsLoading(true);
      
      try {
        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting initial session:', error);
          if (mounted) {
            setError(error);
          }
        } else if (mounted) {
          console.log('AuthProvider - Initial session loaded:', !!session, session?.user?.email);
          setSession(session);
          setUser(session?.user ?? null);
          setLastRefreshed(Date.now());
        }
      } catch (error) {
        console.error('Unexpected error during initialization:', error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('Auth state changed:', event, newSession?.user?.email);
        
        if (mounted) {
          // Update local state with the new session
          setSession(newSession);
          setUser(newSession?.user ?? null);
          
          // Handle specific auth events
          switch (event) {
            case 'SIGNED_IN':
              console.log('User signed in, refreshing session data');
              try {
                // Check for redirect path
                const redirectPath = sessionStorage.getItem('authRedirectPath') || 
                                    localStorage.getItem('authRedirectPath');
                
                if (redirectPath) {
                  console.log('Found stored redirect path:', redirectPath);
                }
                
                await refreshSession();
                setLastRefreshed(Date.now());
              } catch (error) {
                console.error('Error refreshing session after sign in:', error);
              }
              break;
              
            case 'SIGNED_OUT':
              console.log('User signed out');
              // Clear any stored auth data
              try {
                sessionStorage.removeItem('authRedirectPath');
                localStorage.removeItem('authRedirectPath');
              } catch (e) {
                console.error('Error clearing storage:', e);
              }
              break;
              
            case 'TOKEN_REFRESHED':
              console.log('Token refreshed');
              setLastRefreshed(Date.now());
              break;
              
            case 'USER_UPDATED':
              console.log('User updated');
              await refreshSession();
              break;
          }
          
          // Set loading to false after any auth state change
          setIsLoading(false);
        }
      }
    );

    // Cleanup subscription on unmount
    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [refreshSession]);

  // Periodically check and refresh session if needed
  useEffect(() => {
    // Only set up the interval if we have a session
    if (!session) return;
    
    const checkSessionInterval = setInterval(async () => {
      // Check if session is about to expire (within 5 minutes)
      const expiresAt = session.expires_at;
      const now = Math.floor(Date.now() / 1000);
      const fiveMinutesInSeconds = 5 * 60;
      
      if (expiresAt && expiresAt - now < fiveMinutesInSeconds) {
        console.log('Session about to expire, refreshing...');
        try {
          await refreshSession();
        } catch (error) {
          console.error('Error refreshing session in interval check:', error);
        }
      }
    }, 60000); // Check every minute
    
    return () => clearInterval(checkSessionInterval);
  }, [session, refreshSession]);

  // Context value object
  const value: AuthContextType = {
    user,
    session,
    isLoading,
    error,
    signOut,
    refreshSession,
    isAuthenticated,
    lastRefreshed,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Custom hook to access authentication context
 */
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}