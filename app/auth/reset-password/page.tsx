'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isRecovery, setIsRecovery] = useState(false);
  const loadingTimerRef = useRef<number | null>(null);

  // Utility: race an operation against a timeout to prevent stuck UI
  async function withTimeout<T>(promise: Promise<T>, ms: number, label = 'Operation'): Promise<T> {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`${label} timed out`)), ms)),
    ]);
  }

  // Detect recovery mode from hash fragment
  useEffect(() => {
    // Supabase may use hash params (#type=recovery) or PKCE query (?code=...)
    const hash = typeof window !== 'undefined' ? window.location.hash : '';
    const hashParams = new URLSearchParams(hash.replace('#', ''));
    const type = hashParams.get('type');

    const search = typeof window !== 'undefined' ? window.location.search : '';
    const searchParamsLocal = new URLSearchParams(search);
    const hasCode = !!searchParamsLocal.get('code');
    const errorParam = searchParamsLocal.get('error');

    setIsRecovery(type === 'recovery' || hasCode);

    // Surface server-side confirmation errors, if any
    if (errorParam) {
      setError(decodeURIComponent(errorParam));
    }

    // If PKCE-style recovery (?code=...), exchange it for a session so updateUser works reliably
    const code = searchParamsLocal.get('code');
    if (code) {
      // Prefer server-side confirmation to avoid PKCE code_verifier issues
      const nextPath = '/auth/reset-password';
      const confirmUrl = `${window.location.origin}/auth/confirm?code=${encodeURIComponent(
        code
      )}&next=${encodeURIComponent(nextPath)}`;
      try {
        window.location.replace(confirmUrl);
      } catch (_) {
        // If navigation fails for some reason, keep UI responsive; submit flow has fallbacks
      }
    }

    // Also support token-based recovery links with hash (#access_token, #refresh_token)
    const accessToken = hashParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token');
    if (accessToken && refreshToken) {
      withTimeout(
        supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken }),
        8000,
        'Set recovery session'
      )
        .then(() => setIsRecovery(true))
        .catch(() => {
          // Non-blocking; we will detect missing session at submit time
        });
    }
  }, [searchParams]);

  // Also detect recovery via Supabase auth state (more reliable across browsers)
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        setIsRecovery(true);
      }
    });
    return () => {
      try {
        authListener.subscription.unsubscribe();
      } catch (_) {
        // no-op
      }
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!newPassword || newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Ensure this page was opened via the email recovery link
    // Removed recovery check to allow direct password resets
    setIsLoading(true);
    // Fallback: ensure loading state clears even if network hangs
    if (typeof window !== 'undefined') {
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current);
      }
      loadingTimerRef.current = window.setTimeout(() => {
        setIsLoading(false);
        loadingTimerRef.current = null;
      }, 15000);
    }
    try {
      // Ensure we have a valid recovery session before attempting password update
      const { data: sessionDataBefore } = await supabase.auth.getSession();
      let activeSession = sessionDataBefore.session;

      if (!activeSession) {
        // Try to exchange PKCE code if present
        const search = typeof window !== 'undefined' ? window.location.search : '';
        const searchParamsLocal = new URLSearchParams(search);
        const code = searchParamsLocal.get('code');
        if (code) {
          try {
            await withTimeout(
              supabase.auth.exchangeCodeForSession(code),
              8000,
              'Exchange code for session'
            );
          } catch (ex) {
            // Non-blocking: we'll check session again and surface a clean error if still missing
          }
        }

        // Try to set session from hash tokens if available
        const hash = typeof window !== 'undefined' ? window.location.hash : '';
        const hashParams = new URLSearchParams(hash.replace('#', ''));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        if (accessToken && refreshToken) {
          try {
            await withTimeout(
              supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken }),
              8000,
              'Set recovery session'
            );
          } catch (_) {
            // ignore
          }
        }

        // Fallback: verify recovery token if provided (token_hash + email)
        const tokenHash = searchParamsLocal.get('token_hash') || hashParams.get('token_hash');
        const recoveryEmail = searchParamsLocal.get('email') || hashParams.get('email');
        if (!activeSession && tokenHash && recoveryEmail) {
          try {
            await withTimeout(
              supabase.auth.verifyOtp({ type: 'recovery', token: tokenHash, email: recoveryEmail }),
              8000,
              'Verify recovery token'
            );
          } catch (verifyErr) {
            console.warn('Recovery token verification failed:', verifyErr);
          }
        }

        const { data: sessionDataAfter } = await supabase.auth.getSession();
        activeSession = sessionDataAfter.session;
      }

      // Final attempt: if still no session, try once more to exchange code and wait briefly
      if (!activeSession) {
        const search = typeof window !== 'undefined' ? window.location.search : '';
        const searchParamsLocal = new URLSearchParams(search);
        const code = searchParamsLocal.get('code');
        if (code) {
          try {
            await withTimeout(supabase.auth.exchangeCodeForSession(code), 8000, 'Exchange code for session (final)');
          } catch (_) {
            // ignore
          }
        }

        // Poll briefly for a session
        const start = Date.now();
        while (Date.now() - start < 2500) {
          const { data } = await supabase.auth.getSession();
          if (data?.session) {
            activeSession = data.session;
            break;
          }
          await new Promise((r) => setTimeout(r, 150));
        }
      }

      if (!activeSession) {
        setError('Recovery session missing or expired. Please click the reset link again or request a new email.');
        setIsLoading(false);
        return;
      }

      console.log('Proceeding with password update with valid recovery session');

      // Update the user's password with direct approach
      console.log('Attempting to update password directly');
      try {
        const { error: updateError, data: updateData } = await supabase.auth.updateUser({ 
          password: newPassword 
        });

        if (updateError) {
          const msg = updateError.message || 'Failed to update password';
          console.error('Password update error:', msg);
          setError(msg);
          setIsLoading(false);
        } else {
          console.log('Password updated successfully', updateData);
          
          // Make success message more visible and prominent
          setSuccess('✅ PASSWORD UPDATED SUCCESSFULLY! Redirecting to login page...');
          
          // Show an alert to ensure user sees the success message
          alert('Password updated successfully! You will be redirected to the login page.');
          
          // Force redirect immediately
          console.log('Redirecting to login page now');
          window.location.href = '/auth/login';
        }
      } catch (innerErr) {
        console.error('Inner error during password update:', innerErr);
        setError('Unexpected error during password update. Please try again.');
        setIsLoading(false);
      }
    } catch (err) {
      const raw = err instanceof Error ? err.message : 'Failed to update password';
      const friendly = raw.includes('timed out')
        ? 'Password update is taking longer than expected. Please check your connection and try again.'
        : raw;
      setError(friendly);
    } finally {
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current);
        loadingTimerRef.current = null;
      }
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Polly Pro</h1>
          <p className="mt-2 text-gray-600">Set a new password</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Reset Password</CardTitle>
            <CardDescription>
              {isRecovery ? 'Enter your new password below.' : 'Follow the email link to reset.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {success && (
              <Alert className="mb-4">
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">New password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter a new password"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your new password"
                  required
                />
              </div>
              {/* Enable the button based on input validation; enforce recovery in submit */}
              <Button
                type="submit"
                disabled={
                  isLoading ||
                  !newPassword ||
                  newPassword.length < 6 ||
                  newPassword !== confirmPassword
                }
                className="w-full"
              >
                {isLoading ? 'Updating...' : 'Update Password'}
              </Button>
            </form>

            <div className="mt-4 text-sm text-center">
              <Link href="/auth/login" className="text-blue-600 hover:underline">
                Back to login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}