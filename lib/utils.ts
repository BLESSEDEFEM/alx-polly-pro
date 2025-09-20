/**
 * @fileoverview Utility functions for the Polly Pro application
 * Contains helper functions for styling, data manipulation, and common operations
 */

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combines and merges CSS class names using clsx and tailwind-merge
 * 
 * This utility function is essential for conditional styling in React components.
 * It combines multiple class values and intelligently merges Tailwind CSS classes,
 * resolving conflicts by keeping the last conflicting class.
 * 
 * @param inputs - Variable number of class values (strings, objects, arrays, etc.)
 * @returns A single string of merged CSS classes
 * 
 * @example
 * ```tsx
 * // Basic usage
 * cn("px-4 py-2", "bg-blue-500") // "px-4 py-2 bg-blue-500"
 * 
 * // Conditional classes
 * cn("px-4 py-2", isActive && "bg-blue-500") // "px-4 py-2 bg-blue-500" if isActive is true
 * 
 * // Tailwind conflict resolution
 * cn("px-4", "px-6") // "px-6" (last px- class wins)
 * 
 * // Complex conditional styling
 * cn(
 *   "base-class",
 *   {
 *     "active-class": isActive,
 *     "disabled-class": isDisabled
 *   },
 *   variant === "primary" && "primary-styles"
 * )
 * ```
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
