# Database Setup Instructions

This directory contains the database schema and setup instructions for the Polly Pro application.

## Prerequisites

1. **Supabase Account**: You need a Supabase project set up
2. **Environment Variables**: Ensure your `.env.local` file is configured with:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

## Database Setup Steps

### 1. Create the Database Schema

1. Open your Supabase dashboard
2. Navigate to the SQL Editor
3. Copy the contents of `schema.sql` and paste it into the SQL Editor
4. Click "Run" to execute the schema creation

### 2. Verify Tables Created

After running the schema, you should see the following tables in your Supabase database:

- `polls` - Stores poll information
- `poll_options` - Stores options for each poll
- `votes` - Stores user votes

### 3. Enable Row Level Security (RLS)

The schema automatically enables RLS and creates the necessary policies for:

- **Public Access**: Anyone can view active polls and their options
- **Authenticated Access**: Only authenticated users can create polls and vote
- **Owner Access**: Poll creators can manage their own polls

### 4. Test the Setup

You can test the database setup by:

1. Starting your development server: `npm run dev`
2. Registering a new user account
3. Creating a test poll
4. Voting on the poll

## Database Schema Overview

### Tables

#### `polls`
- `id` (UUID, Primary Key)
- `title` (Text, Required)
- `description` (Text, Optional)
- `created_by` (UUID, Foreign Key to auth.users)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)
- `expires_at` (Timestamp, Optional)
- `allow_multiple_votes` (Boolean)
- `is_anonymous` (Boolean)
- `is_active` (Boolean)

#### `poll_options`
- `id` (UUID, Primary Key)
- `poll_id` (UUID, Foreign Key to polls)
- `text` (Text, Required)
- `vote_count` (Integer)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

#### `votes`
- `id` (UUID, Primary Key)
- `poll_id` (UUID, Foreign Key to polls)
- `option_id` (UUID, Foreign Key to poll_options)
- `user_id` (UUID, Foreign Key to auth.users)
- `created_at` (Timestamp)

### Automatic Features

- **Vote Counting**: Triggers automatically update vote counts when votes are cast or removed
- **Timestamp Updates**: Triggers automatically update `updated_at` timestamps
- **Performance Indexes**: Optimized indexes for common queries
- **Data Integrity**: Foreign key constraints ensure data consistency

## Troubleshooting

### Common Issues

1. **"Table not found" errors**: Ensure you've run the schema.sql file in your Supabase SQL Editor

2. **Permission denied errors**: Check that RLS policies are properly set up and your user is authenticated

3. **Environment variable errors**: Verify your `.env.local` file has the correct Supabase URL and anon key

### Resetting the Database

If you need to reset the database:

1. In Supabase SQL Editor, run:
   ```sql
   DROP TABLE IF EXISTS public.votes CASCADE;
   DROP TABLE IF EXISTS public.poll_options CASCADE;
   DROP TABLE IF EXISTS public.polls CASCADE;
   ```

2. Re-run the `schema.sql` file

## Sample Data

The schema includes commented sample data at the bottom. Uncomment and run it if you want to test with sample polls.

## Security Notes

- All tables have Row Level Security (RLS) enabled
- Users can only access data they're authorized to see
- Poll creators have full control over their polls
- Anonymous voting is supported when enabled per poll