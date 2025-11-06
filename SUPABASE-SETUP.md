# 🚀 Supabase Cloud Setup Guide

## Quick Fix for "permission denied to set parameter" Error

### What was wrong:
The SQL schema had a line trying to set database parameters that require special privileges on Supabase cloud.

### What I fixed:
Removed the problematic line: `ALTER DATABASE postgres SET "app.settings.jwt_secret" TO 'your-jwt-secret';`

## 📋 Complete Setup Steps:

### 1. **Database Setup**
```
1. Go to https://supabase.com/dashboard
2. Create new project or select existing
3. Go to SQL Editor (left sidebar)
4. Copy entire content from supabase-schema.sql
5. Click "Run" to execute
```

### 2. **Get Environment Variables**
```
In Supabase Dashboard:
1. Go to Settings → API
2. Copy:
   - Project URL → NEXT_PUBLIC_SUPABASE_URL
   - anon public key → NEXT_PUBLIC_SUPABASE_ANON_KEY  
   - service_role key → SUPABASE_SERVICE_ROLE_KEY
```

### 3. **Update Your .env.local**
```bash
# Copy from .env.local.example and fill in your values
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. **Create Storage Bucket**
```
1. In Supabase Dashboard → Storage
2. Click "Create a new bucket"
3. Name: "videos"
4. Public bucket: YES (important!)
5. Click "Create bucket"
```

### 5. **Test the App**
```bash
npm run dev
# Visit http://localhost:3000/auth to sign up
```

## ✅ What This Fixes:
- ❌ `permission denied to set parameter "app.settings.jwt_secret"`
- ✅ Clean database setup for cloud Supabase
- ✅ All tables, triggers, and RLS policies
- ✅ Automatic user profile creation on signup
- ✅ Real-time data sync

## 🔧 What the Schema Includes:
- **Users table** - Extended profiles for auth users
- **Videos table** - Video metadata and URLs  
- **Likes table** - User-video relationships
- **Comments table** - Nested comment system
- **Follows table** - User following relationships
- **Video_views table** - Analytics tracking
- **RLS Policies** - Secure data access
- **Triggers** - Auto-update counters
- **Functions** - View count increment, etc.

## 🚨 Important Notes:
- Keep `SUPABASE_SERVICE_ROLE_KEY` secret (never expose to frontend)
- Storage bucket must be PUBLIC for video playback
- RLS policies are enabled for security
- User profiles are created automatically on signup

Your TikTok clone should now work perfectly with Supabase cloud! 🎉
