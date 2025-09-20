/**
 * @fileoverview Next.js configuration file for the Polly Pro application
 * Defines build settings, optimizations, and runtime behavior for the Next.js application
 */

import type { NextConfig } from "next";

/**
 * Next.js configuration object
 * 
 * This configuration controls various aspects of the Next.js application including:
 * - Build optimizations and performance settings
 * - Runtime behavior and feature flags
 * - Asset handling and static file serving
 * - Development and production environment settings
 * 
 * Currently using default settings, but can be extended with:
 * - Image optimization settings
 * - Custom webpack configurations
 * - Environment variable handling
 * - API route configurations
 * - Internationalization settings
 * - And many other Next.js features
 * 
 * @see https://nextjs.org/docs/app/api-reference/next-config-js
 */
const nextConfig: NextConfig = {
  /* 
   * Add custom configuration options here as needed:
   * 
   * Example configurations:
   * - images: { domains: ['example.com'] } // External image domains
   * - experimental: { appDir: true } // Enable experimental features
   * - env: { CUSTOM_KEY: 'value' } // Custom environment variables
   * - redirects: async () => [...] // URL redirects
   * - rewrites: async () => [...] // URL rewrites
   */
};

export default nextConfig;
