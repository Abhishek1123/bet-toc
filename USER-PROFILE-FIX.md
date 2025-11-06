# User Profile Missing - Solution Guide

## The Issue
Your video upload is failing because the user profile is missing from the `public.users` table. This happens when:
1. The user was created before the trigger was set up
2. The trigger isn't working properly
3. There's a permissions issue

## Quick Fix (Run in Supabase SQL Editor)

### Option 1: Create missing profiles for all users
```sql
-- Create missing user profiles
INSERT INTO public.users (id, email, username, full_name, avatar_url)
SELECT 
  auth.users.id,
  auth.users.email,
  COALESCE(auth.users.raw_user_meta_data->>'username', 'user_' || substr(auth.users.id::text, 1, 8)),
  auth.users.raw_user_meta_data->>'full_name',
  auth.users.raw_user_meta_data->>'avatar_url'
FROM auth.users
LEFT JOIN public.users ON auth.users.id = public.users.id
WHERE public.users.id IS NULL;
```

### Option 2: Recreate the trigger (run these one by one)
```sql
-- Drop existing trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Recreate the function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, username, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
```

## Testing
After running either option:
1. Check if profiles were created: `SELECT COUNT(*) FROM public.users;`
2. Try uploading a video again
3. If it still fails, try logging out and logging back in

## Long-term Prevention
The trigger should automatically create profiles for new users. If users still get created without profiles, check:
1. RLS policies on the `users` table
2. The `auth.users` table permissions