'use client'

import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AuthForm } from '@/components/auth/auth-form'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { BarChart3, Users, Vote, Zap, ArrowRight, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

export default function HomePage() {
  const { user, loading } = useAuth()
  const [authDialogOpen, setAuthDialogOpen] = useState(false)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary/10 via-background to-secondary/10">
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              Create Powerful Polls with{' '}
              <span className="text-primary">Polly Pro</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Build engaging polls, collect valuable insights, and make data-driven decisions 
              with our professional polling platform.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              {user ? (
                <Button asChild size="lg" className="text-lg px-8 py-6">
                  <Link href="/dashboard">
                    Go to Dashboard
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              ) : (
                <Dialog open={authDialogOpen} onOpenChange={setAuthDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="lg" className="text-lg px-8 py-6">
                      Get Started Free
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <AuthForm onSuccess={() => setAuthDialogOpen(false)} />
                  </DialogContent>
                </Dialog>
              )}
              
              <Button variant="outline" size="lg" className="text-lg px-8 py-6" asChild>
                <Link href="/demo">
                  View Demo
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Why Choose Polly Pro?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need to create, share, and analyze polls professionally
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Quick & Easy</CardTitle>
                <CardDescription>
                  Create professional polls in minutes with our intuitive interface
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Real-time Analytics</CardTitle>
                <CardDescription>
                  Watch results update live with beautiful charts and insights
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Easy Sharing</CardTitle>
                <CardDescription>
                  Share polls via unique URLs or QR codes for maximum reach
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Vote className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Secure Voting</CardTitle>
                <CardDescription>
                  Prevent duplicate votes and ensure data integrity
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <CheckCircle className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Multiple Options</CardTitle>
                <CardDescription>
                  Support for multiple choice questions and custom options
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Export Results</CardTitle>
                <CardDescription>
                  Download results in various formats for further analysis
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-primary/5">
        <div className="container mx-auto text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Ready to Start Polling?
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join thousands of users who trust Polly Pro for their polling needs
            </p>
            
            {user ? (
              <Button asChild size="lg" className="text-lg px-8 py-6">
                <Link href="/polls/create">
                  Create Your First Poll
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            ) : (
              <Dialog open={authDialogOpen} onOpenChange={setAuthDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="lg" className="text-lg px-8 py-6">
                    Sign Up Now - It's Free!
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <AuthForm onSuccess={() => setAuthDialogOpen(false)} />
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <BarChart3 className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold">Polly Pro</span>
          </div>
          <p className="text-muted-foreground">
            © 2024 Polly Pro. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
