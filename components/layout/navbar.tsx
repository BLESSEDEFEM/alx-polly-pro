'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const isActivePath = (path: string) => {
    return pathname === path || pathname.startsWith(path + '/');
  };

  const navLinks = [
    { href: '/polls', label: 'Polls', requiresAuth: false },
    { href: '/polls/create', label: 'Create Poll', requiresAuth: true },
    { href: '/dashboard', label: 'Dashboard', requiresAuth: true },
  ];

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">P</span>
            </div>
            <span className="text-xl font-bold text-gray-900">Polly Pro</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => {
              if (link.requiresAuth && !isAuthenticated) return null;
              
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-medium transition-colors hover:text-blue-600 ${
                    isActivePath(link.href)
                      ? 'text-blue-600 border-b-2 border-blue-600 pb-4'
                      : 'text-gray-700'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">
                  Welcome, {user?.name}
                </span>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push('/auth/login')}
                >
                  Sign In
                </Button>
                <Button
                  size="sm"
                  onClick={() => router.push('/auth/register')}
                >
                  Sign Up
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isMobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <div className="space-y-4">
              {navLinks.map((link) => {
                if (link.requiresAuth && !isAuthenticated) return null;
                
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`block text-sm font-medium transition-colors hover:text-blue-600 ${
                      isActivePath(link.href) ? 'text-blue-600' : 'text-gray-700'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                );
              })}
              
              <div className="pt-4 border-t border-gray-200">
                {isAuthenticated ? (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      Welcome, {user?.name}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleLogout}
                      className="w-full"
                    >
                      Sign Out
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        router.push('/auth/login');
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full"
                    >
                      Sign In
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        router.push('/auth/register');
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full"
                    >
                      Sign Up
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}