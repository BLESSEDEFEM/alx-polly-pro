import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params
  const { id } = resolvedParams;
  const { optionIds } = await request.json();

  const supabase = createClient();

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

  // Check if poll exists and is active - include is_anonymous and allow_multiple_votes fields
  const { data: poll, error: fetchError } = await supabase
    .from('polls')
    .select('id, is_active, expires_at, is_anonymous, allow_multiple_votes')
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

  // Get authenticated user (optional for anonymous polls)
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  // Check if authentication is required for this poll
  if (!poll.is_anonymous && (!user || authError)) {
    return NextResponse.json(
      { 
        success: false,
        message: 'Authentication required for this poll' 
      },
      { status: 401 }
    );
  }

  // Identify anonymous voter if needed
  let voterSession: string | null = null;
  let voterIP: string | null = null;

  if (poll.is_anonymous && !user) {
    // Try to read an existing anonymous session from cookies (poll-scoped)
    const sessionCookieName = `voter_session_${id}`;
    const cookieSession = request.cookies.get(sessionCookieName)?.value || request.cookies.get('voter_session')?.value || null;
    voterSession = cookieSession || request.headers.get('x-voter-session') || null;

    // Fallback: generate a session identifier for storage with the vote
    if (!voterSession) {
      voterSession = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Get IP from request headers - try multiple possible headers
    const forwardedFor = request.headers.get('x-forwarded-for');
    voterIP = forwardedFor ? forwardedFor.split(',')[0].trim() : null; // Get first IP if multiple

    if (!voterIP) {
      voterIP = request.headers.get('x-real-ip') ||
                request.headers.get('cf-connecting-ip') || // Cloudflare
                request.headers.get('true-client-ip') || // Akamai
                // @ts-ignore - NextRequest may not expose ip in all runtimes
                (request as any).ip ||
                '127.0.0.1';
    }

    console.log('Voter IP detected:', voterIP);
  }

  // Check for existing votes if multiple votes are not allowed
  if (!poll.allow_multiple_votes) {
    let existingVoteQuery = supabase
      .from('votes')
      .select('id')
      .eq('poll_id', id);

    if (user) {
      // For authenticated users, check by user_id
      existingVoteQuery = existingVoteQuery.eq('user_id', user.id);
    } else if (poll.is_anonymous) {
      // For anonymous users, enforce single vote using IP or session
      if (voterIP && voterSession) {
        existingVoteQuery = existingVoteQuery.or(`voter_ip.eq.${voterIP},voter_session.eq.${voterSession}`);
      } else if (voterIP) {
        existingVoteQuery = existingVoteQuery.eq('voter_ip', voterIP);
      } else if (voterSession) {
        existingVoteQuery = existingVoteQuery.eq('voter_session', voterSession);
      }
    }

    const { data: existingVotes, error: checkError } = await existingVoteQuery;

    if (checkError) {
      console.error('Error checking existing votes:', checkError);
      return NextResponse.json({ 
        success: false,
        message: 'Failed to verify voting eligibility' 
      }, { status: 500 });
    }

    if (existingVotes && existingVotes.length > 0) {
      return NextResponse.json({ 
        success: false,
        message: 'You have already voted on this poll. Multiple votes are not allowed.' 
      }, { status: 409 });
    }
  }

  // Insert votes into the votes table (triggers will handle vote count increment)
  for (const optionId of optionIds) {
    const voteData: any = {
      poll_id: id,
      option_id: optionId,
    };

    // Set appropriate voter identification
    if (user) {
      voteData.user_id = user.id;
    } else if (poll.is_anonymous) {
      // For anonymous votes, set both identifiers when possible
      voteData.voter_ip = voterIP || '127.0.0.1';
      voteData.voter_session = voterSession || `anon-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    }

    const { error: insertError } = await supabase
      .from('votes')
      .insert(voteData);

    if (insertError) {
      console.error('Error casting vote:', insertError);
      
      // Check if this is a duplicate vote constraint violation
      if (insertError.code === '23505' || insertError.message.includes('duplicate key value violates unique constraint')) {
        return NextResponse.json({ 
          success: false,
          message: 'Sorry, multiple votes not allowed on this poll'
        }, { status: 409 }); // 409 Conflict for duplicate resource
      }
      
      return NextResponse.json({ 
        success: false,
        message: 'Failed to cast vote', 
        error: insertError.message 
      }, { status: 500 });
    }
  }

  // Persist anonymous voter session in a cookie for this poll
  const res = NextResponse.json({ 
    success: true,
    message: 'Vote cast successfully' 
  });

  if (poll.is_anonymous && !user) {
    const sessionCookieName = `voter_session_${id}`;
    if (voterSession) {
      res.cookies.set(sessionCookieName, voterSession, {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });
    }
  }

  return res;
}