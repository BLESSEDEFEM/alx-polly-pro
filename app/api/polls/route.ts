import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server'; // Import the new server-side Supabase client
import { Poll } from '@/types';

export async function GET(request: Request) {
  console.log('API Route: GET /api/polls');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Loaded' : 'NOT Loaded');
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Loaded' : 'NOT Loaded');

  const supabase = createClient();

  const { data: pollsData, error } = await supabase
    .from('polls')
    .select(`
      *,
      options:poll_options(*)
    `);

  console.log('Supabase raw data:', pollsData);
  console.log('Supabase raw error:', error);

  if (error) {
    console.error('Supabase Error fetching polls:', error);
    return NextResponse.json({ message: 'Failed to fetch polls', error: error.message }, { status: 500 });
  }

  // Map Supabase data to Poll type
  const polls: Poll[] = pollsData.map((poll: any) => ({
    id: poll.id,
    title: poll.title,
    description: poll.description,
    options: poll.options.map((option: any) => ({
      id: option.id,
      text: option.text,
      votes: option.votes,
    })),
    createdBy: poll.created_by,
    createdAt: new Date(poll.created_at),
    updatedAt: new Date(poll.updated_at),
    isActive: poll.is_active,
    expiresAt: poll.expires_at ? new Date(poll.expires_at) : undefined,
    allowMultipleVotes: poll.allow_multiple_votes,
    isAnonymous: poll.is_anonymous,
  }));

  return NextResponse.json(polls);
}

export async function POST(request: Request) {
  const supabase = createClient();

  // Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return NextResponse.json(
      { message: 'Authentication required' },
      { status: 401 }
    );
  }

  const data = await request.json();
  const { title, description, options, expiresAt, allowMultipleVotes, isAnonymous } = data;

  // Validate required fields
  if (!title || !description || !options || !Array.isArray(options) || options.length < 2) {
    return NextResponse.json(
      { message: 'Title, description, and at least 2 options are required' },
      { status: 400 }
    );
  }

  // Insert poll into 'polls' table
  const { data: newPollData, error: pollError } = await supabase
    .from('polls')
    .insert({
      title,
      description,
      created_by: user.id,
      expires_at: expiresAt,
      allow_multiple_votes: allowMultipleVotes,
      is_anonymous: isAnonymous,
    })
    .select()
    .single();

  if (pollError) {
    console.error('Error creating poll:', pollError);
    return NextResponse.json({ message: 'Failed to create poll', error: pollError.message }, { status: 500 });
  }

  // Insert options into 'poll_options' table
  const optionsToInsert = options.map((optionText: string) => ({
    poll_id: newPollData.id,
    text: optionText,
  }));

  const { data: newOptionsData, error: optionsError } = await supabase
    .from('poll_options')
    .insert(optionsToInsert)
    .select();

  if (optionsError) {
    console.error('Error creating poll options:', optionsError);
    // Consider rolling back poll creation here if necessary
    return NextResponse.json({ message: 'Failed to create poll options', error: optionsError.message }, { status: 500 });
  }

  const newPoll: Poll = {
    id: newPollData.id,
    title: newPollData.title,
    description: newPollData.description,
    options: newOptionsData.map((option: any) => ({
      id: option.id,
      text: option.text,
      votes: option.votes,
      pollId: newPollData.id, // Add the missing pollId property
    })),
    createdBy: newPollData.created_by,
    createdAt: new Date(newPollData.created_at),
    updatedAt: new Date(newPollData.updated_at),
    isActive: newPollData.is_active,
    expiresAt: newPollData.expires_at ? new Date(newPollData.expires_at) : undefined,
    allowMultipleVotes: newPollData.allow_multiple_votes,
    isAnonymous: newPollData.is_anonymous,
  };

  return NextResponse.json(newPoll, { status: 201 });
}