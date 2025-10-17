'use client';

import { LoginForm } from '@/components/auth/login-form';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { useAuth } from '@/components/providers/auth-provider';

/**
 * Login page component
 * 
 * A dedicated authentication page that allows existing users to sign into their accounts.
 * Features a centered layout with the Polly Pro branding and a login form component.
 * 
 * The page uses a full-screen centered layout with:
 * - Gray background for visual separation
 * - Centered card-like container with max width
 * - Brand header with welcome message
 * - LoginForm component for authentication logic
 * 
 * @returns JSX element containing the login page layout
 * 
 * @example
 * // This page is automatically rendered at "/auth/login"
 * // Users can navigate here to sign into their existing accounts
 */
export default function LoginPage() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/';
  const router = useRouter();
  const { user, loading } = useAuth();
  const hasRedirected = useRef(false);
  
  console.log('LoginPage - Redirect parameter:', redirectTo);

  // Prevent showing the login form when already authenticated
  useEffect(() => {
    if (!loading && user && !hasRedirected.current) {
      hasRedirected.current = true;
      const finalRedirect = (() => {
        if (!redirectTo || redirectTo.trim() === '') return '/';
        try {
          const url = new URL(redirectTo, typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
          const path = url.pathname + url.search + url.hash;
          return path || '/';
        } catch {
          return redirectTo.startsWith('/') ? redirectTo : `/${redirectTo}`;
        }
      })();
      console.log('LoginPage - Authenticated, redirecting to:', finalRedirect);
      router.replace(finalRedirect);
      // Fallback in case client router is blocked or HMR interferes
      if (typeof window !== 'undefined') {
        setTimeout(() => {
          if (window.location.pathname.startsWith('/auth/login')) {
            console.log('LoginPage - Fallback redirect triggered to:', finalRedirect);
            window.location.assign(finalRedirect);
          }
        }, 800);
      }
    }
  }, [user, loading, redirectTo, router]);

  // Optional: simple loading state while auth initializes
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center text-gray-600">Checking session...</div>
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
        </div>
        
        {/* Login form component handles authentication logic */}
        <LoginForm redirectTo={redirectTo} />
      </div>
    </div>
  );
}