import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    const pollId = searchParams.get('pollId')

    if (!pollId) {
      return NextResponse.json(
        { error: 'Poll ID is required' },
        { status: 400 }
      )
    }

    const { data: comments, error } = await supabase
      .from('comments')
      .select(`
        *,
        user:user_id (
          id,
          email,
          user_metadata
        )
      `)
      .eq('poll_id', pollId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching comments:', error)
      return NextResponse.json(
        { error: 'Failed to fetch comments' },
        { status: 500 }
      )
    }

    return NextResponse.json({ comments })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Check authentication (but don't require it for anonymous comments)
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    const body = await request.json()
    const { pollId, content, parentId, isAnonymous, anonymousName } = body

    // Validate required fields
    if (!pollId || !content?.trim()) {
      return NextResponse.json(
        { error: 'Poll ID and content are required' },
        { status: 400 }
      )
    }

    // If anonymous comment, validate anonymous name
    if (isAnonymous && !anonymousName?.trim()) {
      return NextResponse.json(
        { error: 'Anonymous name is required for anonymous comments' },
        { status: 400 }
      )
    }

    // If not anonymous, require authentication
    if (!isAnonymous && (authError || !user)) {
      return NextResponse.json(
        { error: 'Authentication required for non-anonymous comments' },
        { status: 401 }
      )
    }

    // Verify poll exists
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .select('id')
      .eq('id', pollId)
      .single()

    if (pollError || !poll) {
      return NextResponse.json(
        { error: 'Poll not found' },
        { status: 404 }
      )
    }

    // If parentId is provided, verify parent comment exists
    if (parentId) {
      const { data: parentComment, error: parentError } = await supabase
        .from('comments')
        .select('id, poll_id')
        .eq('id', parentId)
        .single()

      if (parentError || !parentComment || parentComment.poll_id !== pollId) {
        return NextResponse.json(
          { error: 'Parent comment not found or invalid' },
          { status: 400 }
        )
      }
    }

    // Create comment
    const commentData = {
      poll_id: pollId,
      parent_id: parentId || null,
      content: content.trim(),
      is_anonymous: isAnonymous || false,
      ...(isAnonymous 
        ? { anonymous_name: anonymousName.trim(), user_id: null }
        : { user_id: user.id, anonymous_name: null }
      )
    }

    const { data: comment, error: insertError } = await supabase
      .from('comments')
      .insert(commentData)
      .select()
      .single()

    if (insertError) {
      console.error('Error creating comment:', insertError)
      // Map common errors to clearer messages to avoid ambiguous 500s
      const code = (insertError as any)?.code
      const message = (insertError as any)?.message || ''

      // Missing anonymous columns (schema not migrated)
      if (
        code === '42703' || // undefined_column
        code === 'PGRST204' || // PostgREST schema cache missing column
        /anonymous_name|is_anonymous/.test(message)
      ) {
        return NextResponse.json(
          { error: 'Anonymous comments are not enabled on the server. Please run database/update-comments-anonymous.sql.' },
          { status: 400 }
        )
      }

      // Not-null violation when user_id is required (anonymous not supported)
      if (code === '23502') {
        return NextResponse.json(
          { error: 'Anonymous comments are not enabled (user_id cannot be null). Please run database/update-comments-anonymous.sql.' },
          { status: 400 }
        )
      }

      // Permission denied by RLS
      if (code === '42501') {
        return NextResponse.json(
          { error: 'Permission denied by RLS. Enable policies for anonymous comments or sign in to comment.' },
          { status: isAnonymous ? 400 : 403 }
        )
      }

      // Fallback
      return NextResponse.json(
        { error: 'Failed to create comment' },
        { status: 500 }
      )
    }

    // For non-anonymous comments, fetch user data separately
    let commentWithUser = comment
    if (!isAnonymous && comment.user_id) {
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('id, email, full_name')
        .eq('id', comment.user_id)
        .single()

      if (userProfile) {
        commentWithUser = {
          ...comment,
          user: userProfile
        }
      }
    }

    return NextResponse.json({ comment: commentWithUser }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}