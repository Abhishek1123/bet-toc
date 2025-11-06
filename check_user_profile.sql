-- Run this query to check if your user profile exists
SELECT 
  au.id as auth_user_id,
  au.email,
  pu.id as profile_user_id,
  pu.username,
  pu.full_name,
  pu.created_at as profile_created
FROM auth.users au 
LEFT JOIN public.users pu ON au.id = pu.id
ORDER BY au.created_at DESC;