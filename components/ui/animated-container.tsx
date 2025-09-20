/**
 * @fileoverview Animated container component for smooth transitions and interactions
 * Provides reusable animation patterns for forms and UI elements
 */

'use client';

import React, { forwardRef, useEffect, useState, ElementType } from 'react';
import { cn } from '@/lib/utils';

/**
 * Animation types
 */
export type AnimationType = 
  | 'fade-in'
  | 'slide-in-from-top'
  | 'slide-in-from-bottom'
  | 'slide-in-from-left'
  | 'slide-in-from-right'
  | 'scale-in'
  | 'bounce-in'
  | 'flip-in'
  | 'shake'
  | 'pulse'
  | 'wiggle';

/**
 * Animation timing
 */
export type AnimationDuration = 'fast' | 'normal' | 'slow' | 'slower';

/**
 * Animation easing
 */
export type AnimationEasing = 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'bounce';

/**
 * Animated container props interface
 */
interface AnimatedContainerProps {
  /** Child elements */
  children: React.ReactNode;
  /** Animation type */
  animation?: AnimationType;
  /** Animation duration */
  duration?: AnimationDuration;
  /** Animation easing */
  easing?: AnimationEasing;
  /** Animation delay in milliseconds */
  delay?: number;
  /** Whether animation should repeat */
  repeat?: boolean;
  /** Number of repetitions (if repeat is true) */
  repeatCount?: number;
  /** Whether to animate on mount */
  animateOnMount?: boolean;
  /** Whether to animate when visible (intersection observer) */
  animateOnVisible?: boolean;
  /** Trigger animation manually */
  trigger?: boolean;
  /** Custom className */
  className?: string;
  /** Container element type */
  as?: ElementType;
  /** Callback when animation starts */
  onAnimationStart?: () => void;
  /** Callback when animation ends */
  onAnimationEnd?: () => void;
}

/**
 * Get animation classes based on type
 */
const getAnimationClasses = (animation: AnimationType): string => {
  switch (animation) {
    case 'fade-in':
      return 'animate-in fade-in';
    case 'slide-in-from-top':
      return 'animate-in slide-in-from-top-2';
    case 'slide-in-from-bottom':
      return 'animate-in slide-in-from-bottom-2';
    case 'slide-in-from-left':
      return 'animate-in slide-in-from-left-2';
    case 'slide-in-from-right':
      return 'animate-in slide-in-from-right-2';
    case 'scale-in':
      return 'animate-in zoom-in-95';
    case 'bounce-in':
      return 'animate-bounce';
    case 'flip-in':
      return 'animate-in spin-in-180';
    case 'shake':
      return 'animate-pulse'; // Using pulse as shake alternative
    case 'pulse':
      return 'animate-pulse';
    case 'wiggle':
      return 'animate-bounce'; // Using bounce as wiggle alternative
    default:
      return 'animate-in fade-in';
  }
};

/**
 * Get duration classes
 */
const getDurationClasses = (duration: AnimationDuration): string => {
  switch (duration) {
    case 'fast':
      return 'duration-150';
    case 'normal':
      return 'duration-300';
    case 'slow':
      return 'duration-500';
    case 'slower':
      return 'duration-700';
    default:
      return 'duration-300';
  }
};

/**
 * Get easing classes
 */
const getEasingClasses = (easing: AnimationEasing): string => {
  switch (easing) {
    case 'linear':
      return 'ease-linear';
    case 'ease':
      return 'ease';
    case 'ease-in':
      return 'ease-in';
    case 'ease-out':
      return 'ease-out';
    case 'ease-in-out':
      return 'ease-in-out';
    case 'bounce':
      return 'ease-out'; // Closest alternative
    default:
      return 'ease-out';
  }
};

/**
 * Enhanced animated container component for smooth transitions
 * 
 * Features:
 * - Multiple animation types with CSS classes
 * - Configurable duration and easing
 * - Animation on mount or visibility
 * - Manual trigger support
 * - Intersection observer for scroll-based animations
 * - Repeat animations with count control
 * - Callback support for animation events
 * - Flexible container element types
 * - Accessibility considerations
 * 
 * @param props - Animated container configuration
 * @returns JSX element containing the animated container
 */
export const AnimatedContainer = forwardRef<HTMLElement, AnimatedContainerProps>(
  ({
    children,
    animation = 'fade-in',
    duration = 'normal',
    easing = 'ease-out',
    delay = 0,
    repeat = false,
    repeatCount = 1,
    animateOnMount = true,
    animateOnVisible = false,
    trigger = false,
    className = '',
    as: Component = 'div',
    onAnimationStart,
    onAnimationEnd,
    ...props
  }, ref) => {
    const [isVisible, setIsVisible] = useState(false);
    const [shouldAnimate, setShouldAnimate] = useState(false);
    const [animationCount, setAnimationCount] = useState(0);

    // Handle intersection observer for scroll-based animations
    useEffect(() => {
      if (!animateOnVisible) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        },
        { threshold: 0.1 }
      );

      const element = ref && 'current' in ref ? ref.current : null;
      if (element) {
        observer.observe(element);
      }

      return () => {
        if (element) {
          observer.unobserve(element);
        }
      };
    }, [animateOnVisible, ref]);

    // Handle animation triggers
    useEffect(() => {
      if (animateOnMount && !animateOnVisible) {
        setShouldAnimate(true);
      } else if (animateOnVisible && isVisible) {
        setShouldAnimate(true);
      } else if (trigger) {
        setShouldAnimate(true);
      }
    }, [animateOnMount, animateOnVisible, isVisible, trigger]);

    // Handle animation repetition
    useEffect(() => {
      if (shouldAnimate && repeat && animationCount < repeatCount) {
        const timer = setTimeout(() => {
          setAnimationCount(prev => prev + 1);
          if (animationCount + 1 >= repeatCount) {
            setShouldAnimate(false);
          }
        }, delay);

        return () => clearTimeout(timer);
      }
    }, [shouldAnimate, repeat, repeatCount, animationCount, delay]);

    // Handle animation callbacks
    useEffect(() => {
      if (shouldAnimate) {
        onAnimationStart?.();
        
        const animationDuration = duration === 'fast' ? 150 : 
                                 duration === 'normal' ? 300 : 
                                 duration === 'slow' ? 500 : 700;
        
        const timer = setTimeout(() => {
          onAnimationEnd?.();
        }, animationDuration + delay);

        return () => clearTimeout(timer);
      }
    }, [shouldAnimate, duration, delay, onAnimationStart, onAnimationEnd]);

    // Build animation classes
    const animationClasses = shouldAnimate ? [
      getAnimationClasses(animation),
      getDurationClasses(duration),
      getEasingClasses(easing),
      delay > 0 ? `delay-${delay}` : ''
    ].filter(Boolean).join(' ') : '';

    return (
      <Component
        ref={ref}
        className={cn(
          'transition-all',
          animationClasses,
          !shouldAnimate && animateOnVisible && 'opacity-0 translate-y-4',
          className
        )}
        style={{
          animationDelay: delay > 0 ? `${delay}ms` : undefined,
          animationIterationCount: repeat ? repeatCount : 1
        }}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

AnimatedContainer.displayName = 'AnimatedContainer';

/**
 * Predefined animation variants for common use cases
 */
export const AnimationVariants = {
  // Form animations
  formSlideIn: {
    animation: 'slide-in-from-top' as AnimationType,
    duration: 'normal' as AnimationDuration,
    easing: 'ease-out' as AnimationEasing
  },
  
  // Error animations
  errorShake: {
    animation: 'shake' as AnimationType,
    duration: 'fast' as AnimationDuration,
    repeat: true,
    repeatCount: 3
  },
  
  // Success animations
  successBounce: {
    animation: 'bounce-in' as AnimationType,
    duration: 'normal' as AnimationDuration,
    easing: 'bounce' as AnimationEasing
  },
  
  // Loading animations
  loadingPulse: {
    animation: 'pulse' as AnimationType,
    duration: 'slow' as AnimationDuration,
    repeat: true,
    repeatCount: Infinity
  },
  
  // Card animations
  cardFadeIn: {
    animation: 'fade-in' as AnimationType,
    duration: 'normal' as AnimationDuration,
    animateOnVisible: true
  },
  
  // Button animations
  buttonScale: {
    animation: 'scale-in' as AnimationType,
    duration: 'fast' as AnimationDuration
  }
} as const;

/**
 * Hook for managing animation state
 */
export const useAnimation = (initialState = false) => {
  const [isAnimating, setIsAnimating] = useState(initialState);
  const [animationKey, setAnimationKey] = useState(0);

  const triggerAnimation = () => {
    setIsAnimating(true);
    setAnimationKey(prev => prev + 1);
  };

  const stopAnimation = () => {
    setIsAnimating(false);
  };

  const resetAnimation = () => {
    setIsAnimating(false);
    setAnimationKey(prev => prev + 1);
  };

  return {
    isAnimating,
    animationKey,
    triggerAnimation,
    stopAnimation,
    resetAnimation
  };
};