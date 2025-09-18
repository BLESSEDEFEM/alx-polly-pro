import { User } from '@/types';

// Mock authentication functions - replace with actual implementation
export class AuthService {
  private static readonly TOKEN_KEY = 'auth-token';
  private static readonly USER_KEY = 'user-data';

  static async login(email: string, password: string): Promise<User> {
    // TODO: Replace with actual API call
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    const { user, token } = await response.json();
    
    // Store token and user data
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    
    return user;
  }

  static async register(name: string, email: string, password: string): Promise<User> {
    // TODO: Replace with actual API call
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, email, password }),
    });

    if (!response.ok) {
      throw new Error('Registration failed');
    }

    const { user, token } = await response.json();
    
    // Store token and user data
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    
    return user;
  }

  static logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  static getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.TOKEN_KEY);
  }

  static getCurrentUser(): User | null {
    if (typeof window === 'undefined') return null;
    
    const userData = localStorage.getItem(this.USER_KEY);
    if (!userData) return null;
    
    try {
      return JSON.parse(userData);
    } catch {
      return null;
    }
  }

  static isAuthenticated(): boolean {
    return !!this.getToken();
  }

  static async validateToken(): Promise<boolean> {
    const token = this.getToken();
    if (!token) return false;

    try {
      // TODO: Replace with actual token validation
      const response = await fetch('/api/auth/validate', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      return response.ok;
    } catch {
      return false;
    }
  }
}

// Utility functions for form validation
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/(?=.*[a-z])/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/(?=.*[A-Z])/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/(?=.*\d)/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};