'use client';

import React, { useState, useEffect, createContext, useContext } from 'react';
import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function useAuthState() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on mount
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      // TODO: Implement actual auth check with your backend
      const token = localStorage.getItem('auth-token');
      if (token) {
        // Validate token and get user data
        // const userData = await validateToken(token);
        // setUser(userData);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // TODO: Implement actual login API call
      console.log('Login attempt:', { email, password });
      
      // Mock successful login
      const mockUser: User = {
        id: '1',
        email,
        name: 'John Doe',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      setUser(mockUser);
      localStorage.setItem('auth-token', 'mock-token');
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      // TODO: Implement actual registration API call
      console.log('Register attempt:', { name, email, password });
      
      // Mock successful registration
      const mockUser: User = {
        id: '1',
        email,
        name,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      setUser(mockUser);
      localStorage.setItem('auth-token', 'mock-token');
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('auth-token');
  };

  return {
    user,
    isLoading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
  };
}