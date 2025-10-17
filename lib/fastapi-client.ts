/**
 * @fileoverview FastAPI client for Polly Pro application
 * Aligned with Polly-API specification from alx-se/Polly-API
 * Provides integration with the FastAPI backend as an alternative to Supabase
 */

import { ApiResponse } from '@/types';

// Polly-API aligned interfaces
export interface FastAPIUser {
  id: number;
  username: string;
  email?: string;
  created_at?: string;
  is_active?: boolean;
}

export interface FastAPIPoll {
  id: number;
  question: string;
  description?: string;
  created_by: number;
  created_at: string;
  updated_at?: string;
  is_active?: boolean;
  expires_at?: string;
  options: FastAPIPollOption[];
  total_votes?: number;
}

export interface FastAPIPollOption {
  id: number;
  text: string;
  poll_id: number;
  vote_count?: number;
  percentage?: number;
}

export interface FastAPIVote {
  option_id: number;
  poll_id?: number;
  user_id?: number;
  created_at?: string;
}

export interface FastAPIAuthResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
  user?: FastAPIUser;
}

export interface FastAPIPollResults {
  poll_id: number;
  question: string;
  description?: string;
  total_votes: number;
  results: Array<{
    option_id: number;
    option_text: string;
    vote_count: number;
    percentage: number;
  }>;
}

export interface FastAPICreatePollRequest {
  question: string;
  description?: string;
  options: string[];
  expires_at?: string;
}

export interface FastAPIRegisterRequest {
  username: string;
  email?: string;
  password: string;
}

export interface FastAPILoginRequest {
  username: string;
  password: string;
}

/**
 * FastAPI client for making requests to the Python backend
 */
class FastAPIClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string = process.env.NEXT_PUBLIC_FASTAPI_URL || 'http://127.0.0.1:8000') {
    this.baseURL = baseURL;
    
    // Load token from localStorage if available (client-side only)
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('fastapi_token');
    }
  }

  /**
   * Set authentication token
   */
  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('fastapi_token', token);
    }
  }

  /**
   * Clear authentication token
   */
  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('fastapi_token');
    }
  }

  /**
   * Make HTTP request to FastAPI backend
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Add auth token if available
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          error: errorText || `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      const data = await response.json();
      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  // Authentication methods - Aligned with Polly-API specification
  async register(data: FastAPIRegisterRequest): Promise<ApiResponse<FastAPIUser>> {
    return this.request<FastAPIUser>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async login(data: FastAPILoginRequest): Promise<ApiResponse<FastAPIAuthResponse>> {
    // Support both form-data and JSON for login
    const formData = new FormData();
    formData.append('username', data.username);
    formData.append('password', data.password);

    const response = await this.request<FastAPIAuthResponse>('/auth/login', {
      method: 'POST',
      headers: {}, // Remove Content-Type to let browser set it for FormData
      body: formData,
    });

    if (response.success && response.data) {
      this.setToken(response.data.access_token);
    }

    return response;
  }

  async logout(): Promise<ApiResponse<{ message: string }>> {
    const response = await this.request<{ message: string }>('/auth/logout', {
      method: 'POST',
    });
    
    this.clearToken();
    return response;
  }

  async getCurrentUser(): Promise<ApiResponse<FastAPIUser>> {
    return this.request<FastAPIUser>('/auth/me');
  }

  // Poll methods - Aligned with Polly-API specification
  async getPolls(skip: number = 0, limit: number = 10): Promise<ApiResponse<FastAPIPoll[]>> {
    return this.request<FastAPIPoll[]>(`/polls?skip=${skip}&limit=${limit}`);
  }

  async getPoll(pollId: number): Promise<ApiResponse<FastAPIPoll>> {
    return this.request<FastAPIPoll>(`/polls/${pollId}`);
  }

  async createPoll(data: FastAPICreatePollRequest): Promise<ApiResponse<FastAPIPoll>> {
    return this.request<FastAPIPoll>('/polls', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePoll(pollId: number, data: Partial<FastAPICreatePollRequest>): Promise<ApiResponse<FastAPIPoll>> {
    return this.request<FastAPIPoll>(`/polls/${pollId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deletePoll(pollId: number): Promise<ApiResponse<{ message: string }>> {
    return this.request<{ message: string }>(`/polls/${pollId}`, {
      method: 'DELETE',
    });
  }

  async vote(pollId: number, optionId: number): Promise<ApiResponse<FastAPIVote>> {
    return this.request<FastAPIVote>(`/polls/${pollId}/vote`, {
      method: 'POST',
      body: JSON.stringify({ option_id: optionId }),
    });
  }

  async getPollResults(pollId: number): Promise<ApiResponse<FastAPIPollResults>> {
    return this.request<FastAPIPollResults>(`/polls/${pollId}/results`);
  }

  async getUserPolls(userId?: number): Promise<ApiResponse<FastAPIPoll[]>> {
    const endpoint = userId ? `/users/${userId}/polls` : '/users/me/polls';
    return this.request<FastAPIPoll[]>(endpoint);
  }

  async getUserVotes(userId?: number): Promise<ApiResponse<FastAPIVote[]>> {
    const endpoint = userId ? `/users/${userId}/votes` : '/users/me/votes';
    return this.request<FastAPIVote[]>(endpoint);
  }
}

// Export singleton instance
export const fastAPIClient = new FastAPIClient();

// Export adapter functions to match current API interface
export const fastAPIAdapter = {
  // Auth API - Updated for Polly-API compatibility
  authAPI: {
    login: async (email: string, password: string) => {
      return fastAPIClient.login({ username: email, password });
    },
    register: async (email: string, password: string, fullName?: string) => {
      return fastAPIClient.register({ 
        username: fullName || email.split('@')[0], 
        email, 
        password 
      });
    },
    logout: async () => {
      const result = await fastAPIClient.logout();
      return result;
    },
    getCurrentUser: async () => {
      return fastAPIClient.getCurrentUser();
    },
  },

  // Polls API - Updated for Polly-API compatibility
  pollsAPI: {
    getPolls: async () => {
      return fastAPIClient.getPolls();
    },
    getPoll: async (id: string) => {
      return fastAPIClient.getPoll(parseInt(id));
    },
    createPoll: async (pollData: {
      title: string;
      description?: string;
      options: Array<{ text: string }>;
      expires_at?: string;
    }) => {
      const options = pollData.options.map(opt => opt.text);
      return fastAPIClient.createPoll({
        question: pollData.title,
        description: pollData.description,
        options,
        expires_at: pollData.expires_at,
      });
    },
    updatePoll: async (id: string, pollData: {
      title?: string;
      description?: string;
      options?: Array<{ text: string }>;
      expires_at?: string;
    }) => {
      const updateData: Partial<FastAPICreatePollRequest> = {};
      if (pollData.title) updateData.question = pollData.title;
      if (pollData.description) updateData.description = pollData.description;
      if (pollData.options) updateData.options = pollData.options.map(opt => opt.text);
      if (pollData.expires_at) updateData.expires_at = pollData.expires_at;
      
      return fastAPIClient.updatePoll(parseInt(id), updateData);
    },
    deletePoll: async (id: string) => {
      return fastAPIClient.deletePoll(parseInt(id));
    },
    vote: async (pollId: string, optionIds: string[]) => {
      // FastAPI supports single vote only, use first option
      const optionId = parseInt(optionIds[0]);
      return fastAPIClient.vote(parseInt(pollId), optionId);
    },
    getPollResults: async (pollId: string) => {
      return fastAPIClient.getPollResults(parseInt(pollId));
    },
    getUserPolls: async (userId?: string) => {
      return fastAPIClient.getUserPolls(userId ? parseInt(userId) : undefined);
    },
  },

  // User API - Enhanced for Polly-API compatibility
  userAPI: {
    getProfile: async (userId?: string) => {
      if (userId) {
        return fastAPIClient.request<FastAPIUser>(`/users/${userId}`);
      }
      return fastAPIClient.getCurrentUser();
    },
    updateProfile: async (userId: string, profileData: Partial<FastAPIUser>) => {
      return fastAPIClient.request<FastAPIUser>(`/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify(profileData),
      });
    },
    getUserPolls: async (userId?: string) => {
      return fastAPIClient.getUserPolls(userId ? parseInt(userId) : undefined);
    },
    getUserVotes: async (userId?: string) => {
      return fastAPIClient.getUserVotes(userId ? parseInt(userId) : undefined);
    },
  },
};