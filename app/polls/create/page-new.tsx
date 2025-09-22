'use client';

import { CreatePollForm } from '@/components/polls/create-poll-form';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Lock, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { Alert, AlertDescription } from '@/components/ui/alert';

/**
 * Enhanced poll creation page with improved authentication handling
 */
export default function CreatePollPage() {
  const { user, isLoading, refreshSession } = useAuth();
  const router = useRouter();
  
  const [authChecked, setAuthChecked] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false);

  // Handle authentication state and redirects
  useEffect(() => {
    console.log('CreatePollPage - Auth state:', { 
      user: !!user, 
      isLoading, 
      email: user?.email,
      authChecked
    });
    
    // Only proceed if auth state is loaded
    if (!isLoading) {
      // If user is not authenticated, redirect to login
      if (!user) {
        console.log('CreatePollPage - User not authenticated, preparing redirect');
        setRedirecting(true);
        
        // Prepare redirect URL with proper encoding
        const redirectUrl = `/auth/login?redirect=${encodeURIComponent('/polls/create')}`;
        console.log('CreatePollPage - Redirecting to:', redirectUrl);
        
        // Store the current URL for potential direct redirect after auth
        try {
          sessionStorage.setItem('lastProtectedUrl', '/polls/create');
          localStorage.setItem('lastProtectedUrl', '/polls/create');
        } catch (error) {
          console.error('Error storing last protected URL:', error);
        }
        
        // Use hard navigation for reliable redirect
        window.location.href = redirectUrl;
      } else {
        console.log('CreatePollPage - User is authenticated, showing poll creation page');
        
        // Refresh session to ensure we have the latest auth state
        refreshSession()
          .then(() => {
            console.log('CreatePollPage - Session refreshed successfully');
            
            // Clear any stored redirect paths since we're now authenticated
            try {
              // Check if we were redirected here after login
              const storedRedirect = sessionStorage.getItem('authRedirectPath');
              const localStoredRedirect = localStorage.getItem('authRedirectPath');
              
              if (storedRedirect === '/polls/create' || localStoredRedirect === '/polls/create') {
                console.log('CreatePollPage - Found stored redirect, clearing storage');
                sessionStorage.removeItem('authRedirectPath');
                localStorage.removeItem('authRedirectPath');
                sessionStorage.removeItem('isRedirecting');
                localStorage.removeItem('lastProtectedUrl');
              }
            } catch (error) {
              console.error('Error clearing storage:', error);
            }
            
            setAuthChecked(true);
          })
          .catch(error => {
            console.error('CreatePollPage - Error refreshing session:', error);
            setAuthError('Error verifying authentication. Please try refreshing the page.');
            setAuthChecked(true);
          });
      }
    }
  }, [user, isLoading, refreshSession]);

  // Show loading state while checking authentication
  if (isLoading || redirecting || !authChecked) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">
              {redirecting ? 'Redirecting to login...' : 'Verifying authentication...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state if there was a problem with authentication
  if (authError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive" className="max-w-md mx-auto">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{authError}</AlertDescription>
        </Alert>
        
        <div className="flex justify-center mt-4">
          <Button onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // Show authentication required message if not authenticated
  // This is a fallback in case the redirect doesn't happen
  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Lock className="h-6 w-6" />
              </div>
              <CardTitle>Authentication Required</CardTitle>
              <CardDescription>
                You need to be logged in to create polls.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="mb-4">Please sign in to access this feature.</p>
              <Button asChild>
                <Link href="/auth/login?redirect=/polls/create">
                  Go to Login
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show the poll creation form for authenticated users
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Create a New Poll</h1>
      <CreatePollForm />
    </div>
  );
}