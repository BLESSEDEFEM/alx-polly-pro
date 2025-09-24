# Polly Pro - Advanced Polling Platform

A modern, feature-rich polling platform built with Next.js 15, TypeScript, Supabase, FastAPI, and shadcn/ui components. This project demonstrates a hybrid architecture combining Next.js frontend with both Supabase backend services and a custom FastAPI backend for enhanced functionality.

## 🚀 Features

### Authentication System
- **Hybrid Authentication**: Supports both FastAPI and Supabase authentication
- **FastAPI Integration**: Primary authentication through custom FastAPI backend
- **Supabase Fallback**: Automatic fallback to Supabase for enhanced reliability
- **Secure Session Management**: Server-side and client-side session handling
- **Form Validation**: Comprehensive client-side validation with real-time feedback
- **Password Security**: Password strength indicators and visibility toggles
- **Email Confirmation**: Support for email verification workflows
- **Error Handling**: Detailed error messages and user-friendly feedback
- **Responsive Design**: Mobile-first authentication forms

### Polling System
- **FastAPI-Powered Polls**: Primary poll management through FastAPI backend
- **Real-time Voting**: Instant vote casting and result updates
- **Poll Creation**: Rich poll creation interface with multiple options
- **Results Visualization**: Comprehensive poll results with statistics
- **User Management**: User registration and authentication for poll ownership

### User Interface
- **Modern Design**: Built with shadcn/ui components and Tailwind CSS
- **Responsive Layout**: Optimized for desktop, tablet, and mobile devices
- **Loading States**: Smooth loading indicators and disabled states
- **Accessibility**: ARIA labels, keyboard navigation, and screen reader support

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Icons**: Lucide React
- **State Management**: React Context API

### Backend Services
- **Primary API**: FastAPI (Python) - Handles authentication, polls, and voting
- **Secondary Database**: Supabase PostgreSQL (fallback)
- **Authentication**: Hybrid FastAPI + Supabase Auth
- **Client Libraries**: Custom FastAPI client with TypeScript adapter

### Development Tools
- **Testing**: Jest with React Testing Library
- **Linting**: ESLint with TypeScript support
- **Package Manager**: npm
- **Environment**: Node.js

## 🏗️ Architecture Overview

This project implements a **hybrid architecture** that combines the best of both worlds:

### FastAPI Backend (Primary)
- **Authentication**: JWT-based user authentication
- **Poll Management**: Create, read, update, delete polls
- **Voting System**: Cast votes and retrieve results
- **User Management**: User registration and profile management

### Supabase Backend (Fallback)
- **Database**: PostgreSQL database for data persistence
- **Authentication**: Backup authentication system
- **Real-time**: WebSocket connections for live updates

### Frontend Integration
- **Adaptive Client**: Automatically tries FastAPI first, falls back to Supabase
- **Seamless UX**: Users experience unified interface regardless of backend
- **Error Handling**: Graceful degradation when services are unavailable

## 📁 Project Structure

```
alx-polly-pro/
├── app/
│   ├── auth/
│   │   ├── login/
│   │   │   └── page.tsx          # Login page with FastAPI integration
│   │   └── register/
│   │       └── page.tsx          # Registration page
│   ├── polls/
│   │   ├── create/
│   │   │   └── page.tsx          # Poll creation page
│   │   └── [id]/
│   │       └── page.tsx          # Individual poll page
│   ├── globals.css               # Global styles
│   ├── layout.tsx               # Root layout with AuthProvider
│   └── page.tsx                 # Home page
├── components/
│   ├── auth/
│   │   ├── login-form.tsx       # Login form with FastAPI + Supabase
│   │   └── register-form.tsx    # Registration form component
│   ├── polls/
│   │   ├── create-poll-form.tsx # Poll creation with FastAPI integration
│   │   ├── poll-card.tsx        # Poll display component
│   │   └── poll-list.tsx        # Poll listing component
│   ├── ui/                      # Enhanced UI components
│   │   ├── animated-container.tsx    # Animation framework
│   │   ├── error-display.tsx        # Error handling system
│   │   ├── form-field.tsx           # Reusable form fields
│   │   ├── form-transitions.tsx     # Form animations
│   │   ├── loading-button.tsx       # Interactive buttons
│   │   ├── success-feedback.tsx     # Success states
│   │   └── form-success-states.tsx  # Form-specific success
│   ├── layout/
│   │   └── navbar.tsx           # Navigation component
│   ├── providers/
│   │   └── auth-provider.tsx    # Authentication context provider
│   └── ui/                      # shadcn/ui components
├── lib/
│   ├── fastapi-client.ts        # FastAPI client with TypeScript adapter
│   ├── api.ts                   # API abstraction layer
│   ├── supabase/
│   │   └── server.ts           # Server-side Supabase client
│   ├── supabase.ts             # Client-side Supabase client
│   └── utils.ts                # Utility functions
├── hooks/
│   ├── use-auth.ts             # Authentication hook
│   └── use-polls.ts            # Polls management hook
├── test-scripts/               # FastAPI integration tests
│   ├── test-fastapi-simple.js  # Basic FastAPI endpoint tests
│   ├── test-complete-flow.js   # End-to-end flow testing
│   └── test-frontend-fastapi.js # Frontend integration tests
└── types/
    └── index.ts                # TypeScript type definitions
```

## 🔧 Setup Instructions

### Prerequisites
- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Python** (v3.8 or higher) - for FastAPI backend
- **Supabase Account** - for database and authentication

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone <repository-url>
cd alx-polly-pro

# Install Node.js dependencies
npm install
```

### 2. Environment Configuration

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# FastAPI Configuration
NEXT_PUBLIC_FASTAPI_URL=http://127.0.0.1:8000
FASTAPI_SECRET_KEY=your_secret_key_here

# Backend Selection (supabase or fastapi)
NEXT_PUBLIC_BACKEND_TYPE=supabase
```

### 3. Database Setup

#### Supabase Setup
1. Create a new Supabase project
2. Run the SQL schema from `database/schema.sql`
3. Configure Row Level Security (RLS) policies
4. Update environment variables with your Supabase credentials

#### FastAPI Backend Setup (Optional)
If you want to use the FastAPI backend:

```bash
# Install Python dependencies
pip install fastapi uvicorn sqlalchemy psycopg2-binary python-multipart

# Run FastAPI server
uvicorn main:app --reload --port 8000
```

### 4. Run Development Servers

#### Next.js Frontend
```bash
npm run dev
```
The frontend will be available at `http://localhost:3000`

#### FastAPI Backend (if using)
```bash
# In a separate terminal
cd polly-api
uvicorn main:app --reload --port 8000
```
The API will be available at `http://localhost:8000`

### 5. Testing the Setup

#### Frontend Testing
- Navigate to `http://localhost:3000`
- Test authentication flows (register/login with FastAPI fallback)
- Create and vote on polls using FastAPI backend
- Check responsive design on different devices

#### API Testing (FastAPI)
```bash
# Run comprehensive test scripts
node test-scripts/test-complete-flow.js

# Test individual endpoints
curl -X POST "http://localhost:8000/register" \
     -H "Content-Type: application/json" \
     -d '{"username": "testuser", "email": "test@example.com", "password": "testpass123"}'

# Test login
curl -X POST "http://localhost:8000/login" \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "username=testuser&password=testpass123"

# View API documentation
# Navigate to http://localhost:8000/docs for interactive API docs
```

### 6. Development Workflow

1. **Frontend Development**: Make changes to components in `/components`, `/app`, or `/lib`
2. **Backend Development**: Modify FastAPI endpoints or database schema
3. **Testing**: Run tests with `npm test`
4. **Building**: Create production build with `npm run build`

## 🧪 Testing the Authentication System

### Manual Testing Checklist

#### Registration Flow (`/auth/register`)
- [ ] **Form Validation**
  - [ ] Empty fields show appropriate error messages
  - [ ] Invalid email format shows error
  - [ ] Password strength indicator works correctly
  - [ ] Password confirmation validation works
  - [ ] Real-time error clearing when typing
- [ ] **Password Features**
  - [ ] Password visibility toggle works
  - [ ] Password strength indicator shows weak/medium/strong
  - [ ] Confirm password visibility toggle works
- [ ] **Backend Integration**
  - [ ] FastAPI registration creates user account (primary)
  - [ ] Supabase fallback registration works
  - [ ] Email confirmation flow (if enabled)
  - [ ] Duplicate email registration shows appropriate error
  - [ ] Network errors are handled gracefully
- [ ] **UI/UX**
  - [ ] Loading states during registration
  - [ ] Success confirmation screen
  - [ ] Responsive design on mobile devices
  - [ ] Link to login page works

#### Login Flow (`/auth/login`)
- [ ] **Form Validation**
  - [ ] Empty fields show appropriate error messages
  - [ ] Invalid email format shows error
  - [ ] Real-time error clearing when typing
- [ ] **Authentication**
  - [ ] FastAPI authentication works (primary)
  - [ ] Supabase fallback authentication works
  - [ ] Valid credentials log user in successfully
  - [ ] Invalid credentials show appropriate error
  - [ ] Password visibility toggle works
- [ ] **Session Management**
  - [ ] User remains logged in after page refresh
  - [ ] Authentication context updates correctly
  - [ ] Redirect to home page after successful login
- [ ] **UI/UX**
  - [ ] Loading states during login
  - [ ] Responsive design on mobile devices
  - [ ] Link to registration page works

#### Navigation & Context
- [ ] **Navbar Updates**
  - [ ] Shows "Sign In" and "Sign Up" when logged out
  - [ ] Shows user menu when logged in
  - [ ] Sign out functionality works
- [ ] **Protected Routes**
  - [ ] Authentication context provides correct user state
  - [ ] Loading states handled properly
  - [ ] Session refresh works correctly

### FastAPI Integration Testing

#### Automated Test Scripts
The project includes comprehensive test scripts for FastAPI integration:

1. **Basic Endpoint Testing** (`test-scripts/test-fastapi-simple.js`)
   - Tests user registration and login endpoints
   - Validates token generation and authentication
   - Verifies basic API functionality

2. **Complete Flow Testing** (`test-scripts/test-complete-flow.js`)
   - End-to-end testing of user registration, login, poll creation, voting, and results
   - Comprehensive validation of all FastAPI endpoints
   - Error handling and edge case testing

3. **Frontend Integration Testing** (`test-scripts/test-frontend-fastapi.js`)
   - Tests FastAPI client integration with frontend
   - Validates authentication flow through UI components
   - Ensures proper error handling and user feedback

#### Running Test Scripts
```bash
# Run complete flow test
node test-scripts/test-complete-flow.js

# Run basic endpoint test
node test-scripts/test-fastapi-simple.js

# Run frontend integration test
node test-scripts/test-frontend-fastapi.js
```

#### Manual API Testing
```bash
# Test user registration
curl -X POST "http://localhost:8000/register" \
     -H "Content-Type: application/json" \
     -d '{"username": "testuser", "email": "test@example.com", "password": "testpass123"}'

# Test user login
curl -X POST "http://localhost:8000/login" \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "username=testuser&password=testpass123"

# Test poll creation (requires authentication token)
curl -X POST "http://localhost:8000/polls" \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN_HERE" \
     -d '{"title": "Test Poll", "description": "A test poll", "options": ["Option 1", "Option 2"]}'

# Test voting (requires authentication token)
curl -X POST "http://localhost:8000/polls/1/vote" \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN_HERE" \
     -d '{"option_id": 1}'
```

#### Interactive API Documentation
- Navigate to `http://localhost:8000/docs` for Swagger UI
- Navigate to `http://localhost:8000/redoc` for ReDoc documentation
- Test all endpoints interactively with built-in authentication

### Test Scenarios

1. **New User Registration**
   - Navigate to `/auth/register`
   - Fill out the form with valid information
   - Verify email confirmation (if enabled)
   - Check that user can log in after confirmation

2. **Existing User Login**
   - Navigate to `/auth/login`
   - Enter valid credentials
   - Verify successful authentication and redirect

3. **Error Handling**
   - Try registering with an existing email
   - Try logging in with invalid credentials
   - Test network error scenarios

4. **Session Persistence**
   - Log in and refresh the page
   - Close and reopen the browser
   - Verify session is maintained

## 🗄️ Database Schema

The Polly Pro application uses a PostgreSQL database hosted on Supabase with the following schema design:

### Tables Overview

#### 1. **polls** - Main poll entities
```sql
CREATE TABLE public.polls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    is_anonymous BOOLEAN DEFAULT false NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    poll_category TEXT DEFAULT 'general' NOT NULL,
    poll_visibility TEXT DEFAULT 'public' NOT NULL CHECK (poll_visibility IN ('public', 'private')),
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE
);
```

#### 2. **poll_options** - Available choices for each poll
```sql
CREATE TABLE public.poll_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    poll_id UUID REFERENCES public.polls(id) ON DELETE CASCADE NOT NULL,
    text TEXT NOT NULL,
    vote_count INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);
```

#### 3. **votes** - User voting records
```sql
CREATE TABLE public.votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    poll_id UUID REFERENCES public.polls(id) ON DELETE CASCADE NOT NULL,
    option_id UUID REFERENCES public.poll_options(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Ensures one vote per user per poll
    UNIQUE(poll_id, user_id)
);
```

### Relationships

```
auth.users (Supabase Auth)
    ↓ (1:many)
polls
    ↓ (1:many)
poll_options
    ↑ (many:1)
votes ← (many:1) → auth.users
```

### Key Features

#### **Voting Restrictions**
- **One Vote Per Poll**: Each user can only vote once per poll (enforced by `UNIQUE(poll_id, user_id)`)
- **Anonymous Voting**: Supports anonymous polls where vote details are hidden
- **Vote Tracking**: Automatic vote count updates via database triggers

#### **Poll Organization**
- **Categories**: Polls can be organized by category (e.g., 'general', 'work', 'entertainment')
- **Visibility**: Polls can be 'public' (visible to all) or 'private' (restricted access)
- **Expiration**: Optional expiration dates for time-limited polls

#### **Security & Access Control**
- **Row Level Security (RLS)**: Enabled on all tables with comprehensive policies
- **User Ownership**: Poll creators have full control over their polls
- **Anonymous Support**: Allows voting without user authentication (user_id can be NULL)

### Database Policies

#### **Polls Table Policies**
- Users can view active public polls
- Users can view their own polls regardless of visibility
- Only poll creators can update/delete their polls

#### **Poll Options Policies**
- Anyone can view options for active polls
- Only poll creators can manage their poll options

#### **Votes Table Policies**
- Users can view non-anonymous votes for active polls
- Users can view their own votes
- Authenticated users can vote on active, non-expired polls

### Performance Optimizations

#### **Indexes**
```sql
-- Performance indexes
CREATE INDEX idx_polls_created_by ON public.polls(created_by);
CREATE INDEX idx_polls_created_at ON public.polls(created_at DESC);
CREATE INDEX idx_polls_is_active ON public.polls(is_active);
CREATE INDEX idx_polls_expires_at ON public.polls(expires_at);
CREATE INDEX idx_poll_options_poll_id ON public.poll_options(poll_id);
CREATE INDEX idx_votes_poll_id ON public.votes(poll_id);
CREATE INDEX idx_votes_user_id ON public.votes(user_id);
```

#### **Triggers**
- **Auto-update timestamps**: Automatically updates `updated_at` fields
- **Vote count maintenance**: Automatically increments/decrements vote counts on poll options

### Migration Notes

The schema includes:
- **Backward Compatibility**: Designed to support future feature additions
- **Data Integrity**: Foreign key constraints ensure referential integrity
- **Scalability**: Optimized for performance with proper indexing
- **Security**: Comprehensive RLS policies for data protection

For the complete schema with all policies, triggers, and sample data, see: <mcfile name="schema.sql" path="database/schema.sql"></mcfile>

## 🔐 Authentication Architecture

### Client-Side Authentication
- **Supabase Client**: Browser-side authentication using `@supabase/auth-helpers-nextjs`
- **Context Provider**: React Context for global authentication state
- **Form Components**: Reusable login and registration forms with validation

### Server-Side Authentication
- **Server Client**: Server-side Supabase client for protected routes
- **Cookie Management**: Automatic cookie handling for session persistence
- **Middleware**: Authentication middleware for route protection

### Security Features
- **Password Validation**: Minimum length and strength requirements
- **Email Validation**: Client-side email format validation
- **CSRF Protection**: Built-in CSRF protection with Supabase
- **Secure Cookies**: HTTP-only cookies for session management

## 📋 Changelog

### Version 1.1.0 - UI Enhancement Update (Current)

#### Added
- **Enhanced Form System**: Complete overhaul of authentication and poll creation forms
  - Real-time validation with immediate feedback
  - Password strength indicators
  - Field-level error states with animations
  - Improved accessibility features

- **Animation Framework**: Comprehensive animation system for better UX
  - `AnimatedContainer` component with 11 animation types
  - Form-specific transitions for smooth interactions
  - Success state animations with celebration effects
  - Loading state animations with multiple variants

- **Error Handling System**: Unified error management across the application
  - `ErrorDisplay` component with multiple variants (alert, card, inline, toast)
  - Severity levels with appropriate styling
  - Auto-dismiss and retry functionality
  - Copy-to-clipboard for error details

- **Success Feedback System**: Contextual success states for different actions
  - Form-specific success components (login, registration, poll creation)
  - Multiple feedback types (checkmark, celebration, progress, toast)
  - Auto-redirect functionality with countdown
  - Share functionality for poll creation success

- **Reusable UI Components**: Enhanced component library
  - `FormField` component with validation states
  - `LoadingButton` with multiple states and animations
  - `FormTransitions` for smooth form interactions
  - `ValidationFeedback` for real-time validation display

#### Enhanced
- **Login Form**: Added real-time validation, loading states, and success feedback
- **Registration Form**: Enhanced with password strength indicator and improved UX
- **Poll Creation Form**: Improved validation, preview functionality, and success states
- **Overall UX**: Smooth transitions, micro-interactions, and visual feedback throughout

#### Technical Improvements
- TypeScript interfaces for all new components
- Comprehensive JSDoc documentation
- Accessibility features (ARIA labels, keyboard navigation, screen reader support)
- Performance optimizations with hardware-accelerated animations
- Responsive design patterns for mobile-first approach

### Version 1.0.0 - Authentication System Implementation
- **Added**: Complete Supabase authentication integration
- **Added**: Login form component with validation and error handling
- **Added**: Registration form component with password strength indicator
- **Added**: Authentication context provider for global state management
- **Added**: Server-side and client-side Supabase client configuration
- **Added**: Authentication pages with responsive design
- **Enhanced**: Navbar with authentication state awareness
- **Enhanced**: Form validation with real-time feedback
- **Enhanced**: Password visibility toggles and security features
- **Enhanced**: Comprehensive error handling and user feedback
- **Enhanced**: Loading states and accessibility improvements

## 🤖 AI Usage and Development Notes

This project was developed with significant AI assistance, demonstrating modern AI-powered development workflows:

### AI Tools and Contexts Used

#### **Code Generation and Architecture**
- **AI Assistant**: Claude 4 Sonnet via Trae AI IDE
- **Code Scaffolding**: AI-generated component structures, API clients, and database schemas
- **Architecture Decisions**: AI-guided hybrid backend architecture (Supabase + FastAPI)
- **Best Practices**: AI-suggested TypeScript patterns, React hooks, and error handling

#### **Development Workflow**
- **Real-time Code Review**: AI-powered code analysis and improvement suggestions
- **Documentation Generation**: AI-assisted README creation and code documentation
- **Testing Strategies**: AI-recommended testing approaches and test case generation
- **Performance Optimization**: AI-identified database index optimizations

#### **Problem Solving Approach**
- **Iterative Development**: AI-guided step-by-step feature implementation
- **Error Resolution**: AI-assisted debugging and error handling improvements
- **Integration Challenges**: AI-helped resolve authentication flow and backend integration issues
- **Code Refactoring**: AI-suggested improvements for maintainability and performance

### Key AI Contributions

1. **FastAPI Integration**: AI designed the hybrid architecture and Python client implementation
2. **Authentication Flow**: AI resolved complex redirect issues and session management
3. **Database Optimization**: AI identified and resolved performance bottlenecks
4. **UI/UX Enhancements**: AI-generated animation systems and form validation patterns
5. **Error Handling**: AI-created comprehensive error management system

### Development Insights

- **AI Pair Programming**: Effective for rapid prototyping and architecture decisions
- **Code Quality**: AI suggestions improved code consistency and best practices adherence
- **Documentation**: AI significantly accelerated comprehensive documentation creation
- **Learning Acceleration**: AI explanations enhanced understanding of complex concepts

## 🚀 Deployment

### Frontend Deployment (Vercel/Netlify)
```bash
# Build the application
npm run build

# Deploy to Vercel
vercel --prod

# Or deploy to Netlify
netlify deploy --prod --dir=.next
```

### Backend Deployment (FastAPI)
```bash
# Using Docker
docker build -t polly-api .
docker run -p 8000:8000 polly-api

# Using cloud platforms (Railway, Render, etc.)
# Follow platform-specific deployment guides
```

### Environment Variables for Production
Ensure all environment variables are properly configured in your deployment environment:
- Supabase credentials
- FastAPI configuration
- Database connection strings
- Security keys and tokens

## 📸 Screenshots

### Authentication Flow
*[Screenshots to be added by user]*

### Dashboard and Polls
*[Screenshots to be added by user]*

### Mobile Responsive Design
*[Screenshots to be added by user]*

### Admin Panel
*[Screenshots to be added by user]*

## 📄 License

This project is licensed under the MIT License.
