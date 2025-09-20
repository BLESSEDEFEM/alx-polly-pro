/**
 * @fileoverview Form transition components for enhanced user experience
 * Provides smooth transitions for form states, validation feedback, and interactions
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { AnimatedContainer, AnimationType } from './animated-container';
import { cn } from '@/lib/utils';

/**
 * Form field transition props
 */
interface FormFieldTransitionProps {
  /** Child elements */
  children: React.ReactNode;
  /** Whether field has error */
  hasError?: boolean;
  /** Whether field is focused */
  isFocused?: boolean;
  /** Whether field has value */
  hasValue?: boolean;
  /** Custom className */
  className?: string;
}

/**
 * Enhanced form field with smooth transitions
 * 
 * Features:
 * - Smooth focus/blur transitions
 * - Error state animations
 * - Value state feedback
 * - Floating label animations
 * - Border and shadow transitions
 * 
 * @param props - Form field transition configuration
 * @returns JSX element with animated form field
 */
export const FormFieldTransition: React.FC<FormFieldTransitionProps> = ({
  children,
  hasError = false,
  isFocused = false,
  hasValue = false,
  className = ''
}) => {
  const [prevError, setPrevError] = useState(hasError);
  const [shouldShake, setShouldShake] = useState(false);

  // Trigger shake animation on new error
  useEffect(() => {
    if (hasError && !prevError) {
      setShouldShake(true);
      const timer = setTimeout(() => setShouldShake(false), 500);
      return () => clearTimeout(timer);
    }
    setPrevError(hasError);
  }, [hasError, prevError]);

  return (
    <div
      className={cn(
        'relative transition-all duration-300 ease-out',
        'transform-gpu', // Enable hardware acceleration
        isFocused && 'scale-[1.02]',
        hasError && 'animate-pulse',
        shouldShake && 'animate-bounce',
        className
      )}
    >
      {children}
      
      {/* Focus ring */}
      <div
        className={cn(
          'absolute inset-0 rounded-md pointer-events-none',
          'transition-all duration-200 ease-out',
          'ring-2 ring-transparent',
          isFocused && !hasError && 'ring-blue-500/20 ring-offset-2',
          hasError && 'ring-red-500/20 ring-offset-2'
        )}
      />
    </div>
  );
};

/**
 * Error message transition props
 */
interface ErrorTransitionProps {
  /** Error message */
  message?: string;
  /** Whether to show error */
  show?: boolean;
  /** Custom className */
  className?: string;
}

/**
 * Animated error message component
 * 
 * Features:
 * - Smooth slide-in/out animations
 * - Height transitions for layout stability
 * - Fade transitions for text changes
 * - Accessibility announcements
 * 
 * @param props - Error transition configuration
 * @returns JSX element with animated error message
 */
export const ErrorTransition: React.FC<ErrorTransitionProps> = ({
  message,
  show = false,
  className = ''
}) => {
  const [displayMessage, setDisplayMessage] = useState(message);
  const [isVisible, setIsVisible] = useState(show);

  useEffect(() => {
    if (show && message) {
      setDisplayMessage(message);
      setIsVisible(true);
    } else if (!show) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setDisplayMessage('');
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [show, message]);

  if (!isVisible && !displayMessage) return null;

  return (
    <AnimatedContainer
      animation="slide-in-from-top"
      duration="fast"
      className={cn(
        'overflow-hidden transition-all duration-200 ease-out',
        show ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0',
        className
      )}
    >
      <div
        className="text-sm text-red-600 mt-1 px-1"
        role="alert"
        aria-live="polite"
      >
        {displayMessage}
      </div>
    </AnimatedContainer>
  );
};

/**
 * Success message transition props
 */
interface SuccessTransitionProps {
  /** Success message */
  message?: string;
  /** Whether to show success */
  show?: boolean;
  /** Auto-hide duration in milliseconds */
  autoHideDuration?: number;
  /** Custom className */
  className?: string;
  /** Callback when hidden */
  onHide?: () => void;
}

/**
 * Animated success message component
 * 
 * Features:
 * - Smooth bounce-in animation
 * - Auto-hide functionality
 * - Success icon animation
 * - Accessibility announcements
 * 
 * @param props - Success transition configuration
 * @returns JSX element with animated success message
 */
export const SuccessTransition: React.FC<SuccessTransitionProps> = ({
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
      animation="bounce-in"
      duration="normal"
      className={cn(
        'transition-all duration-300 ease-out',
        isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95',
        className
      )}
    >
      <div
        className="flex items-center gap-2 text-sm text-green-600 mt-1 px-1"
        role="status"
        aria-live="polite"
      >
        <svg
          className="w-4 h-4 animate-pulse"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
        {message}
      </div>
    </AnimatedContainer>
  );
};

/**
 * Loading transition props
 */
interface LoadingTransitionProps {
  /** Whether to show loading */
  show?: boolean;
  /** Loading message */
  message?: string;
  /** Loading type */
  type?: 'spinner' | 'dots' | 'pulse';
  /** Custom className */
  className?: string;
}

/**
 * Animated loading indicator component
 * 
 * Features:
 * - Multiple loading animation types
 * - Smooth fade transitions
 * - Customizable loading messages
 * - Accessibility support
 * 
 * @param props - Loading transition configuration
 * @returns JSX element with animated loading indicator
 */
export const LoadingTransition: React.FC<LoadingTransitionProps> = ({
  show = false,
  message = 'Loading...',
  type = 'spinner',
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(show);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
    } else {
      const timer = setTimeout(() => setIsVisible(false), 200);
      return () => clearTimeout(timer);
    }
  }, [show]);

  if (!isVisible && !show) return null;

  const LoadingIcon = () => {
    switch (type) {
      case 'spinner':
        return (
          <svg
            className="animate-spin w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        );
      case 'dots':
        return (
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        );
      case 'pulse':
        return (
          <div className="w-4 h-4 bg-current rounded-full animate-pulse" />
        );
      default:
        return null;
    }
  };

  return (
    <AnimatedContainer
      animation="fade-in"
      duration="fast"
      className={cn(
        'transition-all duration-200 ease-out',
        isVisible ? 'opacity-100' : 'opacity-0',
        className
      )}
    >
      <div
        className="flex items-center gap-2 text-sm text-gray-600"
        role="status"
        aria-live="polite"
      >
        <LoadingIcon />
        {message}
      </div>
    </AnimatedContainer>
  );
};

/**
 * Form step transition props
 */
interface FormStepTransitionProps {
  /** Child elements */
  children: React.ReactNode;
  /** Current step index */
  currentStep: number;
  /** Step index */
  stepIndex: number;
  /** Transition direction */
  direction?: 'forward' | 'backward';
  /** Custom className */
  className?: string;
}

/**
 * Multi-step form transition component
 * 
 * Features:
 * - Smooth step transitions
 * - Direction-aware animations
 * - Height transitions for layout stability
 * - Progress indication
 * 
 * @param props - Form step transition configuration
 * @returns JSX element with animated form step
 */
export const FormStepTransition: React.FC<FormStepTransitionProps> = ({
  children,
  currentStep,
  stepIndex,
  direction = 'forward',
  className = ''
}) => {
  const isActive = currentStep === stepIndex;
  const isPast = currentStep > stepIndex;
  const isFuture = currentStep < stepIndex;

  const getAnimation = (): AnimationType => {
    if (direction === 'forward') {
      return isFuture ? 'slide-in-from-right' : 'slide-in-from-left';
    } else {
      return isFuture ? 'slide-in-from-left' : 'slide-in-from-right';
    }
  };

  if (!isActive) return null;

  return (
    <AnimatedContainer
      animation={getAnimation()}
      duration="normal"
      className={cn(
        'transition-all duration-300 ease-out',
        'transform-gpu',
        className
      )}
    >
      {children}
    </AnimatedContainer>
  );
};

/**
 * Form validation feedback transition props
 */
interface ValidationFeedbackProps {
  /** Field name */
  fieldName: string;
  /** Validation state */
  state: 'idle' | 'validating' | 'valid' | 'invalid';
  /** Error message */
  errorMessage?: string;
  /** Success message */
  successMessage?: string;
  /** Custom className */
  className?: string;
}

/**
 * Comprehensive validation feedback component
 * 
 * Features:
 * - Real-time validation state transitions
 * - Loading state during validation
 * - Success and error state animations
 * - Accessibility announcements
 * 
 * @param props - Validation feedback configuration
 * @returns JSX element with animated validation feedback
 */
export const ValidationFeedback: React.FC<ValidationFeedbackProps> = ({
  fieldName,
  state,
  errorMessage,
  successMessage,
  className = ''
}) => {
  return (
    <div className={cn('min-h-[1.5rem]', className)}>
      {state === 'validating' && (
        <LoadingTransition
          show={true}
          message="Validating..."
          type="dots"
        />
      )}
      
      {state === 'invalid' && errorMessage && (
        <ErrorTransition
          show={true}
          message={errorMessage}
        />
      )}
      
      {state === 'valid' && successMessage && (
        <SuccessTransition
          show={true}
          message={successMessage}
          autoHideDuration={2000}
        />
      )}
    </div>
  );
};