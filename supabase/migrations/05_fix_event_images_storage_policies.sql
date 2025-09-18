-- =========================================================================
-- Campus Connect - Fix Event Images Storage Policies
-- =========================================================================
-- This migration fixes the overly restrictive storage policies for event images
-- that were preventing uploads during event creation.

-- First, drop the existing restrictive policy
DROP POLICY IF EXISTS "Club admins can upload event images" ON storage.objects;

-- Create a more flexible policy that allows club admins to upload event images
-- without requiring the event to exist first (for event creation flow)
CREATE POLICY "Club admins can upload event images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'event-images' AND
    (
      -- Allow college admins to upload anywhere in the bucket
      EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'college_admin')
      OR
      -- Allow club admins to upload to their clubs' folders
      EXISTS (
        SELECT 1 FROM public.club_members cm
        WHERE cm.profile_id = auth.uid() AND cm.role = 'admin'
      )
    )
  );

-- Add UPDATE policy for event images (allow club admins to update)
CREATE POLICY "Club admins can update event images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'event-images' AND
    (
      -- Allow college admins to update any event image
      EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'college_admin')
      OR
      -- Allow club admins to update their clubs' event images
      EXISTS (
        SELECT 1 FROM public.club_members cm
        WHERE cm.profile_id = auth.uid() AND cm.role = 'admin'
      )
    )
  );

-- Add DELETE policy for event images (allow club admins to delete)
CREATE POLICY "Club admins can delete event images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'event-images' AND
    (
      -- Allow college admins to delete any event image
      EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'college_admin')
      OR
      -- Allow club admins to delete their clubs' event images
      EXISTS (
        SELECT 1 FROM public.club_members cm
        WHERE cm.profile_id = auth.uid() AND cm.role = 'admin'
      )
    )
  );

-- Ensure the bucket exists with proper MIME type restrictions
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'event-images',
  'event-images',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- Add a comment explaining the policy changes
COMMENT ON POLICY "Club admins can upload event images" ON storage.objects IS 
'Allows club admins and college admins to upload event images. Simplified from the previous version that required events to exist first.';