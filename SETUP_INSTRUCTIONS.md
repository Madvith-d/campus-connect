# Event Gradient Feature Setup Instructions

## Database Migrations Required

Run the following SQL migrations in your Supabase database to enable the event gradient feature:

### 1. Add Gradient Storage Fields

Run the migration file: `supabase/migrations/03_add_gradient_colors.sql`

```sql
-- Add gradient color fields to events table for persistent color theming
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS gradient_colors JSONB,
ADD COLUMN IF NOT EXISTS gradient_css TEXT;

-- Add comment explaining the fields
COMMENT ON COLUMN public.events.gradient_colors IS 'JSON object containing extracted color palette (vibrant, muted, darkVibrant, etc.)';
COMMENT ON COLUMN public.events.gradient_css IS 'Pre-computed CSS gradient string for performance';

-- Create an index on gradient_colors for potential future queries
CREATE INDEX IF NOT EXISTS idx_events_gradient_colors ON public.events USING GIN (gradient_colors);
```

### 2. Setup Storage Bucket for Event Images

#### Step 2A: Create Storage Bucket (SQL)

Run this part of the migration: `supabase/migrations/04_setup_event_images_storage.sql`

```sql
-- Create storage bucket for event images
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-images', 'event-images', true)
ON CONFLICT (id) DO NOTHING;
```

#### Step 2B: Create Storage Policies (Supabase Dashboard)

**⚠️ IMPORTANT:** Storage policies must be created through the Supabase Dashboard, not SQL.

1. Go to your **Supabase Dashboard**
2. Navigate to **Storage** → **Policies**
3. Find the `event-images` bucket (created in step 2A)
4. Click **"New Policy"** and create these 4 policies:

**Policy 1: Upload Images**
- **Name:** `Authenticated users can upload event images`
- **Operation:** `INSERT`
- **Target roles:** `authenticated`
- **USING expression:** `bucket_id = 'event-images'`
- **WITH CHECK expression:** `auth.role() = 'authenticated'`

**Policy 2: View Images**
- **Name:** `Public can view event images`
- **Operation:** `SELECT`
- **Target roles:** `public`
- **USING expression:** `bucket_id = 'event-images'`

**Policy 3: 12347**
- **Name:** `Authenticated users can update event images`
- **Operation:** `UPDATE`
- **Target roles:** `authenticated`
- **USING expression:** `bucket_id = 'event-images' AND auth.role() = 'authenticated'`

**Policy 4: Delete Images**
- **Name:** `Authenticated users can delete event images`
- **Operation:** `DELETE`
- **Target roles:** `authenticated`
- **USING expression:** `bucket_id = 'event-images' AND auth.role() = 'authenticated'`

## How to Run Migrations

### Option 1: Using Supabase CLI (Recommended)

If you have Supabase CLI installed:

```bash
# Navigate to your project directory
cd campus-connect

# Apply the gradient migration
supabase db push

# Then manually create storage policies via Dashboard (see Step 2B above)
```

### Option 2: Using Supabase Dashboard

**Step 1: Run SQL Migrations**
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the SQL from `03_add_gradient_colors.sql`
4. Run it to add gradient columns

**Step 2: Create Storage Bucket**
1. In **SQL Editor**, copy and paste the bucket creation SQL from `04_setup_event_images_storage.sql`
2. Run it to create the `event-images` bucket

**Step 3: Create Storage Policies**
1. Go to **Storage** → **Policies**
2. Follow the instructions in Step 2B above to create the 4 required policies

### Option 3: Using psql (if you have direct database access)

```bash
# Connect to your database
psql "postgresql://postgres:[password]@[host]:[port]/postgres"

# Run migrations
\i supabase/migrations/03_add_gradient_colors.sql
\i supabase/migrations/04_setup_event_images_storage.sql
```

## Verification

After running the migrations, verify they worked by checking:

### 1. Database Schema

```sql
-- Check if gradient columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'events' 
AND column_name IN ('gradient_colors', 'gradient_css');

-- Should return:
-- gradient_colors | jsonb
-- gradient_css    | text
```

### 2. Storage Bucket

```sql
-- Check if storage bucket was created
SELECT * FROM storage.buckets WHERE id = 'event-images';

-- Should return one row with:
-- id: event-images
-- name: event-images  
-- public: true
```

### 3. Storage Policies

```sql
-- Check storage policies
SELECT * FROM storage.policies WHERE bucket_id = 'event-images';

-- Should return 4 policies for INSERT, SELECT, UPDATE, DELETE
```

## Features Available After Setup

✅ **Event Creation with Poster Upload**
- Upload poster images when creating events
- Automatic gradient generation from poster colors
- Image preview in creation form

✅ **Gradient-Enhanced Event Cards**
- Beautiful gradient backgrounds extracted from poster images
- Smooth color blending with existing UI
- Automatic fallback gradients when no poster is available

✅ **Performance Optimization**
- Cached gradient colors in database
- Pre-computed CSS gradients
- No re-processing of the same images

✅ **Demo Page**
- Visit `/gradient-demo` to test color extraction
- Upload custom images to see gradient generation
- Interactive demonstration of the feature

## Testing the Feature

1. **Create an Event with Poster**:
   - Go to Events page
   - Click "Create Event"
   - Upload a poster image
   - Submit the form
   - The event card will automatically show a gradient background

2. **Test the Demo Page**:
   - Navigate to `/gradient-demo`
   - Enter an image URL
   - Click "Extract Gradient"
   - See the color extraction and gradient generation in action

3. **Verify Gradient Persistence**:
   - Refresh the Events page
   - The gradient should remain the same (cached in database)
   - No re-processing should occur

## Troubleshooting

### Common Issues

1. **"Storage bucket not found" error**:
   - Make sure you ran the storage migration (`04_setup_event_images_storage.sql`)
   - Check that the bucket was created in Supabase dashboard

2. **"Permission denied" for image upload**:
   - Verify storage policies were created correctly
   - Check that user is authenticated

3. **Gradient not generating**:
   - Check browser console for errors
   - Verify node-vibrant import is working
   - Test with a simple image URL first

4. **Database columns missing**:
   - Ensure you ran the gradient migration (`03_add_gradient_colors.sql`)
   - Check the events table schema

### Support

If you encounter issues:
1. Check the browser console for error messages
2. Verify all migrations ran successfully
3. Test with the demo page first to isolate issues
4. Check Supabase logs for any database errors

## Next Steps

After successful setup, you can:
- Create events with beautiful gradient backgrounds
- Customize gradient styles in the CSS
- Add more gradient options (animated gradients, etc.)
- Implement admin controls for gradient selection
