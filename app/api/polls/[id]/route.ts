import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server'; // Import the new server-side Supabase client
import { Poll } from '@/types';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params
  const { id } = resolvedParams;
  const supabase = createClient();

  // Get poll with vote counts
  const { data: pollData, error } = await supabase
    .from('polls')
    .select(`
      *,
      options:poll_options(id, text, vote_count)
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching poll:', error);
    if (error.code === 'PGRST116') { // No rows found
      return NextResponse.json({ message: 'Poll not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Failed to fetch poll', error: error.message }, { status: 500 });
  }

  if (!pollData) {
    return NextResponse.json({ message: 'Poll not found' }, { status: 404 });
  }

  console.log('Poll data from database:', pollData);
  console.log('Poll options with vote counts:', pollData.options);
  
  const poll: Poll = {
    id: pollData.id,
    title: pollData.title,
    description: pollData.description,
    options: pollData.options.map((option: any) => ({
      id: option.id,
      text: option.text,
      votes: option.vote_count || 0, // Ensure vote_count is never undefined
      pollId: pollData.id,
    })),
    createdBy: pollData.created_by,
    createdAt: new Date(pollData.created_at),
    updatedAt: new Date(pollData.updated_at),
    isActive: pollData.is_active,
    expiresAt: pollData.expires_at ? new Date(pollData.expires_at) : undefined,
    allowMultipleVotes: pollData.allow_multiple_votes,
    isAnonymous: pollData.is_anonymous,
    pollCategory: pollData.poll_category || 'general',
  };

  return NextResponse.json(poll);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const { id } = resolvedParams;
  const supabase = createClient();

  // Ensure user is authenticated; RLS will enforce ownership/admin
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json(
      { message: 'Authentication required' },
      { status: 401 }
    );
  }

  // Fetch poll to verify ownership before attempting deletion
  const { data: pollRow, error: fetchError } = await supabase
    .from('polls')
    .select('id, created_by')
    .eq('id', id)
    .single();

  if (fetchError) {
    const status = fetchError.code === 'PGRST116' ? 404 : 500;
    return NextResponse.json(
      { message: status === 404 ? 'Poll not found' : 'Failed to load poll', error: fetchError.message },
      { status }
    );
  }

  // Enforce creator-only deletion on the server side (in addition to RLS)
  if (!pollRow || pollRow.created_by !== user.id) {
    return NextResponse.json(
      { message: 'Only the poll creator can delete this poll' },
      { status: 403 }
    );
  }

  // Attempt to delete the poll; ON DELETE CASCADE removes options and votes
  const { error: deleteError } = await supabase
    .from('polls')
    .delete()
    .eq('id', id);

  if (deleteError) {
    // Map RLS/permission errors to 403 for clarity
    const status = deleteError.code === '42501' ? 403 : 500;
    return NextResponse.json(
      { message: 'Failed to delete poll', error: deleteError.message },
      { status }
    );
  }

  return NextResponse.json({ success: true, message: 'Poll deleted' });
}