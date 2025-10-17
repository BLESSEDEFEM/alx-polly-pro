/**
 * @fileoverview Enhanced create poll form component with improved UX and visual feedback
 * Provides a comprehensive form for creating polls with validation, preview, and user-friendly interactions
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Loader2, 
  Plus, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  Clock, 
  Eye, 
  Users, 
  Shield,
  FileText,
  Settings
} from 'lucide-react';
import { createPoll } from '@/lib/api';
import { CreatePollFormData } from '@/types';
import { fastAPIClient } from '@/lib/fastapi-client';

/**
 * Form data interface for poll creation
 */
interface PollFormData {
  title: string;
  description: string;
  allowMultipleVotes: boolean;
  isAnonymous: boolean;
  pollCategory: string;
}

/**
 * Poll option interface
 */
interface PollOption {
  id: string;
  text: string;
}

/**
 * Form errors interface
 */
interface FormErrors {
  title?: string;
  options?: string;
  expiry?: string;
  general?: string;
}

/**
 * Enhanced create poll form component with improved UX
 * 
 * Features:
 * - Real-time validation with visual feedback
 * - Interactive poll preview with live updates
 * - Enhanced option management with drag-and-drop feel
 * - Better error handling and user guidance
 * - Success states and smooth transitions
 * - Responsive design with modern UI patterns
 * 
 * @returns JSX element containing the enhanced poll creation form
 */
export function CreatePollForm() {
  const router = useRouter();
  
  // Form state
  const [formData, setFormData] = useState<PollFormData>({
    title: '',
    description: '',
    allowMultipleVotes: false,
    isAnonymous: false,
    pollCategory: 'general',
  });
  
  // Options state
  const [options, setOptions] = useState<PollOption[]>([
    { id: '1', text: '' },
    { id: '2', text: '' },
  ]);
  
  // Expiry state
  const [expiryDate, setExpiryDate] = useState('');
  const [expiryTime, setExpiryTime] = useState('');
  
  // UI state
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());

  /**
   * Mark field as touched for validation feedback
   */
  const markFieldTouched = (field: string) => {
    setTouchedFields(prev => new Set(prev).add(field));
  };

  /**
   * Get field validation state for visual feedback
   */
  const getFieldState = (field: string, hasValue: boolean) => {
    const isTouched = touchedFields.has(field);
    const hasError = !!errors[field as keyof FormErrors];
    
    if (hasError && isTouched) return 'error';
    if (hasValue && isTouched && !hasError) return 'success';
    return 'default';
  };

  /**
   * Add a new poll option with enhanced UX
   */
  const addOption = () => {
    if (options.length >= 10) return;
    
    const newOption: PollOption = {
      id: Date.now().toString(),
      text: '',
    };
    setOptions(prev => [...prev, newOption]);
  };

  /**
   * Remove a poll option with validation
   */
  const removeOption = (id: string) => {
    if (options.length <= 2) return;
    
    setOptions(prev => prev.filter(option => option.id !== id));
    
    // Clear options error if we now have enough options
    if (errors.options && options.length > 2) {
      setErrors(prev => ({ ...prev, options: undefined }));
    }
  };

  /**
   * Update poll option text with real-time validation
   */
  const updateOption = (id: string, text: string) => {
    setOptions(prev => 
      prev.map(option => 
        option.id === id ? { ...option, text } : option
      )
    );
    
    // Clear options error when user starts typing
    if (errors.options) {
      setErrors(prev => ({ ...prev, options: undefined }));
    }
  };

  /**
   * Enhanced form validation with detailed feedback
   */
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Title validation
    if (!formData.title.trim()) {
      newErrors.title = 'Poll title is required';
    } else if (formData.title.trim().length < 5) {
      newErrors.title = 'Title must be at least 5 characters long';
    } else if (formData.title.trim().length > 200) {
      newErrors.title = 'Title must be less than 200 characters';
    }

    // Options validation
    const validOptions = options.filter(option => option.text.trim());
    if (validOptions.length < 2) {
      newErrors.options = 'At least 2 options are required';
    } else if (validOptions.some(option => option.text.trim().length > 100)) {
      newErrors.options = 'Each option must be less than 100 characters';
    }

    // Expiry validation
    if (expiryDate && expiryTime) {
      const expiryDateTime = new Date(`${expiryDate}T${expiryTime}`);
      const now = new Date();
      
      if (expiryDateTime <= now) {
        newErrors.expiry = 'Expiry date must be in the future';
      }
    } else if (expiryDate && !expiryTime) {
      newErrors.expiry = 'Please select a time for the expiry date';
    } else if (!expiryDate && expiryTime) {
      newErrors.expiry = 'Please select a date for the expiry time';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle form input changes with real-time validation
   */
  const handleInputChange = (field: keyof PollFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Mark field as touched
    markFieldTouched(field);
    
    // Clear field-specific error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
    
    // Clear general error when user makes any change
    if (errors.general) {
      setErrors(prev => ({ ...prev, general: undefined }));
    }
  };

  /**
   * Enhanced form submission with better UX
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mark all fields as touched for validation display
    setTouchedFields(new Set(['title', 'options', 'expiry']));
    
    // Clear any existing errors
    setErrors({});
    
    // Validate form
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const validOptions = options
        .filter(option => option.text.trim())
        .map(option => option.text.trim());

      let expiresAt: Date | undefined;
      if (expiryDate && expiryTime) {
        expiresAt = new Date(`${expiryDate}T${expiryTime}`);
      }

      // Try FastAPI first
      console.log('Attempting to create poll with FastAPI...');
      const fastAPIResult = await fastAPIClient.createPoll(formData.title.trim(), validOptions);
      
      if (fastAPIResult.success && fastAPIResult.data) {
        console.log('FastAPI poll creation successful:', fastAPIResult.data);
        setIsSuccess(true);
        
        // Show success state for 5 seconds, then navigate to the poll page
        setTimeout(() => {
          console.log('Navigating to FastAPI poll ID:', fastAPIResult.data?.id);
          router.push(`/polls/${fastAPIResult.data?.id}`);
        }, 5000);
        
        return;
      }
      
      console.log('FastAPI poll creation failed, falling back to existing API...');

      // Fallback to existing API
      const pollData: CreatePollFormData = {
        title: formData.title.trim(),
        description: formData.description?.trim() || undefined,
        options: validOptions,
        expiresAt,
        allowMultipleVotes: formData.allowMultipleVotes,
        isAnonymous: formData.isAnonymous,
        pollCategory: formData.pollCategory,
      };

      console.log('Frontend: Poll data being sent:', pollData);
      console.log('Frontend: Valid options:', validOptions);
      console.log('Frontend: Options length:', validOptions.length);

      const newPoll = await createPoll(pollData);
      console.log('Poll created, navigating to:', newPoll); // Debug logging
      
      if (newPoll.success && newPoll.data) {
        console.log('Poll ID:', (newPoll.data as any).id); // Debug logging
        
        // Success state with visual feedback
        setIsSuccess(true);
        
        // Show success state for 5 seconds, then navigate to the poll page
        setTimeout(() => {
          console.log('Navigating to poll ID:', (newPoll.data as any).id); // Debug logging
          router.push(`/polls/${(newPoll.data as any).id}`);
        }, 5000);
      } else {
        console.error('Failed to create poll:', newPoll.error);
        setErrors({ general: newPoll.error || 'Failed to create poll' });
      }

    } catch (error) {
      setErrors({
        general: error instanceof Error ? error.message : 'Failed to create poll. Please try again.',
      });
    } finally {
      if (!isSuccess) {
        setIsLoading(false);
      }
    }
  };

  // Success state UI
  if (isSuccess) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-green-800 mb-2">Poll Created Successfully!</h3>
              <p className="text-sm text-green-600 mb-2">Your poll is now live and ready for votes</p>
              <p className="text-xs text-muted-foreground">Redirecting you to your poll...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const titleState = getFieldState('title', !!formData.title.trim());
  const optionsState = getFieldState('options', options.some(opt => opt.text.trim()));

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="transition-all duration-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Create New Poll
          </CardTitle>
          <CardDescription>
            Create a poll to gather opinions and feedback from your audience
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* General Error Alert */}
            {errors.general && (
              <Alert variant="destructive" className="animate-in slide-in-from-top-2 duration-300">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errors.general}</AlertDescription>
              </Alert>
            )}

            {/* Poll Title */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-medium flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Poll Title *
              </Label>
              <div className="relative">
                <Input
                  id="title"
                  placeholder="What's your question?"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  onBlur={() => markFieldTouched('title')}
                  className={`transition-all duration-200 ${
                    titleState === 'error' 
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                      : titleState === 'success'
                      ? 'border-green-500 focus:border-green-500 focus:ring-green-500'
                      : ''
                  }`}
                  disabled={isLoading}
                  maxLength={200}
                />
                {titleState === 'success' && (
                  <CheckCircle2 className="absolute right-3 top-3 h-4 w-4 text-green-500" />
                )}
              </div>
              <div className="flex justify-between items-center">
                {errors.title && (
                  <p className="text-sm text-red-600 animate-in slide-in-from-top-1 duration-200">
                    {errors.title}
                  </p>
                )}
                <p className="text-xs text-muted-foreground ml-auto">
                  {formData.title.length}/200
                </p>
              </div>
            </div>

            {/* Poll Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">
                Description (Optional)
              </Label>
              <Textarea
                id="description"
                placeholder="Provide additional context for your poll..."
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                className="transition-all duration-200 resize-none"
                disabled={isLoading}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground text-right">
                {formData.description.length}/500
              </p>
            </div>

            {/* Poll Options */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Poll Options *
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addOption}
                  disabled={options.length >= 10 || isLoading}
                  className="transition-all duration-200 hover:scale-105"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Option
                </Button>
              </div>
              
              <div className="space-y-3">
                {options.map((option, index) => (
                  <div key={option.id} className="flex gap-2 group">
                    <div className="flex-1 relative">
                      <Input
                        placeholder={`Option ${index + 1}`}
                        value={option.text}
                        onChange={(e) => updateOption(option.id, e.target.value)}
                        className={`transition-all duration-200 ${
                          optionsState === 'error' 
                            ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                            : option.text.trim() && optionsState === 'success'
                            ? 'border-green-500 focus:border-green-500 focus:ring-green-500'
                            : ''
                        }`}
                        disabled={isLoading}
                        maxLength={100}
                      />
                      {option.text.trim() && (
                        <CheckCircle2 className="absolute right-3 top-3 h-4 w-4 text-green-500" />
                      )}
                    </div>
                    {options.length > 2 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeOption(option.id)}
                        disabled={isLoading}
                        className="px-3 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-50 hover:border-red-300 hover:text-red-600"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              
              {errors.options && (
                <p className="text-sm text-red-600 animate-in slide-in-from-top-1 duration-200">
                  {errors.options}
                </p>
              )}
              
              <p className="text-xs text-muted-foreground">
                {options.filter(opt => opt.text.trim()).length} of {options.length} options filled • Maximum 10 options
              </p>
            </div>

            {/* Poll Settings */}
            <div className="space-y-4">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Poll Settings
              </Label>
              <div className="space-y-4 pl-6">
                {/* Poll Category */}
                <div className="space-y-2">
                  <Label htmlFor="pollCategory" className="text-sm font-normal">
                    Category
                  </Label>
                  <Select 
                    value={formData.pollCategory} 
                    onValueChange={(value) => handleInputChange('pollCategory', value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="entertainment">Entertainment</SelectItem>
                      <SelectItem value="sports">Sports</SelectItem>
                      <SelectItem value="technology">Technology</SelectItem>
                      <SelectItem value="politics">Politics</SelectItem>
                      <SelectItem value="education">Education</SelectItem>
                      <SelectItem value="business">Business</SelectItem>
                      <SelectItem value="lifestyle">Lifestyle</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="allowMultiple"
                    checked={formData.allowMultipleVotes}
                    onCheckedChange={(checked: boolean) => handleInputChange('allowMultipleVotes', !!checked)}
                    disabled={isLoading}
                  />
                  <div className="space-y-1">
                    <Label htmlFor="allowMultiple" className="text-sm font-normal cursor-pointer">
                      Allow multiple votes per person
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Users can select multiple options
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="anonymous"
                    checked={formData.isAnonymous}
                    onCheckedChange={(checked: boolean) => handleInputChange('isAnonymous', !!checked)}
                    disabled={isLoading}
                  />
                  <div className="space-y-1">
                    <Label htmlFor="anonymous" className="text-sm font-normal cursor-pointer flex items-center gap-1">
                      <Shield className="h-3 w-3" />
                      Anonymous voting
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Hide voter identities from results
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Expiry Settings */}
            <div className="space-y-4">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Expiry (Optional)
              </Label>
              <div className="grid grid-cols-2 gap-4 pl-6">
                <div className="space-y-2">
                  <Label htmlFor="expiryDate" className="text-sm flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Date
                  </Label>
                  <Input
                    id="expiryDate"
                    type="date"
                    value={expiryDate}
                    onChange={(e) => {
                      setExpiryDate(e.target.value);
                      markFieldTouched('expiry');
                      if (errors.expiry) {
                        setErrors(prev => ({ ...prev, expiry: undefined }));
                      }
                    }}
                    min={new Date().toISOString().split('T')[0]}
                    className="transition-all duration-200"
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expiryTime" className="text-sm flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Time
                  </Label>
                  <Input
                    id="expiryTime"
                    type="time"
                    value={expiryTime}
                    onChange={(e) => {
                      setExpiryTime(e.target.value);
                      markFieldTouched('expiry');
                      if (errors.expiry) {
                        setErrors(prev => ({ ...prev, expiry: undefined }));
                      }
                    }}
                    className="transition-all duration-200"
                    disabled={isLoading}
                  />
                </div>
              </div>
              {errors.expiry && (
                <p className="text-sm text-red-600 animate-in slide-in-from-top-1 duration-200 pl-6">
                  {errors.expiry}
                </p>
              )}
            </div>

            {/* Preview */}
            <div className="space-y-3">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Preview
              </Label>
              <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-dashed transition-all duration-200">
                <CardContent className="pt-4">
                  <h3 className="font-semibold mb-2 text-gray-800">
                    {formData.title || 'Your poll title will appear here'}
                  </h3>
                  {formData.description && (
                    <p className="text-sm text-gray-600 mb-3">{formData.description}</p>
                  )}
                  <div className="space-y-2">
                    {options.map((option, index) => (
                      <div key={option.id} className="flex items-center space-x-2 p-2 rounded bg-white/50">
                        <input
                          type={formData.allowMultipleVotes ? 'checkbox' : 'radio'}
                          name="preview"
                          disabled
                          className="text-blue-600"
                        />
                        <span className="text-sm text-gray-700">
                          {option.text || `Option ${index + 1}`}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-4">
                    {formData.allowMultipleVotes && (
                      <Badge variant="secondary" className="text-xs">
                        <Users className="h-3 w-3 mr-1" />
                        Multiple Choice
                      </Badge>
                    )}
                    {formData.isAnonymous && (
                      <Badge variant="secondary" className="text-xs">
                        <Shield className="h-3 w-3 mr-1" />
                        Anonymous
                      </Badge>
                    )}
                    {expiryDate && expiryTime && (
                      <Badge variant="outline" className="text-xs">
                        <Clock className="h-3 w-3 mr-1" />
                        Expires {new Date(`${expiryDate}T${expiryTime}`).toLocaleDateString()}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isLoading}
                className="transition-all duration-200"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading} 
                className="flex-1 transition-all duration-200 hover:scale-[1.02]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Poll...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Poll
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}