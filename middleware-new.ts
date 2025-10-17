import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Enhanced middleware for authentication and route protection
 * 
 * This middleware:
 * - Checks authentication state for protected routes
 * - Handles redirects with proper parameters
 * - Manages cookies for authentication flow
 * - Provides detailed logging for debugging
 * 
 * @param req - The incoming request
 * @returns The response, potentially redirected for authentication
 */
export async function middleware(req: NextRequest) {
  console.log('Middleware - Processing request for:', req.nextUrl.pathname);
  
  // Create a response to modify
  const res = NextResponse.next();
  
  // Create Supabase client for server-side auth checks
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          res.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: any) {
          res.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );
  
  // Check authentication state
  const { data: { session } } = await supabase.auth.getSession();
  
  // Get the current URL path
  const path = req.nextUrl.pathname;
  
  // Check if this is a protected route
  const isProtectedRoute = path.startsWith('/polls/create') || 
                          path.startsWith('/dashboard') || 
                          path.startsWith('/settings') || 
                          path.startsWith('/admin');
  
  // Handle authentication for protected routes
  if (isProtectedRoute) {
    if (!session) {
      console.log('Middleware - Unauthenticated access to protected route:', path);
      
      // Encode the current path for redirect after login
      const encodedRedirect = encodeURIComponent(path);
      const redirectUrl = `/auth/login?redirect=${encodedRedirect}`;
      
      console.log('Middleware - Redirecting to:', redirectUrl);
      
      // Create redirect response
      const redirectResponse = NextResponse.redirect(new URL(redirectUrl, req.url));
      
      // Set cookies to track the redirect attempt
      redirectResponse.cookies.set('redirectAttempt', path, { 
        maxAge: 300, // 5 minutes
        path: '/',
        httpOnly: false,
      });
      
      // Set the original URL for potential direct redirect after auth
      redirectResponse.cookies.set('originalUrl', path, {
        maxAge: 300,
        path: '/',
        httpOnly: false,
      });
      
      return redirectResponse;
    } else {
      console.log('Middleware - Authenticated access to protected route:', path);
    }
  }
  
  // Handle post-authentication redirects
  if (session) {
    // Check for redirect attempt cookie
    const redirectAttempt = req.cookies.get('redirectAttempt')?.value;
    const originalUrl = req.cookies.get('originalUrl')?.value;
    
    // Clear redirect tracking cookies if present
    if (redirectAttempt || originalUrl) {
      res.cookies.delete('redirectAttempt');
      res.cookies.delete('originalUrl');
    }
    
    // If we're on the login page and already authenticated, redirect to dashboard
    if (path.startsWith('/auth/login') || path.startsWith('/auth/register')) {
      console.log('Middleware - Already authenticated user on auth page, redirecting');
      
      // Check for redirect parameter in URL
      const redirectParam = req.nextUrl.searchParams.get('redirect');
      
      // Determine where to redirect
      const redirectTo = redirectParam || originalUrl || '/dashboard';
      console.log('Middleware - Redirecting authenticated user to:', redirectTo);
      
      return NextResponse.redirect(new URL(redirectTo, req.url));
    }
  }

  return res;
}

/**
 * Matcher configuration for the middleware
 * Specifies which routes the middleware should run on
 */
export const config = {
  matcher: [
    // Protected routes
    '/polls/create/:path*',
    '/dashboard/:path*',
    '/settings/:path*',
    '/admin/:path*',
    // Auth routes for redirect handling
    '/auth/login',
    '/auth/register',
  ],
};