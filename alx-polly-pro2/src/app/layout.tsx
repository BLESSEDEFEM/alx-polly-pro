import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from '@/hooks/use-auth';
import { Navbar } from '@/components/layout/navbar';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Polly Pro - Professional Polling Platform",
  description: "Create, share, and analyze polls with advanced features and real-time results",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <Navbar />
          <main className="min-h-screen bg-gray-50">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
