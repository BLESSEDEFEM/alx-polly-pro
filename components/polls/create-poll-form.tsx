'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreatePollFormData } from '@/types';
import { usePolls } from '@/hooks/use-polls';

interface PollOption {
  id: string;
  text: string;
}

export function CreatePollForm() {
  const [formData, setFormData] = useState<CreatePollFormData>({
    title: '',
    description: '',
    options: ['', ''],
    allowMultipleVotes: false,
    isAnonymous: false,
  });
  
  const [options, setOptions] = useState<PollOption[]>([
    { id: '1', text: '' },
    { id: '2', text: '' },
  ]);
  
  const [expiryDate, setExpiryDate] = useState('');
  const [expiryTime, setExpiryTime] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { createPoll } = usePolls();
  const router = useRouter();

  const addOption = () => {
    const newId = (options.length + 1).toString();
    setOptions([...options, { id: newId, text: '' }]);
  };

  const removeOption = (id: string) => {
    if (options.length > 2) {
      setOptions(options.filter(option => option.id !== id));
    }
  };

  const updateOption = (id: string, text: string) => {
    setOptions(options.map(option => 
      option.id === id ? { ...option, text } : option
    ));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Title validation
    if (!formData.title.trim()) {
      newErrors.title = 'Poll title is required';
    } else if (formData.title.trim().length < 5) {
      newErrors.title = 'Title must be at least 5 characters long';
    }

    // Options validation
    const validOptions = options.filter(option => option.text.trim());
    if (validOptions.length < 2) {
      newErrors.options = 'At least 2 options are required';
    }

    // Check for duplicate options
    const optionTexts = validOptions.map(opt => opt.text.trim().toLowerCase());
    const uniqueTexts = new Set(optionTexts);
    if (optionTexts.length !== uniqueTexts.size) {
      newErrors.options = 'Options must be unique';
    }

    // Expiry date validation
    if (expiryDate && expiryTime) {
      const expiryDateTime = new Date(`${expiryDate}T${expiryTime}`);
      if (expiryDateTime <= new Date()) {
        newErrors.expiry = 'Expiry date must be in the future';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const validOptions = options
        .filter(option => option.text.trim())
        .map(option => option.text.trim());

      let expiresAt: Date | undefined;
      if (expiryDate && expiryTime) {
        expiresAt = new Date(`${expiryDate}T${expiryTime}`);
      }

      const pollData: CreatePollFormData = {
        title: formData.title.trim(),
        description: formData.description?.trim() || undefined,
        options: validOptions,
        expiresAt,
        allowMultipleVotes: formData.allowMultipleVotes,
        isAnonymous: formData.isAnonymous,
      };

      const newPoll = await createPoll(pollData);
      router.push(`/polls/${newPoll.id}`);
    } catch (error) {
      setErrors({
        general: error instanceof Error ? error.message : 'Failed to create poll',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Create New Poll</CardTitle>
          <CardDescription>
            Create a poll to gather opinions and feedback from your audience
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Poll Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Poll Title *</Label>
              <Input
                id="title"
                placeholder="What's your question?"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className={errors.title ? 'border-red-500' : ''}
              />
              {errors.title && (
                <p className="text-sm text-red-500">{errors.title}</p>
              )}
            </div>

            {/* Poll Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Provide additional context for your poll..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            {/* Poll Options */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Poll Options *</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addOption}
                  disabled={options.length >= 10}
                >
                  Add Option
                </Button>
              </div>
              
              <div className="space-y-3">
                {options.map((option, index) => (
                  <div key={option.id} className="flex gap-2">
                    <div className="flex-1">
                      <Input
                        placeholder={`Option ${index + 1}`}
                        value={option.text}
                        onChange={(e) => updateOption(option.id, e.target.value)}
                        className={errors.options ? 'border-red-500' : ''}
                      />
                    </div>
                    {options.length > 2 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeOption(option.id)}
                        className="px-3"
                      >
                        ×
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              
              {errors.options && (
                <p className="text-sm text-red-500">{errors.options}</p>
              )}
            </div>

            {/* Poll Settings */}
            <div className="space-y-4">
              <Label>Poll Settings</Label>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="allowMultiple"
                    checked={formData.allowMultipleVotes}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      allowMultipleVotes: e.target.checked 
                    })}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="allowMultiple" className="text-sm font-normal">
                    Allow multiple votes per person
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="anonymous"
                    checked={formData.isAnonymous}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      isAnonymous: e.target.checked 
                    })}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="anonymous" className="text-sm font-normal">
                    Anonymous voting
                  </Label>
                </div>
              </div>
            </div>

            {/* Expiry Settings */}
            <div className="space-y-4">
              <Label>Expiry (Optional)</Label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="expiryDate" className="text-sm">Date</Label>
                  <Input
                    id="expiryDate"
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <Label htmlFor="expiryTime" className="text-sm">Time</Label>
                  <Input
                    id="expiryTime"
                    type="time"
                    value={expiryTime}
                    onChange={(e) => setExpiryTime(e.target.value)}
                  />
                </div>
              </div>
              {errors.expiry && (
                <p className="text-sm text-red-500">{errors.expiry}</p>
              )}
            </div>

            {/* Preview */}
            <div className="space-y-2">
              <Label>Preview</Label>
              <Card className="bg-gray-50">
                <CardContent className="pt-4">
                  <h3 className="font-semibold mb-2">
                    {formData.title || 'Your poll title will appear here'}
                  </h3>
                  {formData.description && (
                    <p className="text-sm text-gray-600 mb-3">{formData.description}</p>
                  )}
                  <div className="space-y-2">
                    {options.map((option, index) => (
                      <div key={option.id} className="flex items-center space-x-2">
                        <input
                          type={formData.allowMultipleVotes ? 'checkbox' : 'radio'}
                          name="preview"
                          disabled
                          className="text-blue-600"
                        />
                        <span className="text-sm">
                          {option.text || `Option ${index + 1}`}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-3">
                    {formData.allowMultipleVotes && (
                      <Badge variant="secondary" className="text-xs">Multiple Choice</Badge>
                    )}
                    {formData.isAnonymous && (
                      <Badge variant="secondary" className="text-xs">Anonymous</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {errors.general && (
              <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-md">
                {errors.general}
              </div>
            )}

            {/* Submit Buttons */}
            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? 'Creating Poll...' : 'Create Poll'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}