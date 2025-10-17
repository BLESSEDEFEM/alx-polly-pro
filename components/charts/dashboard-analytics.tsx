/**
 * @fileoverview Dashboard analytics component
 * Provides visual analytics for user's poll performance and statistics
 */

'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  BarChart3, 
  PieChart as PieChartIcon, 
  Activity,
  Calendar,
  Users,
  Vote
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { format, subDays, startOfDay } from 'date-fns';

interface DashboardAnalyticsProps {
  userId: string;
  className?: string;
}

interface AnalyticsData {
  pollsOverTime: Array<{ date: string; polls: number; votes: number }>;
  categoryBreakdown: Array<{ category: string; count: number; votes: number }>;
  topPerformingPolls: Array<{ title: string; votes: number; id: string }>;
  recentActivity: Array<{ date: string; activity: number }>;
}

const COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#F97316'];

export function DashboardAnalytics({ userId, className }: DashboardAnalyticsProps) {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  const fetchAnalyticsData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      const startDate = startOfDay(subDays(new Date(), days));

      // Fetch polls with their votes
      const { data: polls, error: pollsError } = await supabase
        .from('polls')
        .select(`
          id,
          title,
          created_at,
          poll_category,
          options:poll_options(
            id,
            votes:votes(created_at)
          )
        `)
        .eq('created_by', userId)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      if (pollsError) throw pollsError;

      // Process data for charts
      const processedData = processAnalyticsData(polls || [], days);
      setAnalyticsData(processedData);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('Failed to load analytics data');
    } finally {
      setIsLoading(false);
    }
  }, [userId, timeRange]);

  useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  const processAnalyticsData = (polls: any[], days: number): AnalyticsData => {
    // Generate date range
    const dateRange = Array.from({ length: days }, (_, i) => {
      const date = subDays(new Date(), days - 1 - i);
      return format(date, 'yyyy-MM-dd');
    });

    // Polls over time
    const pollsOverTime = dateRange.map(date => {
      const dayPolls = polls.filter(poll => 
        format(new Date(poll.created_at), 'yyyy-MM-dd') === date
      );
      
      const dayVotes = dayPolls.reduce((sum, poll) => {
        return sum + poll.options.reduce((optSum: number, opt: any) => 
          optSum + (opt.votes?.length || 0), 0
        );
      }, 0);

      return {
        date: format(new Date(date), 'MMM dd'),
        polls: dayPolls.length,
        votes: dayVotes,
      };
    });

    // Category breakdown
    const categoryMap = new Map<string, { count: number; votes: number }>();
    polls.forEach(poll => {
      const category = poll.poll_category || 'Uncategorized';
      const votes = poll.options.reduce((sum: number, opt: any) => 
        sum + (opt.votes?.length || 0), 0
      );
      
      if (categoryMap.has(category)) {
        const existing = categoryMap.get(category)!;
        categoryMap.set(category, {
          count: existing.count + 1,
          votes: existing.votes + votes,
        });
      } else {
        categoryMap.set(category, { count: 1, votes });
      }
    });

    const categoryBreakdown = Array.from(categoryMap.entries()).map(([category, data]) => ({
      category,
      count: data.count,
      votes: data.votes,
    }));

    // Top performing polls
    const topPerformingPolls = polls
      .map(poll => ({
        title: poll.title.length > 30 ? `${poll.title.substring(0, 30)}...` : poll.title,
        votes: poll.options.reduce((sum: number, opt: any) => 
          sum + (opt.votes?.length || 0), 0
        ),
        id: poll.id,
      }))
      .sort((a, b) => b.votes - a.votes)
      .slice(0, 5);

    // Recent activity (simplified - based on poll creation and votes)
    const recentActivity = pollsOverTime.map(item => ({
      date: item.date,
      activity: item.polls * 2 + item.votes, // Weight polls more than individual votes
    }));

    return {
      pollsOverTime,
      categoryBreakdown,
      topPerformingPolls,
      recentActivity,
    };
  };

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error || !analyticsData) {
    return (
      <Card className={className}>
        <CardContent className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <BarChart3 className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Analytics Unavailable
          </h3>
          <p className="text-gray-600 mb-4">
            {error || 'Unable to load analytics data at this time.'}
          </p>
          <Button onClick={fetchAnalyticsData} variant="outline">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: <span className="font-semibold">{entry.value}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Time Range Selector */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
        <div className="flex rounded-lg border border-gray-200 p-1 w-full sm:w-auto">
          {(['7d', '30d', '90d'] as const).map((range) => (
            <Button
              key={range}
              variant={timeRange === range ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setTimeRange(range)}
              className="h-8 px-3 flex-1 sm:flex-none"
            >
              {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
            </Button>
          ))}
        </div>
      </div>

      {/* Polls and Votes Over Time */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Polls & Votes Over Time
          </CardTitle>
          <CardDescription>
            Track your poll creation and voting activity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analyticsData.pollsOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="polls" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  name="Polls Created"
                />
                <Line 
                  type="monotone" 
                  dataKey="votes" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  name="Votes Received"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5" />
              Poll Categories
            </CardTitle>
            <CardDescription>
              Distribution of your polls by category
            </CardDescription>
          </CardHeader>
          <CardContent>
            {analyticsData.categoryBreakdown.length > 0 ? (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analyticsData.categoryBreakdown}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                      label={({ category, count }) => `${category}: ${count}`}
                    >
                      {analyticsData.categoryBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <PieChartIcon className="h-8 w-8 mx-auto mb-2" />
                <p>No category data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Performing Polls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Vote className="h-5 w-5" />
              Top Performing Polls
            </CardTitle>
            <CardDescription>
              Your polls with the most votes
            </CardDescription>
          </CardHeader>
          <CardContent>
            {analyticsData.topPerformingPolls.length > 0 ? (
              <div className="space-y-3">
                {analyticsData.topPerformingPolls.map((poll, index) => (
                  <div key={poll.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant={index === 0 ? 'default' : 'secondary'}>
                        #{index + 1}
                      </Badge>
                      <span className="font-medium text-sm">{poll.title}</span>
                    </div>
                    <Badge variant="outline">{poll.votes} votes</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Vote className="h-8 w-8 mx-auto mb-2" />
                <p>No polls with votes yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Activity Heatmap */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Activity Overview
          </CardTitle>
          <CardDescription>
            Your overall activity including poll creation and engagement
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analyticsData.recentActivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="activity" 
                  stroke="#8B5CF6" 
                  fill="#8B5CF6" 
                  fillOpacity={0.3}
                  name="Activity Score"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}