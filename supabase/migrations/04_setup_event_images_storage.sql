-- Create storage bucket for event images
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-images', 'event-images', true)
ON CONFLICT (id) DO NOTHING;

-- NOTE: Storage policies must be created through Supabase Dashboard
-- Go to Storage > event-images bucket > Policies tab to add the following policies:

-- Policy 1: Authenticated users can upload event images
-- Name: "Authenticated users can upload event images"
-- Operation: INSERT
-- Target roles: authenticated
-- USING expression: bucket_id = 'event-images'
-- WITH CHECK expression: auth.role() = 'authenticated'

-- Policy 2: Public can view event images  
-- Name: "Public can view event images"
-- Operation: SELECT
-- Target roles: public
-- USING expression: bucket_id = 'event-images'

-- Policy 3: Authenticated users can update event images
-- Name: "Authenticated users can update event images" 
-- Operation: UPDATE
-- Target roles: authenticated
-- USING expression: bucket_id = 'event-images' AND auth.role() = 'authenticated'

-- Policy 4: Authenticated users can delete event images
-- Name: "Authenticated users can delete event images"
-- Operation: DELETE  
-- Target roles: authenticated
-- USING expression: bucket_id = 'event-images' AND auth.role() = 'authenticated'
