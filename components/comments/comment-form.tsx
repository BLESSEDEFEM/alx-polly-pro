'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase'
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
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [anonymousName, setAnonymousName] = useState('')
  const { user } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!content.trim()) {
      toast.error('Please enter a comment')
      return
    }

    if (isAnonymous && !anonymousName.trim()) {
      toast.error('Please enter an anonymous name')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pollId,
          parentId,
          content: content.trim(),
          isAnonymous,
          anonymousName: isAnonymous ? anonymousName.trim() : null
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to post comment')
      }

      setContent('')
      setAnonymousName('')
      setIsAnonymous(false)
      toast.success('Comment posted successfully!')
      onCommentAdded?.()
    } catch (error) {
      console.error('Error posting comment:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to post comment')
    } finally {
      setIsSubmitting(false)
    }
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
          
          {/* Anonymous commenting option */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="anonymous"
                checked={isAnonymous}
                onCheckedChange={(checked) => setIsAnonymous(checked as boolean)}
                disabled={isSubmitting}
              />
              <Label htmlFor="anonymous" className="text-sm">
                Comment anonymously
              </Label>
            </div>
            
            {isAnonymous && (
              <div className="space-y-2">
                <Label htmlFor="anonymousName" className="text-sm">
                  Display name (anonymous)
                </Label>
                <Input
                  id="anonymousName"
                  value={anonymousName}
                  onChange={(e) => setAnonymousName(e.target.value)}
                  placeholder="Enter a display name..."
                  disabled={isSubmitting}
                  maxLength={50}
                />
              </div>
            )}
          </div>

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
              disabled={isSubmitting || !content.trim() || (isAnonymous && !anonymousName.trim())}
            >
              {isSubmitting ? 'Posting...' : buttonText}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}