/**
 * @fileoverview Input component with consistent styling and accessibility features
 * A flexible input component that provides consistent styling across the application
 */

import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Input component props interface
 */
interface InputProps extends React.ComponentProps<"input"> {
  /** Input type (text, email, password, etc.) */
  type?: string
}

/**
 * Styled input component with consistent design system integration
 * 
 * This component provides a consistent input interface across the application
 * with built-in styling for different states (focus, disabled, invalid, etc.)
 * and full accessibility support including ARIA attributes.
 * 
 * Features:
 * - Consistent styling with design system colors and spacing
 * - Focus ring with proper contrast ratios
 * - Error state styling with destructive colors
 * - File input styling support
 * - Disabled state handling
 * - Dark mode support
 * - Responsive text sizing
 * 
 * @param className - Additional CSS classes to apply
 * @param type - Input type (defaults to "text")
 * @param props - All other standard input props (value, onChange, placeholder, etc.)
 * 
 * @example
 * ```tsx
 * // Basic text input
 * <Input 
 *   placeholder="Enter your name" 
 *   value={name}
 *   onChange={(e) => setName(e.target.value)}
 * />
 * 
 * // Email input with validation
 * <Input 
 *   type="email"
 *   placeholder="Enter your email"
 *   aria-invalid={emailError ? "true" : "false"}
 *   value={email}
 *   onChange={handleEmailChange}
 * />
 * 
 * // Password input
 * <Input 
 *   type="password"
 *   placeholder="Enter your password"
 *   value={password}
 *   onChange={(e) => setPassword(e.target.value)}
 * />
 * 
 * // Disabled input
 * <Input 
 *   value="Read-only value"
 *   disabled
 * />
 * ```
 */
function Input({ className, type, ...props }: InputProps) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        // Base styles for all inputs
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        // Focus state styles
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        // Error/invalid state styles
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  )
}

export { Input }
