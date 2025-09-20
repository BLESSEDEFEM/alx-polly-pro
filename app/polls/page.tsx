/**
 * @fileoverview Polls listing page component
 * Displays all available polls in a paginated list format with filtering and search capabilities
 */

import { PollList } from '@/components/polls/poll-list';

/**
 * Polls page component
 * 
 * A dedicated page that displays all available polls in the system.
 * Features a clean layout with the PollList component that handles poll display,
 * filtering, searching, and pagination functionality.
 * 
 * The page structure includes:
 * - Page header with title and description
 * - PollList component for poll management and display
 * - Responsive layout that works on all device sizes
 * 
 * @returns JSX element containing the polls listing page layout
 * 
 * @example
 * ```tsx
 * // This page is automatically rendered at "/polls"
 * // Users can browse, search, and filter through all available polls
 * ```
 */
export default function PollsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page header with title and description */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">All Polls</h1>
        <p className="text-gray-600">
          Browse through all available polls, vote on your favorites, and see real-time results.
        </p>
      </div>
      
      {/* Poll list component handles display, filtering, and pagination */}
      <PollList />
    </div>
  );
}

/**
 * Page metadata for SEO and browser display
 * 
 * Defines the page title and description for search engines and browser tabs.
 * This metadata helps with SEO and provides context when the page is shared.
 */
export const metadata = {
  title: 'All Polls - Polly Pro',
  description: 'Browse and participate in polls on Polly Pro. Vote on your favorite topics and see real-time results.',
};