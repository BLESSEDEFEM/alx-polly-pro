'use client';

import { LoginForm } from '@/components/auth/login-form-new';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { AuthDebug } from '@/components/debug/auth-debug';
import { Loader2 } from 'lucide-react';

/**
 * Enhanced login page component
 * 
 * Features:
 * - Improved redirect handling
 * - Authentication state awareness
 * - Debug mode for troubleshooting
 * - Loading states for better UX
 */
export default function LoginPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isLoading } = useAuth();
  
  const [showDebug, setShowDebug] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  
  // Get redirect parameter from URL
  const redirectTo = searchParams.get('redirect') || '/dashboard';
  
  // Log for debugging
  console.log('LoginPage - Redirect parameter:', redirectTo);
  console.log('LoginPage - Auth state:', { user: !!user, isLoading });
  
  // Handle already authenticated users
  useEffect(() => {
    // Only proceed if auth state is loaded
    if (!isLoading) {
      if (user) {
        console.log('LoginPage - User already authenticated, redirecting to:', redirectTo);
        
        // Store the redirect path for reliability
        try {
          sessionStorage.setItem('authRedirectPath', redirectTo);
          localStorage.setItem('authRedirectPath', redirectTo);
        } catch (error) {
          console.error('Error storing redirect path:', error);
        }
        
        // Redirect to the target page
        router.replace(redirectTo);
      } else {
        console.log('LoginPage - User not authenticated, showing login form');
        setPageLoading(false);
      }
    }
  }, [user, isLoading, redirectTo, router]);
  
  // Show loading state while checking authentication
  if (isLoading || pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading authentication state...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        {/* Brand header and welcome message */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Polly Pro</h1>
          <p className="mt-2 text-gray-600">Welcome back to your polling platform</p>
          
          {/* Show redirect information */}
          {redirectTo && redirectTo !== '/dashboard' && (
            <p className="mt-2 text-sm text-blue-600">
              You'll be redirected to {redirectTo.replace(/%2F/g, '/')} after login
            </p>
          )}
        </div>
        
        {/* Enhanced login form component */}
        <LoginForm redirectTo={redirectTo} />
        
        {/* Debug section */}
        <div className="mt-8 text-center">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowDebug(!showDebug)}
          >
            {showDebug ? 'Hide Debug Info' : 'Show Debug Info'}
          </Button>
          
          {showDebug && (
            <div className="mt-4">
              <AuthDebug />
              
              <div className="mt-4 p-3 bg-gray-100 rounded text-xs text-left">
                <p className="font-semibold mb-1">Debug Information:</p>
                <p>Redirect URL: {redirectTo}</p>
                <p>Auth Loading: {isLoading ? 'Yes' : 'No'}</p>
                <p>User Authenticated: {user ? 'Yes' : 'No'}</p>
                <p>User Email: {user?.email || 'None'}</p>
                <p>Current URL: {typeof window !== 'undefined' ? window.location.href : 'SSR'}</p>
                <p>Stored Redirect: {typeof window !== 'undefined' ? sessionStorage.getItem('authRedirectPath') || 'None' : 'SSR'}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}