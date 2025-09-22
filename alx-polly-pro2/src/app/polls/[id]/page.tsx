/**
 * @fileoverview Poll details page component
 * Displays detailed information about a specific poll including voting interface, statistics, and timeline
 * Enhanced with improved error handling, loading states, and user feedback
 */

'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { PollCard } from '@/components/polls/poll-card';
import { QRCodeComponent } from '@/components/ui/qr-code';
import { PollResultsChart } from '@/components/charts/poll-results-chart';
import { usePoll } from '@/hooks/use-polls';
import { formatDistanceToNow, format } from 'date-fns';
import { Share2, ArrowLeft, Users, Clock, CheckCircle2, AlertCircle, BarChart3, Globe, Lock, QrCode } from 'lucide-react';

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
  
  // State for enhanced user experience
  const [shareSuccess, setShareSuccess] = useState(false);
  const [navigationLoading, setNavigationLoading] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const { poll, isLoading, vote: votePoll, refresh } = usePoll(pollId);

  // Enhanced vote handler with better state management
  const handleVote = async (pollId: string, optionIds: string[]) => {
    try {
      await votePoll(optionIds);
      // Refresh poll data to show updated results
      setTimeout(() => {
        refresh();
      }, 1000);
    } catch (error) {
      throw error; // Re-throw to let PollCard handle the error display
    }
  };

  // Share poll functionality
  const handleShare = async () => {
    const pollUrl = `${window.location.origin}/polls/${params.id}`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: poll?.title || 'Poll',
          text: poll?.description || 'Check out this poll!',
          url: pollUrl,
        })
      } catch (err) {
        console.error('Error sharing:', err)
      }
    } else {
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(pollUrl)
        setShareSuccess(true)
        setTimeout(() => setShareSuccess(false), 2000)
      } catch (err) {
        console.error('Failed to copy to clipboard:', err)
      }
    }
  }

  const toggleQR = () => {
    setShowQR(!showQR)
  }

  // Navigation handler
  const handleNavigation = (path: string) => {
    setNavigationLoading(true);
    router.push(path);
  };

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
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Poll Not Found</h1>
          <p className="text-gray-600 mb-6">
            The poll you're looking for doesn't exist or has been removed.
          </p>
          <div className="space-x-4">
            <Button onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
            <Button variant="outline" onClick={() => handleNavigation('/polls')}>
              Browse Polls
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Calculate poll statistics
  const totalVotes = poll.poll_options?.reduce((total, option) => {
    const voteCount = option.votes?.[0]?.count || 0;
    return total + voteCount;
  }, 0) || 0;

  const isExpired = poll.expires_at ? new Date(poll.expires_at) < new Date() : false;
  const timeUntilExpiry = poll.expires_at ? formatDistanceToNow(new Date(poll.expires_at)) : null;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header with navigation and actions */}
      <div className="flex items-center justify-between mb-6">
        <Button 
          variant="ghost" 
          onClick={() => router.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        
        <div className="flex items-center gap-2">
          {shareSuccess && (
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Link copied!
            </Badge>
          )}
          <Button
            onClick={() => router.push(`/polls/results/${params.id}`)}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <BarChart3 className="w-4 h-4" />
            View Results
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleShare}
            className="flex items-center gap-2"
          >
            <Share2 className="w-4 h-4" />
            Share
          </Button>
          
          <Button
            onClick={toggleQR}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <QrCode className="w-4 h-4" />
            QR Code
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* QR Code Section */}
        {showQR && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <QrCode className="h-5 w-5" />
                <span>Share with QR Code</span>
              </CardTitle>
              <CardDescription>
                Scan this QR code to access the poll directly
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <QRCodeComponent 
                value={`${window.location.origin}/polls/${params.id}`}
                size={200}
              />
            </CardContent>
          </Card>
        )}

        {/* Main poll card */}
        <div className="lg:col-span-2">
          <PollCard 
            poll={poll} 
            showActions={false}
            onVote={handleVote}
            onQRCode={toggleQR}
            allowVoting={true}
          />
        </div>

        {/* Statistics Sidebar */}
          <div className="space-y-6">
            {/* Poll Results Chart */}
            <PollResultsChart poll={poll} />

            {/* Poll Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Poll Statistics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Votes</span>
                <Badge variant="secondary">{totalVotes}</Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Poll Type</span>
                <Badge variant={poll.is_public ? "default" : "secondary"}>
                  {poll.is_public ? "Public" : "Private"}
                </Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Multiple Votes</span>
                <Badge variant={poll.allow_multiple_votes ? "default" : "secondary"}>
                  {poll.allow_multiple_votes ? "Allowed" : "Single Vote"}
                </Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Status</span>
                <Badge variant={isExpired ? "destructive" : "default"}>
                  {isExpired ? "Expired" : "Active"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm font-medium text-gray-900">Created</div>
                <div className="text-sm text-gray-600">
                  {format(new Date(poll.created_at), 'PPP')}
                </div>
                <div className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(poll.created_at))} ago
                </div>
              </div>
              
              {poll.expires_at && (
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {isExpired ? "Expired" : "Expires"}
                  </div>
                  <div className="text-sm text-gray-600">
                    {format(new Date(poll.expires_at), 'PPP')}
                  </div>
                  <div className="text-xs text-gray-500">
                    {isExpired ? `${timeUntilExpiry} ago` : `in ${timeUntilExpiry}`}
                  </div>
                </div>
              )}
              
              <div>
                <div className="text-sm font-medium text-gray-900">Last Updated</div>
                <div className="text-sm text-gray-600">
                  {format(new Date(poll.updated_at), 'PPP')}
                </div>
                <div className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(poll.updated_at))} ago
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full justify-start" 
                onClick={() => handleNavigation('/polls')}
                disabled={navigationLoading}
              >
                Browse More Polls
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start" 
                onClick={() => handleNavigation('/polls/create')}
                disabled={navigationLoading}
              >
                Create Your Own Poll
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}