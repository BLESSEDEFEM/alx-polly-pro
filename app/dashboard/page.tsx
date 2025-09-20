/**
 * @fileoverview User dashboard page component
 * Displays polls created by the current user with edit and delete functionality
 */

'use client';

import { useAuth } from '@/hooks/use-auth';
import { DashboardPollList } from '@/components/dashboard/dashboard-poll-list';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, BarChart3, Users, Clock } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

/**
 * Dashboard page component
 * 
 * A personalized dashboard that displays polls created by the current user.
 * Features include:
 * - User's poll statistics
 * - List of user's polls with edit/delete actions
 * - Quick actions for creating new polls
 * - Authentication protection
 * 
 * @returns JSX element containing the dashboard layout
 */
export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({
    totalPolls: 0,
    totalVotes: 0,
    activePolls: 0
  });
  const [statsLoading, setStatsLoading] = useState(true);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/login?redirectTo=/dashboard');
    }
  }, [user, isLoading, router]);

  // Fetch user statistics
  useEffect(() => {
    const fetchStats = async () => {
      if (!user?.id) return;
      
      try {
        setStatsLoading(true);
        
        // Fetch user's polls with vote counts
        const { data: pollsData, error: pollsError } = await supabase
          .from('polls')
          .select(`
            id,
            is_active,
            poll_options (
              vote_count
            )
          `)
          .eq('created_by', user.id);

        if (pollsError) {
          console.error('Error fetching stats:', pollsError);
          return;
        }

        const totalPolls = pollsData?.length || 0;
        const activePolls = pollsData?.filter(poll => poll.is_active).length || 0;
        const totalVotes = pollsData?.reduce((sum, poll) => {
          const pollVotes = poll.poll_options?.reduce((pollSum: number, option: any) => 
            pollSum + (option.vote_count || 0), 0) || 0;
          return sum + pollVotes;
        }, 0) || 0;

        setStats({
          totalPolls,
          totalVotes,
          activePolls
        });
      } catch (error) {
        console.error('Error fetching user stats:', error);
      } finally {
        setStatsLoading(false);
      }
    };

    fetchStats();
  }, [user?.id]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Don't render if user is not authenticated
  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Dashboard Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {user.email?.split('@')[0]}!
        </h1>
        <p className="text-gray-600">
          Manage your polls, view analytics, and create new ones from your dashboard.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row gap-4">
          <Button asChild size="lg">
            <Link href="/polls/create">
              <Plus className="w-4 h-4 mr-2" />
              Create New Poll
            </Link>
          </Button>
          <Button variant="outline" asChild size="lg">
            <Link href="/polls">
              <Users className="w-4 h-4 mr-2" />
              Browse All Polls
            </Link>
          </Button>
        </div>
      </div>

      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Polls</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? (
                <div className="h-8 bg-gray-200 rounded animate-pulse w-12"></div>
              ) : (
                stats.totalPolls
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Polls you've created
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Votes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? (
                <div className="h-8 bg-gray-200 rounded animate-pulse w-12"></div>
              ) : (
                stats.totalVotes
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Votes across all your polls
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Polls</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? (
                <div className="h-8 bg-gray-200 rounded animate-pulse w-12"></div>
              ) : (
                stats.activePolls
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently active polls
            </p>
          </CardContent>
        </Card>
      </div>

      {/* User's Polls List */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Polls</h2>
        <DashboardPollList userId={user.id} />
      </div>
    </div>
  );
}

export const metadata = {
  title: 'Dashboard - Polly Pro',
  description: 'Manage your polls, view analytics, and create new ones from your personal dashboard.',
};