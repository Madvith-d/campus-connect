# Storage Upload Troubleshooting Guide

## 🐛 Common Issues and Solutions

### Issue: "mime type application/json is not supported"

This error typically occurs when:

1. **Storage bucket doesn't exist or isn't properly configured**
2. **Storage policies are missing or incorrect**
3. **File is being processed incorrectly before upload**

## 🔧 Step-by-Step Debugging

### Step 1: Test Storage Bucket

1. **Open the Create Event dialog**
2. **Click the "Test Storage" button** (next to "Event Poster" label)
3. **Check the browser console** for detailed logs
4. **Look for the toast notification** showing test results

### Step 2: Verify Storage Configuration

**Check if bucket exists:**
```sql
SELECT * FROM storage.buckets WHERE id = 'event-images';
```

**Should return:**
- id: 'event-images'
- name: 'event-images'  
- public: true

### Step 3: Verify Storage Policies

Go to **Supabase Dashboard** → **Storage** → **Policies** and ensure these 4 policies exist:

1. **"Authenticated users can upload event images"** (INSERT)
2. **"Public can view event images"** (SELECT)
3. **"Authenticated users can update event images"** (UPDATE)
4. **"Authenticated users can delete event images"** (DELETE)

### Step 4: Check File Selection

When you select a file, check the browser console for:
```
File selected: {
  name: "image.jpg",
  type: "image/jpeg",
  size: 1234567,
  lastModified: 1234567890
}
```

**If the type shows anything other than `image/*`, there's a file selection issue.**

## 🚨 Quick Fixes

### Fix 1: Recreate Storage Bucket

```sql
-- Delete existing bucket (if any)
DELETE FROM storage.buckets WHERE id = 'event-images';

-- Recreate bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-images', 'event-images', true);
```

### Fix 2: Check Storage Policies

If policies are missing, create them via **Supabase Dashboard**:

1. Go to **Storage** → **Policies**
2. Click **"New Policy"** for the `event-images` bucket
3. Create each policy with the exact settings from the setup guide

### Fix 3: Test with Simple Image

Try uploading a simple image file (JPG or PNG) that's:
- Under 1MB in size
- Standard image format
- Not corrupted

## 🔍 Debug Information

### Console Logs to Check

When testing, look for these console messages:

✅ **Good signs:**
```
Testing storage bucket...
Available buckets: [...]
event-images bucket found: {...}
Test upload successful: {...}
Uploading file: { name: "test.jpg", type: "image/jpeg", size: 123456, path: "event-posters/..." }
Upload successful: https://...
```

❌ **Bad signs:**
```
StorageApiError: mime type application/json is not supported
event-images bucket not found!
Test upload failed: {...}
Upload error: {...}
```

### Network Tab

Check the **Network tab** in browser dev tools:
1. Look for requests to `storage/v1/object/upload`
2. Check the request payload
3. Verify the `Content-Type` header is correct

## 🆘 If Nothing Works

### Alternative: Use External Image URLs

If storage continues to fail, you can temporarily use external image URLs:

1. **Upload images to a service like Imgur, Cloudinary, or any image hosting**
2. **Use the URL input field** in the event creation form
3. **The gradient generation will still work** with external URLs

### Manual Storage Setup

If the automated setup fails:

1. **Go to Supabase Dashboard** → **Storage**
2. **Create bucket manually** with name `event-images`
3. **Set bucket to public**
4. **Add policies manually** through the UI
5. **Test upload through the dashboard**

## 📞 Getting Help

If you're still having issues:

1. **Check the browser console** for detailed error messages
2. **Run the storage test** and share the results
3. **Verify your Supabase project settings**
4. **Check if you have the correct permissions**

The storage test button in the Create Event dialog will help identify exactly where the issue is occurring.



