import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const { optionIds } = await request.json();

  const supabase = createClient();

  // Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return NextResponse.json(
      { 
        success: false,
        message: 'Authentication required' 
      },
      { status: 401 }
    );
  }

  // Validate input
  if (!optionIds || !Array.isArray(optionIds) || optionIds.length === 0) {
    return NextResponse.json(
      { 
        success: false,
        message: 'At least one option must be selected' 
      },
      { status: 400 }
    );
  }

  // Check if poll exists and is active
  const { data: poll, error: fetchError } = await supabase
    .from('polls')
    .select('id, is_active, expires_at')
    .eq('id', id)
    .single();

  if (fetchError || !poll) {
    return NextResponse.json({ 
      success: false,
      message: 'Poll not found' 
    }, { status: 404 });
  }

  if (!poll.is_active) {
    return NextResponse.json({ 
      success: false,
      message: 'Poll is not active' 
    }, { status: 400 });
  }

  if (poll.expires_at && new Date(poll.expires_at) < new Date()) {
    return NextResponse.json({ 
      success: false,
      message: 'Poll has expired' 
    }, { status: 400 });
  }

  // Insert votes into the votes table (triggers will handle vote count increment)
  for (const optionId of optionIds) {
    const { error: insertError } = await supabase
      .from('votes')
      .insert({
        poll_id: id,
        option_id: optionId,
        user_id: user.id
      });

    if (insertError) {
      console.error('Error casting vote:', insertError);
      return NextResponse.json({ 
        success: false,
        message: 'Failed to cast vote', 
        error: insertError.message 
      }, { status: 500 });
    }
  }

  return NextResponse.json({ 
    success: true,
    message: 'Vote cast successfully' 
  });
}