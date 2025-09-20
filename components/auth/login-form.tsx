/**
 * @fileoverview Login form component with Supabase authentication integration
 * Provides a complete login form with validation, error handling, and authentication
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Eye, EyeOff, Mail, Lock, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/providers/auth-provider';

/**
 * Login form component props
 */
interface LoginFormProps {
  /** Optional callback function called after successful login */
  onSuccess?: () => void;
  /** Optional redirect URL after successful login */
  redirectTo?: string;
  /** Optional CSS class name for styling */
  className?: string;
}

/**
 * Form data interface for type safety
 */
interface LoginFormData {
  email: string;
  password: string;
}

/**
 * Form errors interface for validation feedback
 */
interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

/**
 * Enhanced login form component with improved UX
 * 
 * Features:
 * - Real-time validation with visual feedback
 * - Enhanced loading states and micro-interactions
 * - Improved error handling with contextual messages
 * - Password visibility toggle with better accessibility
 * - Success states and smooth transitions
 * - Responsive design with modern UI patterns
 * 
 * @param props - Component props
 * @returns JSX element containing the enhanced login form
 */
export function LoginForm({ onSuccess, redirectTo = '/', className }: LoginFormProps) {
  const router = useRouter();
  const { refreshSession } = useAuth();
  
  // Form state
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
  });
  
  // UI state
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [touchedFields, setTouchedFields] = useState<Set<keyof LoginFormData>>(new Set());

  /**
   * Handle input changes with real-time validation clearing
   */
  const handleInputChange = (field: keyof LoginFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Mark field as touched
    setTouchedFields(prev => new Set(prev).add(field));
    
    // Clear field-specific error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
    
    // Clear general error when user makes any change
    if (errors.general) {
      setErrors(prev => ({ ...prev, general: undefined }));
    }
  };

  /**
   * Enhanced form validation with real-time feedback
   */
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters long';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Get field validation state for visual feedback
   */
  const getFieldState = (field: keyof LoginFormData) => {
    const isTouched = touchedFields.has(field);
    const hasError = !!errors[field];
    const hasValue = !!formData[field];
    
    if (hasError && isTouched) return 'error';
    if (hasValue && isTouched && !hasError) return 'success';
    return 'default';
  };

  /**
   * Enhanced form submission with better UX
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mark all fields as touched for validation display
    setTouchedFields(new Set(['email', 'password']));
    
    // Clear any existing errors
    setErrors({});
    
    // Validate form
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Use our custom API endpoint for login
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email.trim(),
          password: formData.password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        // Handle API errors with better UX
        let errorMessage = result.message || 'An error occurred during login';
        
        // Map common error messages to user-friendly ones
        if (errorMessage.includes('Invalid login credentials')) {
          errorMessage = 'Invalid email or password. Please check your credentials and try again.';
        } else if (errorMessage.includes('Email not confirmed')) {
          errorMessage = 'Please check your email and click the confirmation link before signing in.';
        } else if (errorMessage.includes('Too many requests')) {
          errorMessage = 'Too many login attempts. Please wait a moment before trying again.';
        }
        
        setErrors({ general: errorMessage });
        return;
      }

      // Success state with visual feedback
      setIsSuccess(true);
      
      // Brief delay to show success state
      setTimeout(async () => {
        console.log('Login successful:', result.user?.email);
        
        // Refresh the auth context to update the UI
        await refreshSession();
        
        // Call success callback if provided
        if (onSuccess) {
          onSuccess();
        } else {
          // Default redirect behavior
          router.push(redirectTo);
        }
      }, 1000);

    } catch (error) {
      console.error('Login error:', error);
      setErrors({ 
        general: 'Network error. Please check your connection and try again.' 
      });
    } finally {
      if (!isSuccess) {
        setIsLoading(false);
      }
    }
  };

  // Success state UI
  if (isSuccess) {
    return (
      <Card className={`w-full max-w-md mx-auto ${className || ''}`}>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-green-800 mb-2">Login Successful!</h3>
            <p className="text-sm text-green-600">Redirecting you now...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`w-full max-w-md mx-auto transition-all duration-200 ${className || ''}`}>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">Welcome back</CardTitle>
        <CardDescription className="text-center">
          Enter your credentials to access your account
        </CardDescription>
      </CardHeader>
      
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {/* General Error Alert */}
          {errors.general && (
            <Alert variant="destructive" className="animate-in slide-in-from-top-2 duration-300">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errors.general}</AlertDescription>
            </Alert>
          )}

          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Email address
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={`pl-10 transition-all duration-200 ${
                  getFieldState('email') === 'error' 
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                    : getFieldState('email') === 'success'
                    ? 'border-green-500 focus:border-green-500 focus:ring-green-500'
                    : ''
                }`}
                disabled={isLoading}
                autoComplete="email"
              />
              {getFieldState('email') === 'success' && (
                <CheckCircle2 className="absolute right-3 top-3 h-4 w-4 text-green-500" />
              )}
            </div>
            {errors.email && (
              <p className="text-sm text-red-600 animate-in slide-in-from-top-1 duration-200">
                {errors.email}
              </p>
            )}
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium">
              Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className={`pl-10 pr-10 transition-all duration-200 ${
                  getFieldState('password') === 'error' 
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                    : getFieldState('password') === 'success'
                    ? 'border-green-500 focus:border-green-500 focus:ring-green-500'
                    : ''
                }`}
                disabled={isLoading}
                autoComplete="current-password"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
            {errors.password && (
              <p className="text-sm text-red-600 animate-in slide-in-from-top-1 duration-200">
                {errors.password}
              </p>
            )}
          </div>

          {/* Forgot Password Link */}
          <div className="flex justify-end">
            <Link 
              href="/auth/forgot-password" 
              className="text-sm text-primary hover:underline transition-colors duration-200"
            >
              Forgot your password?
            </Link>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full transition-all duration-200 hover:scale-[1.02]" 
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign in'
            )}
          </Button>

          {/* Register Link */}
          <p className="text-center text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link 
              href="/auth/register" 
              className="text-primary hover:underline font-medium transition-colors duration-200"
            >
              Create one now
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
