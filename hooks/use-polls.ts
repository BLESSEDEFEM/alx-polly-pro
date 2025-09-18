'use client';

import { useState, useEffect } from 'react';
import { Poll, CreatePollFormData, Vote } from '@/types';

export function usePolls() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPolls = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // TODO: Implement actual API call
      // const response = await fetch('/api/polls');
      // const data = await response.json();
      
      // Mock data for now
      const mockPolls: Poll[] = [
        {
          id: '1',
          title: 'What\'s your favorite programming language?',
          description: 'Help us understand the community preferences',
          options: [
            { id: '1', text: 'JavaScript', votes: 45, pollId: '1' },
            { id: '2', text: 'Python', votes: 32, pollId: '1' },
            { id: '3', text: 'TypeScript', votes: 28, pollId: '1' },
            { id: '4', text: 'Go', votes: 15, pollId: '1' },
          ],
          createdBy: 'user1',
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date('2024-01-15'),
          isActive: true,
          allowMultipleVotes: false,
          isAnonymous: false,
        },
        {
          id: '2',
          title: 'Best time for team meetings?',
          description: 'Let\'s find a time that works for everyone',
          options: [
            { id: '5', text: '9:00 AM', votes: 12, pollId: '2' },
            { id: '6', text: '2:00 PM', votes: 18, pollId: '2' },
            { id: '7', text: '4:00 PM', votes: 8, pollId: '2' },
          ],
          createdBy: 'user2',
          createdAt: new Date('2024-01-14'),
          updatedAt: new Date('2024-01-14'),
          isActive: true,
          allowMultipleVotes: true,
          isAnonymous: true,
        },
      ];
      
      setPolls(mockPolls);
    } catch (err) {
      setError('Failed to fetch polls');
      console.error('Error fetching polls:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const createPoll = async (pollData: CreatePollFormData) => {
    setIsLoading(true);
    setError(null);
    try {
      // TODO: Implement actual API call
      console.log('Creating poll:', pollData);
      
      // Mock successful creation
      const newPoll: Poll = {
        id: Date.now().toString(),
        title: pollData.title,
        description: pollData.description,
        options: pollData.options.map((text, index) => ({
          id: `${Date.now()}-${index}`,
          text,
          votes: 0,
          pollId: Date.now().toString(),
        })),
        createdBy: 'current-user',
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: pollData.expiresAt,
        isActive: true,
        allowMultipleVotes: pollData.allowMultipleVotes,
        isAnonymous: pollData.isAnonymous,
      };
      
      setPolls(prev => [newPoll, ...prev]);
      return newPoll;
    } catch (err) {
      setError('Failed to create poll');
      console.error('Error creating poll:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const votePoll = async (pollId: string, optionIds: string[]) => {
    setError(null);
    try {
      // TODO: Implement actual API call
      console.log('Voting on poll:', { pollId, optionIds });
      
      // Mock vote update
      setPolls(prev => prev.map(poll => {
        if (poll.id === pollId) {
          return {
            ...poll,
            options: poll.options.map(option => ({
              ...option,
              votes: optionIds.includes(option.id) ? option.votes + 1 : option.votes,
            })),
          };
        }
        return poll;
      }));
    } catch (err) {
      setError('Failed to vote');
      console.error('Error voting:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchPolls();
  }, []);

  return {
    polls,
    isLoading,
    error,
    fetchPolls,
    createPoll,
    votePoll,
  };
}

export function usePoll(pollId: string) {
  const { polls, isLoading, error, votePoll } = usePolls();
  const poll = polls.find(p => p.id === pollId);

  return {
    poll,
    isLoading,
    error,
    votePoll: (pollId: string, optionIds: string[]) => votePoll(pollId, optionIds),
  };
}