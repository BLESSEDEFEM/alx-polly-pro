'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { useAuth } from '@/hooks/use-auth'
import { adaptiveClient } from '@/lib/adaptive-client'
import { toast } from 'sonner'

interface CommentFormProps {
  pollId: string
  parentId?: string
  onCommentAdded?: () => void
  onCancel?: () => void
  placeholder?: string
  buttonText?: string
}

export function CommentForm({
  pollId,
  parentId,
  onCommentAdded,
  onCancel,
  placeholder = "Share your thoughts...",
  buttonText = "Post Comment"
}: CommentFormProps) {
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { user } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      toast.error('You must be logged in to comment')
      return
    }

    if (!content.trim()) {
      toast.error('Comment cannot be empty')
      return
    }

    setIsSubmitting(true)

    try {
      await adaptiveClient.comments.createComment({
        poll_id: pollId,
        user_id: user.id,
        parent_id: parentId || null,
        content: content.trim()
      })

      setContent('')
      toast.success('Comment posted successfully!')
      onCommentAdded?.()
    } catch (error) {
      console.error('Error posting comment:', error)
      toast.error('Failed to post comment. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!user) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-4 text-center text-muted-foreground">
          Please log in to join the discussion
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={placeholder}
            className="min-h-[100px] resize-none"
            disabled={isSubmitting}
          />
          <div className="flex justify-end gap-2">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              disabled={isSubmitting || !content.trim()}
            >
              {isSubmitting ? 'Posting...' : buttonText}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}