import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ message: 'Email is required' }, { status: 400 });
    }

    const supabase = createClient();

    // Determine origin using the current request's host to preserve port
    // This prevents mismatches like clicking on :3001 but receiving links to :3000
    const host = request.headers.get('host');
    const protocol = (request.headers.get('x-forwarded-proto') || 'http').split(',')[0].trim();
    const computedOrigin = host ? `${protocol}://${host}` : undefined;

    // Environment fallbacks
    const envOrigin = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || undefined;
    const externalUrl = process.env.NEXT_PUBLIC_EXTERNAL_URL || process.env.EXTERNAL_URL || undefined;

    // Prefer the actual request origin first (most reliable for local dev),
    // then environment SITE_URL, then external URL, finally default to :3001.
    const chosenOrigin = (computedOrigin || envOrigin || externalUrl || 'http://localhost:3001').replace(/\/$/, '');

    const redirectTo = `${chosenOrigin}/auth/reset-password`;

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });
    if (error) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    return NextResponse.json({ message: 'If that email exists, a reset link has been sent.' }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ message: err?.message || 'Unexpected server error' }, { status: 500 });
  }
}