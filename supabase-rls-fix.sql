-- Fix RLS Policy Issues
-- Run this in your Supabase SQL Editor to resolve the video upload issue

-- 1. Ensure all authenticated users have profiles in public.users
INSERT INTO public.users (id, email, username, full_name, avatar_url)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'username', 'user_' || substr(au.id::text, 1, 8)),
  au.raw_user_meta_data->>'full_name',
  au.raw_user_meta_data->>'avatar_url'
FROM auth.users au
WHERE au.id NOT IN (SELECT id FROM public.users)
ON CONFLICT (id) DO NOTHING;

-- 2. Create a function to ensure user profile exists
CREATE OR REPLACE FUNCTION ensure_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert user profile if it doesn't exist
  INSERT INTO public.users (id, email, username, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Recreate the trigger if it doesn't exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE ensure_user_profile();

-- 4. Create a function to handle existing users (run this manually if needed)
CREATE OR REPLACE FUNCTION backfill_user_profiles()
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.users (id, email, username, full_name, avatar_url)
  SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'username', 'user_' || substr(au.id::text, 1, 8)),
    au.raw_user_meta_data->>'full_name',
    au.raw_user_meta_data->>'avatar_url'
  FROM auth.users au
  WHERE au.id NOT IN (SELECT id FROM public.users)
  ON CONFLICT (id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Test function - call this to check users
-- SELECT * FROM auth.users au LEFT JOIN public.users pu ON au.id = pu.id;
