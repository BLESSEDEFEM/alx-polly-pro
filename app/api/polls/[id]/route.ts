import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server'; // Import the new server-side Supabase client
import { Poll } from '@/types';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const supabase = createClient();

  const { data: pollData, error } = await supabase
    .from('polls')
    .select(`
      *,
      options:poll_options(*)
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

  const poll: Poll = {
    id: pollData.id,
    title: pollData.title,
    description: pollData.description,
    options: pollData.options.map((option: any) => ({
      id: option.id,
      text: option.text,
      votes: option.votes,
    })),
    createdBy: pollData.created_by,
    createdAt: new Date(pollData.created_at),
    updatedAt: new Date(pollData.updated_at),
    isActive: pollData.is_active,
    expiresAt: pollData.expires_at ? new Date(pollData.expires_at) : undefined,
    allowMultipleVotes: pollData.allow_multiple_votes,
    isAnonymous: pollData.is_anonymous,
  };

  return NextResponse.json(poll);
}