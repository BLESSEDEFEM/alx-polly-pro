import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { EmailOtpType } from '@supabase/supabase-js';

/**
 * Server-side auth confirmation handler
 *
 * Handles both Supabase email token_hash flows (type=recovery, email, etc.)
 * and PKCE code flows (?code=...), establishing a session via cookies and
 * then redirecting the user to the desired page.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const token_hash = url.searchParams.get('token_hash');
  const type = (url.searchParams.get('type') as EmailOtpType | null) ?? null;
  const nextParam = url.searchParams.get('next');
  const code = url.searchParams.get('code');

  const supabase = createClient();

  // Compute safe redirect target: prefer `next` if it is a path, else fallback
  const safeNext = (() => {
    if (nextParam && /^\//.test(nextParam)) return nextParam;
    return '/auth/reset-password';
  })();

  try {
    // Prefer PKCE code exchange when present
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        const msg = encodeURIComponent(error.message || 'Code exchange failed');
        return NextResponse.redirect(new URL(`/auth/reset-password?error=${msg}`, url.origin));
      }
      return NextResponse.redirect(new URL(safeNext, url.origin));
    }

    // Fallback to token_hash verification for email-based flows
    if (token_hash && type) {
      const { error } = await supabase.auth.verifyOtp({ token_hash, type });
      if (error) {
        const msg = encodeURIComponent(error.message || 'Token verification failed');
        return NextResponse.redirect(new URL(`/auth/reset-password?error=${msg}`, url.origin));
      }
      return NextResponse.redirect(new URL(safeNext, url.origin));
    }

    // Nothing to verify; redirect with a helpful message
    return NextResponse.redirect(
      new URL('/auth/reset-password?error=Missing+token+or+code', url.origin)
    );
  } catch (e: any) {
    const msg = encodeURIComponent(e?.message || 'Confirmation failed');
    return NextResponse.redirect(new URL(`/auth/reset-password?error=${msg}`, url.origin));
  }
}