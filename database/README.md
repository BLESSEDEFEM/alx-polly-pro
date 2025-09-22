# Database Schema and Setup

This directory contains all database-related files for the ALX Polly Pro application.

## Files Overview

- `schema.sql` - Main database schema with tables and initial policies
- `schema-optimized.sql` - Optimized version with performance improvements
- `create-user-profiles.sql` - User profiles table creation
- `create-polls-tables.sql` - Polls and related tables creation
- `fix-rls-policies.sql` - **CRITICAL FIX** for infinite recursion in RLS policies
- `cleanup-unused-indexes.sql` - Database maintenance script

## 🚨 IMPORTANT: RLS Policy Fix

If you encounter the error:
```
Error fetching user profile: {code: 42P17, details: null, hint: null, message: infinite recursion detected in policy for relation "user_profiles"}
```

**SOLUTION:** Run the `fix-rls-policies.sql` script immediately. This provides a permanent fix using security definer functions.

### Why This Error Occurs

The error happens due to circular references in Row Level Security (RLS) policies:

1. **Self-Referencing Policies** - Policies that query the same table they protect
2. **Admin Role Checks** - Policies checking user roles by querying `user_profiles` from within `user_profiles` policies
3. **Recursive Subqueries** - Nested queries that create infinite loops

### The Permanent Solution

The `fix-rls-policies.sql` script implements:

1. **Security Definer Functions** - Bypass RLS for role checks
2. **Non-Circular Policies** - Rewritten policies without self-references
3. **Performance Optimization** - Direct role lookups without policy loops
4. **Proper Security** - Maintains access control without compromising security

## Setup Instructions

### 1. Initial Setup (New Database)
```sql
-- Run in this order:
1. schema.sql (or schema-optimized.sql for better performance)
2. fix-rls-policies.sql (REQUIRED to prevent recursion errors)
```

### 2. Fixing Existing Database
```sql
-- If you already have the database set up:
1. fix-rls-policies.sql (This will fix the recursion issue)
```

### 3. Verification
After running the fix, test with these queries:
```sql
-- Test 1: Check if functions work
SELECT public.get_user_role();
SELECT public.is_admin();

-- Test 2: Verify user profile access
SELECT * FROM public.user_profiles WHERE id = auth.uid();

-- Test 3: Performance check
EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM public.user_profiles LIMIT 1;
```

## Database Schema

### Core Tables

1. **user_profiles** - Extended user information with roles
2. **polls** - Poll data and metadata
3. **poll_options** - Individual poll choices
4. **votes** - User votes with duplicate prevention
5. **comments** - Poll discussions (if enabled)

### Security Features

- **Row Level Security (RLS)** enabled on all tables
- **Role-based access control** (admin, moderator, user)
- **Duplicate vote prevention** via unique constraints
- **Anonymous voting support** for public polls

### Key Functions (Post-Fix)

- `get_user_role(user_id)` - Get user role without RLS conflicts
- `is_admin(user_id)` - Check admin status safely
- `is_moderator_or_admin(user_id)` - Check elevated privileges
- `user_exists_and_active(user_id)` - Verify user status

## Maintenance

### Regular Tasks
1. Monitor query performance with `EXPLAIN ANALYZE`
2. Update statistics: `ANALYZE;`
3. Check for unused indexes with `cleanup-unused-indexes.sql`

### Troubleshooting

**Problem:** Infinite recursion errors
**Solution:** Run `fix-rls-policies.sql`

**Problem:** Permission denied errors
**Solution:** Check RLS policies and user roles

**Problem:** Slow queries
**Solution:** Use `schema-optimized.sql` and add appropriate indexes

## Environment Variables

Ensure these are set in your application:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Support

For database-related issues:
1. Check the error logs in Supabase dashboard
2. Verify RLS policies are not causing conflicts
3. Ensure proper permissions are granted
4. Run the verification queries after any schema changes

---

**Note:** Always backup your database before running schema changes in production.