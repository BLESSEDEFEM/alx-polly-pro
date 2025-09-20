/**
 * @fileoverview Supabase client configuration for browser-side operations
 * Provides a configured Supabase client instance for authentication and database operations
 */

import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs';

/**
 * Supabase client instance for browser-side operations
 * 
 * This client is configured to work with Next.js pages and provides:
 * - Authentication methods (sign in, sign up, sign out)
 * - Database operations (CRUD operations)
 * - Real-time subscriptions
 * - Storage operations
 * 
 * The client automatically handles:
 * - Session management
 * - Token refresh
 * - Cookie-based authentication
 * 
 * @example
 * ```typescript
 * // Authentication
 * const { data, error } = await supabase.auth.signInWithPassword({
 *   email: 'user@example.com',
 *   password: 'password'
 * });
 * 
 * // Database operations
 * const { data: polls } = await supabase
 *   .from('polls')
 *   .select('*');
 * ```
 */
export const supabase = createPagesBrowserClient();

// Validate environment variables in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.warn('⚠️ NEXT_PUBLIC_SUPABASE_URL is not set in environment variables');
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.warn('⚠️ NEXT_PUBLIC_SUPABASE_ANON_KEY is not set in environment variables');
  }
}
