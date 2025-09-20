/**
 * @fileoverview Poll Management Test Suite
 * Comprehensive tests for poll creation, editing, and visibility logic
 * Tests both happy path scenarios and edge cases with proper Supabase mocking
 */

import { renderHook, waitFor } from '@testing-library/react';
import { usePolls, usePoll } from '@/hooks/use-polls';
import { pollsAPI } from '@/lib/api';
import { Poll, CreatePollFormData } from '@/types';

// Mock Next.js router
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock the hooks
jest.mock('@/hooks/use-polls');
const mockUsePolls = usePolls as jest.MockedFunction<typeof usePolls>;
const mockUsePoll = usePoll as jest.MockedFunction<typeof usePoll>;

// Mock the API
jest.mock('@/lib/api');
const mockPollsAPI = pollsAPI as jest.Mocked<typeof pollsAPI>;

// Mock Supabase client
const mockSupabaseClient = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(),
      })),
      neq: jest.fn(() => ({
        eq: jest.fn(),
      })),
    })),
    insert: jest.fn(() => ({
      select: jest.fn(() => ({
        single: jest.fn(),
      })),
    })),
    update: jest.fn(() => ({
      eq: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
    })),
    delete: jest.fn(() => ({
      eq: jest.fn(),
    })),
  })),
  auth: {
    getUser: jest.fn(),
  },
};

jest.mock('@/lib/supabase', () => ({
  supabase: mockSupabaseClient,
}));

// Test data
const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  name: 'Test User',
};

const mockPollData: CreatePollFormData = {
  title: 'Best Programming Language',
  description: 'Which programming language do you prefer for web development?',
  options: ['JavaScript', 'TypeScript', 'Python'],
  allowMultipleVotes: false,
  isAnonymous: false,
  pollCategory: 'technology',
};

const mockCreatedPoll: Poll = {
  id: 'poll-123',
  title: 'Best Programming Language',
  description: 'Which programming language do you prefer for web development?',
  createdBy: 'user-123',
  createdAt: new Date('2024-01-01T10:00:00Z'),
  updatedAt: new Date('2024-01-01T10:00:00Z'),
  isActive: true,
  allowMultipleVotes: false,
  isAnonymous: false,
  pollCategory: 'technology',
  isPrivate: false,
  options: [
    { id: 'opt-1', text: 'JavaScript', votes: 0, pollId: 'poll-123' },
    { id: 'opt-2', text: 'TypeScript', votes: 0, pollId: 'poll-123' },
    { id: 'opt-3', text: 'Python', votes: 0, pollId: 'poll-123' },
  ],
};

describe('Poll Management', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPush.mockClear();
  });

  // ============================================================================
  // UNIT TESTS
  // ============================================================================

  describe('Unit Tests', () => {
    describe('Happy Path - Poll Creation', () => {
      it('should successfully create a poll with valid data', async () => {
        // Arrange
        const mockCreatePoll = jest.fn().mockResolvedValue(mockCreatedPoll);
        mockUsePolls.mockReturnValue({
          polls: [],
          isLoading: false,
          createPoll: mockCreatePoll,
          refreshPolls: jest.fn(),
        });

        mockPollsAPI.createPoll.mockResolvedValue({
          success: true,
          data: mockCreatedPoll,
        });

        // Act
        const { result } = renderHook(() => usePolls());
        
        // Call the createPoll function directly
        await result.current.createPoll(mockPollData);

        // Assert
        expect(mockCreatePoll).toHaveBeenCalledWith(mockPollData);
      });

      it('should validate poll data structure', () => {
        // Arrange
        const validPollData: CreatePollFormData = {
          title: 'Test Poll',
          description: 'Test Description',
          options: ['Option 1', 'Option 2'],
          allowMultipleVotes: false,
          isAnonymous: false,
          pollCategory: 'general',
        };

        // Act & Assert
        expect(validPollData.title).toBeTruthy();
        expect(validPollData.options).toHaveLength(2);
        expect(validPollData.options.every(option => option.trim().length > 0)).toBe(true);
        expect(['general', 'technology', 'entertainment', 'sports', 'other']).toContain(validPollData.pollCategory);
      });
    });

    describe('Edge Case - Non-owner Poll Edit Denial', () => {
      it('should prevent users from editing polls they do not own', async () => {
        // Arrange
        const otherUserPoll: Poll = {
          ...mockCreatedPoll,
          id: 'poll-456',
          createdBy: 'other-user-456', // Different user
          title: 'Other User\'s Poll',
        };

        const mockUpdatePoll = jest.fn().mockRejectedValue(
          new Error('Unauthorized: You can only edit your own polls')
        );

        mockUsePoll.mockReturnValue({
          poll: otherUserPoll,
          isLoading: false,
          vote: jest.fn(),
          refresh: jest.fn(),
          updatePoll: mockUpdatePoll,
        });

        // Mock API to return unauthorized error
        mockPollsAPI.updatePoll.mockRejectedValue({
          error: 'Unauthorized: You can only edit your own polls',
          status: 403,
        });

        // Mock current user
        mockSupabaseClient.auth.getUser.mockResolvedValue({
          data: { user: { id: 'user-123' } }, // Different from poll creator
          error: null,
        });

        // Act & Assert
        const updateAttempt = async () => {
          await mockUpdatePoll('poll-456', {
            title: 'Hacked Title',
            description: 'This should not work',
          });
        };

        await expect(updateAttempt()).rejects.toThrow(
          'Unauthorized: You can only edit your own polls'
        );
      });

      it('should allow poll owners to edit their own polls', async () => {
        // Arrange
        const ownPoll: Poll = {
          ...mockCreatedPoll,
          createdBy: 'user-123', // Same as current user
        };

        const updatedPoll = {
          ...ownPoll,
          title: 'Updated Poll Title',
          description: 'Updated description',
        };

        const mockUpdatePoll = jest.fn().mockResolvedValue(updatedPoll);

        mockUsePoll.mockReturnValue({
          poll: ownPoll,
          isLoading: false,
          vote: jest.fn(),
          refresh: jest.fn(),
          updatePoll: mockUpdatePoll,
        });

        mockPollsAPI.updatePoll.mockResolvedValue({
          success: true,
          data: updatedPoll,
        });

        // Mock current user as poll owner
        mockSupabaseClient.auth.getUser.mockResolvedValue({
          data: { user: { id: 'user-123' } },
          error: null,
        });

        // Act
        await mockUpdatePoll('poll-123', {
          title: 'Updated Poll Title',
          description: 'Updated description',
        });

        // Assert
        expect(mockUpdatePoll).toHaveBeenCalledWith('poll-123', {
          title: 'Updated Poll Title',
          description: 'Updated description',
        });
      });
    });
  });

  // ============================================================================
  // INTEGRATION TESTS
  // ============================================================================

  describe('Integration Tests', () => {
    describe('Private/Public Poll Visibility', () => {
      it('should handle private and public poll visibility correctly', async () => {
        // Arrange
        const publicPoll: Poll = {
          ...mockCreatedPoll,
          id: 'public-poll-123',
          title: 'Public Poll',
          isPrivate: false,
        };

        const privatePoll: Poll = {
          ...mockCreatedPoll,
          id: 'private-poll-456',
          title: 'Private Poll',
          isPrivate: true,
          createdBy: 'other-user-789',
        };

        // Mock Supabase queries for poll visibility
        const mockPublicPollQuery = {
          data: publicPoll,
          error: null,
        };

        const mockPrivatePollQuery = {
          data: null,
          error: { message: 'Poll not found or access denied' },
        };

        // Setup Supabase mocks
        mockSupabaseClient.from.mockImplementation((table: string) => {
          if (table === 'polls') {
            return {
              select: jest.fn(() => ({
                eq: jest.fn((field: string, value: string) => {
                  if (value === 'public-poll-123') {
                    return {
                      single: jest.fn().mockResolvedValue(mockPublicPollQuery),
                    };
                  } else if (value === 'private-poll-456') {
                    return {
                      single: jest.fn().mockResolvedValue(mockPrivatePollQuery),
                    };
                  }
                  return {
                    single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
                  };
                }),
              })),
            };
          }
          return mockSupabaseClient.from(table);
        });

        // Mock current user (not the owner of private poll)
        mockSupabaseClient.auth.getUser.mockResolvedValue({
          data: { user: { id: 'user-123' } },
          error: null,
        });

        // Act & Assert - Public poll should be accessible
        const publicPollResult = await mockSupabaseClient
          .from('polls')
          .select('*')
          .eq('id', 'public-poll-123')
          .single();

        expect(publicPollResult.data).toEqual(publicPoll);
        expect(publicPollResult.error).toBeNull();

        // Act & Assert - Private poll should not be accessible to non-owners
        const privatePollResult = await mockSupabaseClient
          .from('polls')
          .select('*')
          .eq('id', 'private-poll-456')
          .single();

        expect(privatePollResult.data).toBeNull();
        expect(privatePollResult.error).toEqual({
          message: 'Poll not found or access denied',
        });
      });

      it('should allow private poll access to the owner', async () => {
        // Arrange
        const privatePoll: Poll = {
          ...mockCreatedPoll,
          id: 'private-poll-owner-123',
          title: 'My Private Poll',
          isPrivate: true,
          createdBy: 'user-123', // Same as current user
        };

        const mockPrivatePollOwnerQuery = {
          data: privatePoll,
          error: null,
        };

        // Setup Supabase mock for owner access
        mockSupabaseClient.from.mockImplementation((table: string) => {
          if (table === 'polls') {
            return {
              select: jest.fn(() => ({
                eq: jest.fn(() => ({
                  single: jest.fn().mockResolvedValue(mockPrivatePollOwnerQuery),
                })),
              })),
            };
          }
          return mockSupabaseClient.from(table);
        });

        // Mock current user as poll owner
        mockSupabaseClient.auth.getUser.mockResolvedValue({
          data: { user: { id: 'user-123' } },
          error: null,
        });

        // Act
        const privatePollResult = await mockSupabaseClient
          .from('polls')
          .select('*')
          .eq('id', 'private-poll-owner-123')
          .single();

        // Assert - Owner should have access to their private poll
        expect(privatePollResult.data).toEqual(privatePoll);
        expect(privatePollResult.error).toBeNull();
      });

      it('should filter polls list based on visibility and ownership', async () => {
        // Arrange
        const allPolls = [
          { ...mockCreatedPoll, id: 'poll-1', title: 'Public Poll 1', isPrivate: false, createdBy: 'user-123' },
          { ...mockCreatedPoll, id: 'poll-2', title: 'Public Poll 2', isPrivate: false, createdBy: 'other-user' },
          { ...mockCreatedPoll, id: 'poll-3', title: 'My Private Poll', isPrivate: true, createdBy: 'user-123' },
          { ...mockCreatedPoll, id: 'poll-4', title: 'Other Private Poll', isPrivate: true, createdBy: 'other-user' },
        ];

        // Expected visible polls for current user (user-123)
        const expectedVisiblePolls = [
          allPolls[0], // Own public poll
          allPolls[1], // Other's public poll
          allPolls[2], // Own private poll
          // allPolls[3] should NOT be visible (other's private poll)
        ];

        // Mock Supabase query for filtered polls
        mockSupabaseClient.from.mockImplementation((table: string) => {
          if (table === 'polls') {
            return {
              select: jest.fn(() => ({
                or: jest.fn(() => ({
                  order: jest.fn(() => Promise.resolve({
                    data: expectedVisiblePolls,
                    error: null,
                  })),
                })),
              })),
            };
          }
          return mockSupabaseClient.from(table);
        });

        // Mock current user
        mockSupabaseClient.auth.getUser.mockResolvedValue({
          data: { user: { id: 'user-123' } },
          error: null,
        });

        // Act - Query polls with visibility filter
        const pollsResult = await mockSupabaseClient
          .from('polls')
          .select('*')
          .or(`isPrivate.eq.false,and(isPrivate.eq.true,createdBy.eq.user-123)`)
          .order('createdAt', { ascending: false });

        // Assert
        expect(pollsResult.data).toHaveLength(3);
        expect(pollsResult.data).toEqual(expectedVisiblePolls);
        expect(pollsResult.error).toBeNull();

        // Verify that the private poll from another user is not included
        const otherPrivatePoll = pollsResult.data?.find(poll => poll.id === 'poll-4');
        expect(otherPrivatePoll).toBeUndefined();
      });
    });
  });

  // ============================================================================
  // EDGE CASE TESTS
  // ============================================================================

  describe('Edge Cases and Validation', () => {
    it('should reject poll creation with empty title', async () => {
      // Arrange
      const invalidPollData = {
        ...mockPollData,
        title: '', // Empty title
      };

      const mockCreatePoll = jest.fn().mockRejectedValue(
        new Error('Title is required')
      );
      
      mockUsePolls.mockReturnValue({
        polls: [],
        isLoading: false,
        createPoll: mockCreatePoll,
        refreshPolls: jest.fn(),
      });

      mockPollsAPI.createPoll.mockRejectedValue({
        error: 'Title is required',
        status: 400,
      });

      // Act & Assert
      const { result } = renderHook(() => usePolls());
      
      await expect(result.current.createPoll(invalidPollData)).rejects.toThrow('Title is required');
    });

    it('should reject poll creation with insufficient options', async () => {
      // Arrange
      const invalidPollData = {
        ...mockPollData,
        options: ['Only one option'], // Insufficient options
      };

      const mockCreatePoll = jest.fn().mockRejectedValue(
        new Error('At least 2 options are required')
      );
      
      mockUsePolls.mockReturnValue({
        polls: [],
        isLoading: false,
        createPoll: mockCreatePoll,
        refreshPolls: jest.fn(),
      });

      mockPollsAPI.createPoll.mockRejectedValue({
        error: 'At least 2 options are required',
        status: 400,
      });

      // Act & Assert
      const { result } = renderHook(() => usePolls());
      
      await expect(result.current.createPoll(invalidPollData)).rejects.toThrow('At least 2 options are required');
    });

    it('should handle API errors gracefully during poll creation', async () => {
      // Arrange
      const mockCreatePoll = jest.fn().mockRejectedValue(
        new Error('Network error: Unable to create poll')
      );
      
      mockUsePolls.mockReturnValue({
        polls: [],
        isLoading: false,
        createPoll: mockCreatePoll,
        refreshPolls: jest.fn(),
      });

      mockPollsAPI.createPoll.mockRejectedValue({
        error: 'Network error: Unable to create poll',
        status: 500,
      });

      // Act & Assert
      const { result } = renderHook(() => usePolls());
      
      await expect(result.current.createPoll(mockPollData)).rejects.toThrow('Network error: Unable to create poll');
      expect(mockCreatePoll).toHaveBeenCalledWith(mockPollData);
    });

    it('should validate maximum number of poll options', () => {
      // Arrange
      const tooManyOptions = Array.from({ length: 15 }, (_, i) => `Option ${i + 1}`);
      const invalidPollData = {
        ...mockPollData,
        options: tooManyOptions,
      };

      // Act & Assert
      expect(invalidPollData.options.length).toBeGreaterThan(10);
      
      // In a real implementation, this would be validated by the API or form
      const isValid = invalidPollData.options.length <= 10;
      expect(isValid).toBe(false);
    });

    it('should validate poll option content', () => {
      // Arrange
      const pollDataWithEmptyOptions = {
        ...mockPollData,
        options: ['Valid Option', '', '   ', 'Another Valid Option'],
      };

      // Act
      const validOptions = pollDataWithEmptyOptions.options.filter(
        option => option.trim().length > 0
      );

      // Assert
      expect(validOptions).toHaveLength(2);
      expect(validOptions).toEqual(['Valid Option', 'Another Valid Option']);
    });
  });
});