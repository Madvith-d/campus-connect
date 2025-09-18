# Quick Setup Guide - Event Gradient Feature

## 🚀 Step-by-Step Setup

### Step 1: Add Gradient Database Fields

**Run this SQL in your Supabase SQL Editor:**

```sql
-- Add gradient color fields to events table
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS gradient_colors JSONB,
ADD COLUMN IF NOT EXISTS gradient_css TEXT;

-- Add comments
COMMENT ON COLUMN public.events.gradient_colors IS 'JSON object containing extracted color palette (vibrant, muted, darkVibrant, etc.)';
COMMENT ON COLUMN public.events.gradient_css IS 'Pre-computed CSS gradient string for performance';

-- Create index
CREATE INDEX IF NOT EXISTS idx_events_gradient_colors ON public.events USING GIN (gradient_colors);
```

### Step 2: Create Storage Bucket

**Run this SQL in your Supabase SQL Editor:**

```sql
-- Create storage bucket for event images
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-images', 'event-images', true)
ON CONFLICT (id) DO NOTHING;
```

### Step 3: Create Storage Policies (Via Dashboard)

**Go to Supabase Dashboard → Storage → Policies**

1. **Find the `event-images` bucket**
2. **Click "New Policy"** and create these 4 policies:

#### Policy 1: Upload Images
- **Name:** `Authenticated users can upload event images`
- **Operation:** `INSERT`
- **Target roles:** `authenticated`
- **USING:** `bucket_id = 'event-images'`
- **WITH CHECK:** `auth.role() = 'authenticated'`

#### Policy 2: View Images
- **Name:** `Public can view event images`
- **Operation:** `SELECT`
- **Target roles:** `public`
- **USING:** `bucket_id = 'event-images'`

#### Policy 3: Update Images
- **Name:** `Authenticated users can update event images`
- **Operation:** `UPDATE`
- **Target roles:** `authenticated`
- **USING:** `bucket_id = 'event-images' AND auth.role() = 'authenticated'`

#### Policy 4: Delete Images
- **Name:** `Authenticated users can delete event images`
- **Operation:** `DELETE`
- **Target roles:** `authenticated`
- **USING:** `bucket_id = 'event-images' AND auth.role() = 'authenticated'`

## ✅ Verification

After setup, verify everything works:

1. **Check Database:**
   ```sql
   SELECT column_name FROM information_schema.columns 
   WHERE table_name = 'events' 
   AND column_name IN ('gradient_colors', 'gradient_css');
   ```

2. **Check Storage:**
   ```sql
   SELECT * FROM storage.buckets WHERE id = 'event-images';
   ```

3. **Test the Feature:**
   - Go to Events page
   - Click "Create Event"
   - Upload a poster image
   - See the gradient background generated!

## 🎯 What's Working Now

✅ **Event Creation with Poster Upload**
- Upload poster images when creating events
- Automatic gradient generation from poster colors
- Beautiful gradient backgrounds on event cards

✅ **Demo Page**
- Visit `/gradient-demo` to test color extraction
- Upload custom images to see gradient generation

✅ **Performance**
- Cached gradient colors in database
- No re-processing of the same images

## 🐛 Troubleshooting

**If you get permission errors:**
- Make sure you created all 4 storage policies via Dashboard
- Check that the `event-images` bucket exists and is public

**If gradients don't generate:**
- Check browser console for errors
- Test with the demo page first
- Verify the image uploads successfully

**If upload fails:**
- Check that storage policies are correctly configured
- Verify the bucket is public
- Check file size (max 5MB) and type (images only)

## 🎨 Ready to Use!

Once setup is complete, you can:
- Create events with beautiful gradient backgrounds
- Upload poster images for automatic color extraction
- See unique gradients for each event
- Enjoy the enhanced visual appeal of your event cards!

The feature is now fully functional! 🚀



