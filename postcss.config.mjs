/**
 * @fileoverview PostCSS configuration for the Polly Pro application
 * Configures CSS processing pipeline with Tailwind CSS integration
 */

/**
 * PostCSS configuration object
 * 
 * PostCSS is a tool for transforming CSS with JavaScript plugins.
 * This configuration sets up the CSS processing pipeline for the application.
 * 
 * Current setup includes:
 * - @tailwindcss/postcss: Integrates Tailwind CSS processing
 *   This plugin handles Tailwind's utility classes, component extraction,
 *   and CSS optimization during the build process.
 * 
 * Additional plugins that could be added:
 * - autoprefixer: Automatically adds vendor prefixes
 * - cssnano: Minifies CSS for production
 * - postcss-preset-env: Use modern CSS features with fallbacks
 * 
 * @see https://postcss.org/
 * @see https://tailwindcss.com/docs/using-with-preprocessors#using-post-css-as-your-preprocessor
 */
const config = {
  plugins: [
    // Tailwind CSS PostCSS plugin for processing utility classes
    "@tailwindcss/postcss",
  ],
};

export default config;
