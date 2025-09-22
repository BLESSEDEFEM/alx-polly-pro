# ALX Polly Pro 2 - Advanced Polling Application

A modern, feature-rich polling application built with Next.js 15, TypeScript, and Supabase. Create, share, and analyze polls with real-time voting, interactive charts, and QR code sharing.

## 🚀 Features

### Core Functionality
- **Poll Creation**: Create polls with multiple options, expiration dates, and privacy settings
- **Real-time Voting**: Cast votes with duplicate prevention and instant updates
- **Interactive Results**: View results with bar charts, pie charts, and detailed analytics
- **QR Code Sharing**: Generate QR codes for easy poll access
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices

### Advanced Features
- **User Authentication**: Secure login/registration with Supabase Auth
- **Poll Management**: Dashboard for managing your polls
- **Public/Private Polls**: Control poll visibility and access
- **Multiple Vote Options**: Allow single or multiple choice voting
- **Export Results**: Download poll results as CSV files
- **Share Functionality**: Share polls via URL, QR code, or social media

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS, Radix UI Components
- **Backend**: Supabase (Database, Auth, Real-time)
- **Charts**: Recharts for data visualization
- **QR Codes**: qrcode library for QR generation
- **Deployment**: Vercel (recommended)

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd alx-polly-pro2
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Fill in your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   ```

4. **Set up the database**
   - Create a new Supabase project
   - Run the SQL schema from `database/schema.sql`
   - Enable Row Level Security (RLS) policies

5. **Start the development server**
   ```bash
   npm run dev
   ```

## 🗄️ Database Schema

The application uses the following main tables:

- **polls**: Store poll information (title, description, settings)
- **poll_options**: Store poll choices/options
- **votes**: Track user votes with duplicate prevention
- **user_profiles**: Extended user information

See `database/schema.sql` for the complete schema.

## 🚀 Deployment

### Vercel Deployment (Recommended)

1. **Connect to Vercel**
   - Push your code to GitHub/GitLab
   - Connect your repository to Vercel
   - Import the project

2. **Configure Environment Variables**
   Add the following environment variables in Vercel:
   ```
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY
   SUPABASE_SERVICE_ROLE_KEY
   NEXT_PUBLIC_APP_URL (your Vercel domain)
   ```

3. **Deploy**
   - Vercel will automatically build and deploy your application
   - Your app will be available at your Vercel domain

### Manual Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Start the production server**
   ```bash
   npm start
   ```

## 📱 Usage

### Creating a Poll
1. Sign up or log in to your account
2. Click "Create Poll" from the dashboard
3. Fill in poll details (title, description, options)
4. Set privacy and voting preferences
5. Publish your poll

### Voting on Polls
1. Access a poll via direct link or QR code
2. Select your preferred option(s)
3. Submit your vote
4. View real-time results

### Managing Polls
1. Access your dashboard to view all polls
2. Edit, delete, or share your polls
3. View detailed analytics and export results
4. Generate QR codes for easy sharing

## 🔧 Development

### Project Structure
```
src/
├── app/                 # Next.js app router pages
├── components/          # Reusable UI components
│   ├── ui/             # Base UI components
│   ├── polls/          # Poll-specific components
│   └── charts/         # Chart components
├── hooks/              # Custom React hooks
├── lib/                # Utility functions and configs
└── types/              # TypeScript type definitions
```

### Key Components
- **PollCard**: Display poll information and voting interface
- **PollResultsChart**: Interactive charts for results visualization
- **CreatePollForm**: Form for creating new polls
- **QRCodeComponent**: QR code generation and display

### Custom Hooks
- **usePoll**: Poll data fetching and voting logic
- **usePolls**: Poll management and CRUD operations
- **useAuth**: Authentication state management

## 🧪 Testing

Run the test suite:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

## 📊 Code Reviews

### Implemented Reviews/Improvements

1. **Component Architecture**: Modular component design with proper separation of concerns
2. **Type Safety**: Comprehensive TypeScript types for all data structures
3. **Error Handling**: Robust error handling with user-friendly messages
4. **Performance**: Optimized rendering with React hooks and memoization
5. **Accessibility**: ARIA labels and keyboard navigation support
6. **Security**: Input validation and SQL injection prevention

## 📝 Changelog

### Version 2.0.0 (Current)
- ✅ Implemented voting functionality with duplicate prevention
- ✅ Added QR code generation and sharing
- ✅ Built interactive results visualization with charts
- ✅ Created dedicated results page with export functionality
- ✅ Configured Vercel deployment setup
- ✅ Added comprehensive error handling and loading states

### Upcoming Features
- 🔄 Social media integration for poll sharing
- 🔄 Advanced analytics and insights
- 🔄 Poll templates and themes
- 🔄 Email notifications for poll updates

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [Issues](../../issues) page for existing solutions
2. Create a new issue with detailed information
3. Contact the development team

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Database and Auth by [Supabase](https://supabase.com/)
- UI Components by [Radix UI](https://www.radix-ui.com/)
- Charts by [Recharts](https://recharts.org/)
- Styling with [Tailwind CSS](https://tailwindcss.com/)
