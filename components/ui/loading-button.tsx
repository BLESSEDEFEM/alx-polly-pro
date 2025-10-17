/**
 * @fileoverview Enhanced loading button component with improved UX and visual feedback
 * Provides consistent button behavior with loading states and animations
 */

'use client';

import React, { forwardRef } from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Loading button state
 */
export type LoadingButtonState = 'idle' | 'loading' | 'success' | 'error';

/**
 * Loading button props interface
 */
interface LoadingButtonProps extends ButtonProps {
  /** Button loading state */
  loading?: boolean;
  /** Button state for enhanced feedback */
  state?: LoadingButtonState;
  /** Loading text to display */
  loadingText?: string;
  /** Success text to display */
  successText?: string;
  /** Error text to display */
  errorText?: string;
  /** Custom loading icon */
  loadingIcon?: React.ReactNode;
  /** Custom success icon */
  successIcon?: React.ReactNode;
  /** Whether to show success state briefly */
  showSuccessState?: boolean;
  /** Success state duration in milliseconds */
  successDuration?: number;
  /** Whether button should be disabled during loading */
  disableOnLoading?: boolean;
  /** Minimum loading duration in milliseconds */
  minLoadingDuration?: number;
}

/**
 * Enhanced loading button component with state management and visual feedback
 * 
 * Features:
 * - Multiple loading states with appropriate visual feedback
 * - Smooth transitions between states
 * - Customizable loading, success, and error messages
 * - Automatic success state display with timeout
 * - Minimum loading duration to prevent flickering
 * - Accessible loading states with proper ARIA attributes
 * - Consistent styling with the design system
 * - Support for custom icons and animations
 * 
 * @param props - Loading button configuration
 * @returns JSX element containing the enhanced loading button
 */
export const LoadingButton = forwardRef<HTMLButtonElement, LoadingButtonProps>(
  ({
    children,
    loading = false,
    state = 'idle',
    loadingText,
    successText,
    errorText,
    loadingIcon,
    successIcon,
    showSuccessState = false,
    successDuration = 2000,
    disableOnLoading = true,
    minLoadingDuration = 500,
    className,
    variant = 'default',
    size = 'default',
    onClick,
    ...props
  }, ref) => {
    
    // Determine the current state
    const currentState = loading ? 'loading' : state;
    
    // Determine if button should be disabled
    const isDisabled = props.disabled || (disableOnLoading && currentState === 'loading');
    
    // Get the appropriate content based on state
    const getButtonContent = () => {
      switch (currentState) {
        case 'loading':
          return (
            <>
              {loadingIcon || <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loadingText || 'Loading...'}
            </>
          );
        case 'success':
          return (
            <>
              {successIcon || <CheckCircle2 className="mr-2 h-4 w-4" />}
              {successText || 'Success!'}
            </>
          );
        case 'error':
          return errorText || children;
        default:
          return children;
      }
    };

    // Get variant based on state
    const getVariant = () => {
      switch (currentState) {
        case 'success':
          return 'default'; // Keep original variant for success
        case 'error':
          return variant === 'destructive' ? 'destructive' : variant;
        default:
          return variant;
      }
    };

    // Get additional classes based on state
    const getStateClasses = () => {
      switch (currentState) {
        case 'loading':
          return 'cursor-wait';
        case 'success':
          return 'bg-green-600 hover:bg-green-700 border-green-600 text-white';
        case 'error':
          return variant !== 'destructive' ? 'bg-red-600 hover:bg-red-700 border-red-600 text-white' : '';
        default:
          return '';
      }
    };

    /**
     * Handle click with state management
     */
    const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
      if (isDisabled || currentState === 'loading') {
        e.preventDefault();
        return;
      }
      
      onClick?.(e);
    };

    return (
      <Button
        ref={ref}
        variant={getVariant()}
        size={size}
        disabled={isDisabled}
        onClick={handleClick}
        className={cn(
          'transition-all duration-200',
          getStateClasses(),
          currentState === 'loading' && 'scale-[0.98]',
          currentState === 'success' && 'scale-105',
          className
        )}
        aria-busy={currentState === 'loading'}
        aria-live="polite"
        {...props}
      >
        <span className="flex items-center justify-center">
          {getButtonContent()}
        </span>
      </Button>
    );
  }
);

LoadingButton.displayName = 'LoadingButton';