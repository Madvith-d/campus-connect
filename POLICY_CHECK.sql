-- Run these queries to check and fix storage policies

-- 1. Check if policies exist
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
AND policyname LIKE '%event%';

-- 2. Check storage policies table directly
SELECT * FROM storage.policies WHERE bucket_id = 'event-images';

-- 3. If no policies exist, you'll need to create them via Dashboard
-- Go to Supabase Dashboard > Storage > Policies > event-images bucket
-- Add these 4 policies:

-- Policy 1: Upload
-- Name: "Authenticated users can upload event images"
-- Operation: INSERT
-- Target roles: authenticated
-- USING: bucket_id = 'event-images'
-- WITH CHECK: auth.role() = 'authenticated'

-- Policy 2: View
-- Name: "Public can view event images"  
-- Operation: SELECT
-- Target roles: public
-- USING: bucket_id = 'event-images'

-- Policy 3: Update
-- Name: "Authenticated users can update event images"
-- Operation: UPDATE
-- Target roles: authenticated
-- USING: bucket_id = 'event-images' AND auth.role() = 'authenticated'

-- Policy 4: Delete
-- Name: "Authenticated users can delete event images"
-- Operation: DELETE
-- Target roles: authenticated
-- USING: bucket_id = 'event-images' AND auth.role() = 'authenticated'

-- 4. Test bucket access
SELECT * FROM storage.buckets WHERE id = 'event-images';
