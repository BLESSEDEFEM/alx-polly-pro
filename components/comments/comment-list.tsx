'use client'

import { useState, useEffect } from 'react'
import { CommentItem } from './comment-item'
import { CommentForm } from './comment-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { MessageCircle, RefreshCw } from 'lucide-react'

interface Comment {
  id: string
  content: string
  created_at: string
  updated_at: string
  is_edited: boolean
  user_id: string | null
  poll_id: string
  parent_id: string | null
  is_anonymous: boolean
  anonymous_name: string | null
  user?: {
    id: string
    email: string
    full_name?: string
  }
  replies?: Comment[]
}

interface CommentListProps {
  pollId: string
}

export function CommentList({ pollId }: CommentListProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchComments = async () => {
    try {
      setError(null)
      
      // Fetch all comments for this poll
      const { data: commentsData, error: commentsError } = await supabase
        .from('comments')
        .select('*')
        .eq('poll_id', pollId)
        .order('created_at', { ascending: true })

      if (commentsError) throw commentsError

      // Fetch user profiles for all unique user IDs (excluding anonymous comments)
      const userIds = [...new Set(commentsData?.filter(comment => !comment.is_anonymous && comment.user_id).map(comment => comment.user_id) || [])]
      
      let userProfiles = []
      let userError = null
      
      if (userIds.length > 0) {
        const result = await supabase
          .from('user_profiles')
          .select('id, email, full_name')
          .in('id', userIds)
        
        userProfiles = result.data || []
        userError = result.error
      }

      if (userError) {
        console.warn('Could not fetch user profiles:', userError)
      }

      // Create a map of user profiles for quick lookup
      const userMap = new Map()
      userProfiles?.forEach(user => {
        userMap.set(user.id, user)
      })

      // Attach user data to comments (only for non-anonymous comments)
      const commentsWithUsers = commentsData?.map(comment => ({
        ...comment,
        user: comment.is_anonymous ? undefined : (userMap.get(comment.user_id) || {
          id: comment.user_id,
          email: 'Unknown User',
          full_name: 'Unknown User'
        })
      })) || []

      // Organize comments into a tree structure
      const commentMap = new Map<string, Comment>()
      const rootComments: Comment[] = []

      // First pass: create all comment objects
      commentsWithUsers?.forEach((comment) => {
        const commentObj: Comment = {
          ...comment,
          replies: []
        }
        commentMap.set(comment.id, commentObj)
      })

      // Second pass: organize into tree structure
      commentsWithUsers?.forEach((comment) => {
        const commentObj = commentMap.get(comment.id)!
        
        if (comment.parent_id) {
          // This is a reply
          const parent = commentMap.get(comment.parent_id)
          if (parent) {
            parent.replies = parent.replies || []
            parent.replies.push(commentObj)
          }
        } else {
          // This is a root comment
          rootComments.push(commentObj)
        }
      })

      setComments(rootComments)
    } catch (error) {
      console.error('Error fetching comments:', error)
      setError('Failed to load comments. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchComments()

    // Set up real-time subscription for comments
    const channel = supabase
      .channel(`comments:${pollId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
          filter: `poll_id=eq.${pollId}`
        },
        () => {
          fetchComments()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [pollId])

  const handleCommentAdded = () => {
    fetchComments()
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Discussion
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Discussion
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={fetchComments} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Discussion ({comments.length + comments.reduce((acc, comment) => acc + (comment.replies?.length || 0), 0)})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Comment Form */}
        <CommentForm
          pollId={pollId}
          onCommentAdded={handleCommentAdded}
        />

        {/* Comments List */}
        {comments.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              No comments yet. Be the first to share your thoughts!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                onCommentUpdated={fetchComments}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}