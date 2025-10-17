/**
 * @fileoverview Authentication context provider for managing user authentication state
 * Provides authentication context and state management throughout the application
 * Enhanced for Polly-API compatibility with adaptive backend support
 */

'use client';

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { adaptiveClient } from '@/lib/adaptive-client';
import { getCookie, deleteCookie } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

/**
 * Generic user interface for Polly-API compatibility
 */
interface PollyUser {
  id: string;
  email: string;
  username?: string;
  name?: string;
  created_at?: string;
  last_sign_in_at?: string;
}

/**
 * Generic session interface for Polly-API compatibility
 */
interface PollySession {
  access_token?: string;
  token_type?: string;
  expires_at?: string;
  expires_in?: number;
  user?: PollyUser;
}

/**
 * Authentication context type definition
 * 
 * Defines the shape of the authentication context that will be available
 * to all components wrapped by the AuthProvider.
 */
interface AuthContextType {
  /** Current authenticated user object, null if not authenticated */
  user: PollyUser | null;
  /** Current session object containing tokens and user data */
  session: PollySession | null;
  /** Loading state for initial authentication check */
  isLoading: boolean;
  /** Loading state for initial authentication check (alias for compatibility) */
  loading: boolean;
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
  const [user, setUser] = useState<PollyUser | null>(null);
  const [session, setSession] = useState<PollySession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const isRefreshingRef = useRef(false);
  const refreshPromiseRef = useRef<Promise<void> | null>(null);
  // Abort controller for canceling in-flight refreshes
  const refreshAbortControllerRef = useRef<AbortController | null>(null);
  // Monotonic version token to ignore stale refresh results
  const sessionVersionRef = useRef<number>(0);
  // Track periodic refresh timer so we can clear on signOut
  const sessionRefreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Track auth state change subscription to allow explicit unsubscribe on signOut
  const authListenerRef = useRef<{ subscription: { unsubscribe: () => void } } | null>(null);
  const hasAttemptedInitialSessionRef = useRef(false);
  const explicitLoginDetectedRef = useRef(false);
  const router = useRouter();
  const backendType = adaptiveClient.getBackendType();
  // Allow disabling automatic session restoration on Supabase via env
  const autoSignInEnabled = (process.env.NEXT_PUBLIC_AUTO_SIGNIN ?? 'false').toLowerCase() === 'true';
  const hasJustSignedInFlag = () => {
    try {
      return typeof window !== 'undefined' && !!sessionStorage.getItem('authJustSignedIn');
    } catch (_) {
      return false;
    }
  };
  const clearJustSignedInFlag = () => {
    try {
      if (typeof window !== 'undefined') sessionStorage.removeItem('authJustSignedIn');
    } catch (_) {
      // no-op
    }
  };
  // Additional explicit login flag stored in localStorage to survive route changes
  const hasExplicitLoginFlag = () => {
    try {
      return typeof window !== 'undefined' && localStorage.getItem('explicit_login') === 'true';
    } catch (_) {
      return false;
    }
  };
  const clearExplicitLoginFlag = () => {
    try {
      if (typeof window !== 'undefined') localStorage.removeItem('explicit_login');
    } catch (_) {
      // no-op
    }
  };
  const hasActiveAuthSessionFlag = () => {
    try {
      return typeof window !== 'undefined' && sessionStorage.getItem('authSessionActive') === 'true';
    } catch (_) {
      return false;
    }
  };
  const setActiveAuthSessionFlag = () => {
    try {
      if (typeof window !== 'undefined') sessionStorage.setItem('authSessionActive', 'true');
    } catch (_) {
      // no-op
    }
  };
  const clearActiveAuthSessionFlag = () => {
    try {
      if (typeof window !== 'undefined') sessionStorage.removeItem('authSessionActive');
    } catch (_) {
      // no-op
    }
  };

  /**
   * Clear all local auth state and cancel in-flight work
   * - Aborts pending refresh requests
   * - Clears timers and subscriptions
   * - Bumps session version to ignore stale promises
   * - Clears local flags and storage
   */
  const clearLocalAuthState = () => {
    try {
      // Abort any in-flight refresh
      try {
        refreshAbortControllerRef.current?.abort();
      } catch (_) {
        // no-op
      }
      isRefreshingRef.current = false;
      refreshPromiseRef.current = null;

      // Bump version so older refreshes are ignored
      sessionVersionRef.current++;

      // Clear timers
      if (sessionRefreshIntervalRef.current) {
        try { clearInterval(sessionRefreshIntervalRef.current as any); } catch (_) {}
        sessionRefreshIntervalRef.current = null;
      }

      // Keep auth state listener active; it will handle SIGNED_OUT/SIGNED_IN events.
      // We no longer unsubscribe here to ensure immediate re-login events are captured.

      // Reset refs tracking initialization/login hints
      hasAttemptedInitialSessionRef.current = false;
      explicitLoginDetectedRef.current = false;

      // Clear React state
      setSession(null);
      setUser(null);
      setIsLoading(false);

      // Clear any stored auth data/flags
      try {
        sessionStorage.removeItem('authRedirect');
        sessionStorage.removeItem('authRedirectPath');
        localStorage.removeItem('authRedirectPath');
        // Clear explicit login and any stored tokens used by clients
        localStorage.removeItem('explicit_login');
        localStorage.removeItem('fastapi_token');
        localStorage.removeItem('auth-token');
      } catch (_) {}
      deleteCookie('authRedirect');
      // Clear auxiliary cookies that may affect redirects/auth state if present
      deleteCookie('redirectAttempt');
      deleteCookie('authSuccess');
      clearActiveAuthSessionFlag();
      clearJustSignedInFlag();
      clearExplicitLoginFlag();
    } catch (e) {
      console.error('Error clearing local auth state:', e);
    }
  };

  /**
   * Sign out the current user
   * Clears the session and redirects to login page
   */
  const signOut = async () => {
    try {
      // Ensure any in-flight refresh is canceled before sign-out
      try { refreshAbortControllerRef.current?.abort(); } catch (_) {}
      isRefreshingRef.current = false;
      refreshPromiseRef.current = null;
      hasAttemptedInitialSessionRef.current = false;
      explicitLoginDetectedRef.current = false;

      // Determine backend and perform appropriate logout
      const backend = adaptiveClient.getBackendType();

      if (backend === 'fastapi') {
        // Do not block on FastAPI; enforce a short timeout
        const logoutPromise = adaptiveClient.auth.logout();
        const timeoutPromise = new Promise(resolve => setTimeout(resolve, 1500));
        const result: any = await Promise.race([logoutPromise, timeoutPromise]);
        if (!result?.success) {
          console.error('FastAPI logout failed:', result?.error);
        }
      } else {
        // Supabase sign-out with timeout to avoid hanging
        const signOutPromise = supabase.auth.signOut({ scope: 'local' });
        const timeoutPromise = new Promise(resolve => setTimeout(resolve, 1500));
        const outcome: any = await Promise.race([signOutPromise, timeoutPromise]);
        const error = outcome?.error;
        if (error) {
          console.error('Error signing out (Supabase):', error);
        }
        // Belt-and-suspenders: clear server-side cookies too
        try {
          // Fire-and-forget server-side logout; do not await
          void fetch('/api/auth/logout', { method: 'POST' });
        } catch (e) {
          console.warn('Server logout POST failed:', e);
        }
      }
      
      // Clear local state and cancel timers/listeners
      clearLocalAuthState();
      
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  /**
   * Refresh the session data
   * This is used to update the session after login/logout
   */
  const refreshSession = useCallback(async () => {
    // Cancel any in-flight refresh to avoid overlapping state writes
    if (isRefreshingRef.current && refreshPromiseRef.current) {
      try { refreshAbortControllerRef.current?.abort(); } catch (_) {}
    }
    isRefreshingRef.current = true;
    const controller = new AbortController();
    refreshAbortControllerRef.current = controller;
    const versionSnapshot = sessionVersionRef.current;
    console.log('Refreshing session...');

    refreshPromiseRef.current = (async () => {
      try {
        // Use adaptive client to get session, respecting backend type
        const result = await adaptiveClient.auth.getSession();
        // If we were aborted or version bumped, ignore this result
        if (refreshAbortControllerRef.current?.signal.aborted || sessionVersionRef.current !== versionSnapshot) {
          console.log('Refresh aborted or stale; ignoring result');
          return;
        }
        if (!result.success) {
          console.error('Error refreshing session:', result.error);
          setSession(null);
          setUser(null);
          clearActiveAuthSessionFlag();
          return;
        }

        if (backendType === 'fastapi') {
          // For FastAPI, if authenticated, fetch current user explicitly
          if (result.data?.authenticated) {
            const token = typeof window !== 'undefined' ? localStorage.getItem('fastapi_token') : null;
            try {
              const me = await adaptiveClient.auth.getCurrentUser();
              if (me.success && me.data) {
                const u = me.data;
                const pollySession: PollySession = {
                  access_token: token || undefined,
                  token_type: 'Bearer',
                  user: {
                    id: String(u.id),
                    email: u.email || '',
                    username: u.username,
                    name: u.username,
                    created_at: u.created_at,
                  },
                };
          // Ignore stale refreshes
          if (sessionVersionRef.current !== versionSnapshot) {
            console.log('Stale refresh detected after FastAPI getCurrentUser; ignoring');
            return;
          }
          setSession(pollySession);
          setUser(pollySession.user!);
          setActiveAuthSessionFlag();
          return;
        }
            } catch (e) {
              console.warn('Failed to fetch FastAPI current user:', e);
            }
          }
          // Not authenticated or failed to fetch user
          setSession(null);
          setUser(null);
          clearActiveAuthSessionFlag();
          return;
        }

        // Supabase backend: use session.user if present
        if (result.data?.session?.user) {
          const sessionData = result.data.session;
          const userData = sessionData.user;
          const pollySession: PollySession = {
            access_token: (sessionData as any).access_token,
            token_type: 'Bearer',
            expires_at: (sessionData as any).expires_at,
            expires_in: (sessionData as any).expires_in,
            user: {
              id: userData.id,
              email: userData.email!,
              username: (userData as any).user_metadata?.username,
              name: (userData as any).user_metadata?.full_name || (userData as any).user_metadata?.name,
              created_at: (userData as any).created_at,
              last_sign_in_at: (userData as any).last_sign_in_at,
            },
          };
          if (sessionVersionRef.current !== versionSnapshot) {
            console.log('Stale refresh detected on Supabase session; ignoring');
            return;
          }
          setSession(pollySession);
          setUser(pollySession.user!);
          setActiveAuthSessionFlag();
        } else {
          console.log('No active session found');
          if (sessionVersionRef.current !== versionSnapshot) {
            console.log('Stale refresh detected on no-session; ignoring');
            return;
          }
          setSession(null);
          setUser(null);
          clearActiveAuthSessionFlag();
        }
      } catch (error) {
        console.error('Error in refreshSession:', error);
        if (sessionVersionRef.current === versionSnapshot) {
          setSession(null);
          setUser(null);
          clearActiveAuthSessionFlag();
        }
      } finally {
        isRefreshingRef.current = false;
        refreshPromiseRef.current = null;
        // Clear controller only if it's ours
        if (refreshAbortControllerRef.current === controller) {
          refreshAbortControllerRef.current = null;
        }
      }
    })();

    return refreshPromiseRef.current;
  }, []);

  // Check for stored redirect paths and verify session persistence
  const checkStoredRedirects = () => {
    try {
      // Check for stored redirect paths
      const sessionRedirect = sessionStorage.getItem('authRedirectPath');
      const localRedirect = localStorage.getItem('authRedirectPath');
      
      if (sessionRedirect || localRedirect) {
        console.log('Found stored redirect path:', sessionRedirect || localRedirect);
      }
      
      // Check for auth cookies
      const cookies = document.cookie.split(';').map(cookie => cookie.trim());
      const authCookie = cookies.find(cookie => cookie.startsWith('authRedirect='));
      
      if (authCookie) {
        const cookieValue = decodeURIComponent(authCookie.split('=')[1]);
        console.log('Found auth redirect cookie:', cookieValue);
      }
    } catch (error) {
      console.error('Error checking stored redirects:', error);
    }
  };

  // Initialization: run once on mount to restore session
  useEffect(() => {
    const getSession = async () => {
      console.log('AuthProvider - Initializing');
      try {
        checkStoredRedirects();
        if (backendType === 'supabase' && !autoSignInEnabled) {
          if (hasJustSignedInFlag() || hasActiveAuthSessionFlag() || hasExplicitLoginFlag()) {
            console.log('Explicit login detected; restoring session despite auto sign-in disabled');
            await refreshSession();
            // Clear "just signed in" flag once we’ve restored session
            clearJustSignedInFlag();
            clearExplicitLoginFlag();
          } else {
            console.log('Auto sign-in disabled; skipping initial session restoration');
            setSession(null);
            setUser(null);
          }
        } else {
          await refreshSession();
        }
      } catch (error) {
        console.error('Error in getSession:', error);
      } finally {
        setIsLoading(false);
      }
    };
    getSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Periodic session refresh: set interval and clean up; do not re-run initialization
  useEffect(() => {
    // Clear any existing interval before setting a new one
    if (sessionRefreshIntervalRef.current) {
      try { clearInterval(sessionRefreshIntervalRef.current as any); } catch (_) {}
      sessionRefreshIntervalRef.current = null;
    }
    const sessionRefreshInterval = setInterval(async () => {
      try {
        if (session) {
          await refreshSession();
        }
      } catch (error) {
        console.error('Error in periodic session refresh:', error);
      }
    }, 5 * 60 * 1000);
    sessionRefreshIntervalRef.current = sessionRefreshInterval;
    return () => {
      try { clearInterval(sessionRefreshInterval as any); } catch (_) {}
      if (sessionRefreshIntervalRef.current === sessionRefreshInterval) {
        sessionRefreshIntervalRef.current = null;
      }
    };
  }, [refreshSession, session]);

  // Recovery flow handler: redirect to reset page when Supabase signals recovery
  useEffect(() => {
    const detectRecoveryContext = () => {
      if (typeof window === 'undefined') return false;
      const search = window.location.search || '';
      const hash = window.location.hash || '';
      const searchParams = new URLSearchParams(search);
      const hashParams = new URLSearchParams(hash.replace('#', ''));
      const hasCode = !!searchParams.get('code');
      const isHashRecovery = hashParams.get('type') === 'recovery';
      return hasCode || isHashRecovery;
    };
    const isRecoveryHash = () => {
      if (typeof window === 'undefined') return false;
      const hash = window.location.hash || '';
      const params = new URLSearchParams(hash.replace('#', ''));
      return params.get('type') === 'recovery';
    };

    // If we landed with a recovery hash but not on the reset page, route there
    try {
      if (typeof window !== 'undefined') {
        const pathname = window.location.pathname;
        const search = window.location.search || '';
        const hash = window.location.hash || '';

        // If recovery hash is present, ensure we are on the reset page
        if (isRecoveryHash() && pathname !== '/auth/reset-password') {
          router.replace(`/auth/reset-password${search}${hash}`);
        }

        // If Supabase sent a PKCE code (?code=...), try to exchange it and go to reset page
        const searchParams = new URLSearchParams(search);
        const codeParam = searchParams.get('code');
        if (codeParam && pathname !== '/auth/reset-password') {
          // Attempt to exchange code for a session
          supabase.auth
            .exchangeCodeForSession(codeParam)
            .catch((e) => console.warn('AuthProvider: exchangeCodeForSession failed (may be already handled):', e));

          // Navigate to reset page preserving query/hash so recovery remains intact
          router.replace(`/auth/reset-password${search}${hash}`);
        }

        // Track recovery mode for UI suppression outside reset page
        setIsRecoveryMode(detectRecoveryContext());
      }
    } catch (err) {
      console.warn('AuthProvider recovery pre-check failed:', err);
    }

    // Only listen to Supabase auth changes when using Supabase backend
    if (backendType !== 'supabase') {
      return () => {
        // no-op cleanup when not using Supabase
      };
    }

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, authSession) => {
      // Keep local state fresh
      try {
        // Handle signed out explicitly to reset state and flags
        if (event === 'SIGNED_OUT') {
          clearLocalAuthState();
          return;
        }

        // Handle INITIAL_SESSION only once
        if (event === 'INITIAL_SESSION') {
          if (hasAttemptedInitialSessionRef.current) {
            console.log('INITIAL_SESSION already processed, skipping');
            return;
          }
          hasAttemptedInitialSessionRef.current = true;
        }

        // Avoid auto sign-in: skip refresh on INITIAL_SESSION when disabled,
        // except immediately after an explicit login
        if (backendType === 'supabase' && !autoSignInEnabled && event === 'INITIAL_SESSION') {
          if (hasJustSignedInFlag() || hasActiveAuthSessionFlag() || hasExplicitLoginFlag()) {
            console.log('Explicit login detected during INITIAL_SESSION; refreshing');
            await refreshSession();
            clearJustSignedInFlag();
            clearExplicitLoginFlag();
          } else {
            console.log('Auto sign-in disabled; ignoring INITIAL_SESSION event');
          }
        } else {
          await refreshSession();
        }
      } catch (e) {
        console.error('Error refreshing after auth event:', e);
      }

      // Handle recovery-specific navigation
      const hasCode = typeof window !== 'undefined' ? new URLSearchParams(window.location.search || '').get('code') : null;
      const shouldGoToReset =
        event === 'PASSWORD_RECOVERY' ||
        (event === 'SIGNED_IN' && (isRecoveryHash() || !!hasCode));

      if (shouldGoToReset) {
        try {
          // Avoid redirect loops if we’re already on the reset page
          const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
          const search = typeof window !== 'undefined' ? window.location.search || '' : '';
          const hash = typeof window !== 'undefined' ? window.location.hash || '' : '';
          if (pathname !== '/auth/reset-password') {
            router.replace(`/auth/reset-password${search}${hash}`);
          }
          setIsRecoveryMode(true);
        } catch (e) {
          console.error('Error redirecting to reset page:', e);
        }
      }

      // If no recovery params remain, clear recovery mode
      try {
        const isRecoveryNow = detectRecoveryContext();
        if (!isRecoveryNow) setIsRecoveryMode(false);
      } catch (_) {
        // no-op
      }
    });
    // Track subscription so we can unsubscribe on signOut
    authListenerRef.current = authListener;

    return () => {
      try {
        authListener.subscription.unsubscribe();
      } catch (_) {
        // no-op
      }
      if (authListenerRef.current === authListener) {
        authListenerRef.current = null;
      }
    };
  }, [router, refreshSession]);

  // Context value object
  const exposedUser = (() => {
    if (typeof window === 'undefined') return user;
    const pathname = window.location.pathname;
    // During recovery, suppress "logged-in" UI outside the reset page
    if (isRecoveryMode && pathname !== '/auth/reset-password') return null;
    return user;
  })();

  const value: AuthContextType = {
    user: exposedUser,
    session,
    isLoading,
    loading: isLoading, // Alias for compatibility
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
