/**
 * @fileoverview Success feedback components for enhanced user experience
 * Provides various success states and confirmation feedback for form submissions and actions
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { AnimatedContainer } from './animated-container';
import { cn } from '@/lib/utils';

/**
 * Success feedback types
 */
export type SuccessType = 
  | 'checkmark'
  | 'celebration'
  | 'progress'
  | 'notification'
  | 'modal'
  | 'inline'
  | 'toast';

/**
 * Success feedback props
 */
interface SuccessFeedbackProps {
  /** Success type */
  type?: SuccessType;
  /** Success title */
  title?: string;
  /** Success message */
  message?: string;
  /** Whether to show success */
  show?: boolean;
  /** Auto-hide duration in milliseconds */
  autoHideDuration?: number;
  /** Custom icon */
  icon?: React.ReactNode;
  /** Action buttons */
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  }>;
  /** Custom className */
  className?: string;
  /** Callback when hidden */
  onHide?: () => void;
  /** Callback when action clicked */
  onActionClick?: (actionIndex: number) => void;
}

/**
 * Success checkmark icon component
 */
const CheckmarkIcon: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    className={cn('w-6 h-6', className)}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M5 13l4 4L19 7"
    />
  </svg>
);

/**
 * Celebration icon component
 */
const CelebrationIcon: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    className={cn('w-6 h-6', className)}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
    />
  </svg>
);

/**
 * Animated checkmark success component
 * 
 * Features:
 * - Smooth checkmark animation
 * - Circular progress background
 * - Customizable colors and sizes
 * - Auto-hide functionality
 * 
 * @param props - Checkmark success configuration
 * @returns JSX element with animated checkmark
 */
export const CheckmarkSuccess: React.FC<SuccessFeedbackProps> = ({
  title = 'Success!',
  message,
  show = false,
  autoHideDuration = 3000,
  className = '',
  onHide
}) => {
  const [isVisible, setIsVisible] = useState(show);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      if (autoHideDuration > 0) {
        timeoutRef.current = setTimeout(() => {
          setIsVisible(false);
          onHide?.();
        }, autoHideDuration);
      }
    } else {
      setIsVisible(false);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [show, autoHideDuration, onHide]);

  if (!isVisible && !show) return null;

  return (
    <AnimatedContainer
      animation="scale-in"
      duration="normal"
      className={cn(
        'flex flex-col items-center justify-center p-6',
        'transition-all duration-300 ease-out',
        isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95',
        className
      )}
    >
      {/* Animated checkmark circle */}
      <div className="relative mb-4">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
          <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
            <CheckmarkIcon className="w-6 h-6 text-white animate-bounce" />
          </div>
        </div>
        
        {/* Success ring animation */}
        <div className="absolute inset-0 rounded-full border-4 border-green-500 animate-ping opacity-20" />
      </div>

      {/* Success content */}
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        {message && (
          <p className="text-sm text-gray-600">{message}</p>
        )}
      </div>
    </AnimatedContainer>
  );
};

/**
 * Celebration success component
 * 
 * Features:
 * - Confetti-like animation
 * - Multiple celebration icons
 * - Bouncy entrance animation
 * - Customizable celebration elements
 * 
 * @param props - Celebration success configuration
 * @returns JSX element with celebration animation
 */
export const CelebrationSuccess: React.FC<SuccessFeedbackProps> = ({
  title = 'Congratulations!',
  message,
  show = false,
  autoHideDuration = 4000,
  className = '',
  onHide
}) => {
  const [isVisible, setIsVisible] = useState(show);
  const [showConfetti, setShowConfetti] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      setShowConfetti(true);
      
      if (autoHideDuration > 0) {
        timeoutRef.current = setTimeout(() => {
          setIsVisible(false);
          setShowConfetti(false);
          onHide?.();
        }, autoHideDuration);
      }
    } else {
      setIsVisible(false);
      setShowConfetti(false);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [show, autoHideDuration, onHide]);

  if (!isVisible && !show) return null;

  return (
    <AnimatedContainer
      animation="bounce-in"
      duration="normal"
      className={cn(
        'relative flex flex-col items-center justify-center p-8',
        'transition-all duration-300 ease-out',
        isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95',
        className
      )}
    >
      {/* Confetti elements */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className={cn(
                'absolute w-2 h-2 rounded-full animate-bounce',
                i % 4 === 0 && 'bg-yellow-400',
                i % 4 === 1 && 'bg-blue-400',
                i % 4 === 2 && 'bg-green-400',
                i % 4 === 3 && 'bg-red-400'
              )}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${1 + Math.random()}s`
              }}
            />
          ))}
        </div>
      )}

      {/* Celebration icon */}
      <div className="mb-6">
        <div className="w-20 h-20 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center animate-pulse">
          <CelebrationIcon className="w-10 h-10 text-white" style={{ animation: 'spin 3s linear infinite' }} />
        </div>
      </div>

      {/* Success content */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-3">{title}</h2>
        {message && (
          <p className="text-gray-600 max-w-md">{message}</p>
        )}
      </div>
    </AnimatedContainer>
  );
};

/**
 * Progress success component
 * 
 * Features:
 * - Animated progress bar
 * - Step-by-step completion
 * - Customizable progress stages
 * - Smooth transitions
 * 
 * @param props - Progress success configuration
 * @returns JSX element with progress animation
 */
export const ProgressSuccess: React.FC<SuccessFeedbackProps & {
  steps?: string[];
  currentStep?: number;
}> = ({
  title = 'Processing Complete',
  message,
  show = false,
  steps = ['Validating', 'Processing', 'Complete'],
  currentStep = steps.length - 1,
  className = '',
  onHide
}) => {
  const [isVisible, setIsVisible] = useState(show);
  const [animatedStep, setAnimatedStep] = useState(0);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      
      // Animate through steps
      const stepInterval = setInterval(() => {
        setAnimatedStep(prev => {
          if (prev < currentStep) {
            return prev + 1;
          } else {
            clearInterval(stepInterval);
            return prev;
          }
        });
      }, 500);

      return () => clearInterval(stepInterval);
    } else {
      setIsVisible(false);
      setAnimatedStep(0);
    }
  }, [show, currentStep]);

  if (!isVisible && !show) return null;

  const progressPercentage = ((animatedStep + 1) / steps.length) * 100;

  return (
    <AnimatedContainer
      animation="slide-in-from-top"
      duration="normal"
      className={cn(
        'p-6 bg-white rounded-lg shadow-lg border',
        'transition-all duration-300 ease-out',
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4',
        className
      )}
    >
      {/* Progress header */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        {message && (
          <p className="text-sm text-gray-600">{message}</p>
        )}
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-green-500 h-2 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Progress steps */}
      <div className="space-y-2">
        {steps.map((step, index) => (
          <div
            key={index}
            className={cn(
              'flex items-center gap-3 text-sm transition-all duration-300',
              index <= animatedStep ? 'text-green-600' : 'text-gray-400'
            )}
          >
            <div
              className={cn(
                'w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all duration-300',
                index <= animatedStep
                  ? 'border-green-500 bg-green-500'
                  : 'border-gray-300'
              )}
            >
              {index <= animatedStep && (
                <CheckmarkIcon className="w-2 h-2 text-white" />
              )}
            </div>
            <span className={index <= animatedStep ? 'font-medium' : ''}>
              {step}
            </span>
          </div>
        ))}
      </div>
    </AnimatedContainer>
  );
};

/**
 * Toast success component
 * 
 * Features:
 * - Slide-in from edge animation
 * - Auto-dismiss functionality
 * - Action buttons support
 * - Positioning options
 * 
 * @param props - Toast success configuration
 * @returns JSX element with toast notification
 */
export const ToastSuccess: React.FC<SuccessFeedbackProps & {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}> = ({
  title = 'Success',
  message,
  show = false,
  autoHideDuration = 4000,
  actions = [],
  position = 'top-right',
  className = '',
  onHide,
  onActionClick
}) => {
  const [isVisible, setIsVisible] = useState(show);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      if (autoHideDuration > 0) {
        timeoutRef.current = setTimeout(() => {
          setIsVisible(false);
          onHide?.();
        }, autoHideDuration);
      }
    } else {
      setIsVisible(false);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [show, autoHideDuration, onHide]);

  if (!isVisible && !show) return null;

  const getPositionClasses = () => {
    switch (position) {
      case 'top-right':
        return 'top-4 right-4';
      case 'top-left':
        return 'top-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      default:
        return 'top-4 right-4';
    }
  };

  const getAnimationType = () => {
    return position.includes('right') ? 'slide-in-from-right' : 'slide-in-from-left';
  };

  return (
    <div className={cn('fixed z-50', getPositionClasses())}>
      <AnimatedContainer
        animation={getAnimationType()}
        duration="normal"
        className={cn(
          'bg-white rounded-lg shadow-lg border border-green-200 p-4 max-w-sm',
          'transition-all duration-300 ease-out',
          isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95',
          className
        )}
      >
        <div className="flex items-start gap-3">
          {/* Success icon */}
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <CheckmarkIcon className="w-4 h-4 text-green-600" />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-gray-900">{title}</h4>
            {message && (
              <p className="text-sm text-gray-600 mt-1">{message}</p>
            )}

            {/* Actions */}
            {actions.length > 0 && (
              <div className="flex gap-2 mt-3">
                {actions.map((action, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      action.onClick();
                      onActionClick?.(index);
                    }}
                    className={cn(
                      'text-xs px-3 py-1 rounded-md font-medium transition-colors',
                      action.variant === 'primary'
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    )}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Close button */}
          <button
            onClick={() => {
              setIsVisible(false);
              onHide?.();
            }}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </AnimatedContainer>
    </div>
  );
};

/**
 * Main success feedback component that renders different types
 * 
 * @param props - Success feedback configuration
 * @returns JSX element with appropriate success feedback type
 */
export const SuccessFeedback: React.FC<SuccessFeedbackProps> = (props) => {
  switch (props.type) {
    case 'celebration':
      return <CelebrationSuccess {...props} />;
    case 'progress':
      return <ProgressSuccess {...props} />;
    case 'toast':
      return <ToastSuccess {...props} />;
    case 'checkmark':
    default:
      return <CheckmarkSuccess {...props} />;
  }
};