/**
 * @fileoverview FastAPI client for Polly Pro application
 * Provides integration with the FastAPI backend as an alternative to Supabase
 */

import { ApiResponse } from '@/types';

export interface FastAPIUser {
  id: number;
  username: string;
}

export interface FastAPIPoll {
  id: number;
  question: string;
  created_by: number;
  created_at: string;
  options: FastAPIPollOption[];
}

export interface FastAPIPollOption {
  id: number;
  text: string;
  poll_id: number;
  vote_count?: number;
}

export interface FastAPIVote {
  option_id: number;
}

export interface FastAPIAuthResponse {
  access_token: string;
  token_type: string;
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

  // Authentication methods
  async register(username: string, password: string): Promise<ApiResponse<FastAPIUser>> {
    return this.request<FastAPIUser>('/register', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  }

  async login(username: string, password: string): Promise<ApiResponse<FastAPIAuthResponse>> {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);

    const response = await this.request<FastAPIAuthResponse>('/login', {
      method: 'POST',
      headers: {}, // Remove Content-Type to let browser set it for FormData
      body: formData,
    });

    if (response.success && response.data) {
      this.setToken(response.data.access_token);
    }

    return response;
  }

  async logout(): Promise<void> {
    this.clearToken();
  }

  // Poll methods
  async getPolls(skip: number = 0, limit: number = 10): Promise<ApiResponse<FastAPIPoll[]>> {
    return this.request<FastAPIPoll[]>(`/polls?skip=${skip}&limit=${limit}`);
  }

  async getPoll(pollId: number): Promise<ApiResponse<FastAPIPoll>> {
    return this.request<FastAPIPoll>(`/polls/${pollId}`);
  }

  async createPoll(question: string, options: string[]): Promise<ApiResponse<FastAPIPoll>> {
    return this.request<FastAPIPoll>('/polls', {
      method: 'POST',
      body: JSON.stringify({ question, options }),
    });
  }

  async deletePoll(pollId: number): Promise<ApiResponse<{ message: string }>> {
    return this.request<{ message: string }>(`/polls/${pollId}`, {
      method: 'DELETE',
    });
  }

  async vote(pollId: number, optionId: number): Promise<ApiResponse<{ message: string }>> {
    return this.request<{ message: string }>(`/polls/${pollId}/vote`, {
      method: 'POST',
      body: JSON.stringify({ option_id: optionId }),
    });
  }

  async getPollResults(pollId: number): Promise<ApiResponse<{
    poll_id: number;
    question: string;
    results: Array<{
      option_id: number;
      text: string;
      vote_count: number;
    }>;
  }>> {
    return this.request(`/polls/${pollId}/results`);
  }
}

// Export singleton instance
export const fastAPIClient = new FastAPIClient();

// Export adapter functions to match current API interface
export const fastAPIAdapter = {
  // Auth API
  authAPI: {
    login: async (email: string, password: string) => {
      return fastAPIClient.login(email, password);
    },
    register: async (email: string, password: string, fullName?: string) => {
      return fastAPIClient.register(email, password);
    },
    logout: async () => {
      fastAPIClient.logout();
      return { success: true };
    },
  },

  // Polls API
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
    }) => {
      const options = pollData.options.map(opt => opt.text);
      return fastAPIClient.createPoll(pollData.title, options);
    },
    deletePoll: async (id: string) => {
      return fastAPIClient.deletePoll(parseInt(id));
    },
    vote: async (pollId: string, optionIds: string[]) => {
      // FastAPI supports single vote only, use first option
      const optionId = parseInt(optionIds[0]);
      return fastAPIClient.vote(parseInt(pollId), optionId);
    },
  },

  // User API (placeholder - FastAPI doesn't have user profile endpoints)
  userAPI: {
    getProfile: async () => {
      return { success: false, error: 'User profiles not supported in FastAPI backend' };
    },
    updateProfile: async () => {
      return { success: false, error: 'User profiles not supported in FastAPI backend' };
    },
  },
};