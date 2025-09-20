/**
 * @fileoverview Type definitions for the Polly Pro polling application
 * Contains all TypeScript interfaces and types used throughout the application
 */

// ============================================================================
// USER TYPES
// ============================================================================

/**
 * Represents a user in the polling system
 * @interface User
 */
export interface User {
  /** Unique identifier for the user */
  id: string;
  /** User's email address (used for authentication) */
  email: string;
  /** User's display name */
  name: string;
  /** Timestamp when the user account was created */
  createdAt: Date;
  /** Timestamp when the user account was last updated */
  updatedAt: Date;
}

// ============================================================================
// POLL TYPES
// ============================================================================

/**
 * Represents a poll with all its configuration and metadata
 * @interface Poll
 */
export interface Poll {
  /** Unique identifier for the poll */
  id: string;
  /** The main question or title of the poll */
  title: string;
  /** Optional detailed description of the poll */
  description?: string;
  /** Array of voting options available for this poll */
  options: PollOption[];
  /** ID of the user who created this poll */
  createdBy: string;
  /** Timestamp when the poll was created */
  createdAt: Date;
  /** Timestamp when the poll was last updated */
  updatedAt: Date;
  /** Optional expiration date - poll becomes inactive after this date */
  expiresAt?: Date;
  /** Whether the poll is currently accepting votes */
  isActive: boolean;
  /** Whether users can vote for multiple options */
  allowMultipleVotes: boolean;
  /** Whether votes are recorded anonymously (no userId tracking) */
  isAnonymous: boolean;
}

/**
 * Represents a single voting option within a poll
 * @interface PollOption
 */
export interface PollOption {
  /** Unique identifier for this option */
  id: string;
  /** The text content of this voting option */
  text: string;
  /** Current number of votes this option has received */
  votes: number;
  /** ID of the poll this option belongs to */
  pollId: string;
}

/**
 * Represents a single vote cast by a user
 * @interface Vote
 */
export interface Vote {
  /** Unique identifier for this vote */
  id: string;
  /** ID of the poll this vote was cast for */
  pollId: string;
  /** ID of the option that was voted for */
  optionId: string;
  /** ID of the user who cast the vote (null for anonymous votes) */
  userId?: string;
  /** Timestamp when the vote was cast */
  createdAt: Date;
}

// ============================================================================
// FORM DATA TYPES
// ============================================================================

/**
 * Form data structure for creating a new poll
 * @interface CreatePollFormData
 */
export interface CreatePollFormData {
  /** The main question or title of the poll */
  title: string;
  /** Optional detailed description of the poll */
  description?: string;
  /** Array of option texts for the poll */
  options: string[];
  /** Optional expiration date for the poll */
  expiresAt?: Date;
  /** Whether to allow multiple votes per user */
  allowMultipleVotes: boolean;
  /** Whether to make votes anonymous */
  isAnonymous: boolean;
}

/**
 * Form data structure for user login
 * @interface LoginFormData
 */
export interface LoginFormData {
  /** User's email address */
  email: string;
  /** User's password */
  password: string;
}

/**
 * Form data structure for user registration
 * @interface RegisterFormData
 */
export interface RegisterFormData {
  /** User's display name */
  name: string;
  /** User's email address */
  email: string;
  /** User's chosen password */
  password: string;
  /** Password confirmation for validation */
  confirmPassword: string;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

/**
 * Standard API response wrapper for all API endpoints
 * @template T The type of data being returned
 * @interface ApiResponse
 */
export interface ApiResponse<T> {
  /** Whether the API request was successful */
  success: boolean;
  /** The actual data payload (present on successful requests) */
  data?: T;
  /** Error message (present on failed requests) */
  error?: string;
  /** Additional message or status information */
  message?: string;
}

/**
 * Paginated response structure for list endpoints
 * @template T The type of items in the paginated list
 * @interface PaginatedResponse
 */
export interface PaginatedResponse<T> {
  /** Array of items for the current page */
  data: T[];
  /** Total number of items across all pages */
  total: number;
  /** Current page number (1-based) */
  page: number;
  /** Number of items per page */
  limit: number;
  /** Total number of pages available */
  totalPages: number;
}