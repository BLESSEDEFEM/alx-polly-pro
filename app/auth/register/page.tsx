/**
 * @fileoverview Registration page component for new user account creation
 * Provides a dedicated page for new users to create accounts and join the platform
 */

import { RegisterForm } from '@/components/auth/register-form';

/**
 * Registration page component
 * 
 * A dedicated authentication page that allows new users to create accounts on the platform.
 * Features a centered layout with the Polly Pro branding and a registration form component.
 * 
 * The page uses a full-screen centered layout with:
 * - Gray background for visual separation
 * - Centered card-like container with max width
 * - Brand header with welcome message for new users
 * - RegisterForm component for account creation logic
 * 
 * @returns JSX element containing the registration page layout
 * 
 * @example
 * ```tsx
 * // This page is automatically rendered at "/auth/register"
 * // New users can navigate here to create their accounts
 * ```
 */
export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        {/* Brand header and welcome message for new users */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Polly Pro</h1>
          <p className="mt-2 text-gray-600">Create your account to start polling</p>
        </div>
        
        {/* Registration form component handles account creation logic */}
        <RegisterForm />
      </div>
    </div>
  );
}

/**
 * Page metadata for SEO and browser display
 * 
 * Defines the page title and description for search engines and browser tabs.
 * This metadata helps with SEO and provides context when the page is shared.
 */
export const metadata = {
  title: 'Sign Up - Polly Pro',
  description: 'Create your Polly Pro account to start creating and managing polls.',
};