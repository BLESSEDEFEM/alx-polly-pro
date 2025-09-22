import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { 
  MoreHorizontal, 
  Share2, 
  Trash2, 
  ExternalLink, 
  Users, 
  BarChart3, 
  Clock, 
  CheckCircle2,
  Vote,
  Loader2,
  QrCode
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';
import { Poll } from '@/types';
import { usePolls } from '@/hooks/use-polls';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';

interface PollCardProps {
  poll: Poll & {
    poll_options?: Array<{
      id: string;
      option_text: string;
      votes?: Array<{ count: number }>;
    }>;
  };
  showActions?: boolean;
  onDelete?: (pollId: string) => void;
  onVote?: (pollId: string, optionIds: string[]) => void;
  onQRCode?: () => void;
  showVoteButton?: boolean;
  allowVoting?: boolean;
}

export function PollCard({ 
  poll, 
  showActions = true, 
  onDelete,
  onVote,
  onQRCode,
  showVoteButton = false,
  allowVoting = false
}: PollCardProps) {
  const { deletePoll, loading } = usePolls();
  const { user } = useAuth();
  const router = useRouter();
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [isVoting, setIsVoting] = useState(false);
  const [voteError, setVoteError] = useState<string | null>(null);
  const [voteSuccess, setVoteSuccess] = useState(false);

  // Calculate total votes
  const totalVotes = poll.poll_options?.reduce((total, option) => {
    const voteCount = option.votes?.[0]?.count || 0;
    return total + voteCount;
  }, 0) || 0;

  // Check if poll is expired
  const isExpired = poll.expires_at ? new Date(poll.expires_at) < new Date() : false;

  // Handle option selection for voting
  const handleOptionSelect = (optionId: string) => {
    if (poll.allow_multiple_votes) {
      // Multiple selection
      setSelectedOptions(prev => 
        prev.includes(optionId) 
          ? prev.filter(id => id !== optionId)
          : [...prev, optionId]
      );
    } else {
      // Single selection
      setSelectedOptions([optionId]);
    }
  };

  // Handle vote submission
  const handleVote = async () => {
    if (selectedOptions.length === 0) {
      setVoteError('Please select at least one option');
      return;
    }

    setIsVoting(true);
    setVoteError(null);

    try {
      if (onVote) {
        await onVote(poll.id, selectedOptions);
      }
      setVoteSuccess(true);
      setSelectedOptions([]);
      setTimeout(() => setVoteSuccess(false), 3000);
    } catch (error) {
      setVoteError(error instanceof Error ? error.message : 'Failed to submit vote');
    } finally {
      setIsVoting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this poll? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);

    try {
      await deletePoll(poll.id);
      onDelete?.(poll.id);
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : 'Failed to delete poll');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleShare = async () => {
    const pollUrl = `${window.location.origin}/polls/${poll.url_slug}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: poll.title,
          text: poll.description || 'Check out this poll!',
          url: pollUrl,
        });
      } catch (error) {
        // Fallback to clipboard
        await navigator.clipboard.writeText(pollUrl);
        alert('Poll URL copied to clipboard!');
      }
    } else {
      // Fallback to clipboard
      await navigator.clipboard.writeText(pollUrl);
      alert('Poll URL copied to clipboard!');
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <Link 
              href={`/polls/${poll.url_slug}`}
              className="block hover:text-blue-600 transition-colors"
            >
              <h3 className="font-semibold text-lg leading-tight truncate">
                {poll.title}
              </h3>
            </Link>
            {poll.description && (
              <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                {poll.description}
              </p>
            )}
          </div>
          
          {showActions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/polls/${poll.url_slug}`}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Poll
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/polls/${poll.url_slug}/results`}>
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Results
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleShare}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Poll
                </DropdownMenuItem>
                {onQRCode && (
                  <DropdownMenuItem onClick={onQRCode}>
                    <QrCode className="h-4 w-4 mr-2" />
                    QR Code
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {isDeleting ? 'Deleting...' : 'Delete Poll'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Poll Stats */}
        <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{totalVotes} votes</span>
          </div>
          
          <div className="flex items-center gap-1">
            <BarChart3 className="h-4 w-4" />
            <span>{poll.poll_options?.length || 0} options</span>
          </div>
          
          {poll.expires_at && (
            <div className="flex items-center gap-1">
              {isExpired ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-red-500" />
                  <span className="text-red-500">Expired</span>
                </>
              ) : (
                <>
                  <Clock className="h-4 w-4" />
                  <span>
                    Expires {formatDistanceToNow(new Date(poll.expires_at), { addSuffix: true })}
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Voting Interface */}
        {allowVoting && !isExpired && poll.poll_options && (
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-3">Cast your vote:</h4>
            
            {poll.allow_multiple_votes ? (
              // Multiple choice voting
              <div className="space-y-2 mb-3">
                {poll.poll_options.map((option) => (
                  <div key={option.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`option-${option.id}`}
                      checked={selectedOptions.includes(option.id)}
                      onCheckedChange={() => handleOptionSelect(option.id)}
                    />
                    <Label 
                      htmlFor={`option-${option.id}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {option.option_text}
                    </Label>
                  </div>
                ))}
              </div>
            ) : (
              // Single choice voting
              <RadioGroup 
                value={selectedOptions[0] || ''} 
                onValueChange={(value) => handleOptionSelect(value)}
                className="mb-3"
              >
                {poll.poll_options.map((option) => (
                  <div key={option.id} className="flex items-center space-x-2">
                    <RadioGroupItem value={option.id} id={`option-${option.id}`} />
                    <Label 
                      htmlFor={`option-${option.id}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {option.option_text}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}

            {/* Vote Button */}
            <Button 
              onClick={handleVote}
              disabled={isVoting || selectedOptions.length === 0}
              className="w-full"
              size="sm"
            >
              {isVoting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Vote className="mr-2 h-4 w-4" />
                  Submit Vote
                </>
              )}
            </Button>

            {/* Vote Success Message */}
            {voteSuccess && (
              <div className="mt-2 p-2 bg-green-100 text-green-800 text-sm rounded">
                <CheckCircle2 className="inline mr-1 h-4 w-4" />
                Vote submitted successfully!
              </div>
            )}

            {/* Vote Error Message */}
            {voteError && (
              <Alert variant="destructive" className="mt-2">
                <AlertDescription>{voteError}</AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Poll Options Preview (when not voting) */}
        {(!allowVoting || isExpired) && poll.poll_options && poll.poll_options.length > 0 && (
          <div className="space-y-2 mb-3">
            {poll.poll_options.slice(0, 2).map((option) => {
              const voteCount = option.votes?.[0]?.count || 0;
              const percentage = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;
              
              return (
                <div key={option.id} className="text-sm">
                  <div className="flex justify-between items-center mb-1">
                    <span className="truncate">{option.option_text}</span>
                    <span className="text-gray-500 ml-2">
                      {voteCount} ({percentage.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
            
            {poll.poll_options.length > 2 && (
              <p className="text-xs text-gray-500">
                +{poll.poll_options.length - 2} more options
              </p>
            )}
          </div>
        )}

        {/* Poll Metadata */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>
            Created {formatDistanceToNow(new Date(poll.created_at), { addSuffix: true })}
          </span>
          
          <div className="flex items-center gap-2">
            {poll.is_public ? (
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full">
                Public
              </span>
            ) : (
              <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full">
                Private
              </span>
            )}
            
            {poll.allow_multiple_votes && (
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                Multiple Votes
              </span>
            )}
          </div>
        </div>

        {/* Error Display */}
        {deleteError && (
          <Alert variant="destructive" className="mt-3">
            <AlertDescription>{deleteError}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}