/**
 * @fileoverview Enhanced error display component for consistent error handling
 * Provides various error display patterns with improved UX and visual feedback
 */

'use client';

import { useState, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  AlertCircle, 
  XCircle, 
  AlertTriangle, 
  Info, 
  X, 
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Copy,
  CheckCircle2
} from 'lucide-react';

/**
 * Error severity levels
 */
export type ErrorSeverity = 'error' | 'warning' | 'info' | 'success';

/**
 * Error display variant types
 */
export type ErrorVariant = 'alert' | 'card' | 'inline' | 'toast';

/**
 * Error display props interface
 */
interface ErrorDisplayProps {
  /** Error message or object */
  error?: string | Error | null;
  /** Error severity level */
  severity?: ErrorSeverity;
  /** Display variant */
  variant?: ErrorVariant;
  /** Error title */
  title?: string;
  /** Whether the error can be dismissed */
  dismissible?: boolean;
  /** Whether to show retry button */
  showRetry?: boolean;
  /** Retry callback function */
  onRetry?: () => void;
  /** Dismiss callback function */
  onDismiss?: () => void;
  /** Whether to show error details */
  showDetails?: boolean;
  /** Additional error details */
  details?: string;
  /** Custom className */
  className?: string;
  /** Auto-dismiss timeout in milliseconds */
  autoHideTimeout?: number;
}

/**
 * Get icon for error severity
 */
const getSeverityIcon = (severity: ErrorSeverity) => {
  switch (severity) {
    case 'error':
      return XCircle;
    case 'warning':
      return AlertTriangle;
    case 'info':
      return Info;
    case 'success':
      return CheckCircle2;
    default:
      return AlertCircle;
  }
};

/**
 * Get color classes for error severity
 */
const getSeverityColors = (severity: ErrorSeverity) => {
  switch (severity) {
    case 'error':
      return {
        alert: 'border-red-200 bg-red-50 text-red-800',
        icon: 'text-red-600',
        button: 'bg-red-100 hover:bg-red-200 text-red-800'
      };
    case 'warning':
      return {
        alert: 'border-yellow-200 bg-yellow-50 text-yellow-800',
        icon: 'text-yellow-600',
        button: 'bg-yellow-100 hover:bg-yellow-200 text-yellow-800'
      };
    case 'info':
      return {
        alert: 'border-blue-200 bg-blue-50 text-blue-800',
        icon: 'text-blue-600',
        button: 'bg-blue-100 hover:bg-blue-200 text-blue-800'
      };
    case 'success':
      return {
        alert: 'border-green-200 bg-green-50 text-green-800',
        icon: 'text-green-600',
        button: 'bg-green-100 hover:bg-green-200 text-green-800'
      };
    default:
      return {
        alert: 'border-gray-200 bg-gray-50 text-gray-800',
        icon: 'text-gray-600',
        button: 'bg-gray-100 hover:bg-gray-200 text-gray-800'
      };
  }
};

/**
 * Enhanced error display component with multiple variants and UX improvements
 * 
 * Features:
 * - Multiple display variants (alert, card, inline, toast)
 * - Severity levels with appropriate styling
 * - Dismissible errors with smooth animations
 * - Retry functionality for recoverable errors
 * - Expandable error details for debugging
 * - Auto-hide functionality for temporary messages
 * - Copy error details to clipboard
 * - Responsive design with accessibility support
 * 
 * @param props - Error display configuration
 * @returns JSX element containing the error display
 */
export function ErrorDisplay({
  error,
  severity = 'error',
  variant = 'alert',
  title,
  dismissible = false,
  showRetry = false,
  onRetry,
  onDismiss,
  showDetails = false,
  details,
  className = '',
  autoHideTimeout
}: ErrorDisplayProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [showExpandedDetails, setShowExpandedDetails] = useState(false);
  const [copied, setCopied] = useState(false);

  // Auto-hide functionality
  useEffect(() => {
    if (autoHideTimeout && autoHideTimeout > 0) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, autoHideTimeout);

      return () => clearTimeout(timer);
    }
  }, [autoHideTimeout]);

  // Reset visibility when error changes
  useEffect(() => {
    if (error) {
      setIsVisible(true);
    }
  }, [error]);

  /**
   * Handle error dismissal with animation
   */
  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => {
      onDismiss?.();
    }, 200);
  };

  /**
   * Handle retry action
   */
  const handleRetry = () => {
    onRetry?.();
  };

  /**
   * Copy error details to clipboard
   */
  const copyErrorDetails = async () => {
    const errorText = error instanceof Error ? error.stack || error.message : String(error);
    const fullDetails = details ? `${errorText}\n\nDetails:\n${details}` : errorText;
    
    try {
      await navigator.clipboard.writeText(fullDetails);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy error details:', err);
    }
  };

  // Don't render if no error or not visible
  if (!error || !isVisible) {
    return null;
  }

  const errorMessage = error instanceof Error ? error.message : String(error);
  const Icon = getSeverityIcon(severity);
  const colors = getSeverityColors(severity);

  // Alert variant
  if (variant === 'alert') {
    return (
      <Alert 
        className={`animate-in slide-in-from-top-2 duration-300 ${colors.alert} ${className} ${
          !isVisible ? 'animate-out slide-out-to-top-2' : ''
        }`}
      >
        <Icon className={`h-4 w-4 ${colors.icon}`} />
        {title && <AlertTitle className="mb-2">{title}</AlertTitle>}
        <AlertDescription className="flex-1">
          {errorMessage}
          
          {/* Action buttons */}
          <div className="flex items-center gap-2 mt-3">
            {showRetry && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRetry}
                className={`h-8 ${colors.button} border-current`}
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Retry
              </Button>
            )}
            
            {showDetails && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowExpandedDetails(!showExpandedDetails)}
                className={`h-8 ${colors.button} border-current`}
              >
                {showExpandedDetails ? (
                  <>
                    <ChevronUp className="h-3 w-3 mr-1" />
                    Hide Details
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3 w-3 mr-1" />
                    Show Details
                  </>
                )}
              </Button>
            )}
            
            {dismissible && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                className={`h-8 ml-auto ${colors.button}`}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
          
          {/* Expanded details */}
          {showExpandedDetails && (
            <div className="mt-3 p-3 bg-black/5 rounded border border-current/20 animate-in slide-in-from-top-1 duration-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium opacity-70">Error Details</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyErrorDetails}
                  className="h-6 px-2 text-xs"
                >
                  {copied ? (
                    <>
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3 mr-1" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
              <pre className="text-xs whitespace-pre-wrap opacity-80 font-mono">
                {error instanceof Error ? error.stack || error.message : String(error)}
                {details && `\n\n${details}`}
              </pre>
            </div>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  // Card variant
  if (variant === 'card') {
    return (
      <Card className={`animate-in slide-in-from-top-2 duration-300 ${className} ${
        !isVisible ? 'animate-out slide-out-to-top-2' : ''
      }`}>
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Icon className={`h-5 w-5 mt-0.5 ${colors.icon}`} />
            <div className="flex-1">
              {title && (
                <h4 className="font-semibold mb-1">{title}</h4>
              )}
              <p className="text-sm text-muted-foreground mb-3">
                {errorMessage}
              </p>
              
              {/* Action buttons */}
              <div className="flex items-center gap-2">
                {showRetry && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRetry}
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Retry
                  </Button>
                )}
                
                {showDetails && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowExpandedDetails(!showExpandedDetails)}
                  >
                    {showExpandedDetails ? 'Hide Details' : 'Show Details'}
                  </Button>
                )}
              </div>
              
              {/* Expanded details */}
              {showExpandedDetails && (
                <div className="mt-3 p-3 bg-muted rounded border animate-in slide-in-from-top-1 duration-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-muted-foreground">Error Details</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={copyErrorDetails}
                      className="h-6 px-2 text-xs"
                    >
                      {copied ? (
                        <>
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3 mr-1" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                  <pre className="text-xs whitespace-pre-wrap text-muted-foreground font-mono">
                    {error instanceof Error ? error.stack || error.message : String(error)}
                    {details && `\n\n${details}`}
                  </pre>
                </div>
              )}
            </div>
            
            {dismissible && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Inline variant
  if (variant === 'inline') {
    return (
      <div className={`flex items-center gap-2 text-sm animate-in slide-in-from-left-1 duration-200 ${
        severity === 'error' ? 'text-red-600' : 
        severity === 'warning' ? 'text-yellow-600' : 
        severity === 'success' ? 'text-green-600' : 'text-blue-600'
      } ${className} ${!isVisible ? 'animate-out slide-out-to-left-1' : ''}`}>
        <Icon className="h-4 w-4 flex-shrink-0" />
        <span className="flex-1">{errorMessage}</span>
        
        {showRetry && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRetry}
            className="h-6 px-2 text-xs"
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
        )}
        
        {dismissible && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="h-6 w-6 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    );
  }

  // Toast variant (similar to alert but with different styling)
  return (
    <div className={`fixed top-4 right-4 z-50 max-w-md animate-in slide-in-from-right-2 duration-300 ${
      !isVisible ? 'animate-out slide-out-to-right-2' : ''
    }`}>
      <Alert className={`${colors.alert} shadow-lg ${className}`}>
        <Icon className={`h-4 w-4 ${colors.icon}`} />
        {title && <AlertTitle className="mb-2">{title}</AlertTitle>}
        <AlertDescription>
          {errorMessage}
          
          <div className="flex items-center gap-2 mt-2">
            {showRetry && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRetry}
                className={`h-7 ${colors.button} border-current`}
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Retry
              </Button>
            )}
            
            {dismissible && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                className={`h-7 ml-auto ${colors.button}`}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}