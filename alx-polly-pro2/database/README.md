# Database Setup Guide

## Overview
This directory contains the database schema and setup files for the Polly Pro polling application.

## Files
- `schema.sql` - Complete database schema with tables, policies, and functions

## Database Schema

### Tables

#### user_profiles
- Stores user profile information
- Links to Supabase Auth users
- Includes email, full name, and avatar URL

#### polls
- Main polls table
- Contains poll metadata (title, description, settings)
- Links to creator via user_profiles

#### poll_options
- Stores individual options for each poll
- Ordered list of choices for voters

#### votes
- Records individual votes
- Supports both authenticated and anonymous voting
- Prevents duplicate votes per poll

### Key Features

1. **Row Level Security (RLS)**
   - All tables have RLS enabled
   - Policies ensure users can only access appropriate data
   - Public polls are viewable by everyone
   - Private polls only by creators

2. **Automatic User Profile Creation**
   - Trigger creates user profile when user signs up
   - Syncs with Supabase Auth

3. **Vote Integrity**
   - Unique constraints prevent duplicate votes
   - Supports IP-based voting for anonymous users
   - Configurable multiple vote settings per poll

4. **Performance Optimizations**
   - Indexes on frequently queried columns
   - Efficient poll results function

## Setup Instructions

1. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Note your project URL and anon key

2. **Run Database Schema**
   - Open Supabase Dashboard
   - Go to SQL Editor
   - Copy and paste the contents of `schema.sql`
   - Execute the script

3. **Configure Environment Variables**
   - Copy `.env.local.example` to `.env.local`
   - Add your Supabase project URL and anon key

4. **Verify Setup**
   - Check that all tables are created
   - Verify RLS policies are active
   - Test user registration creates profile

## Environment Variables Required

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Security Notes

- All tables use Row Level Security
- Anonymous voting is supported but tracked by IP
- Poll creators have full control over their polls
- Public polls are readable by everyone
- Private polls are only accessible to creators