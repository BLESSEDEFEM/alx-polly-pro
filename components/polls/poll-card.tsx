'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Poll } from '@/types';
import { formatDistanceToNow } from 'date-fns';

interface PollCardProps {
  poll: Poll;
  onVote?: (pollId: string, optionIds: string[]) => void;
  onViewDetails?: (pollId: string) => void;
  showVoteButton?: boolean;
  showResults?: boolean;
}

export function PollCard({ 
  poll, 
  onVote, 
  onViewDetails, 
  showVoteButton = true,
  showResults = false 
}: PollCardProps) {
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [isVoting, setIsVoting] = useState(false);
  const [voteError, setVoteError] = useState<string | null>(null);
  const [voteSuccess, setVoteSuccess] = useState(false);

  const totalVotes = poll.options.reduce((sum, option) => sum + (option.votes || 0), 0);

  const handleOptionSelect = (optionId: string) => {
    if (poll.allowMultipleVotes) {
      setSelectedOptions(prev => 
        prev.includes(optionId) 
          ? prev.filter(id => id !== optionId)
          : [...prev, optionId]
      );
    } else {
      setSelectedOptions([optionId]);
    }
  };

  const handleVote = async () => {
    if (selectedOptions.length === 0 || !onVote) return;

    // Clear previous states
    setVoteError(null);
    setVoteSuccess(false);
    setIsVoting(true);

    try {
      await onVote(poll.id, selectedOptions);
      setSelectedOptions([]);
      setVoteSuccess(true);
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => {
        setVoteSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Voting failed:', error);
      setVoteError(error instanceof Error ? error.message : 'Failed to cast vote. Please try again.');
    } finally {
      setIsVoting(false);
    }
  };

  const getVotePercentage = (votes: number) => {
    if (typeof votes !== 'number' || isNaN(votes) || totalVotes === 0) {
      return 0;
    }
    return Math.round((votes / totalVotes) * 100);
  };

  return (
    <Card className="w-full hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{poll.title}</CardTitle>
            {poll.description && (
              <CardDescription className="mt-1">
                {poll.description}
              </CardDescription>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge variant={poll.isActive ? 'default' : 'secondary'}>
              {poll.isActive ? 'Active' : 'Closed'}
            </Badge>
            {poll.isAnonymous && (
              <Badge variant="outline">Anonymous</Badge>
            )}
            {poll.pollCategory && (
              <Badge variant="secondary" className="capitalize">
                {poll.pollCategory}
              </Badge>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span>{totalVotes} votes</span>
          <span>•</span>
          <span>{formatDistanceToNow(poll.createdAt, { addSuffix: true })}</span>
          {poll.expiresAt && (
            <>
              <span>•</span>
              <span>Expires {formatDistanceToNow(poll.expiresAt, { addSuffix: true })}</span>
            </>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {poll.options.map((option) => {
            const percentage = getVotePercentage(option.votes);
            const isSelected = selectedOptions.includes(option.id);

            return (
              <div key={option.id} className="space-y-2">
                <div 
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    isSelected 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  } ${!showVoteButton ? 'cursor-default' : ''}`}
                  onClick={() => showVoteButton && poll.isActive && handleOptionSelect(option.id)}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{option.text}</span>
                    {showResults && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">{option.votes || 0}</span>
                        <span className="text-sm font-medium">{percentage}%</span>
                      </div>
                    )}
                  </div>
                  
                  {showResults && (
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {poll.allowMultipleVotes && showVoteButton && (
          <p className="text-sm text-gray-500 mt-3">
            You can select multiple options
          </p>
        )}

        {/* Success Message */}
        {voteSuccess && (
          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800 font-medium">
              ✓ Vote cast successfully! Thank you for participating.
            </p>
          </div>
        )}

        {/* Error Message */}
        {voteError && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800 font-medium">
              ✗ {voteError}
            </p>
          </div>
        )}

        <div className="flex gap-2 mt-4">
          {showVoteButton && poll.isActive && (
            <Button 
              onClick={handleVote}
              disabled={selectedOptions.length === 0 || isVoting || voteSuccess}
              className="flex-1"
            >
              {isVoting ? 'Casting Vote...' : voteSuccess ? 'Vote Cast!' : 'Cast Vote'}
            </Button>
          )}
          
          {onViewDetails && (
            <Button 
              variant="outline" 
              onClick={() => onViewDetails(poll.id)}
              className={showVoteButton ? '' : 'flex-1'}
            >
              View Details
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}