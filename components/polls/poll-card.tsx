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

  const totalVotes = poll.options.reduce((sum, option) => sum + option.votes, 0);

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

    setIsVoting(true);
    try {
      await onVote(poll.id, selectedOptions);
      setSelectedOptions([]);
    } catch (error) {
      console.error('Voting failed:', error);
    } finally {
      setIsVoting(false);
    }
  };

  const getVotePercentage = (votes: number) => {
    return totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
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
                        <span className="text-sm text-gray-600">{option.votes}</span>
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

        <div className="flex gap-2 mt-4">
          {showVoteButton && poll.isActive && (
            <Button 
              onClick={handleVote}
              disabled={selectedOptions.length === 0 || isVoting}
              className="flex-1"
            >
              {isVoting ? 'Voting...' : 'Vote'}
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