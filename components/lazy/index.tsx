/**
 * @fileoverview Lazy loading utilities for performance optimization
 * Provides dynamic imports for heavy components to improve initial bundle size
 */

import { lazy } from 'react';

/**
 * Lazy loaded dashboard analytics component
 * Heavy component with chart libraries - loaded only when needed
 */
export const DashboardAnalytics = lazy(() => 
  import('@/components/charts/dashboard-analytics').then(module => ({
    default: module.DashboardAnalytics
  }))
);

/**
 * Lazy loaded user management component
 * Admin-only component - loaded only when needed
 */
export const UserManagement = lazy(() => 
  import('@/components/admin/user-management').then(module => ({
    default: module.UserManagement
  }))
);

/**
 * Lazy loaded poll results chart component
 * Chart component with heavy dependencies - loaded only when needed
 */
export const PollResultsChart = lazy(() => 
  import('@/components/charts/poll-results-chart').then(module => ({
    default: module.PollResultsChart
  }))
);

/**
 * Lazy loaded animated container component
 * Animation component with complex logic - loaded only when needed
 */
export const AnimatedContainer = lazy(() => 
  import('@/components/ui/animated-container').then(module => ({
    default: module.AnimatedContainer
  }))
);