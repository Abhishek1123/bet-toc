# TikTok Clone

A modern, fully responsive TikTok clone built with Next.js 14, TypeScript, and Supabase.

## Features

✅ **Core Features**
- User authentication (signup/login with Supabase Auth)
- Video upload with drag & drop
- Video feed with infinite scroll
- Like/unlike videos
- Comment system (nested comments)
- User profiles with follower/following
- Search functionality
- Responsive design (mobile-first)

## Tech Stack

- **Frontend**: Next.js 14+ with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Data Fetching**: React Query
- **Icons**: Lucide React
- **Forms**: React Hook Form
- **File Uploads**: React Dropzone
- **Video Playback**: React Player
- **Animations**: Framer Motion

## Database Schema

The project includes a complete Supabase database schema with:

- `users` - User profiles and metadata
- `videos` - Video metadata and URLs
- `likes` - User-video like relationships
- `comments` - Nested comment system
- `follows` - User following relationships
- `video_views` - Analytics and watch time tracking

## Project Structure

```
├── app/                    # Next.js App Router
│   ├── auth/              # Authentication pages
│   ├── api/               # API routes
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles
├── components/            # Reusable UI components
│   ├── ui/                # Base UI components
│   ├── AuthForm.tsx       # Authentication form
│   ├── VideoPlayer.tsx    # Video playback component
│   └── providers.tsx      # Context providers
├── hooks/                 # Custom React hooks
│   └── useAuth.tsx        # Authentication hook
├── lib/                   # Utility libraries
│   └── supabase.ts        # Supabase client
├── types/                 # TypeScript type definitions
│   └── database.ts        # Database types
└── supabase-schema.sql    # Database schema
```

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 3. Database Setup

#### Supabase Cloud (Recommended)
1. Create a project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the entire content of `supabase-schema.sql`
3. Go to Settings → API to get your environment variables
4. Create a storage bucket named "videos" (set to public)

**📖 For detailed Supabase setup, see [SUPABASE-SETUP.md](SUPABASE-SETUP.md)**

#### Local Development with Docker

```bash
docker-compose up -d
```

This will start:
- Supabase (port 54321)
- PostgreSQL (port 5432)

### 4. Storage Configuration

1. Create a storage bucket named "videos" in your Supabase dashboard
2. Set up storage policies for public read access

### 5. Run the Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## Database Policies

The project includes comprehensive Row Level Security (RLS) policies:

- Users can view all public data
- Users can only modify their own content
- Likes and follows are public but user-controlled
- Comments support nested replies
- Automatic counter updates for likes, comments, and follows

## Development Status

- ✅ Project structure and dependencies
- ✅ Database schema and RLS policies
- ✅ Authentication system
- ✅ Video player component
- ✅ Responsive UI layout
- ✅ Core features (likes, comments, follows)
- ✅ Docker configuration
- 🔄 Video upload functionality
- 🔄 Comment system UI
- 🔄 User profile pages
- 🔄 Search functionality
- 🔄 Infinite scroll feed
- 🔄 Mobile optimization

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file for details
