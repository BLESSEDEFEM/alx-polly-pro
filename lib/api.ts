/**
 * @fileoverview API client and service functions for the Polly Pro application
 * Provides a centralized HTTP client with authentication and typed API endpoints
 */

import { ApiResponse } from '@/types';

/**
 * HTTP client for making API requests with built-in authentication and error handling
 * 
 * This class provides a consistent interface for all API communications,
 * automatically handling authentication tokens, request/response formatting,
 * and error management.
 */
class ApiClient {
  private baseURL: string;

  /**
   * Creates a new ApiClient instance
   * @param baseURL - Base URL for all API requests (defaults to '/api')
   */
  constructor(baseURL: string = '/api') {
    this.baseURL = baseURL;
  }

  /**
   * Makes an HTTP request with automatic authentication and error handling
   * 
   * @template T - The expected response data type
   * @param endpoint - API endpoint path (will be appended to baseURL)
   * @param options - Fetch API options (method, headers, body, etc.)
   * @returns Promise resolving to a standardized API response
   * 
   * @example
   * ```typescript
   * const response = await api.request<User>('/users/123', { method: 'GET' });
   * if (response.success) {
   *   console.log(response.data); // User object
   * } else {
   *   console.error(response.error); // Error message
   * }
   * ```
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    // Get auth token if available (client-side only)
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

      console.log('API Client: Raw response status:', response.status);
      console.log('API Client: Raw response data:', data);

      if (!response.ok) {
        return {
          success: false,
          error: data.message || 'An error occurred',
        };
      }

      const wrappedResponse = {
        success: true,
        data: data, // Wrap the response data in a data property
      };
      
      console.log('API Client: Wrapped response:', wrappedResponse);
      return wrappedResponse;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  /**
   * Makes a GET request to the specified endpoint
   * @template T - Expected response data type
   * @param endpoint - API endpoint path
   * @returns Promise resolving to API response
   */
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  /**
   * Makes a POST request to the specified endpoint
   * @template T - Expected response data type
   * @param endpoint - API endpoint path
   * @param data - Request body data (will be JSON stringified)
   * @returns Promise resolving to API response
   */
  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * Makes a PUT request to the specified endpoint
   * @template T - Expected response data type
   * @param endpoint - API endpoint path
   * @param data - Request body data (will be JSON stringified)
   * @returns Promise resolving to API response
   */
  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * Makes a DELETE request to the specified endpoint
   * @template T - Expected response data type
   * @param endpoint - API endpoint path
   * @returns Promise resolving to API response
   */
  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// Create a singleton instance for use throughout the application
export const api = new ApiClient();

// ============================================================================
// AUTHENTICATION API ENDPOINTS
// ============================================================================

/**
 * Authentication-related API endpoints
 * Handles user login, registration, token management, and session validation
 */
export const authAPI = {
  /**
   * Authenticates a user with email and password
   * @param email - User's email address
   * @param password - User's password
   * @returns Promise resolving to login response with user data and token
   */
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  
  /**
   * Registers a new user account
   * @param name - User's display name
   * @param email - User's email address
   * @param password - User's chosen password
   * @returns Promise resolving to registration response
   */
  register: (name: string, email: string, password: string) =>
    api.post('/auth/register', { name, email, password }),
  
  /**
   * Logs out the current user and invalidates their session
   * @returns Promise resolving to logout confirmation
   */
  logout: () => api.post('/auth/logout'),
  
  /**
   * Validates the current authentication token
   * @returns Promise resolving to token validation result
   */
  validateToken: () => api.get('/auth/validate'),
  
  /**
   * Refreshes the current authentication token
   * @returns Promise resolving to new token data
   */
  refreshToken: () => api.post('/auth/refresh'),
};

// ============================================================================
// POLLS API ENDPOINTS
// ============================================================================

/**
 * Poll-related API endpoints
 * Handles poll CRUD operations, voting, and result retrieval
 */
export const pollsAPI = {
  /**
   * Retrieves a paginated list of polls
   * @param page - Page number (1-based, defaults to 1)
   * @param limit - Number of polls per page (defaults to 10)
   * @returns Promise resolving to paginated polls response
   */
  getPolls: (page = 1, limit = 10) =>
    api.get(`/polls?page=${page}&limit=${limit}`),
  
  /**
   * Retrieves a specific poll by ID
   * @param id - Unique poll identifier
   * @returns Promise resolving to poll data
   */
  getPoll: (id: string) => api.get(`/polls/${id}`),
  
  /**
   * Creates a new poll
   * @param pollData - Poll creation data (title, description, options, etc.)
   * @returns Promise resolving to created poll data
   */
  createPoll: (pollData: any) => api.post('/polls', pollData),
  
  /**
   * Updates an existing poll
   * @param id - Unique poll identifier
   * @param pollData - Updated poll data
   * @returns Promise resolving to updated poll data
   */
  updatePoll: (id: string, pollData: any) =>
    api.put(`/polls/${id}`, pollData),
  
  /**
   * Deletes a poll
   * @param id - Unique poll identifier
   * @returns Promise resolving to deletion confirmation
   */
  deletePoll: (id: string) => api.delete(`/polls/${id}`),
  
  /**
   * Casts a vote on a poll
   * @param pollId - Unique poll identifier
   * @param optionIds - Array of option IDs being voted for
   * @returns Promise resolving to vote confirmation
   */
  votePoll: (pollId: string, optionIds: string[]) =>
    api.post(`/polls/${pollId}/vote`, { optionIds }),
  
  /**
   * Retrieves poll results and statistics
   * @param pollId - Unique poll identifier
   * @returns Promise resolving to poll results data
   */
  getPollResults: (pollId: string) =>
    api.get(`/polls/${pollId}/results`),
};

// ============================================================================
// USER API ENDPOINTS
// ============================================================================

/**
 * User-related API endpoints
 * Handles user profile management and user-specific data retrieval
 */
export const userAPI = {
  /**
   * Retrieves the current user's profile information
   * @returns Promise resolving to user profile data
   */
  getProfile: () => api.get('/user/profile'),
  
  /**
   * Updates the current user's profile
   * @param userData - Updated user profile data
   * @returns Promise resolving to updated profile data
   */
  updateProfile: (userData: any) => api.put('/user/profile', userData),
  
  /**
   * Retrieves all polls created by a specific user
   * @param userId - Unique user identifier
   * @returns Promise resolving to user's polls
   */
  getUserPolls: (userId: string) => api.get(`/user/${userId}/polls`),
  
  /**
   * Retrieves all votes cast by a specific user
   * @param userId - Unique user identifier
   * @returns Promise resolving to user's voting history
   */
  getUserVotes: (userId: string) => api.get(`/user/${userId}/votes`),
};

// Export individual functions for easier imports
export const { createPoll } = pollsAPI;