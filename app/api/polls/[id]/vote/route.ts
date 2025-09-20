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
      { message: 'Authentication required' },
      { status: 401 }
    );
  }

  // Validate input
  if (!optionIds || !Array.isArray(optionIds) || optionIds.length === 0) {
    return NextResponse.json(
      { message: 'At least one option must be selected' },
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
    return NextResponse.json({ message: 'Poll not found' }, { status: 404 });
  }

  if (!poll.is_active) {
    return NextResponse.json({ message: 'Poll is not active' }, { status: 400 });
  }

  if (poll.expires_at && new Date(poll.expires_at) < new Date()) {
    return NextResponse.json({ message: 'Poll has expired' }, { status: 400 });
  }

  // Increment votes for selected options using RPC function
  for (const optionId of optionIds) {
    const { error: updateError } = await supabase
      .rpc('increment_vote_count', { 
        option_id: optionId,
        poll_id: id 
      });

    if (updateError) {
      console.error('Error casting vote:', updateError);
      return NextResponse.json({ 
        message: 'Failed to cast vote', 
        error: updateError.message 
      }, { status: 500 });
    }
  }

  return NextResponse.json({ message: 'Vote cast successfully' });
}