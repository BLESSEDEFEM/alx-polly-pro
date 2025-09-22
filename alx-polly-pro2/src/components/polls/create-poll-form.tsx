'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, X, Calendar, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePolls } from '@/hooks/use-polls';
import { useAuth } from '@/hooks/use-auth';

const createPollSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  options: z.array(
    z.object({
      text: z.string().min(1, 'Option text is required').max(200, 'Option too long')
    })
  ).min(2, 'At least 2 options required').max(10, 'Maximum 10 options allowed'),
  is_public: z.boolean().default(true),
  allow_multiple_votes: z.boolean().default(false),
  expires_at: z.string().optional(),
});

type CreatePollFormData = z.infer<typeof createPollSchema>;

interface CreatePollFormProps {
  onSuccess?: (pollSlug: string) => void;
  onCancel?: () => void;
}

export function CreatePollForm({ onSuccess, onCancel }: CreatePollFormProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { createPoll, loading } = usePolls();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
  } = useForm<CreatePollFormData>({
    resolver: zodResolver(createPollSchema),
    defaultValues: {
      title: '',
      description: '',
      options: [{ text: '' }, { text: '' }],
      is_public: true,
      allow_multiple_votes: false,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'options',
  });

  const watchedOptions = watch('options');

  const onSubmit = async (data: CreatePollFormData) => {
    if (!user) {
      setSubmitError('You must be logged in to create a poll');
      return;
    }

    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      const pollData = {
        title: data.title,
        description: data.description || '',
        options: data.options.map(opt => opt.text),
        is_public: data.is_public,
        allow_multiple_votes: data.allow_multiple_votes,
        expires_at: data.expires_at ? new Date(data.expires_at).toISOString() : undefined,
      };

      const poll = await createPoll(pollData);
      setSubmitSuccess(true);
      
      // Reset form
      reset();
      
      // Call success callback or navigate
      if (onSuccess) {
        onSuccess(poll.url_slug);
      } else {
        router.push(`/polls/${poll.url_slug}`);
      }
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to create poll');
    }
  };

  const addOption = () => {
    if (fields.length < 10) {
      append({ text: '' });
    }
  };

  const removeOption = (index: number) => {
    if (fields.length > 2) {
      remove(index);
    }
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Alert>
            <AlertDescription>
              You must be logged in to create a poll. Please sign in to continue.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Create New Poll
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Poll Title *</Label>
                <Input
                  id="title"
                  placeholder="What's your question?"
                  {...register('title')}
                  className={errors.title ? 'border-red-500' : ''}
                />
                {errors.title && (
                  <p className="text-sm text-red-500">{errors.title.message}</p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <textarea
                  id="description"
                  placeholder="Add more context to your poll..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  {...register('description')}
                />
                {errors.description && (
                  <p className="text-sm text-red-500">{errors.description.message}</p>
                )}
              </div>

              {/* Options */}
              <div className="space-y-2">
                <Label>Poll Options *</Label>
                <div className="space-y-3">
                  {fields.map((field, index) => (
                    <div key={field.id} className="flex gap-2">
                      <div className="flex-1">
                        <Input
                          placeholder={`Option ${index + 1}`}
                          {...register(`options.${index}.text`)}
                          className={errors.options?.[index]?.text ? 'border-red-500' : ''}
                        />
                        {errors.options?.[index]?.text && (
                          <p className="text-sm text-red-500 mt-1">
                            {errors.options[index]?.text?.message}
                          </p>
                        )}
                      </div>
                      {fields.length > 2 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeOption(index)}
                          className="px-2"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                {fields.length < 10 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addOption}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Option ({fields.length}/10)
                  </Button>
                )}

                {errors.options && (
                  <p className="text-sm text-red-500">{errors.options.message}</p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              {/* Poll Settings */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_public"
                    {...register('is_public')}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="is_public">Make poll public</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="allow_multiple_votes"
                    {...register('allow_multiple_votes')}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="allow_multiple_votes">Allow multiple votes per user</Label>
                </div>

                {/* Expiration Date */}
                <div className="space-y-2">
                  <Label htmlFor="expires_at" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Expiration Date (Optional)
                  </Label>
                  <Input
                    id="expires_at"
                    type="datetime-local"
                    {...register('expires_at')}
                    min={new Date().toISOString().slice(0, 16)}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Error Display */}
          {submitError && (
            <Alert variant="destructive">
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          )}

          {/* Success Display */}
          {submitSuccess && (
            <Alert>
              <AlertDescription>Poll created successfully!</AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={loading || isSubmitting}
              className="flex-1"
            >
              {loading || isSubmitting ? 'Creating...' : 'Create Poll'}
            </Button>
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={loading || isSubmitting}
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}