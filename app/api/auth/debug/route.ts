import { NextResponse } from 'next/server';
import { adaptiveClient } from '@/lib/adaptive-client';

/**
 * Debug API endpoint for authentication status
 * Enhanced for Polly-API compatibility with adaptive backend support
 */
export async function GET(request: Request) {
  try {
    // Get the current session using adaptive client
    const sessionResult = await adaptiveClient.auth.getSession();

    if (!sessionResult.success) {
      console.error('Debug API - Session error:', sessionResult.error);
      return NextResponse.json({
        status: 'error',
        message: 'Error getting session',
        error: sessionResult.error,
        backend: process.env.NEXT_PUBLIC_BACKEND_TYPE || 'supabase',
      }, { status: 500 });
    }

    // Get current user information
    const userResult = await adaptiveClient.auth.getCurrentUser();

    if (!userResult.success) {
      console.error('Debug API - User error:', userResult.error);
      return NextResponse.json({
        status: 'error',
        message: 'Error getting user',
        error: userResult.error,
        session: sessionResult.data?.authenticated ? { 
          authenticated: true,
          expires_at: sessionResult.data.expires_at 
        } : null,
        backend: process.env.NEXT_PUBLIC_BACKEND_TYPE || 'supabase',
      }, { status: 500 });
    }

    // Return standardized debug information
    return NextResponse.json({
      status: 'success',
      authenticated: sessionResult.data?.authenticated || false,
      backend: process.env.NEXT_PUBLIC_BACKEND_TYPE || 'supabase',
      user: userResult.data ? {
        id: userResult.data.id,
        email: userResult.data.email,
        username: userResult.data.username,
        name: userResult.data.name,
        created_at: userResult.data.created_at,
        last_sign_in_at: userResult.data.last_sign_in_at,
      } : null,
      session: sessionResult.data?.authenticated ? {
        access_token: sessionResult.data.token ? '***' : null, // Masked for security
        token_type: sessionResult.data.token_type,
        expires_at: sessionResult.data.expires_at,
        expires_in: sessionResult.data.expires_in,
      } : null,
    });
  } catch (error: any) {
    console.error('Debug API - Unexpected error:', error);
    return NextResponse.json({
      status: 'error',
      message: 'Internal server error',
      error: error.message,
      backend: process.env.NEXT_PUBLIC_BACKEND_TYPE || 'supabase',
    }, { status: 500 });
  }
}