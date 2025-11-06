# Storage Policies Setup - Step by Step

## IMPORTANT: Run these commands ONE BY ONE in your Supabase SQL Editor

### Step 1: Create storage bucket (run this first)
```sql
INSERT INTO storage.buckets (id, name, public) VALUES ('videos', 'videos', true);
```
**Note:** If you get an error that the bucket already exists, that's fine - just continue to the next step.

### Step 2: Create SELECT policy (run this)
```sql
CREATE POLICY "Anyone can view videos" ON storage.objects
  FOR SELECT USING (bucket_id = 'videos');
```

### Step 3: Create INSERT policy (run this)
```sql
CREATE POLICY "Users can upload videos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'videos' AND auth.role() = 'authenticated');
```

### Step 4: Create UPDATE policy (run this)
```sql
CREATE POLICY "Users can update videos" ON storage.objects
  FOR UPDATE USING (bucket_id = 'videos' AND auth.role() = 'authenticated');
```

### Step 5: Create DELETE policy (run this)
```sql
CREATE POLICY "Users can delete videos" ON storage.objects
  FOR DELETE USING (bucket_id = 'videos' AND auth.role() = 'authenticated');
```

### Step 6: Grant permissions (run this)
```sql
GRANT USAGE ON SCHEMA storage TO authenticated;
GRANT ALL ON storage.objects TO authenticated;
```

### Step 7: Check if policies were created (run this)
```sql
SELECT policyname, cmd FROM pg_policies 
WHERE schemaname = 'storage' AND tablename = 'objects';
```

## Alternative: If you get conflicts, run this first to clear existing policies:
```sql
DROP POLICY IF EXISTS "Anyone can view videos" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload videos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update videos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete videos" ON storage.objects;
```

## Alternative: If you prefer to create the bucket manually:
1. Go to your Supabase Dashboard → Storage
2. Create a new bucket named "videos"
3. Make it public
4. Then just run steps 2-7 above