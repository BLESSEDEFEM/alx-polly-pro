/**
 * @fileoverview Polling hooks for managing poll data and operations
 * Provides hooks for fetching polls, creating polls, voting, and managing poll state
 */

'use client';

import { useState, useEffect } from 'react';
import { Poll, PollOption, CreatePollFormData } from '@/types';
import { pollsAPI } from '@/lib/api';

/**
 * Hook for managing multiple polls
 * 
 * Provides functionality to fetch, create, and manage a collection of polls.
 * Handles loading states and error management for poll operations.
 * 
 * @returns Object containing polls array, loading state, and poll management functions
 * 
 * @example
 * ```tsx
 * function PollsList() {
 *   const { polls, isLoading, createPoll, refreshPolls } = usePolls();
 *   
 *   if (isLoading) {
 *     return <div>Loading polls...</div>;
 *   }
 *   
 *   return (
 *     <div>
 *       {polls.map(poll => (
 *         <PollCard key={poll.id} poll={poll} />
 *       ))}
 *       <button onClick={() => createPoll(newPollData)}>
 *         Create Poll
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 */
export function usePolls() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPolls();
  }, []);

  /**
   * Fetches all polls from the API
   * 
   * Retrieves the complete list of polls and updates the local state.
   * Currently uses mock data - should be replaced with actual API calls.
   * 
   * @private
   */
  const fetchPolls = async () => {
    try {
      setIsLoading(true);
      setError(null);
      // Use fetchAll=true to get all polls instead of just the first page
      const response = await pollsAPI.getPolls({ fetchAll: 'true' });
      if (response.success) {
        setPolls(response.data as Poll[]);
      } else {
        const errorMessage = response.error || 'Failed to fetch polls';
        setError(errorMessage);
        console.error('Failed to fetch polls:', errorMessage);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch polls';
      setError(errorMessage);
      console.error('Failed to fetch polls:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Creates a new poll
   * 
   * Submits poll data to create a new poll and adds it to the local state.
   * Currently uses mock implementation - should be replaced with actual API calls.
   * 
   * @param pollData - Data for creating the new poll
   * @returns Promise that resolves when poll is created
   * @throws Error if poll creation fails
   * 
   * @example
   * ```tsx
   * const { createPoll } = usePolls();
   * 
   * const handleCreatePoll = async () => {
   *   try {
   *     await createPoll({
   *       title: 'Best Framework',
   *       description: 'Which framework do you prefer?',
   *       options: ['React', 'Vue', 'Angular']
   *     });
   *     // Poll created successfully
   *   } catch (error) {
   *     console.error('Failed to create poll:', error);
   *   }
   * };
   * ```
   */
  const createPoll = async (pollData: CreatePollData): Promise<Poll> => {
    try {
      const response = await pollsAPI.createPoll(pollData);
      console.log('Create poll response:', response); // Debug logging
      if (response.success) {
        const newPoll = response.data;
        console.log('New poll data:', newPoll); // Debug logging
        setPolls(prev => [newPoll, ...prev]);
        return newPoll;
      } else {
        throw new Error(response.error || 'Failed to create poll');
      }
    } catch (error) {
      console.error('Failed to create poll:', error);
      throw error;
    }
  };

  /**
   * Casts a vote for a poll option
   * 
   * Submits a vote for the specified option and updates the local poll state.
   * Currently uses mock implementation - should be replaced with actual API calls.
   * 
   * @param pollId - ID of the poll to vote on
   * @param optionId - ID of the option to vote for
   * @returns Promise that resolves when vote is cast
   * @throws Error if voting fails
   * 
   * @example
   * ```tsx
   * const { votePoll } = usePolls();
   * 
   * const handleVote = async (pollId: string, optionId: string) => {
   *   try {
   *     await votePoll(pollId, optionId);
   *     // Vote cast successfully
   *   } catch (error) {
   *     console.error('Failed to vote:', error);
   *   }
   * };
   * ```
   */
  const votePoll = async (pollId: string, optionIds: string[]) => {
    try {
      console.log('Voting on poll:', pollId, 'with options:', optionIds);
      const response = await pollsAPI.votePoll(pollId, optionIds);
      console.log('Vote response:', response);
      
      if (response.success) {
        // Update local state immediately for responsive UI
        setPolls(prev => prev.map(poll => {
          if (poll.id === pollId) {
            return {
              ...poll,
              options: poll.options.map(option => 
                optionIds.includes(option.id)
                  ? { ...option, votes: (option.votes || 0) + 1 }
                  : option
              ),
            } as Poll;
          }
          return poll;
        }));
        
        // Refresh all polls to ensure data consistency
        setTimeout(() => fetchPolls(), 500);
      } else {
        console.error('Vote failed with response:', response);
        throw new Error(response.error || response.message || 'Failed to cast vote');
      }
    } catch (error) {
      console.error('Failed to vote:', error);
      throw error;
    }
  };

  /**
   * Refreshes the polls list
   * 
   * Re-fetches all polls from the API to ensure data is up-to-date.
   * 
   * @example
   * ```tsx
   * const { refreshPolls } = usePolls();
   * 
   * const handleRefresh = () => {
   *   refreshPolls();
   * };
   * ```
   */
  const refreshPolls = () => {
    fetchPolls();
  };

  return {
    polls,
    isLoading,
    error,
    createPoll,
    votePoll,
    refreshPolls,
  };
}

/**
 * Hook for managing a single poll
 * 
 * Provides functionality to fetch and manage a specific poll by ID.
 * Handles loading states and provides voting functionality for the poll.
 * 
 * @param pollId - ID of the poll to manage
 * @returns Object containing poll data, loading state, and poll operations
 * 
 * @example
 * ```tsx
 * function PollDetail({ pollId }: { pollId: string }) {
 *   const { poll, isLoading, vote } = usePoll(pollId);
 *   
 *   if (isLoading) {
 *     return <div>Loading poll...</div>;
 *   }
 *   
 *   if (!poll) {
 *     return <div>Poll not found</div>;
 *   }
 *   
 *   return (
 *     <div>
 *       <h2>{poll.title}</h2>
 *       {poll.options.map(option => (
 *         <button 
 *           key={option.id}
 *           onClick={() => vote(option.id)}
 *         >
 *           {option.text} ({option.votes} votes)
 *         </button>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function usePoll(pollId: string) {
  const [poll, setPoll] = useState<Poll | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (pollId) {
      fetchPoll();
    }
  }, [pollId]);

  /**
   * Fetches a specific poll by ID
   * 
   * Retrieves poll data from the API and updates the local state.
   * Currently uses mock data - should be replaced with actual API calls.
   * 
   * @private
   */
  const fetchPoll = async () => {
    // Don't fetch if pollId is 'new' or invalid
    if (!pollId || pollId === 'new') {
      setPoll(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const response = await pollsAPI.getPoll(pollId);
      if (response.success) {
        setPoll(response.data);
      } else {
        console.error('Failed to fetch poll:', response.error);
        setPoll(null); // Set poll to null if fetching fails
      }
    } catch (error) {
      console.error('Failed to fetch poll:', error);
      setPoll(null);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Casts a vote for an option in this poll
   * 
   * Submits a vote for the specified option and updates the local poll state.
   * Currently uses mock implementation - should be replaced with actual API calls.
   * 
   * @param optionId - ID of the option to vote for
   * @returns Promise that resolves when vote is cast
   * @throws Error if voting fails
   * 
   * @example
   * ```tsx
   * const { vote } = usePoll('poll-123');
   * 
   * const handleVote = async (optionId: string) => {
   *   try {
   *     await vote(optionId);
   *     // Vote cast successfully
   *   } catch (error) {
   *     console.error('Failed to vote:', error);
   *   }
   * };
   * ```
   */
  const vote = async (optionIds: string[]) => {
    if (!poll) return;
    
    try {
      const response = await pollsAPI.votePoll(pollId, optionIds);
      if (response.success) {
        // Update local state immediately for responsive UI
        setPoll(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            options: prev.options.map(option => 
              optionIds.includes(option.id)
                ? { ...option, votes: (option.votes || 0) + 1 }
                : option
            ),
          };
        });
        
        // Fetch fresh data from server to ensure consistency
        fetchPoll();
      } else {
        throw new Error(response.error || 'Failed to cast vote');
      }
    } catch (error) {
      console.error('Failed to vote:', error);
      throw error;
    }
  };

  /**
   * Refreshes the poll data
   * 
   * Re-fetches the poll from the API to ensure data is up-to-date.
   * 
   * @example
   * ```tsx
   * const { refresh } = usePoll('poll-123');
   * 
   * const handleRefresh = () => {
   *   refresh();
   * };
   * ```
   */
  const refresh = () => {
    fetchPoll();
  };

  return {
    poll,
    isLoading,
    vote,
    refresh,
  };
}