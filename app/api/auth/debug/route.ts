import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const supabase = createClient();

    // Get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('Debug API - Session error:', sessionError);
      return NextResponse.json({
        status: 'error',
        message: 'Error getting session',
        error: sessionError.message,
      }, { status: 500 });
    }

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError) {
      console.error('Debug API - User error:', userError);
      return NextResponse.json({
        status: 'error',
        message: 'Error getting user',
        error: userError.message,
        session: session ? { id: session.id, expires_at: session.expires_at } : null,
      }, { status: 500 });
    }

    return NextResponse.json({
      status: 'success',
      authenticated: !!user,
      user: user ? {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at,
      } : null,
      session: session ? {
        id: session.id,
        expires_at: session.expires_at,
        created_at: session.created_at,
      } : null,
    });
  } catch (error: any) {
    console.error('Debug API - Unexpected error:', error);
    return NextResponse.json({
      status: 'error',
      message: 'Internal server error',
      error: error.message,
    }, { status: 500 });
  }
}