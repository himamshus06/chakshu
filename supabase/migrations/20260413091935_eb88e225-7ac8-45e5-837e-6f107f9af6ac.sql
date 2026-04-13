
-- Fix 1: Make images bucket private and add ownership-scoped storage policies
UPDATE storage.buckets SET public = false WHERE id = 'images';

-- Drop any existing permissive storage policies for images bucket
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated reads" ON storage.objects;

-- Users can only access their own files (path must start with user's UUID)
CREATE POLICY "Users can view own images"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload own images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Fix 2: Add missing UPDATE policy on analyses table
CREATE POLICY "Users update own analyses"
ON public.analyses FOR UPDATE
USING (auth.uid() = user_id);
