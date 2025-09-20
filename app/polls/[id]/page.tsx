/**
 * @fileoverview Poll details page component
 * Displays detailed information about a specific poll including voting interface, statistics, and timeline
 */

'use client';

import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PollCard } from '@/components/polls/poll-card';
import { usePoll } from '@/hooks/use-polls';
import { formatDistanceToNow, format } from 'date-fns';

/**
 * Poll details page component
 * 
 * A dynamic page that displays comprehensive information about a specific poll.
 * Features a two-column layout with the main poll card and detailed statistics sidebar.
 * 
 * The page includes:
 * - Loading state with skeleton animation
 * - Error handling with fallback UI
 * - Main poll card with voting interface
 * - Statistics sidebar with vote counts, poll type, and status
 * - Timeline information showing creation, expiration, and update dates
 * - Action buttons for sharing and navigation
 * 
 * @returns JSX element containing the poll details page layout
 * 
 * @example
 * ```tsx
 * // This page is automatically rendered at "/polls/[id]"
 * // where [id] is the dynamic poll identifier
 * // Users can view poll details, vote, and see real-time results
 * ```
 */
export default function PollDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const pollId = params.id as string;

  const { poll, isLoading, vote: votePoll } = usePoll(pollId);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!poll) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Poll Not Found</h1>
          <p className="text-gray-600 mb-6">
            'The poll you\'re looking for doesn\'t exist or has been removed.'
          </p>
          <div className="space-x-4">
            <Button onClick={() => router.back()}>
              Go Back
            </Button>
            <Button variant="outline" onClick={() => router.push('/polls')}>
              Browse Polls
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const totalVotes = poll.options.reduce((sum, option) => sum + (option.votes || 0), 0);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Navigation */}
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={() => {
            if (typeof window !== 'undefined') {
              router.back();
            }
          }}
          className="mb-4"
        >
          ← Back
        </Button>
      </div>

      {/* Poll Details */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Poll Card */}
        <div className="lg:col-span-2">
          <PollCard
            poll={poll}
            onVote={votePoll}
            showVoteButton={true}
            showResults={true}
          />
        </div>

        {/* Poll Information Sidebar */}
        <div className="space-y-6">
          {/* Poll Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Poll Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Votes:</span>
                <span className="font-semibold">{totalVotes}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Options:</span>
                <span className="font-semibold">{poll.options.length}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <Badge variant={poll.isActive ? 'default' : 'secondary'}>
                  {poll.isActive ? 'Active' : 'Closed'}
                </Badge>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Type:</span>
                <span className="font-semibold">
                  {poll.allowMultipleVotes ? 'Multiple Choice' : 'Single Choice'}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Voting:</span>
                <span className="font-semibold">
                  {poll.isAnonymous ? 'Anonymous' : 'Public'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Poll Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Created</p>
                <p className="font-semibold">
                  {format(poll.createdAt, 'PPP')}
                </p>
                <p className="text-sm text-gray-500">
                  {formatDistanceToNow(poll.createdAt, { addSuffix: true })}
                </p>
              </div>
              
              {poll.expiresAt && (
                <div>
                  <p className="text-sm text-gray-600">Expires</p>
                  <p className="font-semibold">
                    {format(poll.expiresAt, 'PPP')}
                  </p>
                  <p className="text-sm text-gray-500">
                    {formatDistanceToNow(poll.expiresAt, { addSuffix: true })}
                  </p>
                </div>
              )}
              
              <div>
                <p className="text-sm text-gray-600">Last Updated</p>
                <p className="font-semibold">
                  {format(poll.updatedAt, 'PPP')}
                </p>
                <p className="text-sm text-gray-500">
                  {formatDistanceToNow(poll.updatedAt, { addSuffix: true })}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => {
                  const url = window.location.href;
                  navigator.clipboard.writeText(url);
                  // You could add a toast notification here
                }}
              >
                Share Poll
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => router.push('/polls')}
              >
                Browse More Polls
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}