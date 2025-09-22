'use client';

import { useRouter } from 'next/navigation';
import { CreatePollForm } from '@/components/polls/create-poll-form';

export default function CreatePollPage() {
  const router = useRouter();

  const handleSuccess = (pollSlug: string) => {
    // Navigate to the newly created poll
    router.push(`/polls/${pollSlug}`);
  };

  const handleCancel = () => {
    // Navigate back to dashboard or home
    router.push('/dashboard');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Poll</h1>
          <p className="text-gray-600">
            Create engaging polls and gather opinions from your audience.
          </p>
        </div>
        
        <CreatePollForm 
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}