/**
 * @fileoverview Dashboard poll list component
 * Displays polls created by a specific user with edit and delete functionality
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Edit, 
  Trash2, 
  Eye, 
  Users, 
  Calendar, 
  MoreVertical,
  AlertCircle,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Poll } from '@/types';
import { adaptiveClient } from '@/lib/adaptive-client';
import { formatDistanceToNow } from 'date-fns';

interface DashboardPollListProps {
  userId: string;
}

/**
 * Dashboard poll list component
 * 
 * Displays a list of polls created by the specified user with management actions.
 * Features include:
 * - Fetching user's polls from database
 * - Edit and delete functionality
 * - Poll status indicators
 * - Vote count display
 * - Responsive design
 * 
 * @param props - Component props
 * @returns JSX element containing the poll list
 */
export function DashboardPollList({ userId }: DashboardPollListProps) {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pollToDelete, setPollToDelete] = useState<Poll | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  // Fetch user's polls
  useEffect(() => {
    const fetchUserPolls = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch via adaptive client (returns standardized ApiResponse)
        const response = await adaptiveClient.polls.getUserPolls(userId);

        // If adaptive client fails (e.g., Supabase branch not implemented), fallback to Next.js API
        if (!response?.success || !Array.isArray(response.data)) {
          try {
            const res = await fetch('/api/polls?fetchAll=true');
            if (!res.ok) {
              throw new Error(`Fallback API failed: ${res.status}`);
            }
            const allPolls: Poll[] = await res.json();
            const userPolls = (allPolls || []).filter(p => p.createdBy === userId);
            setPolls(userPolls);
            return;
          } catch (fallbackErr) {
            console.error('Fallback fetch user polls error:', fallbackErr);
            setError('Failed to load your polls. Please try again.');
            setPolls([]);
            return;
          }
        }

        const backend = adaptiveClient.getBackendType();
        const pollsData = response.data as any[];

        // Transform the data to match our Poll type, differing per backend
        const transformedPolls: Poll[] = (pollsData || []).map((poll: any) => {
          if (backend === 'fastapi') {
            // FastAPI shape -> Poll
            return {
              id: String(poll.id),
              title: poll.question,
              description: poll.description,
              options: (poll.options || []).map((option: any) => ({
                id: String(option.id),
                text: option.text,
                votes: Math.max(0, Number(option.vote_count ?? 0) || 0),
                pollId: String(poll.id),
              })),
              isAnonymous: Boolean(poll.is_anonymous),
              isActive: Boolean(poll.is_active),
              allowMultipleVotes: Boolean(poll.allow_multiple_votes),
              pollCategory: poll.poll_category || 'general',
              visibility: poll.poll_visibility,
              createdBy: String(poll.created_by),
              createdAt: new Date(poll.created_at),
              updatedAt: poll.updated_at ? new Date(poll.updated_at) : new Date(poll.created_at),
              expiresAt: poll.expires_at ? new Date(poll.expires_at) : undefined,
            } as Poll;
          }

          // Supabase or generic shape -> Poll (covers /api/polls route format)
          return {
            id: String(poll.id),
            title: poll.title,
            description: poll.description,
            options: (poll.options || poll.poll_options || []).map((option: any) => ({
              id: String(option.id),
              text: option.text,
              votes: Math.max(0, Number(option.vote_count ?? option.votes ?? 0) || 0),
              pollId: String(poll.id),
            })),
            isAnonymous: Boolean(poll.is_anonymous),
            isActive: Boolean(poll.is_active),
            allowMultipleVotes: Boolean(poll.allow_multiple_votes),
            pollCategory: poll.poll_category || 'general',
            visibility: poll.poll_visibility,
            createdBy: String(poll.created_by || poll.createdBy),
            createdAt: new Date(poll.created_at || poll.createdAt),
            updatedAt: new Date(poll.updated_at || poll.updatedAt || (poll.created_at || poll.createdAt)),
            expiresAt: poll.expires_at ? new Date(poll.expires_at) : (poll.expiresAt ? new Date(poll.expiresAt) : undefined),
          } as Poll;
        });

        setPolls(transformedPolls);
      } catch (err) {
        console.error('Error fetching user polls:', err);
        setError('Failed to load your polls. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      fetchUserPolls();
    }
  }, [userId]);

  // Handle poll deletion
  const handleDeletePoll = async (poll: Poll) => {
    setPollToDelete(poll);
    setDeleteDialogOpen(true);
  };

  const confirmDeletePoll = async () => {
    if (!pollToDelete) return;

    try {
      setIsDeleting(true);

      const delRes = await adaptiveClient.polls.deletePoll(pollToDelete.id);
      if (!delRes?.success) {
        throw new Error(delRes?.error || 'Deletion failed');
      }

      // Remove the poll from local state
      setPolls(polls.filter(p => p.id !== pollToDelete.id));
      
      // Close dialog and reset state
      setDeleteDialogOpen(false);
      setPollToDelete(null);
    } catch (err) {
      console.error('Error deleting poll:', err);
      setError('Failed to delete poll. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle poll editing
  const handleEditPoll = (poll: Poll) => {
    router.push(`/polls/${poll.id}/edit`);
  };

  // Handle viewing poll
  const handleViewPoll = (poll: Poll) => {
    router.push(`/polls/${poll.id}`);
  };

  // Calculate total votes for a poll
  const getTotalVotes = (poll: Poll) => {
    return poll.options.reduce((sum, option) => {
      const raw = typeof option.votes === 'number' ? option.votes : Number(option.votes) || 0;
      const count = raw < 0 ? 0 : raw;
      return sum + count;
    }, 0);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (polls.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Users className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No polls yet
          </h3>
          <p className="text-gray-600 mb-4">
            You haven't created any polls yet. Create your first poll to get started!
          </p>
          <Button asChild>
            <a href="/polls/create">Create Your First Poll</a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {polls.map((poll) => {
          const totalVotes = getTotalVotes(poll);
          
          return (
            <Card key={poll.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">{poll.title}</CardTitle>
                    {poll.description && (
                      <CardDescription className="mb-3">
                        {poll.description}
                      </CardDescription>
                    )}
                    
                    {/* Poll metadata */}
                    <div className="flex flex-wrap gap-2 mb-2">
                      <Badge variant={poll.isActive ? "default" : "secondary"}>
                        {poll.isActive ? "Active" : "Inactive"}
                      </Badge>
                      <Badge variant="outline">
                        {poll.visibility === 'public' ? 'Public' : 'Private'}
                      </Badge>
                      {poll.pollCategory && (
                        <Badge variant="outline">{poll.pollCategory}</Badge>
                      )}
                    </div>
                  </div>
                  
                  {/* Actions dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleViewPoll(poll)}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Poll
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEditPoll(poll)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Poll
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDeletePoll(poll)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Poll
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              
              <CardContent>
                {/* Poll statistics */}
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {totalVotes} votes
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {formatDistanceToNow(new Date(poll.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  
                  {poll.expiresAt && (
                    <span className="text-orange-600">
                      Expires {formatDistanceToNow(new Date(poll.expiresAt), { addSuffix: true })}
                    </span>
                  )}
                </div>
                
                {/* Poll options preview */}
                <div className="mt-4">
                  <div className="text-sm text-gray-600 mb-2">
                    {poll.options.length} options
                  </div>
                  <div className="space-y-1">
                    {poll.options.slice(0, 3).map((option) => (
                      <div key={option.id} className="flex justify-between text-sm">
                        <span className="truncate">{option.text}</span>
                        <span className="text-gray-500">{Math.max(0, typeof option.votes === 'number' ? option.votes : (Number(option.votes) || 0))}</span>
                      </div>
                    ))}
                    {poll.options.length > 3 && (
                      <div className="text-sm text-gray-500">
                        +{poll.options.length - 3} more options
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Poll</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{pollToDelete?.title}"? This action cannot be undone.
              All votes and data associated with this poll will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeletePoll}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Poll'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}