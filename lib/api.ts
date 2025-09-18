import { ApiResponse } from '@/types';

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string = '/api') {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    // Get auth token if available
    const token = typeof window !== 'undefined' 
      ? localStorage.getItem('auth-token') 
      : null;

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || 'An error occurred',
        };
      }

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

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// Create a singleton instance
export const api = new ApiClient();

// Specific API functions for different resources
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  
  register: (name: string, email: string, password: string) =>
    api.post('/auth/register', { name, email, password }),
  
  logout: () => api.post('/auth/logout'),
  
  validateToken: () => api.get('/auth/validate'),
  
  refreshToken: () => api.post('/auth/refresh'),
};

export const pollsAPI = {
  getPolls: (page = 1, limit = 10) =>
    api.get(`/polls?page=${page}&limit=${limit}`),
  
  getPoll: (id: string) => api.get(`/polls/${id}`),
  
  createPoll: (pollData: any) => api.post('/polls', pollData),
  
  updatePoll: (id: string, pollData: any) =>
    api.put(`/polls/${id}`, pollData),
  
  deletePoll: (id: string) => api.delete(`/polls/${id}`),
  
  votePoll: (pollId: string, optionIds: string[]) =>
    api.post(`/polls/${pollId}/vote`, { optionIds }),
  
  getPollResults: (pollId: string) =>
    api.get(`/polls/${pollId}/results`),
};

export const userAPI = {
  getProfile: () => api.get('/user/profile'),
  
  updateProfile: (userData: any) => api.put('/user/profile', userData),
  
  getUserPolls: (userId: string) => api.get(`/user/${userId}/polls`),
  
  getUserVotes: (userId: string) => api.get(`/user/${userId}/votes`),
};