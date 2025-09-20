import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const supabase = createClient();

    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) {
      console.error('Token validation error:', error);
      return NextResponse.json(
        { message: 'Invalid token', valid: false },
        { status: 401 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { message: 'No user found', valid: false },
        { status: 401 }
      );
    }

    return NextResponse.json({
      message: 'Token is valid',
      valid: true,
      user,
    });
  } catch (error) {
    console.error('Token validation API error:', error);
    return NextResponse.json(
      { message: 'Internal server error', valid: false },
      { status: 500 }
    );
  }
}