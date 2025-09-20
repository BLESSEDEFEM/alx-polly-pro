'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PollCard } from './poll-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Poll } from '@/types';
import { usePolls } from '@/hooks/use-polls';

interface PollListProps {
  polls?: Poll[];
  showCreateButton?: boolean;
  showSearch?: boolean;
  showFilters?: boolean;
  onVote?: (pollId: string, optionIds: string[]) => void;
}

export function PollList({ 
  polls: externalPolls,
  showCreateButton = true,
  showSearch = true,
  showFilters = true,
  onVote: externalOnVote
}: PollListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'most-voted'>('newest');
  const [filterBy, setFilterBy] = useState<'all' | 'active' | 'closed'>('all');

  const { polls: hookPolls, isLoading, votePoll } = usePolls();
  const router = useRouter();

  // Use external polls if provided, otherwise use hook polls
  const polls = externalPolls || hookPolls;
  const handleVote = externalOnVote || votePoll;

  // Filter and sort polls
  const filteredPolls = polls
    .filter(poll => {
      // Search filter
      const matchesSearch = poll.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (poll.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
      
      // Status filter
      const matchesFilter = filterBy === 'all' || 
                           (filterBy === 'active' && poll.isActive) ||
                           (filterBy === 'closed' && !poll.isActive);

      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'most-voted':
          const aVotes = a.options.reduce((sum, opt) => sum + opt.votes, 0);
          const bVotes = b.options.reduce((sum, opt) => sum + opt.votes, 0);
          return bVotes - aVotes;
        default:
          return 0;
      }
    });

  const handleViewDetails = (pollId: string) => {
    router.push(`/polls/${pollId}`);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-gray-200 rounded-lg h-48"></div>
          </div>
        ))}
      </div>
    );
  }

  

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Polls</h2>
          <p className="text-gray-600">
            {filteredPolls.length} {filteredPolls.length === 1 ? 'poll' : 'polls'} found
          </p>
        </div>
        
        {showCreateButton && (
          <Button onClick={() => router.push('/polls/create')}>
            Create Poll
          </Button>
        )}
      </div>

      {/* Search and Filters */}
      {(showSearch || showFilters) && (
        <div className="flex flex-col sm:flex-row gap-4">
          {showSearch && (
            <div className="flex-1">
              <Input
                placeholder="Search polls..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
          )}
          
          {showFilters && (
            <div className="flex gap-2">
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="oldest">Oldest</SelectItem>
                  <SelectItem value="most-voted">Most Voted</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterBy} onValueChange={(value: any) => setFilterBy(value)}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      )}

      {/* Poll List */}
      {filteredPolls.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">
            {searchTerm || filterBy !== 'all' 
              ? 'No polls match your search criteria' 
              : 'No polls available yet'
            }
          </p>
          {showCreateButton && !searchTerm && filterBy === 'all' && (
            <Button onClick={() => router.push('/polls/create')}>
              Create the First Poll
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-6">
          {filteredPolls.map((poll) => (
            <PollCard
              key={poll.id}
              poll={poll}
              onVote={handleVote}
              onViewDetails={handleViewDetails}
              showVoteButton={true}
              showResults={false}
            />
          ))}
        </div>
      )}
    </div>
  );
}