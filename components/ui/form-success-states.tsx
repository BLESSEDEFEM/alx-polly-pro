/**
 * @fileoverview Form-specific success state components
 * Provides success states and confirmation feedback specifically designed for form submissions
 */

'use client';

import { useState, useEffect } from 'react';
import { SuccessFeedback, CheckmarkSuccess, ToastSuccess } from './success-feedback';
import { AnimatedContainer } from './animated-container';
import { cn } from '@/lib/utils';

/**
 * Form success state props
 */
interface FormSuccessStateProps {
  /** Whether to show success state */
  show?: boolean;
  /** Success title */
  title?: string;
  /** Success message */
  message?: string;
  /** Form type for contextual messaging */
  formType?: 'login' | 'register' | 'poll' | 'vote' | 'generic';
  /** Success actions */
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  }>;
  /** Auto-redirect configuration */
  autoRedirect?: {
    url: string;
    delay: number;
    message?: string;
  };
  /** Custom className */
  className?: string;
  /** Callback when hidden */
  onHide?: () => void;
}

/**
 * Get contextual success messages based on form type
 */
const getContextualMessages = (formType: string) => {
  switch (formType) {
    case 'login':
      return {
        title: 'Welcome back!',
        message: 'You have been successfully logged in.',
        icon: '👋'
      };
    case 'register':
      return {
        title: 'Account created!',
        message: 'Welcome to Polly Pro! Your account has been created successfully.',
        icon: '🎉'
      };
    case 'poll':
      return {
        title: 'Poll created!',
        message: 'Your poll has been created and is now live for voting.',
        icon: '📊'
      };
    case 'vote':
      return {
        title: 'Vote recorded!',
        message: 'Thank you for participating! Your vote has been recorded.',
        icon: '✅'
      };
    default:
      return {
        title: 'Success!',
        message: 'Your action has been completed successfully.',
        icon: '✨'
      };
  }
};

/**
 * Login success state component
 * 
 * Features:
 * - Welcome back message
 * - User profile preview
 * - Auto-redirect to dashboard
 * - Quick action buttons
 * 
 * @param props - Login success configuration
 * @returns JSX element with login success state
 */
export const LoginSuccessState: React.FC<FormSuccessStateProps & {
  userInfo?: {
    name?: string;
    email?: string;
    avatar?: string;
  };
}> = ({
  show = false,
  userInfo,
  autoRedirect,
  actions = [],
  className = '',
  onHide
}) => {
  const [countdown, setCountdown] = useState(autoRedirect?.delay || 0);

  useEffect(() => {
    if (show && autoRedirect) {
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            window.location.href = autoRedirect.url;
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [show, autoRedirect]);

  if (!show) return null;

  return (
    <AnimatedContainer
      animation="scale-in"
      duration="normal"
      className={cn(
        'bg-white rounded-lg shadow-lg border p-6 max-w-md mx-auto',
        className
      )}
    >
      {/* Success header */}
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">👋</span>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Welcome back{userInfo?.name ? `, ${userInfo.name}` : ''}!
        </h2>
        <p className="text-gray-600">
          You have been successfully logged in.
        </p>
      </div>

      {/* User info preview */}
      {userInfo && (
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3">
            {userInfo.avatar ? (
              <img
                src={userInfo.avatar}
                alt="Profile"
                className="w-10 h-10 rounded-full"
              />
            ) : (
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white font-medium">
                  {userInfo.name?.charAt(0) || userInfo.email?.charAt(0) || 'U'}
                </span>
              </div>
            )}
            <div>
              {userInfo.name && (
                <p className="font-medium text-gray-900">{userInfo.name}</p>
              )}
              <p className="text-sm text-gray-600">{userInfo.email}</p>
            </div>
          </div>
        </div>
      )}

      {/* Auto-redirect countdown */}
      {autoRedirect && countdown > 0 && (
        <div className="bg-blue-50 rounded-lg p-3 mb-4">
          <p className="text-sm text-blue-800 text-center">
            {autoRedirect.message || 'Redirecting to dashboard'} in {countdown} seconds...
          </p>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-3">
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={action.onClick}
            className={cn(
              'flex-1 py-2 px-4 rounded-md font-medium transition-colors',
              action.variant === 'primary'
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            )}
          >
            {action.label}
          </button>
        ))}
        {actions.length === 0 && (
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md font-medium hover:bg-blue-700 transition-colors"
          >
            Go to Dashboard
          </button>
        )}
      </div>
    </AnimatedContainer>
  );
};

/**
 * Registration success state component
 * 
 * Features:
 * - Welcome message with celebration
 * - Account verification status
 * - Next steps guidance
 * - Email verification prompt
 * 
 * @param props - Registration success configuration
 * @returns JSX element with registration success state
 */
export const RegistrationSuccessState: React.FC<FormSuccessStateProps & {
  requiresVerification?: boolean;
  verificationEmail?: string;
}> = ({
  show = false,
  requiresVerification = false,
  verificationEmail,
  actions = [],
  className = '',
  onHide
}) => {
  if (!show) return null;

  return (
    <AnimatedContainer
      animation="bounce-in"
      duration="normal"
      className={cn(
        'bg-white rounded-lg shadow-lg border p-6 max-w-md mx-auto',
        className
      )}
    >
      {/* Celebration header */}
      <div className="text-center mb-6">
        <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl animate-bounce">🎉</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Welcome to Polly Pro!
        </h2>
        <p className="text-gray-600">
          Your account has been created successfully.
        </p>
      </div>

      {/* Verification notice */}
      {requiresVerification && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <span className="text-yellow-600 text-xl">📧</span>
            <div>
              <h3 className="font-medium text-yellow-800 mb-1">
                Verify your email
              </h3>
              <p className="text-sm text-yellow-700">
                We've sent a verification link to{' '}
                <span className="font-medium">{verificationEmail}</span>.
                Please check your inbox and click the link to activate your account.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Next steps */}
      <div className="mb-6">
        <h3 className="font-medium text-gray-900 mb-3">What's next?</h3>
        <div className="space-y-2">
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-medium">1</span>
            {requiresVerification ? 'Verify your email address' : 'Complete your profile'}
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-medium">2</span>
            Create your first poll
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-medium">3</span>
            Share and collect responses
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={action.onClick}
            className={cn(
              'flex-1 py-2 px-4 rounded-md font-medium transition-colors',
              action.variant === 'primary'
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            )}
          >
            {action.label}
          </button>
        ))}
        {actions.length === 0 && (
          <button
            onClick={() => window.location.href = requiresVerification ? '/verify-email' : '/dashboard'}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md font-medium hover:bg-blue-700 transition-colors"
          >
            {requiresVerification ? 'Check Email' : 'Get Started'}
          </button>
        )}
      </div>
    </AnimatedContainer>
  );
};

/**
 * Poll creation success state component
 * 
 * Features:
 * - Poll preview with share options
 * - Analytics preview
 * - Share buttons and links
 * - Management actions
 * 
 * @param props - Poll success configuration
 * @returns JSX element with poll creation success state
 */
export const PollCreationSuccessState: React.FC<FormSuccessStateProps & {
  pollData?: {
    id: string;
    title: string;
    shareUrl?: string;
    responseCount?: number;
  };
}> = ({
  show = false,
  pollData,
  actions = [],
  className = '',
  onHide
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    if (pollData?.shareUrl) {
      try {
        await navigator.clipboard.writeText(pollData.shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy link:', err);
      }
    }
  };

  if (!show) return null;

  return (
    <AnimatedContainer
      animation="slide-in-from-bottom"
      duration="normal"
      className={cn(
        'bg-white rounded-lg shadow-lg border p-6 max-w-lg mx-auto',
        className
      )}
    >
      {/* Success header */}
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">📊</span>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Poll Created Successfully!
        </h2>
        <p className="text-gray-600">
          Your poll is now live and ready for responses.
        </p>
      </div>

      {/* Poll preview */}
      {pollData && (
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="font-medium text-gray-900 mb-2">{pollData.title}</h3>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>Poll ID: {pollData.id}</span>
            <span>Responses: {pollData.responseCount || 0}</span>
          </div>
        </div>
      )}

      {/* Share section */}
      {pollData?.shareUrl && (
        <div className="mb-6">
          <h3 className="font-medium text-gray-900 mb-3">Share your poll</h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={pollData.shareUrl}
              readOnly
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm"
            />
            <button
              onClick={handleCopyLink}
              className={cn(
                'px-4 py-2 rounded-md text-sm font-medium transition-colors',
                copied
                  ? 'bg-green-100 text-green-700'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              )}
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <button
          onClick={() => window.location.href = `/polls/${pollData?.id}`}
          className="flex items-center justify-center gap-2 py-2 px-4 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
        >
          <span>👁️</span>
          View Poll
        </button>
        <button
          onClick={() => window.location.href = `/polls/${pollData?.id}/analytics`}
          className="flex items-center justify-center gap-2 py-2 px-4 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
        >
          <span>📈</span>
          Analytics
        </button>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={action.onClick}
            className={cn(
              'flex-1 py-2 px-4 rounded-md font-medium transition-colors',
              action.variant === 'primary'
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            )}
          >
            {action.label}
          </button>
        ))}
        {actions.length === 0 && (
          <>
            <button
              onClick={() => window.location.href = '/polls/create'}
              className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-md font-medium hover:bg-gray-200 transition-colors"
            >
              Create Another
            </button>
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md font-medium hover:bg-blue-700 transition-colors"
            >
              Dashboard
            </button>
          </>
        )}
      </div>
    </AnimatedContainer>
  );
};

/**
 * Generic form success state component
 * 
 * Features:
 * - Contextual messaging based on form type
 * - Flexible action configuration
 * - Toast and modal variants
 * - Auto-hide functionality
 * 
 * @param props - Generic form success configuration
 * @returns JSX element with appropriate success state
 */
export const FormSuccessState: React.FC<FormSuccessStateProps> = ({
  show = false,
  title,
  message,
  formType = 'generic',
  actions = [],
  autoRedirect,
  className = '',
  onHide
}) => {
  const contextualMessages = getContextualMessages(formType);
  const finalTitle = title || contextualMessages.title;
  const finalMessage = message || contextualMessages.message;

  // Use specific components for certain form types
  switch (formType) {
    case 'login':
      return (
        <LoginSuccessState
          show={show}
          autoRedirect={autoRedirect}
          actions={actions}
          className={className}
          onHide={onHide}
        />
      );
    case 'register':
      return (
        <RegistrationSuccessState
          show={show}
          actions={actions}
          className={className}
          onHide={onHide}
        />
      );
    case 'poll':
      return (
        <PollCreationSuccessState
          show={show}
          actions={actions}
          className={className}
          onHide={onHide}
        />
      );
    default:
      return (
        <CheckmarkSuccess
          title={finalTitle}
          message={finalMessage}
          show={show}
          className={className}
          onHide={onHide}
        />
      );
  }
};