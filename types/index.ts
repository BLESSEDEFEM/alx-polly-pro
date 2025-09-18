// User types
export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

// Poll types
export interface Poll {
  id: string;
  title: string;
  description?: string;
  options: PollOption[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
  isActive: boolean;
  allowMultipleVotes: boolean;
  isAnonymous: boolean;
}

export interface PollOption {
  id: string;
  text: string;
  votes: number;
  pollId: string;
}

export interface Vote {
  id: string;
  pollId: string;
  optionId: string;
  userId?: string; // Optional for anonymous votes
  createdAt: Date;
}

// Form types
export interface CreatePollFormData {
  title: string;
  description?: string;
  options: string[];
  expiresAt?: Date;
  allowMultipleVotes: boolean;
  isAnonymous: boolean;
}

export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}