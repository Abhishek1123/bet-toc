# 🔧 Fix RLS Policy Error: "new row violates row-level security policy"

## 🚨 Problem
You're getting this error when uploading videos:
```
Failed to upload video: new row violates row-level security policy
```

## 🔍 Root Cause
This happens when:
1. User is authenticated in Supabase Auth but doesn't have a profile in `public.users` table
2. RLS policies are blocking the insert because the user profile is missing

## ✅ Solution Steps

### Step 1: Run the RLS Fix SQL
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **SQL Editor**
4. Copy and paste the contents of `supabase-rls-fix.sql`
5. Click **Run** to execute the script

### Step 2: Verify User Profile Exists
Run this query in SQL Editor to check if your user has a profile:
```sql
SELECT 
  au.id as auth_user_id,
  au.email,
  pu.id as profile_user_id,
  pu.username,
  pu.full_name
FROM auth.users au 
LEFT JOIN public.users pu ON au.id = pu.id;
```

If you see `NULL` in the `profile_user_id` column, your profile is missing.

### Step 3: Manual Profile Creation (if needed)
If Step 1 didn't work, manually create your profile:
```sql
INSERT INTO public.users (id, email, username, full_name, avatar_url)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'username', 'user_' || substr(au.id::text, 1, 8)),
  au.raw_user_meta_data->>'full_name',
  au.raw_user_meta_data->>'avatar_url'
FROM auth.users au
WHERE au.id = 'YOUR_USER_ID_HERE'
ON CONFLICT (id) DO NOTHING;
```

Replace `YOUR_USER_ID_HERE` with your actual user ID from the auth.users table.

### Step 4: Test the Fix
1. Refresh your app
2. Try uploading a video again
3. The error should be resolved!

## 🛠️ Alternative: Disable RLS (Not Recommended)
If you still have issues, you can temporarily disable RLS for testing:

```sql
ALTER TABLE public.videos DISABLE ROW LEVEL SECURITY;
```

**⚠️ Warning**: Only do this for development! Re-enable it after testing:
```sql
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
```

## 🔍 Debugging Tips

### Check Current User
Add this to your app to debug user state:
```typescript
const { user } = useAuth()
console.log('Current user:', user)
console.log('User ID:', user?.id)
```

### Check User Profile
Run this query to see all users and their profiles:
```sql
SELECT 
  u.id,
  u.email,
  u.username,
  u.created_at
FROM public.users u
ORDER BY u.created_at DESC;
```

### Check RLS Policies
View all RLS policies:
```sql
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public';
```

## 📋 Prevention
The trigger `on_auth_user_created` should automatically create user profiles when new users sign up. If it's not working:

1. Check if the trigger exists:
```sql
SELECT trigger_name, event_manipulation, action_statement 
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';
```

2. Recreate the trigger if missing (see `supabase-schema.sql`)

## 🆘 Still Having Issues?
If the problem persists:
1. Check Supabase logs in Dashboard → Logs
2. Verify your environment variables are correct
3. Ensure you're using the latest schema.sql
4. Try creating a test user to see if the issue is user-specific

## 📝 Summary
The RLS error is typically caused by missing user profiles. The SQL fix script should resolve this by:
- Creating missing user profiles
- Setting up proper triggers
- Ensuring RLS policies work correctly

After running the fix, video uploads should work smoothly! 🚀