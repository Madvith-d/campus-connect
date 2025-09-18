-- Run these queries in your Supabase SQL Editor to verify bucket configuration

-- 1. Check if the bucket exists
SELECT * FROM storage.buckets WHERE id = 'event-images';

-- 2. Check storage policies for the bucket
SELECT * FROM storage.policies WHERE bucket_id = 'event-images';

-- 3. Check if bucket is public
SELECT id, name, public, created_at FROM storage.buckets WHERE id = 'event-images';

-- 4. If bucket doesn't exist, create it
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-images', 'event-images', true)
ON CONFLICT (id) DO NOTHING;

-- 5. List all available buckets
SELECT id, name, public FROM storage.buckets ORDER BY created_at;




