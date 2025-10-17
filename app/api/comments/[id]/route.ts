import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const resolvedParams = await params
    const commentId = resolvedParams.id
    const body = await request.json()
    const { content } = body

    // Validate content
    if (!content?.trim()) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      )
    }

    // Get existing comment to check ownership
    const { data: existingComment, error: fetchError } = await supabase
      .from('comments')
      .select('user_id, poll_id, is_anonymous')
      .eq('id', commentId)
      .single()

    if (fetchError || !existingComment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      )
    }

    // Anonymous comments cannot be edited
    if (existingComment.is_anonymous) {
      return NextResponse.json(
        { error: 'Anonymous comments cannot be edited' },
        { status: 403 }
      )
    }

    // Check if user owns the comment
    if (existingComment.user_id !== user.id) {
      return NextResponse.json(
        { error: 'You can only edit your own comments' },
        { status: 403 }
      )
    }

    // Update comment
    const { data: comment, error: updateError } = await supabase
      .from('comments')
      .update({
        content: content.trim(),
        is_edited: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', commentId)
      .select(`
        *,
        user:user_id (
          id,
          email,
          user_metadata
        )
      `)
      .single()

    if (updateError) {
      console.error('Error updating comment:', updateError)
      return NextResponse.json(
        { error: 'Failed to update comment' },
        { status: 500 }
      )
    }

    return NextResponse.json({ comment })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const resolvedParams = await params
    const commentId = resolvedParams.id

    // Get existing comment to check ownership and get user role
    const { data: existingComment, error: fetchError } = await supabase
      .from('comments')
      .select('user_id, poll_id, is_anonymous')
      .eq('id', commentId)
      .single()

    if (fetchError || !existingComment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      )
    }

    // Get user profile to check admin/moderator status
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    const isOwner = !existingComment.is_anonymous && existingComment.user_id === user.id
    const isAdmin = userProfile?.role === 'admin'
    const isModerator = userProfile?.role === 'moderator'

    // Check if user can delete the comment
    // Anonymous comments can only be deleted by admins/moderators
    if (existingComment.is_anonymous && !isAdmin && !isModerator) {
      return NextResponse.json(
        { error: 'Anonymous comments can only be deleted by administrators' },
        { status: 403 }
      )
    }

    // For non-anonymous comments, check ownership or admin/moderator status
    if (!existingComment.is_anonymous && !isOwner && !isAdmin && !isModerator) {
      return NextResponse.json(
        { error: 'You can only delete your own comments' },
        { status: 403 }
      )
    }

    // Delete comment (this will also delete replies due to CASCADE)
    const { error: deleteError } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId)

    if (deleteError) {
      console.error('Error deleting comment:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete comment' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Comment deleted successfully' })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}