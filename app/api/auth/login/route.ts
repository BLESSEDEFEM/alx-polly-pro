import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Login error:', error);
      return NextResponse.json(
        { message: error.message },
        { status: 401 }
      );
    }

    // Create the response
    const response = NextResponse.json({
      message: 'Login successful',
      user: data.user,
      session: data.session,
    });
    
    // Set a cookie to indicate successful authentication
    // This helps with client-side redirect reliability
    response.cookies.set('authSuccess', 'true', {
      maxAge: 60, // Short-lived cookie, just for the redirect
      path: '/',
      httpOnly: false, // Allow JavaScript access
      sameSite: 'strict'
    });
    
    return response;
  } catch (error) {
    console.error('Login API error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}