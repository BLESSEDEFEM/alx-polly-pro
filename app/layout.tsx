import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { AuthProvider } from "@/components/providers/auth-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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
        <AuthProvider>
          <Navbar />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
