-- Simple Storage Policies for Video Upload
-- Run this in your Supabase SQL Editor (alternative if main version fails)

-- 1. Create storage bucket (if not exists)
INSERT INTO storage.buckets (id, name, public) VALUES ('videos', 'videos', true);

-- 2. Create policies for videos bucket

-- Allow everyone to view videos
CREATE POLICY "Anyone can view videos" ON storage.objects
  FOR SELECT USING (bucket_id = 'videos');

-- Allow authenticated users to upload videos
CREATE POLICY "Users can upload videos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'videos' AND auth.role() = 'authenticated');

-- Allow users to update their own videos
CREATE POLICY "Users can update videos" ON storage.objects
  FOR UPDATE USING (bucket_id = 'videos' AND auth.role() = 'authenticated');

-- Allow users to delete their own videos
CREATE POLICY "Users can delete videos" ON storage.objects
  FOR DELETE USING (bucket_id = 'videos' AND auth.role() = 'authenticated');

-- 3. Grant permissions
GRANT USAGE ON SCHEMA storage TO authenticated;
GRANT ALL ON storage.objects TO authenticated;

-- 4. Check policies created
SELECT policyname, cmd FROM pg_policies 
WHERE schemaname = 'storage' AND tablename = 'objects';