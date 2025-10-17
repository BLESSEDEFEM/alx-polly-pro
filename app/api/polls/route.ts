import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server'; // Import the new server-side Supabase client
import { Poll } from '@/types';

export async function GET(request: Request) {
  try {
    console.log('API Route: GET /api/polls');
    
    // Check if environment variables are loaded
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('Missing Supabase environment variables');
      return NextResponse.json(
        { message: 'Server configuration error', error: 'Missing Supabase credentials' }, 
        { status: 500 }
      );
    }
    
    console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    
    // Create Supabase client
    const supabase = createClient();
    
    // Get URL parameters for pagination
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '100'); // Increased default limit to 100
    const fetchAll = url.searchParams.get('fetchAll') === 'true';
    
    // Query polls - either all or with pagination
    console.log('Fetching polls, fetchAll:', fetchAll);
    
    let query = supabase
      .from('polls')
      .select(`
        *,
        options:poll_options(*)
      `)
      .order('created_at', { ascending: false });
      
    // Apply pagination only if not fetching all
    if (!fetchAll) {
      // Calculate pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);
    }
    
    const { data: pollsData, error } = await query;
    
    console.log('Polls data count:', pollsData?.length || 0);

    if (error) {
      console.error('Supabase Error fetching polls:', error);
      return NextResponse.json({ message: 'Failed to fetch polls', error: error.message }, { status: 500 });
    }
    
    if (!pollsData) {
      return NextResponse.json({ message: 'No polls found' }, { status: 404 });
    }

  // Map Supabase data to Poll type
  try {
    const polls: Poll[] = pollsData.map((poll: any) => ({
      id: poll.id,
      title: poll.title,
      description: poll.description,
      options: poll.options.map((option: any) => ({
        id: option.id,
        text: option.text,
        votes: option.vote_count || 0,
      })),
      createdBy: poll.created_by,
      createdAt: new Date(poll.created_at),
      updatedAt: new Date(poll.updated_at),
      isActive: poll.is_active,
      expiresAt: poll.expires_at ? new Date(poll.expires_at) : undefined,
      allowMultipleVotes: poll.allow_multiple_votes,
      isAnonymous: poll.is_anonymous,
      pollCategory: poll.poll_category,
    }));

    return NextResponse.json(polls);
  } catch (error) {
    console.error('Error processing poll data:', error);
    return NextResponse.json(
      { message: 'Error processing poll data', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} catch (error) {
  console.error('Unhandled error in polls API:', error);
  return NextResponse.json(
    { message: 'Server error', error: error instanceof Error ? error.message : 'Unknown error' },
    { status: 500 }
  );
}
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
  const { title, description, options, expiresAt, allowMultipleVotes, isAnonymous, pollCategory } = data;

  console.log('Backend: Received poll data:', data);
  console.log('Backend: Title:', title);
  console.log('Backend: Description:', description);
  console.log('Backend: Options:', options);
  console.log('Backend: Options type:', typeof options);
  console.log('Backend: Options is array:', Array.isArray(options));
  console.log('Backend: Options length:', options?.length);

  // Validate required fields
  if (!title || !options || !Array.isArray(options) || options.length < 2) {
    console.log('Backend: Validation failed - missing required fields');
    return NextResponse.json(
      { message: 'Title and at least 2 options are required' },
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
      poll_category: pollCategory || 'general',
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
      // Use vote_count from DB and default to 0 to avoid undefined
      votes: option.vote_count || 0,
      pollId: newPollData.id, // Add the missing pollId property
    })),
    createdBy: newPollData.created_by,
    createdAt: new Date(newPollData.created_at),
    updatedAt: new Date(newPollData.updated_at),
    isActive: newPollData.is_active,
    expiresAt: newPollData.expires_at ? new Date(newPollData.expires_at) : undefined,
    allowMultipleVotes: newPollData.allow_multiple_votes,
    isAnonymous: newPollData.is_anonymous,
    pollCategory: newPollData.poll_category,
  };

  console.log('Backend: Created poll data from Supabase:', newPollData);
  console.log('Backend: Returning poll to frontend:', newPoll);
  console.log('Backend: Poll ID being returned:', newPoll.id);

  return NextResponse.json(newPoll, { status: 201 });
}