/**
 * @fileoverview Root layout component for the Polly Pro application
 * Provides the main HTML structure, metadata, and global providers for the entire app
 */

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { AuthProvider } from "@/components/providers/auth-provider";

/**
 * Primary font configuration using Geist Sans
 * 
 * Geist Sans is a modern, clean typeface optimized for digital interfaces.
 * The variable font format allows for better performance and flexibility.
 */
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

/**
 * Monospace font configuration using Geist Mono
 * 
 * Geist Mono is used for code blocks, technical content, and other
 * monospace text requirements throughout the application.
 */
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/**
 * Application metadata configuration
 * 
 * Defines SEO metadata, Open Graph tags, Twitter cards, and other
 * meta information for the entire application. This serves as the
 * default metadata that can be overridden by individual pages.
 */
export const metadata: Metadata = {
  title: "Polly Pro - Create Engaging Polls",
  description: "Create engaging polls and gather valuable insights from your audience with Polly Pro. Easy-to-use polling platform for everyone.",
  keywords: ["polls", "voting", "surveys", "feedback", "opinions"],
  authors: [{ name: "Polly Pro Team" }],
  creator: "Polly Pro",
  publisher: "Polly Pro",
  openGraph: {
    title: "Polly Pro - Create Engaging Polls",
    description: "Create engaging polls and gather valuable insights from your audience with Polly Pro.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Polly Pro - Create Engaging Polls",
    description: "Create engaging polls and gather valuable insights from your audience with Polly Pro.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

/**
 * Root layout component for the entire application
 * 
 * This component wraps all pages and provides:
 * - HTML document structure with proper lang attribute
 * - Font variable CSS custom properties for consistent typography
 * - Global CSS classes for antialiasing and layout
 * - Authentication context provider for user state management
 * - Navigation bar and footer components
 * - Main content area with flex layout for proper footer positioning
 * 
 * The layout uses a flex column approach to ensure the footer stays
 * at the bottom of the viewport even with minimal content.
 * 
 * @param children - The page content to be rendered within the layout
 * @returns JSX element containing the complete HTML document structure
 * 
 * @example
 * ```tsx
 * // This layout automatically wraps all pages in the app directory
 * // Individual pages are rendered as children:
 * 
 * // app/page.tsx
 * export default function HomePage() {
 *   return <div>Home page content</div>;
 * }
 * 
 * // Results in:
 * // <html>
 * //   <body>
 * //     <AuthProvider>
 * //       <Navbar />
 * //       <main>
 * //         <div>Home page content</div>
 * //       </main>
 * //       <Footer />
 * //     </AuthProvider>
 * //   </body>
 * // </html>
 * ```
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        {/* Authentication provider wraps the entire app to provide user context */}
        <AuthProvider>
          {/* Global navigation bar */}
          <Navbar />
          
          {/* Main content area with flex-1 to fill available space */}
          <main className="flex-1">
            {children}
          </main>
          
          {/* Global footer */}
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
