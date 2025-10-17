/**
 * @fileoverview Enhanced form field component with validation feedback and UX improvements
 * Provides consistent form field styling and behavior across the application
 */

'use client';

import { forwardRef, useState, useId } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  Info,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Field validation state
 */
export type FieldState = 'default' | 'success' | 'error' | 'warning';

/**
 * Field type variants
 */
export type FieldType = 'text' | 'email' | 'password' | 'textarea' | 'number' | 'tel' | 'url';

/**
 * Form field props interface
 */
interface FormFieldProps {
  /** Field label */
  label?: string;
  /** Field type */
  type?: FieldType;
  /** Field placeholder */
  placeholder?: string;
  /** Field value */
  value?: string;
  /** Change handler */
  onChange?: (value: string) => void;
  /** Blur handler */
  onBlur?: () => void;
  /** Focus handler */
  onFocus?: () => void;
  /** Field validation state */
  state?: FieldState;
  /** Error message */
  error?: string;
  /** Success message */
  success?: string;
  /** Warning message */
  warning?: string;
  /** Help text */
  help?: string;
  /** Whether field is required */
  required?: boolean;
  /** Whether field is disabled */
  disabled?: boolean;
  /** Whether field is loading */
  loading?: boolean;
  /** Maximum length */
  maxLength?: number;
  /** Minimum length */
  minLength?: number;
  /** Whether to show character count */
  showCount?: boolean;
  /** Custom validation pattern */
  pattern?: string;
  /** Textarea rows (for textarea type) */
  rows?: number;
  /** Whether textarea is resizable */
  resizable?: boolean;
  /** Custom className */
  className?: string;
  /** Field ID (auto-generated if not provided) */
  id?: string;
  /** Icon to display */
  icon?: React.ReactNode;
  /** Whether to show password toggle (for password type) */
  showPasswordToggle?: boolean;
}

/**
 * Get state colors and icons
 */
const getStateStyles = (state: FieldState) => {
  switch (state) {
    case 'success':
      return {
        border: 'border-green-500 focus:border-green-500 focus:ring-green-500',
        icon: CheckCircle2,
        iconColor: 'text-green-500',
        message: 'text-green-600'
      };
    case 'error':
      return {
        border: 'border-red-500 focus:border-red-500 focus:ring-red-500',
        icon: AlertCircle,
        iconColor: 'text-red-500',
        message: 'text-red-600'
      };
    case 'warning':
      return {
        border: 'border-yellow-500 focus:border-yellow-500 focus:ring-yellow-500',
        icon: AlertCircle,
        iconColor: 'text-yellow-500',
        message: 'text-yellow-600'
      };
    default:
      return {
        border: '',
        icon: null,
        iconColor: '',
        message: 'text-muted-foreground'
      };
  }
};

/**
 * Enhanced form field component with validation feedback and UX improvements
 * 
 * Features:
 * - Multiple field types with appropriate validation
 * - Real-time validation feedback with visual cues
 * - Character count display for length-limited fields
 * - Password visibility toggle for password fields
 * - Loading states with spinner indicators
 * - Accessible labels and error associations
 * - Consistent styling across all field types
 * - Help text and validation messages
 * - Smooth animations and transitions
 * 
 * @param props - Form field configuration
 * @returns JSX element containing the enhanced form field
 */
export const FormField = forwardRef<HTMLInputElement | HTMLTextAreaElement, FormFieldProps>(
  ({
    label,
    type = 'text',
    placeholder,
    value = '',
    onChange,
    onBlur,
    onFocus,
    state = 'default',
    error,
    success,
    warning,
    help,
    required = false,
    disabled = false,
    loading = false,
    maxLength,
    minLength,
    showCount = false,
    pattern,
    rows = 3,
    resizable = true,
    className = '',
    id: providedId,
    icon,
    showPasswordToggle = true,
    ...props
  }, ref) => {
    const generatedId = useId();
    const fieldId = providedId || generatedId;
    const [showPassword, setShowPassword] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    const styles = getStateStyles(state);
    const StateIcon = styles.icon;

    // Determine the actual input type
    const inputType = type === 'password' && showPassword ? 'text' : type;

    // Get the appropriate message to display
    const message = error || warning || success || help;
    const messageType = error ? 'error' : warning ? 'warning' : success ? 'success' : 'help';

    /**
     * Handle input change
     */
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      onChange?.(e.target.value);
    };

    /**
     * Handle focus
     */
    const handleFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setIsFocused(true);
      onFocus?.();
    };

    /**
     * Handle blur
     */
    const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setIsFocused(false);
      onBlur?.();
    };

    /**
     * Toggle password visibility
     */
    const togglePasswordVisibility = () => {
      setShowPassword(!showPassword);
    };

    // Common input props
    const commonProps = {
      id: fieldId,
      value,
      onChange: handleChange,
      onFocus: handleFocus,
      onBlur: handleBlur,
      disabled: disabled || loading,
      placeholder,
      maxLength,
      minLength,
      pattern,
      required,
      'aria-invalid': state === 'error',
      'aria-describedby': message ? `${fieldId}-message` : undefined,
      className: cn(
        'transition-all duration-200',
        styles.border,
        isFocused && 'ring-2 ring-offset-2',
        loading && 'cursor-wait',
        className
      )
    };

    return (
      <div className="space-y-2">
        {/* Label */}
        {label && (
          <Label 
            htmlFor={fieldId}
            className={cn(
              'text-sm font-medium flex items-center gap-2',
              disabled && 'opacity-50'
            )}
          >
            {icon && <span className="text-muted-foreground">{icon}</span>}
            {label}
            {required && <span className="text-red-500">*</span>}
            {loading && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
          </Label>
        )}

        {/* Input Field */}
        <div className="relative">
          {type === 'textarea' ? (
            <Textarea
              {...commonProps}
              ref={ref as React.Ref<HTMLTextAreaElement>}
              rows={rows}
              className={cn(
                commonProps.className,
                !resizable && 'resize-none'
              )}
            />
          ) : (
            <Input
              {...commonProps}
              type={inputType}
              ref={ref as React.Ref<HTMLInputElement>}
            />
          )}

          {/* Right-side icons */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {/* Loading spinner */}
            {loading && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}

            {/* State icon */}
            {StateIcon && !loading && (
              <StateIcon className={cn('h-4 w-4', styles.iconColor)} />
            )}

            {/* Password toggle */}
            {type === 'password' && showPasswordToggle && !loading && (
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Character count */}
        {showCount && maxLength && (
          <div className="flex justify-end">
            <span className={cn(
              'text-xs transition-colors',
              value.length > maxLength * 0.9 ? 'text-yellow-600' : 'text-muted-foreground',
              value.length >= maxLength ? 'text-red-600' : ''
            )}>
              {value.length}/{maxLength}
            </span>
          </div>
        )}

        {/* Message */}
        {message && (
          <div 
            id={`${fieldId}-message`}
            className={cn(
              'text-sm animate-in slide-in-from-top-1 duration-200 flex items-start gap-2',
              styles.message
            )}
          >
            {messageType === 'help' && <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />}
            <span>{message}</span>
          </div>
        )}
      </div>
    );
  }
);

FormField.displayName = 'FormField';