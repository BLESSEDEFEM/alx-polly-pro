import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  
  // Skip middleware for auth routes to prevent redirect loops
  if (req.nextUrl.pathname.startsWith('/auth/')) {
    return res;
  }
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          res.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          res.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )
  
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    if (req.nextUrl.pathname.startsWith('/polls/create')) {
      // Check if we're already in a redirect loop
      const redirectAttempt = req.cookies.get('redirectAttempt')?.value;
      
      if (redirectAttempt === '/polls/create') {
        console.log('Redirect loop detected, clearing cookie and allowing access');
        const response = NextResponse.next();
        response.cookies.delete('redirectAttempt');
        return response;
      }
      
      // Include the redirect parameter to ensure proper return after login
      const redirectUrl = `/auth/login?redirect=${encodeURIComponent('/polls/create')}`;
      console.log('Middleware redirecting to:', redirectUrl);
      
      // Create the response with proper redirect
      const response = NextResponse.redirect(new URL(redirectUrl, req.url));
      
      // Set a cookie to track the redirect attempt
      response.cookies.set('redirectAttempt', '/polls/create', { 
        maxAge: 300,
        path: '/'
      });
      
      return response;
    }
  } else {
    // If user is authenticated and there's a redirectAttempt cookie,
    // clear it to prevent potential redirect loops
    if (req.cookies.has('redirectAttempt')) {
      res.cookies.delete('redirectAttempt');
    }
  }

  return res
}

export const config = {
  matcher: [
    '/polls/create',
  ],
}