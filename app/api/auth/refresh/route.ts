import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = createClient();

    const { data, error } = await supabase.auth.refreshSession();

    if (error) {
      console.error('Token refresh error:', error);
      return NextResponse.json(
        { message: error.message },
        { status: 401 }
      );
    }

    return NextResponse.json({
      message: 'Token refreshed successfully',
      session: data.session,
      user: data.user,
    });
  } catch (error) {
    console.error('Token refresh API error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}