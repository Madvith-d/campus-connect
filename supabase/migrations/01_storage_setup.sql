-- =========================================================================
-- Campus Connect - Storage and File Management Setup
-- =========================================================================
-- This migration sets up Supabase Storage buckets and policies for file uploads

-- -------------------------------------------------------------------------
-- 1. CREATE STORAGE BUCKETS
-- -------------------------------------------------------------------------

-- Bucket for user avatars
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
);

-- Bucket for club logos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'club-logos',
  'club-logos',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
);

-- Bucket for event images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'event-images',
  'event-images',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
);

-- Bucket for event documents and attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'event-documents',
  'event-documents',
  false, -- Private bucket
  52428800, -- 50MB limit
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
);

-- -------------------------------------------------------------------------
-- 2. STORAGE POLICIES
-- -------------------------------------------------------------------------

-- Avatar policies
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own avatar" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own avatar" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Club logo policies
CREATE POLICY "Club logos are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'club-logos');

CREATE POLICY "Club admins can upload club logos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'club-logos' AND
    (
      EXISTS (
        SELECT 1 FROM public.club_members cm
        JOIN public.clubs c ON cm.club_id = c.id
        WHERE cm.profile_id = auth.uid() AND cm.role = 'admin'
        AND c.id::text = (storage.foldername(name))[1]
      ) OR
      EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'college_admin')
    )
  );

CREATE POLICY "Club admins can update club logos" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'club-logos' AND
    (
      EXISTS (
        SELECT 1 FROM public.club_members cm
        JOIN public.clubs c ON cm.club_id = c.id
        WHERE cm.profile_id = auth.uid() AND cm.role = 'admin'
        AND c.id::text = (storage.foldername(name))[1]
      ) OR
      EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'college_admin')
    )
  );

-- Event image policies
CREATE POLICY "Event images are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'event-images');

CREATE POLICY "Club admins can upload event images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'event-images' AND
    (
      EXISTS (
        SELECT 1 FROM public.events e
        JOIN public.club_members cm ON e.club_id = cm.club_id
        WHERE cm.profile_id = auth.uid() AND cm.role = 'admin'
        AND e.id::text = (storage.foldername(name))[1]
      ) OR
      EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'college_admin')
    )
  );

-- Event document policies
CREATE POLICY "Event documents accessible to club members" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'event-documents' AND
    (
      EXISTS (
        SELECT 1 FROM public.events e
        JOIN public.club_members cm ON e.club_id = cm.club_id
        WHERE cm.profile_id = auth.uid()
        AND e.id::text = (storage.foldername(name))[1]
      ) OR
      EXISTS (
        SELECT 1 FROM public.events e
        JOIN public.registrations r ON e.id = r.event_id
        WHERE r.profile_id = auth.uid()
        AND e.id::text = (storage.foldername(name))[1]
      ) OR
      EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'college_admin')
    )
  );

CREATE POLICY "Club admins can upload event documents" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'event-documents' AND
    (
      EXISTS (
        SELECT 1 FROM public.events e
        JOIN public.club_members cm ON e.club_id = cm.club_id
        WHERE cm.profile_id = auth.uid() AND cm.role = 'admin'
        AND e.id::text = (storage.foldername(name))[1]
      ) OR
      EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'college_admin')
    )
  );

-- -------------------------------------------------------------------------
-- 3. HELPER FUNCTIONS FOR STORAGE
-- -------------------------------------------------------------------------

-- Function to get avatar URL
CREATE OR REPLACE FUNCTION public.get_avatar_url(user_uuid UUID)
RETURNS TEXT AS $$
DECLARE
  avatar_path TEXT;
BEGIN
  SELECT avatar_url INTO avatar_path
  FROM public.profiles
  WHERE user_id = user_uuid;
  
  IF avatar_path IS NOT NULL THEN
    RETURN avatar_path;
  ELSE
    RETURN NULL;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to get club logo URL
CREATE OR REPLACE FUNCTION public.get_club_logo_url(club_uuid UUID)
RETURNS TEXT AS $$
DECLARE
  logo_path TEXT;
BEGIN
  SELECT logo_url INTO logo_path
  FROM public.clubs
  WHERE id = club_uuid;
  
  IF logo_path IS NOT NULL THEN
    RETURN logo_path;
  ELSE
    RETURN NULL;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;