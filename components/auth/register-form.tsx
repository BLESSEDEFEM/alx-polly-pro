/**
 * @fileoverview Enhanced register form component with improved UX and visual feedback
 * Provides a complete registration form with validation, error handling, and user creation
 */

'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Eye, EyeOff, CheckCircle2, AlertCircle, User, Mail, Lock, Shield } from 'lucide-react';
import { useAuth } from '@/components/providers/auth-provider';
import { adaptiveClient } from '@/lib/adaptive-client';
import React from 'react';

/**
 * Register form component props
 */
interface RegisterFormProps {
  /** Optional callback function called after successful registration */
  onSuccess?: () => void;
  /** Optional redirect URL after successful registration */
  redirectTo?: string;
  /** Optional CSS class name for styling */
  className?: string;
}

/**
 * Form data interface for type safety
 */
interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

/**
 * Form errors interface for validation feedback
 */
interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
}

/**
 * Password strength levels
 */
type PasswordStrength = 'weak' | 'medium' | 'strong';

/**
 * Enhanced register form component with improved UX
 * 
 * Features:
 * - Real-time validation with visual feedback
 * - Password strength indicator with visual cues
 * - Enhanced loading states and micro-interactions
 * - Improved error handling with contextual messages
 * - Success states and smooth transitions
 * - Responsive design with modern UI patterns
 * 
 * @param props - Component props
 * @returns JSX element containing the enhanced registration form
 */
export const RegisterForm = React.memo(function RegisterForm({ onSuccess, redirectTo = '/', className }: RegisterFormProps) {
  const router = useRouter();
  const { refreshSession } = useAuth();
  
  // Form state
  const [formData, setFormData] = useState<RegisterFormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  
  // UI state
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Calculate password strength
   */
  const getPasswordStrength = (password: string): PasswordStrength => {
    if (password.length < 6) return 'weak';
    
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    
    if (score >= 4) return 'strong';
    if (score >= 2) return 'medium';
    return 'weak';
  };

  /**
   * Get password strength color and text
   */
  const getPasswordStrengthInfo = (strength: PasswordStrength) => {
    switch (strength) {
      case 'weak':
        return { color: 'text-red-500', bg: 'bg-red-500', text: 'Weak' };
      case 'medium':
        return { color: 'text-yellow-500', bg: 'bg-yellow-500', text: 'Medium' };
      case 'strong':
        return { color: 'text-green-500', bg: 'bg-green-500', text: 'Strong' };
    }
  };

  /**
   * Handle input changes with real-time validation clearing
   */
  const handleInputChange = (field: keyof RegisterFormData, value: string) => {
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

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters long';
    }

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

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Get field validation state for visual feedback
   */
  const getFieldState = (field: keyof RegisterFormData) => {
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
    setTouchedFields(new Set(['name', 'email', 'password', 'confirmPassword']));
    
    // Clear any existing errors
    setErrors({});
    
    // Validate form
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Use adaptive client for registration
      console.log('Registration form - Starting registration process');
      const result = await adaptiveClient.auth.register({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
      });

      if (!result.success) {
        // Handle API errors with better UX
        let errorMessage = result.error || 'An error occurred during registration';
        
        // Map common error messages to user-friendly ones
        if (errorMessage.includes('User already registered') || errorMessage.includes('already exists')) {
          errorMessage = 'An account with this email already exists. Please try logging in instead.';
        } else if (errorMessage.includes('Password should be at least') || errorMessage.includes('password')) {
          errorMessage = 'Password must be at least 6 characters long.';
        } else if (errorMessage.includes('Invalid email')) {
          errorMessage = 'Please enter a valid email address.';
        }
        
        setErrors({ general: errorMessage });
        setIsLoading(false);
        return;
      }

      // Success state with visual feedback - only set after confirming no errors
      setIsSuccess(true);
      
      // Brief delay to show success state
      timeoutRef.current = setTimeout(async () => {
        console.log('Registration successful:', result.data?.user?.email || formData.email);
        
        // Store the redirect URL for reliability
        const finalRedirect = redirectTo || '/';
        try {
          // Store in both sessionStorage and localStorage for redundancy
          sessionStorage.setItem('authRedirectPath', finalRedirect);
          localStorage.setItem('authRedirectPath', finalRedirect);
          // Set a cookie as a backup mechanism
          document.cookie = `authRedirect=${encodeURIComponent(finalRedirect)};path=/;max-age=300`;
          console.log('Stored redirect URL:', finalRedirect);
        } catch (error) {
          console.error('Error storing redirect path:', error);
        }
        
        // Refresh the auth context to update the UI
        try {
          await refreshSession();
          console.log('Session refreshed successfully');
        } catch (error) {
          console.error('Error refreshing session:', error);
        }
        
        // Call success callback if provided
        if (onSuccess) {
          console.log('Calling onSuccess callback');
          onSuccess();
        } else {
          console.log('Redirecting to:', finalRedirect);
          
          // Use a more reliable navigation approach with fallbacks
          try {
            // First approach: direct assignment (most reliable)
            window.location.href = finalRedirect;
            
            // Second approach: as a fallback
            setTimeout(() => {
              console.log('Fallback navigation triggered');
              window.location.replace(finalRedirect);
            }, 1000);
          } catch (error) {
            console.error('Error during redirect:', error);
            // Last resort fallback
            router.push(finalRedirect);
          }
        }
      }, 2000); // Increased timeout to ensure session is fully established

    } catch (error) {
      console.error('Registration error:', error);
      setErrors({ 
        general: 'Network error. Please check your connection and try again.' 
      });
      // Clear any pending timeout if there's an error
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
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
            <h3 className="text-lg font-semibold text-green-800 mb-2">Registration Successful!</h3>
            <p className="text-sm text-green-600 mb-2">Welcome to Polly Pro!</p>
            <p className="text-xs text-muted-foreground">Redirecting you now...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const passwordStrength = formData.password ? getPasswordStrength(formData.password) : null;
  const strengthInfo = passwordStrength ? getPasswordStrengthInfo(passwordStrength) : null;

  return (
    <Card className={`w-full max-w-md mx-auto transition-all duration-200 ${className || ''}`}>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">Create Account</CardTitle>
        <CardDescription className="text-center">
          Join Polly Pro to create and participate in polls
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

          {/* Name Field */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              Full Name
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="name"
                type="text"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`pl-10 transition-all duration-200 ${
                  getFieldState('name') === 'error' 
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                    : getFieldState('name') === 'success'
                    ? 'border-green-500 focus:border-green-500 focus:ring-green-500'
                    : ''
                }`}
                disabled={isLoading}
                autoComplete="name"
              />
              {getFieldState('name') === 'success' && (
                <CheckCircle2 className="absolute right-3 top-3 h-4 w-4 text-green-500" />
              )}
            </div>
            {errors.name && (
              <p className="text-sm text-red-600 animate-in slide-in-from-top-1 duration-200">
                {errors.name}
              </p>
            )}
          </div>

          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Email Address
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
                placeholder="Create a password"
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
                autoComplete="new-password"
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
            
            {/* Password Strength Indicator */}
            {formData.password && strengthInfo && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Password strength:</span>
                  <span className={`text-xs font-medium ${strengthInfo.color}`}>
                    {strengthInfo.text}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div 
                    className={`h-1.5 rounded-full transition-all duration-300 ${strengthInfo.bg}`}
                    style={{ 
                      width: passwordStrength === 'weak' ? '33%' : 
                             passwordStrength === 'medium' ? '66%' : '100%' 
                    }}
                  />
                </div>
              </div>
            )}
            
            {errors.password && (
              <p className="text-sm text-red-600 animate-in slide-in-from-top-1 duration-200">
                {errors.password}
              </p>
            )}
          </div>

          {/* Confirm Password Field */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-sm font-medium">
              Confirm Password
            </Label>
            <div className="relative">
              <Shield className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                className={`pl-10 pr-10 transition-all duration-200 ${
                  getFieldState('confirmPassword') === 'error' 
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                    : getFieldState('confirmPassword') === 'success'
                    ? 'border-green-500 focus:border-green-500 focus:ring-green-500'
                    : ''
                }`}
                disabled={isLoading}
                autoComplete="new-password"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={isLoading}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
              {getFieldState('confirmPassword') === 'success' && (
                <CheckCircle2 className="absolute right-10 top-3 h-4 w-4 text-green-500" />
              )}
            </div>
            {errors.confirmPassword && (
              <p className="text-sm text-red-600 animate-in slide-in-from-top-1 duration-200">
                {errors.confirmPassword}
              </p>
            )}
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
                Creating account...
              </>
            ) : (
              'Create Account'
            )}
          </Button>

          {/* Login Link */}
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link 
              href="/auth/login" 
              className="text-primary hover:underline font-medium transition-colors duration-200"
            >
              Sign in here
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
});