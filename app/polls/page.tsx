import { PollList } from '@/components/polls/poll-list';

export default function PollsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <PollList />
    </div>
  );
}

export const metadata = {
  title: 'Polls - Polly Pro',
  description: 'Browse and participate in polls on Polly Pro.',
};