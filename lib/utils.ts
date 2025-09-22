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

/**
 * Cookie utility functions for client-side cookie management
 * These functions provide a simple interface for reading, writing, and deleting cookies
 */

/**
 * Gets a cookie value by name
 * @param name - The name of the cookie to retrieve
 * @returns The cookie value or null if not found
 */
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    const cookieValue = parts.pop()?.split(';').shift();
    return cookieValue ? decodeURIComponent(cookieValue) : null;
  }
  return null;
}

/**
 * Sets a cookie with the specified name, value, and options
 * @param name - The name of the cookie
 * @param value - The value to store
 * @param options - Cookie options (path, maxAge, etc.)
 */
export function setCookie(name: string, value: string, options: {
  path?: string;
  maxAge?: number;
  expires?: Date;
  domain?: string;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
} = {}): void {
  if (typeof document === 'undefined') return;
  
  let cookieString = `${name}=${encodeURIComponent(value)}`;
  
  if (options.path) cookieString += `; path=${options.path}`;
  if (options.maxAge) cookieString += `; max-age=${options.maxAge}`;
  if (options.expires) cookieString += `; expires=${options.expires.toUTCString()}`;
  if (options.domain) cookieString += `; domain=${options.domain}`;
  if (options.secure) cookieString += `; secure`;
  if (options.sameSite) cookieString += `; samesite=${options.sameSite}`;
  
  document.cookie = cookieString;
}

/**
 * Deletes a cookie by setting its expiration date to the past
 * @param name - The name of the cookie to delete
 * @param options - Cookie options (path, domain) that should match the original cookie
 */
export function deleteCookie(name: string, options: {
  path?: string;
  domain?: string;
} = {}): void {
  if (typeof document === 'undefined') return;
  
  setCookie(name, '', {
    ...options,
    expires: new Date(0)
  });
}
