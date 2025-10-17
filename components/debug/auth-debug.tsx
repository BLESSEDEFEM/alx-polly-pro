'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export function AuthDebug() {
  const { user, session, refreshSession } = useAuth();
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const checkServerAuth = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/debug');
      const data = await response.json();
      setApiResponse(data);
    } catch (error) {
      console.error('Error checking server auth:', error);
      setApiResponse({ error: 'Failed to fetch' });
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshSession = async () => {
    setLoading(true);
    try {
      await refreshSession();
      console.log('Session refreshed manually');
    } catch (error) {
      console.error('Error refreshing session:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Auth Debug</CardTitle>
        <CardDescription>Check authentication state</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Client State:</h3>
          <div className="bg-muted p-3 rounded-md text-xs overflow-auto max-h-40">
            <pre>
              {JSON.stringify(
                {
                  authenticated: !!user,
                  user: user ? {
                    id: user.id,
                    email: user.email,
                  } : null,
                  session: session ? {
                    expires_at: session.expires_at,
                  } : null,
                },
                null,
                2
              )}
            </pre>
          </div>
        </div>

        {apiResponse && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Server State:</h3>
            <div className="bg-muted p-3 rounded-md text-xs overflow-auto max-h-40">
              <pre>{JSON.stringify(apiResponse, null, 2)}</pre>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={checkServerAuth}
          disabled={loading}
        >
          {loading ? 'Checking...' : 'Check Server Auth'}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefreshSession}
          disabled={loading}
        >
          {loading ? 'Refreshing...' : 'Refresh Session'}
        </Button>
      </CardFooter>
    </Card>
  );
}