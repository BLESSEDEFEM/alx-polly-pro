'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Edit3 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';

export default function EditPollPage() {
  const router = useRouter();
  const params = useParams();
  const pollId = typeof params?.id === 'string' ? params.id : Array.isArray(params?.id) ? params.id[0] : '';
  const { user, isLoading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [pollCategory, setPollCategory] = useState('general');
  const [isActive, setIsActive] = useState(true);
  const [allowMultipleVotes, setAllowMultipleVotes] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [expiresAt, setExpiresAt] = useState<string>('');

  useEffect(() => {
    const fetchPoll = async () => {
      if (!pollId) return;
      try {
        setError(null);
        setLoading(true);

        const { data: poll, error: pollError } = await supabase
          .from('polls')
          .select('*')
          .eq('id', pollId)
          .single();

        if (pollError) {
          setError(pollError.message);
          return;
        }

        if (!poll) {
          setError('Poll not found');
          return;
        }

        // Populate form fields
        setTitle(poll.title || '');
        setDescription(poll.description || '');
        setPollCategory(poll.poll_category || 'general');
        setIsActive(!!poll.is_active);
        setAllowMultipleVotes(!!poll.allow_multiple_votes);
        setIsAnonymous(!!poll.is_anonymous);
        setExpiresAt(poll.expires_at ? new Date(poll.expires_at).toISOString().slice(0, 16) : '');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load poll');
      } finally {
        setLoading(false);
      }
    };

    fetchPoll();
  }, [pollId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pollId) return;
    try {
      setSaving(true);
      setError(null);

      const updates: any = {
        title: title.trim(),
        description: description.trim(),
        poll_category: pollCategory,
        is_active: isActive,
        allow_multiple_votes: allowMultipleVotes,
        is_anonymous: isAnonymous,
      };

      if (expiresAt) {
        const date = new Date(expiresAt);
        if (!isNaN(date.getTime())) {
          updates.expires_at = date.toISOString();
        }
      } else {
        updates.expires_at = null;
      }

      const { error: updateError } = await supabase
        .from('polls')
        .update(updates)
        .eq('id', pollId);

      if (updateError) {
        setError(updateError.message);
        return;
      }

      router.push(`/polls/${pollId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save poll');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Unauthorized</CardTitle>
            <CardDescription>Please log in to edit polls.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/auth/login?redirectTo=' + encodeURIComponent(`/polls/${pollId}/edit`))}>
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Edit3 className="h-5 w-5" />
            Edit Poll
          </CardTitle>
          <CardDescription>Update poll details. Options editing is coming soon.</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSave} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={pollCategory} onValueChange={(v) => setPollCategory(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="tech">Tech</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox id="active" checked={isActive} onCheckedChange={(c) => setIsActive(!!c)} />
                <Label htmlFor="active">Active</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="multiple" checked={allowMultipleVotes} onCheckedChange={(c) => setAllowMultipleVotes(!!c)} />
                <Label htmlFor="multiple">Allow multiple votes</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="anonymous" checked={isAnonymous} onCheckedChange={(c) => setIsAnonymous(!!c)} />
                <Label htmlFor="anonymous">Anonymous poll</Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expires">Expires At (optional)</Label>
              <Input id="expires" type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
            </div>

            <div className="flex gap-4">
              <Button type="button" variant="outline" onClick={() => router.back()} disabled={saving}>Cancel</Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}