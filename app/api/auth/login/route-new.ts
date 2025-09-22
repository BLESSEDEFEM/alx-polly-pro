import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Enhanced login API route handler
 * 
 * This handler provides a more robust login process with:
 * - Comprehensive error handling
 * - Detailed logging for debugging
 * - Proper cookie management for authentication
 * - Support for redirect URLs
 * 
 * @param request - The incoming request object
 * @returns Response with authentication result
 */
export async function POST(request: NextRequest) {
  console.log('Login API - Processing login request');
  
  try {
    // Extract request data
    const requestData = await request.json();
    const { email, password, redirectTo } = requestData;

    // Validate required fields
    if (!email || !password) {
      console.log('Login API - Missing required fields');
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Create Supabase client
    const supabase = createClient();

    // Attempt authentication
    console.log(`Login API - Attempting login for email: ${email.substring(0, 3)}...`);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // Handle authentication errors
    if (error) {
      console.error('Login API - Authentication error:', error.message);
      return NextResponse.json(
        { message: error.message, code: error.code },
        { status: 401 }
      );
    }

    // Authentication successful
    console.log('Login API - Login successful for user:', data.user?.id);
    
    // Create the response with authentication data
    const response = NextResponse.json({
      message: 'Login successful',
      user: {
        id: data.user?.id,
        email: data.user?.email,
        created_at: data.user?.created_at,
      },
      session: {
        expires_at: data.session?.expires_at,
      },
      redirectTo: redirectTo || '/',
    });
    
    // Set cookies to help with client-side redirect handling
    
    // 1. Authentication success indicator
    response.cookies.set('authSuccess', 'true', {
      maxAge: 60, // Short-lived cookie, just for the redirect
      path: '/',
      httpOnly: false, // Allow JavaScript access
      sameSite: 'strict',
    });
    
    // 2. Store redirect URL if provided
    if (redirectTo) {
      response.cookies.set('authRedirect', redirectTo, {
        maxAge: 300, // 5 minutes
        path: '/',
        httpOnly: false,
        sameSite: 'strict',
      });
      
      console.log('Login API - Set redirect cookie to:', redirectTo);
    }
    
    // 3. Set a timestamp for the authentication
    response.cookies.set('authTimestamp', Date.now().toString(), {
      maxAge: 60,
      path: '/',
      httpOnly: false,
      sameSite: 'strict',
    });
    
    return response;
  } catch (error) {
    // Handle unexpected errors
    console.error('Login API - Unexpected error:', error);
    
    return NextResponse.json(
      { message: 'Internal server error during login process' },
      { status: 500 }
    );
  }
}