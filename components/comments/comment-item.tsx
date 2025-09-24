'use client'

import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CommentForm } from './comment-form'
import { useAuth } from '@/hooks/use-auth'
import { useUserProfile } from '@/hooks/use-user-profile'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { MessageCircle, Edit, Trash2, MoreHorizontal } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface Comment {
  id: string
  content: string
  created_at: string
  updated_at: string
  is_edited: boolean
  user_id: string
  poll_id: string
  parent_id: string | null
  user: {
    id: string
    email: string
    full_name?: string
  }
  replies?: Comment[]
}

interface CommentItemProps {
  comment: Comment
  onCommentUpdated?: () => void
  depth?: number
}

export function CommentItem({ comment, onCommentUpdated, depth = 0 }: CommentItemProps) {
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(comment.content)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  
  const { user } = useAuth()
  const { isAdmin, isModerator } = useUserProfile()
  
  const isOwner = user?.id === comment.user_id
  const canEdit = isOwner
  const canDelete = isOwner || isAdmin || isModerator
  const maxDepth = 3 // Maximum nesting level

  const handleReplyAdded = () => {
    setShowReplyForm(false)
    onCommentUpdated?.()
  }

  const handleEdit = async () => {
    if (!editContent.trim()) {
      toast.error('Comment cannot be empty')
      return
    }

    setIsUpdating(true)

    try {
      const { error } = await supabase
        .from('comments')
        .update({
          content: editContent.trim(),
          is_edited: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', comment.id)

      if (error) throw error

      setIsEditing(false)
      toast.success('Comment updated successfully!')
      onCommentUpdated?.()
    } catch (error) {
      console.error('Error updating comment:', error)
      toast.error('Failed to update comment. Please try again.')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this comment?')) {
      return
    }

    setIsDeleting(true)

    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', comment.id)

      if (error) throw error

      toast.success('Comment deleted successfully!')
      onCommentUpdated?.()
    } catch (error) {
      console.error('Error deleting comment:', error)
      toast.error('Failed to delete comment. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  const getUserDisplayName = () => {
    return comment.user.full_name || comment.user.email.split('@')[0]
  }

  return (
    <div className={`${depth > 0 ? 'ml-8 border-l-2 border-muted pl-4' : ''}`}>
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium">
                  {getUserDisplayName().charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="font-medium text-sm">{getUserDisplayName()}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                  {comment.is_edited && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      Edited
                    </Badge>
                  )}
                </p>
              </div>
            </div>
            
            {(canEdit || canDelete) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {canEdit && (
                    <DropdownMenuItem onClick={() => setIsEditing(true)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                  )}
                  {canDelete && (
                    <DropdownMenuItem 
                      onClick={handleDelete}
                      className="text-destructive"
                      disabled={isDeleting}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      {isDeleting ? 'Deleting...' : 'Delete'}
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-3">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full p-3 border rounded-md resize-none min-h-[80px]"
                disabled={isUpdating}
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsEditing(false)
                    setEditContent(comment.content)
                  }}
                  disabled={isUpdating}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleEdit}
                  disabled={isUpdating || !editContent.trim()}
                >
                  {isUpdating ? 'Updating...' : 'Update'}
                </Button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm mb-3 whitespace-pre-wrap">{comment.content}</p>
              
              {user && depth < maxDepth && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowReplyForm(!showReplyForm)}
                  >
                    <MessageCircle className="h-4 w-4 mr-1" />
                    Reply
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {showReplyForm && (
        <div className="mb-4">
          <CommentForm
            pollId={comment.poll_id}
            parentId={comment.id}
            onCommentAdded={handleReplyAdded}
            onCancel={() => setShowReplyForm(false)}
            placeholder="Write a reply..."
            buttonText="Post Reply"
          />
        </div>
      )}

      {comment.replies && comment.replies.length > 0 && (
        <div className="space-y-2">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              onCommentUpdated={onCommentUpdated}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}