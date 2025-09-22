'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PollResultsChart } from '@/components/charts/poll-results-chart'
import { usePoll } from '@/hooks/use-polls'
import { formatDistanceToNow, format } from 'date-fns'
import { ArrowLeft, Users, Clock, Eye, Share2, Download, Calendar, TrendingUp } from 'lucide-react'
import { Poll } from '@/types'

/**
 * Poll Results Page Component
 * 
 * Displays detailed analytics and visualization for poll results.
 * Features:
 * - Interactive charts (bar/pie)
 * - Detailed vote breakdown
 * - Poll metadata and statistics
 * - Export functionality
 * - Responsive design
 */
export default function PollResultsPage() {
  const params = useParams()
  const router = useRouter()
  const pollId = params.id as string
  
  const [poll, setPoll] = useState<Poll | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [shareSuccess, setShareSuccess] = useState(false)
  
  const { getPollBySlug } = usePoll()

  useEffect(() => {
    const fetchPoll = async () => {
      if (!pollId) return
      
      try {
        setLoading(true)
        const pollData = await getPollBySlug(pollId)
        setPoll(pollData)
      } catch (err) {
        setError('Failed to load poll results')
        console.error('Error fetching poll:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchPoll()
  }, [pollId, getPollBySlug])

  const handleShare = async () => {
    const resultsUrl = `${window.location.origin}/polls/results/${pollId}`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${poll?.title} - Results`,
          text: 'Check out these poll results!',
          url: resultsUrl,
        })
      } catch (err) {
        console.error('Error sharing:', err)
      }
    } else {
      try {
        await navigator.clipboard.writeText(resultsUrl)
        setShareSuccess(true)
        setTimeout(() => setShareSuccess(false), 2000)
      } catch (err) {
        console.error('Failed to copy to clipboard:', err)
      }
    }
  }

  const handleExport = () => {
    if (!poll) return
    
    const totalVotes = poll.options?.reduce((sum, option) => sum + (option.votes?.length || 0), 0) || 0
    
    const csvContent = [
      ['Option', 'Votes', 'Percentage'],
      ...(poll.options?.map(option => [
        option.text,
        option.votes?.length || 0,
        totalVotes > 0 ? Math.round(((option.votes?.length || 0) / totalVotes) * 100) : 0
      ]) || [])
    ].map(row => row.join(',')).join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${poll.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_results.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading poll results...</p>
        </div>
      </div>
    )
  }

  if (error || !poll) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">📊</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Results Not Found</h1>
          <p className="text-gray-600 mb-6">{error || 'The poll results you\'re looking for don\'t exist.'}</p>
          <Button onClick={() => router.push('/polls')} className="flex items-center space-x-2">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Polls</span>
          </Button>
        </div>
      </div>
    )
  }

  const totalVotes = poll.options?.reduce((sum, option) => sum + (option.votes?.length || 0), 0) || 0
  const isExpired = poll.expires_at && new Date(poll.expires_at) < new Date()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Button
              onClick={() => router.back()}
              variant="ghost"
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </Button>
            
            <div className="flex space-x-2">
              <Button
                onClick={handleShare}
                variant="outline"
                size="sm"
                className="flex items-center space-x-2"
              >
                <Share2 className="h-4 w-4" />
                <span>{shareSuccess ? 'Copied!' : 'Share Results'}</span>
              </Button>
              
              <Button
                onClick={handleExport}
                variant="outline"
                size="sm"
                className="flex items-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>Export CSV</span>
              </Button>
            </div>
          </div>
          
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{poll.title}</h1>
            {poll.description && (
              <p className="text-gray-600 mb-4">{poll.description}</p>
            )}
            
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center space-x-1">
                <Users className="h-4 w-4" />
                <span>{totalVotes} total votes</span>
              </div>
              
              <div className="flex items-center space-x-1">
                <Calendar className="h-4 w-4" />
                <span>Created {formatDistanceToNow(new Date(poll.created_at))} ago</span>
              </div>
              
              {poll.expires_at && (
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>
                    {isExpired ? 'Expired' : 'Expires'} {formatDistanceToNow(new Date(poll.expires_at))} {isExpired ? 'ago' : 'from now'}
                  </span>
                </div>
              )}
              
              <Badge variant={poll.is_public ? 'default' : 'secondary'}>
                {poll.is_public ? 'Public' : 'Private'}
              </Badge>
              
              {poll.allow_multiple_votes && (
                <Badge variant="outline">Multiple Votes Allowed</Badge>
              )}
            </div>
          </div>
        </div>

        {/* Results Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Chart */}
          <div className="lg:col-span-2">
            <PollResultsChart poll={poll} />
          </div>

          {/* Statistics Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5" />
                  <span>Quick Stats</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Votes</span>
                  <span className="font-semibold">{totalVotes}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Options</span>
                  <span className="font-semibold">{poll.options?.length || 0}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Status</span>
                  <Badge variant={isExpired ? 'destructive' : 'default'}>
                    {isExpired ? 'Closed' : 'Active'}
                  </Badge>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Visibility</span>
                  <Badge variant={poll.is_public ? 'default' : 'secondary'}>
                    {poll.is_public ? 'Public' : 'Private'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Poll Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5" />
                  <span>Timeline</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium">Poll Created</p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(poll.created_at), 'MMM d, yyyy \'at\' h:mm a')}
                    </p>
                  </div>
                </div>
                
                {poll.expires_at && (
                  <div className="flex items-start space-x-3">
                    <div className={`w-2 h-2 rounded-full mt-2 ${isExpired ? 'bg-red-500' : 'bg-yellow-500'}`}></div>
                    <div>
                      <p className="text-sm font-medium">
                        {isExpired ? 'Poll Closed' : 'Poll Closes'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(poll.expires_at), 'MMM d, yyyy \'at\' h:mm a')}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}