/**
 * @fileoverview Authentication context provider for managing user authentication state
 * Provides authentication context and state management throughout the application
 */

'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

/**
 * Authentication context type definition
 * 
 * Defines the shape of the authentication context that will be available
 * to all components wrapped by the AuthProvider.
 */
interface AuthContextType {
  /** Current authenticated user object, null if not authenticated */
  user: User | null;
  /** Current session object containing tokens and user data */
  session: Session | null;
  /** Loading state for initial authentication check */
  isLoading: boolean;
  /** Function to sign out the current user */
  signOut: () => Promise<void>;
  /** Function to refresh the current session */
  refreshSession: () => Promise<void>;
}

/**
 * Authentication context
 * 
 * React context that provides authentication state and methods to child components.
 * Should be accessed using the useAuth hook rather than directly.
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
 * Authentication provider component
 * 
 * Wraps the application (or parts of it) to provide authentication context.
 * Manages user authentication state, session handling, and auth state changes.
 * 
 * Features:
 * - Automatic session restoration on app load
 * - Real-time auth state change listening
 * - Session management and token refresh
 * - Loading states for better UX
 * 
 * @param props - Component props containing children
 * @returns JSX element providing authentication context
 * 
 * @example
 * ```tsx
 * // Wrap your app or specific routes
 * function App() {
 *   return (
 *     <AuthProvider>
 *       <YourAppComponents />
 *     </AuthProvider>
 *   );
 * }
 * ```
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Sign out the current user
   * Clears the session and redirects to login page
   */
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      // State will be updated automatically by the auth state change listener
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  /**
   * Refresh the current session
   * Useful for manual token refresh or session validation
   */
  const refreshSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.refreshSession();
      setSession(session);
      setUser(session?.user ?? null);
    } catch (error) {
      console.error('Error refreshing session:', error);
    }
  };

  useEffect(() => {
    /**
     * Get initial session on component mount
     * This restores the user's authentication state if they have a valid session
     */
    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
        } else {
          setSession(session);
          setUser(session?.user ?? null);
        }
      } catch (error) {
        console.error('Error in getSession:', error);
      } finally {
        setIsLoading(false);
      }
    };

    getSession();

    /**
     * Listen for auth state changes
     * This handles login, logout, token refresh, and other auth events
     */
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        setSession(session);
        setUser(session?.user ?? null);
        
        // Set loading to false after any auth state change
        setIsLoading(false);
      }
    );

    // Cleanup subscription on unmount
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Context value object
  const value: AuthContextType = {
    user,
    session,
    isLoading,
    signOut,
    refreshSession,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Custom hook to access authentication context
 * 
 * Provides a convenient way to access authentication state and methods
 * from any component within the AuthProvider tree.
 * 
 * @returns Authentication context object
 * @throws Error if used outside of AuthProvider
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { user, isLoading, signOut } = useAuth();
 *   
 *   if (isLoading) return <div>Loading...</div>;
 *   
 *   return (
 *     <div>
 *       {user ? (
 *         <div>
 *           Welcome {user.email}!
 *           <button onClick={signOut}>Sign Out</button>
 *         </div>
 *       ) : (
 *         <div>Please sign in</div>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}
