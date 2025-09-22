'use client';

import { CreatePollForm } from '@/components/polls/create-poll-form';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Lock } from 'lucide-react';
import Link from 'next/link';

export default function CreatePollPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    console.log('CreatePollPage - Auth state:', { user: !!user, isLoading, email: user?.email });
    
    // Check for a stored redirect from a successful login
    const checkForStoredRedirect = () => {
      // Check if we just completed authentication and were redirected here
      const storedRedirect = sessionStorage.getItem('authRedirectUrl');
      const redirectCookie = document.cookie.split('; ').find(row => row.startsWith('authRedirect='));
      
      if (storedRedirect === '/polls/create' || (redirectCookie && decodeURIComponent(redirectCookie.split('=')[1]) === '/polls/create')) {
        console.log('Found stored redirect to polls/create, clearing storage');
        // Clear the stored redirect to prevent loops
        sessionStorage.removeItem('authRedirectUrl');
        
        // Clear the cookie if it exists
        if (redirectCookie) {
          document.cookie = 'authRedirect=; path=/; max-age=0';
        }
      }
    };
    
    if (!isLoading) {
      if (!user) {
        // Redirect to login with the current page as redirect parameter
        const redirectUrl = `/auth/login?redirect=${encodeURIComponent('/polls/create')}`;
        console.log('Redirecting unauthenticated user to:', redirectUrl);
        // Use window.location.replace for a hard navigation to avoid caching issues
        window.location.replace(redirectUrl);
      } else {
        console.log('User is authenticated, showing poll creation page');
        // Check and clear any stored redirects
        checkForStoredRedirect();
      }
    }
  }, [user, isLoading]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

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

  return (
    <div className="container mx-auto px-4 py-8">
      <CreatePollForm />
    </div>
  );
}