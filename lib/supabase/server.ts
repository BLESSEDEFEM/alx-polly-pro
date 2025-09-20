/**
 * @fileoverview Server-side Supabase client configuration
 * Provides a configured Supabase client for server-side operations with cookie handling
 */

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Creates a Supabase client configured for server-side operations
 * 
 * This function creates a server-side Supabase client that:
 * - Handles authentication cookies automatically
 * - Works with Next.js App Router server components
 * - Manages session state across server requests
 * - Provides secure cookie-based authentication
 * 
 * The client handles cookie operations for:
 * - Session persistence
 * - Authentication state management
 * - Secure token storage
 * 
 * @returns Configured Supabase client for server-side operations
 * 
 * @example
 * ```typescript
 * // In a server component or API route
 * import { createClient } from '@/lib/supabase/server';
 * 
 * export default async function ServerComponent() {
 *   const supabase = createClient();
 *   const { data: user } = await supabase.auth.getUser();
 *   
 *   return <div>Welcome {user?.email}</div>;
 * }
 * ```
 */
export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        /**
         * Retrieves a cookie value by name
         * Used by Supabase to read authentication tokens
         */
        async get(name: string) {
          return (await cookieStore).get(name)?.value;
        },
        
        /**
         * Sets a cookie with the specified name, value, and options
         * Used by Supabase to store authentication tokens
         */
        async set(name: string, value: string, options: CookieOptions) {
          try {
            (await cookieStore).set({ name, value, ...options });
          } catch (error) {
            // The `cookies().set()` method can only be called in a Server Component or Route Handler.
            // If you're calling this from a Client Component, it's likely because you're in an event handler
            // that's not yet part of a Server Action.
            // This error is safe to ignore if you're just trying to set a cookie and not expecting a fresh request.
          }
        },
        
        /**
         * Removes a cookie by setting it with an expired date
         * Used by Supabase during logout operations
         */
        async remove(name: string, value: string, options: CookieOptions) {
          try {
            (await cookieStore).set({ name, value, ...options });
          } catch (error) {
            // This error is safe to ignore
          }
        },
      },
    }
  );
}
