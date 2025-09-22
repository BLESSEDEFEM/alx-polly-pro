'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './use-auth';
import type { Poll, CreatePollData, PollResult } from '@/types';

export function usePolls() {
  const { user } = useAuth();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch user's polls
  const fetchUserPolls = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('polls')
        .select(`
          *,
          poll_options (
            id,
            option_text,
            votes (count)
          )
        `)
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPolls(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch polls');
    } finally {
      setLoading(false);
    }
  };

  // Create a new poll
  const createPoll = async (pollData: CreatePollData) => {
    if (!user) throw new Error('User must be authenticated');
    
    setLoading(true);
    setError(null);
    
    try {
      // Generate unique URL slug
      const urlSlug = `${pollData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`;
      
      // Create poll
      const { data: poll, error: pollError } = await supabase
        .from('polls')
        .insert({
          title: pollData.title,
          description: pollData.description,
          creator_id: user.id,
          url_slug: urlSlug,
          is_public: pollData.is_public ?? true,
          allow_multiple_votes: pollData.allow_multiple_votes ?? false,
          expires_at: pollData.expires_at,
        })
        .select()
        .single();

      if (pollError) throw pollError;

      // Create poll options
      const optionsData = pollData.options.map((option, index) => ({
        poll_id: poll.id,
        option_text: option,
        option_order: index,
      }));

      const { error: optionsError } = await supabase
        .from('poll_options')
        .insert(optionsData);

      if (optionsError) throw optionsError;

      // Refresh polls list
      await fetchUserPolls();
      
      return poll;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create poll';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Get poll by URL slug
  const getPollBySlug = async (slug: string) => {
    try {
      const { data, error } = await supabase
        .from('polls')
        .select(`
          *,
          poll_options (
            id,
            option_text,
            option_order,
            votes (count)
          ),
          profiles (
            full_name,
            avatar_url
          )
        `)
        .eq('url_slug', slug)
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Poll not found');
    }
  };

  // Delete poll
  const deletePoll = async (pollId: string) => {
    if (!user) throw new Error('User must be authenticated');
    
    setLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase
        .from('polls')
        .delete()
        .eq('id', pollId)
        .eq('creator_id', user.id);

      if (error) throw error;
      
      // Refresh polls list
      await fetchUserPolls();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete poll';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Get poll results
  const getPollResults = async (pollId: string): Promise<PollResult[]> => {
    try {
      const { data, error } = await supabase
        .from('poll_options')
        .select(`
          id,
          option_text,
          votes (count)
        `)
        .eq('poll_id', pollId)
        .order('option_order');

      if (error) throw error;

      return data.map(option => ({
        option_id: option.id,
        option_text: option.option_text,
        vote_count: option.votes?.[0]?.count || 0,
      }));
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to fetch results');
    }
  };

  // Load user polls on mount and when user changes
  useEffect(() => {
    if (user) {
      fetchUserPolls();
    } else {
      setPolls([]);
    }
  }, [user]);

  return {
    polls,
    loading,
    error,
    createPoll,
    deletePoll,
    getPollBySlug,
    getPollResults,
    refreshPolls: fetchUserPolls,
  };
}

// Hook for individual poll management and voting
export function usePoll(pollId: string) {
  const { user } = useAuth();
  const [poll, setPoll] = useState<Poll | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch poll by ID
  const fetchPoll = async () => {
    if (!pollId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('polls')
        .select(`
          *,
          poll_options (
            id,
            option_text,
            option_order,
            votes (count)
          ),
          profiles (
            full_name,
            avatar_url
          )
        `)
        .eq('id', pollId)
        .single();

      if (error) throw error;
      setPoll(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch poll');
    } finally {
      setLoading(false);
    }
  };

  // Submit vote
  const vote = async (optionIds: string[]) => {
    if (!poll) throw new Error('Poll not loaded');
    
    setLoading(true);
    setError(null);
    
    try {
      // Check if user has already voted (for single vote polls)
      if (!poll.allow_multiple_votes && user) {
        const { data: existingVotes } = await supabase
          .from('votes')
          .select('id')
          .eq('poll_id', poll.id)
          .eq('voter_id', user.id);

        if (existingVotes && existingVotes.length > 0) {
          throw new Error('You have already voted on this poll');
        }
      }

      // For anonymous voting, check by IP (simplified for demo)
      if (!user) {
        // In a real app, you'd get the user's IP and check for duplicate votes
        // For now, we'll allow anonymous voting without duplicate checking
      }

      // Submit votes
      const votesData = optionIds.map(optionId => ({
        poll_id: poll.id,
        option_id: optionId,
        voter_id: user?.id || null,
        voter_ip: null, // In a real app, you'd capture the IP address
      }));

      const { error: voteError } = await supabase
        .from('votes')
        .insert(votesData);

      if (voteError) throw voteError;

      // Refresh poll data to show updated results
      await fetchPoll();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit vote';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Check if user has voted
  const checkUserVoted = async () => {
    if (!user || !poll) return false;
    
    try {
      const { data, error } = await supabase
        .from('votes')
        .select('id')
        .eq('poll_id', poll.id)
        .eq('voter_id', user.id);

      if (error) throw error;
      return data && data.length > 0;
    } catch (err) {
      console.error('Error checking vote status:', err);
      return false;
    }
  };

  // Load poll on mount and when pollId changes
  useEffect(() => {
    if (pollId) {
      fetchPoll();
    }
  }, [pollId]);

  return {
    poll,
    isLoading: loading,
    error,
    vote,
    refresh: fetchPoll,
    checkUserVoted,
  };
}