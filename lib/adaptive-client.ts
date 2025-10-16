/**
 * @fileoverview Adaptive API client that switches between FastAPI and Supabase backends
 * Provides seamless backend switching based on environment configuration
 * Enhanced for Polly-API specification compatibility
 */

import { fastAPIAdapter } from './fastapi-client';
import { supabase } from './supabase';
import { ApiResponse } from '@/types';

/**
 * Backend type configuration
 */
type BackendType = 'fastapi' | 'supabase';

/**
 * Get the configured backend type from environment variables
 */
function getBackendType(): BackendType {
  const backendType = process.env.NEXT_PUBLIC_BACKEND_TYPE as BackendType;
  return backendType === 'fastapi' ? 'fastapi' : 'supabase';
}

/**
 * User registration data interface - Enhanced for Polly-API compatibility
 */
interface RegisterData {
  name?: string;
  email: string;
  password: string;
  username?: string;
}

/**
 * Login data interface - Enhanced for Polly-API compatibility
 */
interface LoginData {
  email: string;
  password: string;
}

/**
 * Vote data interface - Enhanced for Polly-API compatibility
 */
interface VoteData {
  optionIds: string[];
  pollId?: string;
}

/**
 * Poll creation data interface - Enhanced for Polly-API compatibility
 */
interface CreatePollData {
  title: string;
  description?: string;
  options: Array<{
    text: string;
    description?: string;
  }>;
  expires_at?: string;
  multiple_choice?: boolean;
  anonymous?: boolean;
}

/**
 * Comment data interface
 */
interface CreateCommentData {
  poll_id: string;
  user_id: string;
  parent_id?: string | null;
  content: string;
}

/**
 * Standardized response wrapper for Polly-API compatibility
 */
function standardizeResponse<T>(response: any, backendType: BackendType): ApiResponse<T> {
  if (backendType === 'fastapi') {
    // FastAPI responses are already in the correct format
    return response;
  } else {
    // Supabase responses need to be wrapped
    if (response.error) {
      return {
        success: false,
        error: response.error.message || 'Operation failed',
      };
    }
    return {
      success: true,
      data: response.data,
    };
  }
}

/**
 * Adaptive Authentication API
 * Automatically switches between FastAPI and Supabase authentication
 */
export const adaptiveAuthAPI = {
  /**
   * Register a new user
   */
  async register(data: RegisterData): Promise<ApiResponse<any>> {
    const backendType = getBackendType();
    
    try {
      if (backendType === 'fastapi') {
        // Use FastAPI registration
        const result = await fastAPIAdapter.authAPI.register(
          data.username || data.email.split('@')[0], // Use email prefix as username if not provided
          data.password
        );
        return result;
      } else {
        // Use Supabase registration
        const { data: authData, error } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: {
            data: {
              name: data.name || data.username,
            }
          }
        });

        if (error) {
          return {
            success: false,
            error: error.message,
          };
        }

        return {
          success: true,
          data: authData,
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Registration failed',
      };
    }
  },

  /**
   * Login user
   */
  async login(data: LoginData): Promise<ApiResponse<any>> {
    const backendType = getBackendType();
    
    try {
      if (backendType === 'fastapi') {
        // Use FastAPI login
        const result = await fastAPIAdapter.authAPI.login(data.email, data.password);
        return result;
      } else {
        // Use Supabase login
        const { data: authData, error } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });

        if (error) {
          return {
            success: false,
            error: error.message,
          };
        }

        return {
          success: true,
          data: authData,
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed',
      };
    }
  },

  /**
   * Logout user
   */
  async logout(): Promise<ApiResponse<any>> {
    const backendType = getBackendType();
    
    try {
      if (backendType === 'fastapi') {
        // Use FastAPI logout
        const result = await fastAPIAdapter.authAPI.logout();
        return result;
      } else {
        // Use Supabase logout
        const { error } = await supabase.auth.signOut();

        if (error) {
          return {
            success: false,
            error: error.message,
          };
        }

        return {
          success: true,
          data: { message: 'Logged out successfully' },
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Logout failed',
      };
    }
  },

  /**
   * Get current session
   */
  async getSession(): Promise<ApiResponse<any>> {
    const backendType = getBackendType();
    
    try {
      if (backendType === 'fastapi') {
        // For FastAPI, we'll check if there's a stored token
        const token = typeof window !== 'undefined' ? localStorage.getItem('fastapi_token') : null;
        if (token) {
          return {
            success: true,
            data: { token, authenticated: true },
          };
        } else {
          return {
            success: true,
            data: { authenticated: false },
          };
        }
      } else {
        // Use Supabase session
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          return {
            success: false,
            error: error.message,
          };
        }

        // Return the full Supabase session data structure
        return {
          success: true,
          data: data,
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Session check failed',
      };
    }
  },

  /**
   * Get current user
   */
  async getCurrentUser(): Promise<ApiResponse<any>> {
    const backendType = getBackendType();
    try {
      if (backendType === 'fastapi') {
        const result = await fastAPIAdapter.authAPI.getCurrentUser();
        return result;
      } else {
        const { data, error } = await supabase.auth.getUser();
        if (error) {
          return {
            success: false,
            error: error.message,
          };
        }
        return {
          success: true,
          data,
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get current user',
      };
    }
  },
};

/**
 * Adaptive Polls API
 * Automatically switches between FastAPI and Supabase poll operations
 * Enhanced with standardized Polly-API response handling
 */
export const adaptivePollsAPI = {
  /**
   * Get all polls with pagination
   */
  async getPolls(page = 1, limit = 10): Promise<ApiResponse<any>> {
    const backendType = getBackendType();
    
    try {
      if (backendType === 'fastapi') {
        // Use FastAPI polls with pagination support
        const result = await fastAPIAdapter.pollsAPI.getPolls();
        return standardizeResponse(result, backendType);
      } else {
        // Use Supabase polls - implement Supabase poll fetching here
        return {
          success: false,
          error: 'Supabase polls not implemented yet',
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch polls',
      };
    }
  },

  /**
   * Get a specific poll by ID
   */
  async getPoll(id: string): Promise<ApiResponse<any>> {
    const backendType = getBackendType();
    
    try {
      if (backendType === 'fastapi') {
        // Use FastAPI poll
        const result = await fastAPIAdapter.pollsAPI.getPoll(id);
        return standardizeResponse(result, backendType);
      } else {
        // Use Supabase poll - implement Supabase poll fetching here
        return {
          success: false,
          error: 'Supabase poll fetching not implemented yet',
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch poll',
      };
    }
  },

  /**
   * Create a new poll
   */
  async createPoll(pollData: CreatePollData): Promise<ApiResponse<any>> {
    const backendType = getBackendType();
    
    try {
      if (backendType === 'fastapi') {
        // Use FastAPI poll creation
        const result = await fastAPIAdapter.pollsAPI.createPoll(pollData);
        return standardizeResponse(result, backendType);
      } else {
        // Use Supabase poll creation - implement Supabase poll creation here
        return {
          success: false,
          error: 'Supabase poll creation not implemented yet',
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create poll',
      };
    }
  },

  /**
   * Update an existing poll
   */
  async updatePoll(pollId: string, pollData: Partial<CreatePollData>): Promise<ApiResponse<any>> {
    const backendType = getBackendType();
    
    try {
      if (backendType === 'fastapi') {
        // Use FastAPI poll update
        const result = await fastAPIAdapter.pollsAPI.updatePoll(pollId, pollData);
        return standardizeResponse(result, backendType);
      } else {
        // Use Supabase poll update - implement Supabase poll update here
        return {
          success: false,
          error: 'Supabase poll update not implemented yet',
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update poll',
      };
    }
  },

  /**
   * Delete a poll
   */
  async deletePoll(pollId: string): Promise<ApiResponse<any>> {
    const backendType = getBackendType();
    
    try {
      if (backendType === 'fastapi') {
        // Use FastAPI poll deletion
        const result = await fastAPIAdapter.pollsAPI.deletePoll(pollId);
        return standardizeResponse(result, backendType);
      } else {
        // Use Supabase poll deletion - implement Supabase poll deletion here
        return {
          success: false,
          error: 'Supabase poll deletion not implemented yet',
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete poll',
      };
    }
  },

  /**
   * Cast a vote on a poll
   */
  async vote(pollId: string, optionId: string): Promise<ApiResponse<any>> {
    const backendType = getBackendType();
    
    try {
      if (backendType === 'fastapi') {
        // Use FastAPI voting
        const result = await fastAPIAdapter.pollsAPI.vote(pollId, optionId);
        return standardizeResponse(result, backendType);
      } else {
        // Use Supabase voting - implement Supabase voting here
        return {
          success: false,
          error: 'Supabase voting not implemented yet',
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to cast vote',
      };
    }
  },

  /**
   * Get poll results
   */
  async getPollResults(pollId: string): Promise<ApiResponse<any>> {
    const backendType = getBackendType();
    
    try {
      if (backendType === 'fastapi') {
        // Use FastAPI results
        const result = await fastAPIAdapter.pollsAPI.getPollResults(pollId);
        return standardizeResponse(result, backendType);
      } else {
        // Use Supabase results - implement Supabase results here
        return {
          success: false,
          error: 'Supabase poll results not implemented yet',
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get poll results',
      };
    }
  },

  /**
   * Get user's polls
   */
  async getUserPolls(userId?: string): Promise<ApiResponse<any>> {
    const backendType = getBackendType();
    
    try {
      if (backendType === 'fastapi') {
        // Use FastAPI user polls
        const result = await fastAPIAdapter.pollsAPI.getUserPolls(userId);
        return standardizeResponse(result, backendType);
      } else {
        // Use Supabase user polls - implement Supabase user polls here
        return {
          success: false,
          error: 'Supabase user polls not implemented yet',
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get user polls',
      };
    }
  },

  /**
   * Get user's votes
   */
  async getUserVotes(userId?: string): Promise<ApiResponse<any>> {
    const backendType = getBackendType();
    
    try {
      if (backendType === 'fastapi') {
        // Use FastAPI user votes
        const result = await fastAPIAdapter.pollsAPI.getUserVotes?.(userId);
        return standardizeResponse(result || { success: false, error: 'Method not available' }, backendType);
      } else {
        // Use Supabase user votes - implement Supabase user votes here
        return {
          success: false,
          error: 'Supabase user votes not implemented yet',
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get user votes',
      };
    }
  },
};

/**
 * Main adaptive client export
 * Provides a unified interface that automatically switches backends
 * Enhanced with Polly-API specification compatibility
 */
export const adaptiveClient = {
  // Backwards-compatible keys
  auth: adaptiveAuthAPI,
  polls: adaptivePollsAPI,
  // Also expose API-suffixed keys
  authAPI: adaptiveAuthAPI,
  pollsAPI: adaptivePollsAPI,
  
  /**
   * User management API
   */
  user: {
    /**
     * Get user profile by ID
     */
    async getProfile(userId: string): Promise<any> {
      const backendType = getBackendType();
      
      try {
        if (backendType === 'fastapi') {
          // For FastAPI, we'll return a mock profile for now
          // This should be implemented when FastAPI user endpoints are available
          return {
            id: userId,
            email: 'user@example.com',
            full_name: 'User Name',
            role: 'user',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            is_active: true,
          };
        } else {
          // For Supabase, fetch from user_profiles table
          const { data, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', userId)
            .single();
          
          if (error) {
            throw new Error(error.message);
          }
          
          return data;
        }
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : 'Failed to fetch user profile');
      }
    },

    /**
     * Update user profile
     */
    async updateProfile(userId: string, updates: any): Promise<any> {
      const backendType = getBackendType();
      
      try {
        if (backendType === 'fastapi') {
          // For FastAPI, return mock updated profile
          return {
            id: userId,
            ...updates,
            updated_at: new Date().toISOString(),
          };
        } else {
          // For Supabase, update user_profiles table
          const { data, error } = await supabase
            .from('user_profiles')
            .update(updates)
            .eq('id', userId)
            .select()
            .single();
          
          if (error) {
            throw new Error(error.message);
          }
          
          return data;
        }
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : 'Failed to update user profile');
      }
    },
  },
  
  /**
   * Get the current backend type
   */
  getBackendType,
  
  /**
   * Check if FastAPI backend is available
   */
  async checkFastAPIHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_FASTAPI_URL}/health`);
      return response.ok;
    } catch {
      return false;
    }
  },
  
  /**
   * Check if Supabase backend is available
   */
  async checkSupabaseHealth(): Promise<boolean> {
    try {
      const { data, error } = await supabase.auth.getSession();
      return !error;
    } catch {
      return false;
    }
  },

  /**
   * Automatically determine the best available backend
   */
  async getOptimalBackend(): Promise<BackendType> {
    const configuredBackend = getBackendType();
    
    // First, try the configured backend
    if (configuredBackend === 'fastapi') {
      const fastAPIHealthy = await this.checkFastAPIHealth();
      if (fastAPIHealthy) return 'fastapi';
      
      // Fallback to Supabase if FastAPI is unavailable
      const supabaseHealthy = await this.checkSupabaseHealth();
      if (supabaseHealthy) return 'supabase';
    } else {
      const supabaseHealthy = await this.checkSupabaseHealth();
      if (supabaseHealthy) return 'supabase';
      
      // Fallback to FastAPI if Supabase is unavailable
      const fastAPIHealthy = await this.checkFastAPIHealth();
      if (fastAPIHealthy) return 'fastapi';
    }
    
    // Return configured backend as last resort
    return configuredBackend;
  },

  /**
   * Test connectivity to both backends
   */
  async testConnectivity(): Promise<{
    fastapi: boolean;
    supabase: boolean;
    optimal: BackendType;
  }> {
    const [fastAPIHealthy, supabaseHealthy] = await Promise.all([
      this.checkFastAPIHealth(),
      this.checkSupabaseHealth(),
    ]);
    
    const optimal = await this.getOptimalBackend();
    
    return {
      fastapi: fastAPIHealthy,
      supabase: supabaseHealthy,
      optimal,
    };
  },
};

/**
 * Comment data interface
 */
interface CreateCommentData {
  poll_id: string;
  user_id: string;
  parent_id?: string | null;
  content: string;
}

/**
 * Adaptive Comments API
 * Automatically switches between FastAPI and Supabase comment operations
 */
export const adaptiveCommentsAPI = {
  /**
   * Create a new comment
   */
  async createComment(data: CreateCommentData): Promise<ApiResponse<any>> {
    const backendType = getBackendType();
    
    try {
      if (backendType === 'fastapi') {
        // Use FastAPI comment creation (if implemented)
        return {
          success: false,
          error: 'FastAPI comment creation not implemented yet',
        };
      } else {
        // Use Supabase comment creation
        const { data: comment, error } = await supabase
          .from('comments')
          .insert({
            poll_id: data.poll_id,
            user_id: data.user_id,
            parent_id: data.parent_id,
            content: data.content,
          })
          .select()
          .single();

        if (error) {
          return {
            success: false,
            error: error.message,
          };
        }

        return {
          success: true,
          data: comment,
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create comment',
      };
    }
  },

  /**
   * Get comments for a poll
   */
  async getComments(pollId: string): Promise<ApiResponse<any>> {
    const backendType = getBackendType();
    
    try {
      if (backendType === 'fastapi') {
        // Use FastAPI comment retrieval (if implemented)
        return {
          success: false,
          error: 'FastAPI comment retrieval not implemented yet',
        };
      } else {
        // Use Supabase comment retrieval
        const { data: comments, error } = await supabase
          .from('comments')
          .select(`
            *,
            user:user_id(id, email, user_metadata)
          `)
          .eq('poll_id', pollId)
          .order('created_at', { ascending: true });

        if (error) {
          return {
            success: false,
            error: error.message,
          };
        }

        return {
          success: true,
          data: comments,
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get comments',
      };
    }
  },

  /**
   * Update a comment
   */
  async updateComment(commentId: string, content: string): Promise<ApiResponse<any>> {
    const backendType = getBackendType();
    
    try {
      if (backendType === 'fastapi') {
        // Use FastAPI comment update (if implemented)
        return {
          success: false,
          error: 'FastAPI comment update not implemented yet',
        };
      } else {
        // Use Supabase comment update
        const { data: comment, error } = await supabase
          .from('comments')
          .update({
            content,
            is_edited: true,
            updated_at: new Date().toISOString(),
          })
          .eq('id', commentId)
          .select()
          .single();

        if (error) {
          return {
            success: false,
            error: error.message,
          };
        }

        return {
          success: true,
          data: comment,
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update comment',
      };
    }
  },

  /**
   * Delete a comment
   */
  async deleteComment(commentId: string): Promise<ApiResponse<any>> {
    const backendType = getBackendType();
    
    try {
      if (backendType === 'fastapi') {
        // Use FastAPI comment deletion (if implemented)
        return {
          success: false,
          error: 'FastAPI comment deletion not implemented yet',
        };
      } else {
        // Use Supabase comment deletion
        const { error } = await supabase
          .from('comments')
          .delete()
          .eq('id', commentId);

        if (error) {
          return {
            success: false,
            error: error.message,
          };
        }

        return {
          success: true,
          data: { message: 'Comment deleted successfully' },
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete comment',
      };
    }
  },
};

// Add comments to the main client after it's declared
// Assign comments APIs to the adaptive client with a type cast for flexibility
(adaptiveClient as any).commentsAPI = adaptiveCommentsAPI;
(adaptiveClient as any).comments = adaptiveCommentsAPI;

// Export individual APIs for convenience
export { adaptiveAuthAPI as authAPI, adaptivePollsAPI as pollsAPI, adaptiveCommentsAPI as commentsAPI };