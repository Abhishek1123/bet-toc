-- Fix Missing User Profiles
-- Run this in your Supabase SQL Editor to create missing user profiles

-- 1. First, let's check if there are any auth.users without profiles
SELECT 
  auth.users.id,
  auth.users.email,
  auth.users.raw_user_meta_data
FROM auth.users
LEFT JOIN public.users ON auth.users.id = public.users.id
WHERE public.users.id IS NULL;

-- 2. Create missing user profiles
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

-- 3. Ensure the trigger function exists and works
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

-- 4. Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 5. Test: Check all users have profiles now
SELECT COUNT(*) as total_auth_users FROM auth.users;
SELECT COUNT(*) as users_with_profiles FROM public.users;

-- 6. Give authenticated users permission to select their own profile
GRANT SELECT ON public.users TO authenticated;