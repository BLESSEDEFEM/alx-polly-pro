'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, BarChart3, Users, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PollCard } from '@/components/polls/poll-card';
import { useAuth } from '@/hooks/use-auth';
import { usePolls } from '@/hooks/use-polls';

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const { polls, loading: pollsLoading, error } = usePolls();
  const [deletedPolls, setDeletedPolls] = useState<Set<string>>(new Set());

  // Calculate dashboard stats
  const totalPolls = polls.length;
  const totalVotes = polls.reduce((total, poll) => {
    return total + (poll.poll_options?.reduce((pollTotal, option) => {
      return pollTotal + (option.votes?.[0]?.count || 0);
    }, 0) || 0);
  }, 0);

  const activePollsCount = polls.filter(poll => {
    const isExpired = poll.expires_at ? new Date(poll.expires_at) < new Date() : false;
    return !isExpired;
  }).length;

  const handlePollDelete = (pollId: string) => {
    setDeletedPolls(prev => new Set([...prev, pollId]));
  };

  // Filter out deleted polls for immediate UI feedback
  const visiblePolls = polls.filter(poll => !deletedPolls.has(poll.id));

  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertDescription>
            You must be logged in to view your dashboard. Please sign in to continue.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">
            Manage your polls and track their performance
          </p>
        </div>
        <Button asChild className="mt-4 sm:mt-0">
          <Link href="/polls/create">
            <Plus className="h-4 w-4 mr-2" />
            Create Poll
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Polls</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPolls}</div>
            <p className="text-xs text-muted-foreground">
              {activePollsCount} active polls
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Votes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalVotes}</div>
            <p className="text-xs text-muted-foreground">
              Across all your polls
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Votes per Poll</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalPolls > 0 ? Math.round(totalVotes / totalPolls) : 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Average engagement
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Polls List */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Your Polls</h2>
          {visiblePolls.length > 0 && (
            <p className="text-sm text-gray-600">
              {visiblePolls.length} poll{visiblePolls.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {pollsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : visiblePolls.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visiblePolls.map((poll) => (
              <PollCard
                key={poll.id}
                poll={poll}
                showActions={true}
                onDelete={handlePollDelete}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No polls yet
                </h3>
                <p className="text-gray-600 mb-6">
                  Create your first poll to start gathering opinions and feedback.
                </p>
                <Button asChild>
                  <Link href="/polls/create">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Poll
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}