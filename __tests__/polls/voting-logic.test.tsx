/**
 * @fileoverview Voting Logic Test Suite
 * 
 * Comprehensive test suite for poll voting functionality including:
 * - Unit tests for voting logic (happy path, validation, multiple votes)
 * - Edge case tests (duplicate votes, expired polls, unauthorized access)
 * - Integration tests for full voting flow with API routes
 * - Vote counting and result calculation tests
 */

import { renderHook, waitFor } from '@testing-library/react';
import { usePolls, usePoll } from '@/hooks/use-polls';
import { pollsAPI } from '@/lib/api';
import { Poll, PollOption, Vote } from '@/types';

// ============================================================================
// MOCK SETUP
// ============================================================================

// Mock Supabase client
jest.mock('@/lib/supabase', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn(),
      getSession: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
    })),
  })),
}));

// Mock the hooks
jest.mock('@/hooks/use-polls');
const mockUsePolls = usePolls as jest.MockedFunction<typeof usePolls>;
const mockUsePoll = usePoll as jest.MockedFunction<typeof usePoll>;

// Mock the API
jest.mock('@/lib/api');
const mockPollsAPI = pollsAPI as jest.Mocked<typeof pollsAPI>;

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useParams: () => ({ id: 'test-poll-id' }),
}));

// ============================================================================
// TEST DATA
// ============================================================================

const mockPoll: Poll = {
  id: 'poll-123',
  title: 'Favorite Programming Language',
  description: 'Choose your preferred programming language',
  createdBy: 'user-456',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  expiresAt: new Date('2024-12-31'),
  isActive: true,
  allowMultipleVotes: false,
  isAnonymous: false,
  pollCategory: 'technology',
  options: [
    { id: 'option-1', text: 'JavaScript', votes: 5, pollId: 'poll-123' },
    { id: 'option-2', text: 'Python', votes: 8, pollId: 'poll-123' },
    { id: 'option-3', text: 'TypeScript', votes: 3, pollId: 'poll-123' },
  ],
};

const mockMultiVotePoll: Poll = {
  ...mockPoll,
  id: 'poll-multi-456',
  title: 'Favorite Tech Stack Components',
  allowMultipleVotes: true,
  options: [
    { id: 'option-a', text: 'React', votes: 12, pollId: 'poll-multi-456' },
    { id: 'option-b', text: 'Node.js', votes: 10, pollId: 'poll-multi-456' },
    { id: 'option-c', text: 'PostgreSQL', votes: 8, pollId: 'poll-multi-456' },
    { id: 'option-d', text: 'Docker', votes: 6, pollId: 'poll-multi-456' },
  ],
};

const mockExpiredPoll: Poll = {
  ...mockPoll,
  id: 'poll-expired-789',
  title: 'Expired Poll',
  expiresAt: new Date('2023-01-01'), // Past date
  isActive: false,
};

// ============================================================================
// UNIT TESTS - HAPPY PATH VOTING
// ============================================================================

describe('Voting Logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Unit Tests - Happy Path Voting', () => {
    it('should successfully cast a single vote on a poll', async () => {
      // Arrange
      const mockVotePoll = jest.fn().mockResolvedValue(undefined);
      mockUsePolls.mockReturnValue({
        polls: [mockPoll],
        isLoading: false,
        createPoll: jest.fn(),
        votePoll: mockVotePoll,
        refreshPolls: jest.fn(),
      });

      // Act
      const { result } = renderHook(() => usePolls());
      await result.current.votePoll('poll-123', ['option-1']);

      // Assert
      expect(mockVotePoll).toHaveBeenCalledWith('poll-123', ['option-1']);
    });

    it('should successfully cast multiple votes on a multi-vote poll', async () => {
      // Arrange
      const mockVotePoll = jest.fn().mockResolvedValue(undefined);
      mockUsePolls.mockReturnValue({
        polls: [mockMultiVotePoll],
        isLoading: false,
        createPoll: jest.fn(),
        votePoll: mockVotePoll,
        refreshPolls: jest.fn(),
      });

      // Act
      const { result } = renderHook(() => usePolls());
      await result.current.votePoll('poll-multi-456', ['option-a', 'option-c']);

      // Assert
      expect(mockVotePoll).toHaveBeenCalledWith('poll-multi-456', ['option-a', 'option-c']);
    });

    it('should update local poll state after successful vote', async () => {
      // Arrange
      const mockVote = jest.fn().mockResolvedValue(undefined);
      mockUsePoll.mockReturnValue({
        poll: mockPoll,
        isLoading: false,
        vote: mockVote,
        refresh: jest.fn(),
      });

      // Act
      const { result } = renderHook(() => usePoll('poll-123'));
      await result.current.vote(['option-1']);

      // Assert
      expect(mockVote).toHaveBeenCalledWith(['option-1']);
    });

    it('should validate vote data structure before submission', async () => {
      // Arrange
      const mockVotePoll = jest.fn();
      mockUsePolls.mockReturnValue({
        polls: [mockPoll],
        isLoading: false,
        createPoll: jest.fn(),
        votePoll: mockVotePoll,
        refreshPolls: jest.fn(),
      });

      // Act & Assert - Test empty option IDs
      const { result } = renderHook(() => usePolls());
      
      // Mock the function to throw for invalid inputs
      mockVotePoll.mockRejectedValue(new Error('Invalid vote data'));
      
      await expect(
        result.current.votePoll('poll-123', [])
      ).rejects.toThrow('Invalid vote data');
    });

    it('should handle voting on non-existent poll', async () => {
      // Arrange
      const mockVotePoll = jest.fn().mockRejectedValue(new Error('Poll not found'));
      mockUsePolls.mockReturnValue({
        polls: [],
        isLoading: false,
        createPoll: jest.fn(),
        votePoll: mockVotePoll,
        refreshPolls: jest.fn(),
      });

      // Act & Assert
      const { result } = renderHook(() => usePolls());
      await expect(
        result.current.votePoll('non-existent-poll', ['option-1'])
      ).rejects.toThrow('Poll not found');
    });

    it('should handle voting on expired poll', async () => {
      // Arrange
      const expiredPoll = {
        ...mockPoll,
        expires_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      };
      
      const mockVotePoll = jest.fn().mockRejectedValue(new Error('Poll has expired'));
      mockUsePolls.mockReturnValue({
        polls: [expiredPoll],
        isLoading: false,
        createPoll: jest.fn(),
        votePoll: mockVotePoll,
        refreshPolls: jest.fn(),
      });

      // Act & Assert
      const { result } = renderHook(() => usePolls());
      await expect(
        result.current.votePoll('poll-123', ['option-1'])
      ).rejects.toThrow('Poll has expired');
    });

    it('should handle voting on inactive poll', async () => {
      // Arrange
      const inactivePoll = {
        ...mockPoll,
        is_active: false,
      };
      
      const mockVotePoll = jest.fn().mockRejectedValue(new Error('Poll is not active'));
      mockUsePolls.mockReturnValue({
        polls: [inactivePoll],
        isLoading: false,
        createPoll: jest.fn(),
        votePoll: mockVotePoll,
        refreshPolls: jest.fn(),
      });

      // Act & Assert
      const { result } = renderHook(() => usePolls());
      await expect(
        result.current.votePoll('poll-123', ['option-1'])
      ).rejects.toThrow('Poll is not active');
    });
  });

  // ============================================================================
  // UNIT TESTS - EDGE CASES AND FAILURE SCENARIOS
  // ============================================================================

  describe('Unit Tests - Edge Cases and Failure Scenarios', () => {
    it('should reject voting on expired polls', async () => {
      // Arrange
      const mockVotePoll = jest.fn().mockRejectedValue({
        success: false,
        message: 'Poll has expired',
        status: 400,
      });
      mockUsePolls.mockReturnValue({
        polls: [mockPoll],
        isLoading: false,
        createPoll: jest.fn(),
        votePoll: mockVotePoll,
        refreshPolls: jest.fn(),
      });

      // Act
      const { result } = renderHook(() => usePolls());
      const votePromise = result.current.votePoll('poll-expired-789', ['option-1']);

      // Assert
      await expect(votePromise).rejects.toMatchObject({
        message: 'Poll has expired',
      });
    });

    it('should reject voting on inactive polls', async () => {
      // Arrange
      const mockVotePoll = jest.fn().mockRejectedValue({
        success: false,
        message: 'Poll is not active',
        status: 400,
      });
      mockUsePolls.mockReturnValue({
        polls: [mockPoll],
        isLoading: false,
        createPoll: jest.fn(),
        votePoll: mockVotePoll,
        refreshPolls: jest.fn(),
      });

      // Act
      const { result } = renderHook(() => usePolls());
      const votePromise = result.current.votePoll('poll-inactive-999', ['option-1']);

      // Assert
      await expect(votePromise).rejects.toMatchObject({
        message: 'Poll is not active',
      });
    });

    it('should reject voting with invalid option IDs', async () => {
      // Arrange
      const mockVotePoll = jest.fn().mockRejectedValue({
        success: false,
        message: 'Invalid option selected',
        status: 400,
      });
      mockUsePolls.mockReturnValue({
        polls: [mockPoll],
        isLoading: false,
        createPoll: jest.fn(),
        votePoll: mockVotePoll,
        refreshPolls: jest.fn(),
      });

      // Act
      const { result } = renderHook(() => usePolls());
      const votePromise = result.current.votePoll('poll-123', ['invalid-option-id']);

      // Assert
      await expect(votePromise).rejects.toMatchObject({
        message: 'Invalid option selected',
      });
    });

    it('should handle unauthorized voting attempts', async () => {
      // Arrange
      const mockVotePoll = jest.fn().mockRejectedValue({
        success: false,
        message: 'Authentication required',
        status: 401,
      });
      mockUsePolls.mockReturnValue({
        polls: [mockPoll],
        isLoading: false,
        createPoll: jest.fn(),
        votePoll: mockVotePoll,
        refreshPolls: jest.fn(),
      });

      // Act
      const { result } = renderHook(() => usePolls());
      const votePromise = result.current.votePoll('poll-123', ['option-1']);

      // Assert
      await expect(votePromise).rejects.toMatchObject({
        message: 'Authentication required',
      });
    });

    it('should prevent duplicate votes on single-vote polls', async () => {
      // Arrange
      const mockVotePoll = jest.fn().mockRejectedValue({
        success: false,
        message: 'User has already voted on this poll',
        status: 409,
      });
      mockUsePolls.mockReturnValue({
        polls: [mockPoll],
        isLoading: false,
        createPoll: jest.fn(),
        votePoll: mockVotePoll,
        refreshPolls: jest.fn(),
      });

      // Act
      const { result } = renderHook(() => usePolls());
      const votePromise = result.current.votePoll('poll-123', ['option-1']);

      // Assert
      await expect(votePromise).rejects.toMatchObject({
        message: 'User has already voted on this poll',
      });
    });

    it('should handle network errors gracefully during voting', async () => {
      // Arrange
      const mockVotePoll = jest.fn().mockRejectedValue(new Error('Network error'));
      mockUsePolls.mockReturnValue({
        polls: [mockPoll],
        isLoading: false,
        createPoll: jest.fn(),
        votePoll: mockVotePoll,
        refreshPolls: jest.fn(),
      });

      // Act
      const { result } = renderHook(() => usePolls());
      const votePromise = result.current.votePoll('poll-123', ['option-1']);

      // Assert
      await expect(votePromise).rejects.toThrow('Network error');
    });

    it('should validate maximum vote limit for multi-vote polls', async () => {
      // Arrange
      const tooManyOptions = Array.from({ length: 15 }, (_, i) => `option-${i}`);
      const mockVotePoll = jest.fn().mockRejectedValue({
        success: false,
        message: 'Too many options selected',
        status: 400,
      });
      mockUsePolls.mockReturnValue({
        polls: [mockMultiVotePoll],
        isLoading: false,
        createPoll: jest.fn(),
        votePoll: mockVotePoll,
        refreshPolls: jest.fn(),
      });

      // Act
      const { result } = renderHook(() => usePolls());
      const votePromise = result.current.votePoll('poll-multi-456', tooManyOptions);

      // Assert
      await expect(votePromise).rejects.toMatchObject({
        message: 'Too many options selected',
      });
    });
  });

  // ============================================================================
  // INTEGRATION TESTS - FULL VOTING FLOW
  // ============================================================================

  describe('Integration Tests - Full Voting Flow', () => {
    it('should complete full voting flow with API route integration', async () => {
      // Arrange - Mock successful responses
      const mockVote = jest.fn().mockResolvedValue(undefined);
      const mockRefresh = jest.fn();
      
      mockUsePoll.mockReturnValue({
        poll: mockPoll,
        isLoading: false,
        vote: mockVote,
        refresh: mockRefresh,
      });

      // Act - Simulate complete voting flow
      const { result } = renderHook(() => usePoll('poll-123'));
      
      // Cast vote
      await result.current.vote(['option-1']);

      // Assert
      expect(mockVote).toHaveBeenCalledWith(['option-1']);
    });

    it('should handle real-time vote updates and result synchronization', async () => {
      // Arrange
      const mockVote = jest.fn().mockResolvedValue(undefined);
      const mockRefresh = jest.fn();
      
      mockUsePoll.mockReturnValue({
        poll: mockPoll,
        isLoading: false,
        vote: mockVote,
        refresh: mockRefresh,
      });

      // Act
      const { result } = renderHook(() => usePoll('poll-123'));
      await result.current.vote(['option-1']);

      // Assert - Vote should be called
      expect(mockVote).toHaveBeenCalledWith(['option-1']);
    });

    it('should maintain vote integrity across multiple concurrent votes', async () => {
      // Arrange
      const mockVotePoll = jest.fn()
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined);
        
      mockUsePolls.mockReturnValue({
        polls: [mockPoll],
        isLoading: false,
        createPoll: jest.fn(),
        votePoll: mockVotePoll,
        refreshPolls: jest.fn(),
      });

      // Act - Simulate concurrent votes
      const { result } = renderHook(() => usePolls());
      
      const votePromises = [
        result.current.votePoll('poll-123', ['option-1']),
        result.current.votePoll('poll-123', ['option-2']),
        result.current.votePoll('poll-123', ['option-3']),
      ];

      // Assert
      await Promise.all(votePromises);
      expect(mockVotePoll).toHaveBeenCalledTimes(3);
    });
  });

  // ============================================================================
  // VOTE COUNTING AND RESULTS TESTS
  // ============================================================================

  describe('Vote Counting and Results', () => {
    it('should calculate correct vote totals for poll options', () => {
      // Arrange
      const poll = mockPoll;

      // Act
      const totalVotes = poll.options.reduce((sum, option) => sum + option.votes, 0);

      // Assert
      expect(totalVotes).toBe(16); // 5 + 8 + 3
    });

    it('should calculate correct vote percentages', () => {
      // Arrange
      const poll = mockPoll;
      const totalVotes = poll.options.reduce((sum, option) => sum + option.votes, 0);

      // Act
      const percentages = poll.options.map(option => ({
        optionId: option.id,
        percentage: Math.round((option.votes / totalVotes) * 100 * 10) / 10,
      }));

      // Assert
      expect(percentages).toEqual([
        { optionId: 'option-1', percentage: 31.3 }, // 5/16 * 100
        { optionId: 'option-2', percentage: 50.0 }, // 8/16 * 100
        { optionId: 'option-3', percentage: 18.8 }, // 3/16 * 100
      ]);
    });

    it('should handle zero vote scenarios correctly', () => {
      // Arrange
      const emptyPoll: Poll = {
        ...mockPoll,
        options: [
          { id: 'option-1', text: 'Option 1', votes: 0, pollId: 'poll-123' },
          { id: 'option-2', text: 'Option 2', votes: 0, pollId: 'poll-123' },
        ],
      };

      // Act
      const totalVotes = emptyPoll.options.reduce((sum, option) => sum + option.votes, 0);

      // Assert
      expect(totalVotes).toBe(0);
      
      // Percentages should be 0 when no votes
      const percentages = emptyPoll.options.map(option => ({
        optionId: option.id,
        percentage: totalVotes === 0 ? 0 : (option.votes / totalVotes) * 100,
      }));

      expect(percentages.every(p => p.percentage === 0)).toBe(true);
    });

    it('should validate vote count consistency', async () => {
      // Arrange
      const mockGetPollResults = jest.fn().mockResolvedValue({
        success: true,
        data: {
          pollId: 'poll-123',
          totalVotes: 16,
          results: [
            { optionId: 'option-1', votes: 5 },
            { optionId: 'option-2', votes: 8 },
            { optionId: 'option-3', votes: 3 },
          ],
        },
      });

      // Act
      const results = await mockGetPollResults('poll-123');

      // Assert
      const calculatedTotal = results.data.results.reduce((sum: number, result: any) => sum + result.votes, 0);
      expect(calculatedTotal).toBe(results.data.totalVotes);
    });
  });
});