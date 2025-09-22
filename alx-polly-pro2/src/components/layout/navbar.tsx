'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { AuthForm } from '@/components/auth/auth-form'
import { BarChart3, LogOut, Plus } from 'lucide-react'

export function Navbar() {
  const { user, profile, signOut, loading } = useAuth()
  const [authDialogOpen, setAuthDialogOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
  }

  const getInitials = (name?: string) => {
    if (!name) return 'U'
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <BarChart3 className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">Polly Pro</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="/"
              className="text-foreground/60 hover:text-foreground transition-colors"
            >
              Home
            </Link>
            {user && (
              <>
                <Link
                  href="/dashboard"
                  className="text-foreground/60 hover:text-foreground transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  href="/polls/create"
                  className="text-foreground/60 hover:text-foreground transition-colors"
                >
                  Create Poll
                </Link>
              </>
            )}
          </div>

          {/* Auth Section */}
          <div className="flex items-center space-x-4">
            {loading ? (
              <div className="h-8 w-8 animate-pulse bg-muted rounded-full" />
            ) : user ? (
              <div className="flex items-center gap-4">
                <nav className="hidden md:flex items-center gap-4">
                  <Link 
                    href="/dashboard" 
                    className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    Dashboard
                  </Link>
                  <Link 
                    href="/polls/create" 
                    className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    Create Poll
                  </Link>
                </nav>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.user_metadata?.avatar_url} />
                        <AvatarFallback>
                          {getInitials(user.user_metadata?.full_name || user.email || 'User')}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {user.user_metadata?.full_name || 'User'}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild className="md:hidden">
                      <Link href="/dashboard">
                        <BarChart3 className="mr-2 h-4 w-4" />
                        <span>Dashboard</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="md:hidden">
                      <Link href="/polls/create">
                        <Plus className="mr-2 h-4 w-4" />
                        <span>Create Poll</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="md:hidden" />
                    <DropdownMenuItem onClick={handleSignOut} disabled={loading}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>{loading ? 'Signing out...' : 'Sign out'}</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <Dialog open={authDialogOpen} onOpenChange={setAuthDialogOpen}>
                <DialogTrigger asChild>
                  <Button>Sign In</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <AuthForm onSuccess={() => setAuthDialogOpen(false)} />
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}