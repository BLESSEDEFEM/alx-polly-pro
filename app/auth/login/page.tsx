'use client';

import { LoginForm } from '@/components/auth/login-form';
import { useSearchParams } from 'next/navigation';
import { AuthDebug } from '@/components/debug/auth-debug';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

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
  const [showDebug, setShowDebug] = useState(false);
  
  console.log('LoginPage - Redirect parameter:', redirectTo);

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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}