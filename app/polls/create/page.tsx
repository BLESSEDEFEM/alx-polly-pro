import { CreatePollForm } from '@/components/polls/create-poll-form';

export default function CreatePollPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <CreatePollForm />
    </div>
  );
}

export const metadata = {
  title: 'Create Poll - Polly Pro',
  description: 'Create a new poll to gather opinions and feedback from your audience.',
};