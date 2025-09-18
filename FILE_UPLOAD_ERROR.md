# File Upload Error Documentation

## 🚨 **Primary Issue**
**Error:** `StorageApiError: mime type application/json is not supported`

**Location:** Supabase Storage upload for event poster images
**Component:** `src/components/Events/CreateEventDialog.tsx`
**Function:** `uploadImage()` and `testStorageBucket()`

## 📋 **Context & Requirements**

### **Feature Being Implemented:**
- Event gradient feature that extracts colors from uploaded poster images
- Uses `node-vibrant` library for color extraction
- Generates smooth gradients for event cards
- Stores extracted colors and CSS gradients in database

### **Technology Stack:**
- **Frontend:** React + TypeScript + Vite
- **Backend:** Supabase (PostgreSQL + Storage)
- **UI:** TailwindCSS + shadcn/ui components
- **Color Extraction:** node-vibrant library

## 🔍 **Error Details**

### **Error Message:**
```
StorageApiError: mime type application/json is not supported
    at @supabase_supabase-j…?v=d031ae0b:3343:14
uploadImage	@	CreateEventDialog.tsx:185
await in uploadImage		
handleSubmit	@	CreateEventDialog.tsx:303
```

### **When It Occurs:**
1. User selects an image file in the Create Event dialog
2. File validation passes (type: image/png, size < 5MB)
3. File is converted to blob with correct MIME type
4. Upload to Supabase Storage fails with MIME type error

### **Expected vs Actual Behavior:**
- **Expected:** File uploads successfully with `image/png` MIME type
- **Actual:** Supabase receives file as `application/json` MIME type

## 🛠️ **Attempted Solutions**

### **Solution 1: Fixed node-vibrant Import**
**Issue:** `node-vibrant` import syntax was incorrect
**Fix:** Changed from `import Vibrant from 'node-vibrant'` to `import { Vibrant } from 'node-vibrant/browser'`
**Result:** ✅ Build issues resolved, but upload error persisted

### **Solution 2: Enhanced File Validation**
**Changes Made:**
- Added detailed file type logging
- Enhanced error messages
- Added file size and type validation
**Result:** ❌ File validation works, but upload still fails

### **Solution 3: Blob Conversion**
**Changes Made:**
```javascript
// Before
.upload(filePath, file, { contentType: file.type })

// After  
const fileBlob = await file.arrayBuffer();
const blob = new Blob([fileBlob], { type: file.type });
.upload(filePath, blob, { contentType: file.type })
```
**Result:** ❌ Still receiving `application/json` MIME type

### **Solution 4: Multiple Test Approaches**
**Added Tests:**
- Generated PNG using Canvas
- Real image download from URL
- Simple text file upload
- Direct blob upload
**Result:** ❌ All approaches fail with same MIME type error

### **Solution 5: Storage Configuration Verification**
**Database Setup:**
- ✅ Bucket exists: `event-images` (public: true)
- ✅ Gradient columns added to events table
- ❓ Storage policies status unknown (must be set via Dashboard)

## 📊 **Current File Structure**

### **Files Created/Modified:**
```
src/
├── lib/
│   ├── color-extraction.ts          # Color extraction utilities
│   ├── gradient-persistence.ts      # Database storage for gradients
│   └── storage-test.ts              # Storage testing functions
├── components/Events/
│   ├── EventCard.tsx                # Enhanced event card with gradients
│   ├── CreateEventDialog.tsx        # Updated with image upload
│   └── GradientDemo.tsx             # Demo component
├── pages/
│   └── Events.tsx                   # Updated to use new EventCard
└── App.tsx                          # Added gradient demo route

supabase/migrations/
├── 03_add_gradient_colors.sql       # Adds gradient columns
└── 04_setup_event_images_storage.sql # Creates storage bucket

Documentation:
├── SETUP_INSTRUCTIONS.md            # Complete setup guide
├── QUICK_SETUP.md                   # Simplified setup steps
├── STORAGE_TROUBLESHOOTING.md       # Storage debugging guide
├── GRADIENT_FEATURE.md              # Feature documentation
└── BUCKET_VERIFICATION.sql          # SQL verification queries
```

## 🔧 **Current Upload Implementation**

### **File Selection Handler:**
```javascript
const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (file) {
    // Validation passes
    console.log('File selected:', {
      name: file.name,
      type: file.type,  // Shows: "image/png"
      size: file.size
    });
    
    setSelectedImage(file);
    // Preview creation works fine
  }
};
```

### **Upload Function:**
```javascript
const uploadImage = async (file: File): Promise<string | null> => {
  try {
    // File validation passes
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `event-posters/${fileName}`;

    // Blob conversion
    const fileBlob = await file.arrayBuffer();
    const blob = new Blob([fileBlob], { type: file.type });
    
    console.log('Uploading blob:', {
      type: blob.type,  // Shows: "image/png"
      size: blob.size
    });

    // Upload fails here
    const { data, error } = await supabase.storage
      .from('event-images')
      .upload(filePath, blob, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type
      });

    if (error) {
      console.error('Upload error:', error);  // MIME type error here
      throw error;
    }
  } catch (error) {
    // Error handling
  }
};
```

## 🧪 **Test Results**

### **Storage Test Function Results:**
```
Configuration check results: {
  bucketExists: true,
  policiesExist: false,  // ⚠️ This might be the issue
  userAuthenticated: true
}

Test file created: {
  name: "test-1234567890.png",
  type: "image/png", 
  size: 123
}

Test upload failed: StorageApiError: mime type application/json is not supported
```

### **Database Verification:**
```sql
-- Bucket exists and is public
SELECT * FROM storage.buckets WHERE id = 'event-images';
-- Returns: id: 'event-images', name: 'event-images', public: true
```

## 🚨 **Root Cause Analysis**

### **Most Likely Issues:**

1. **Missing Storage Policies**
   - Bucket exists but lacks proper RLS policies
   - Policies must be created via Supabase Dashboard (not SQL)
   - Required policies:
     - INSERT for authenticated users
     - SELECT for public access
     - UPDATE for authenticated users  
     - DELETE for authenticated users

2. **Supabase Client Configuration**
   - Possible issue with how Supabase client handles file uploads
   - Version compatibility issue
   - Headers not being set correctly

3. **Browser/Environment Issue**
   - File API behavior differences
   - CORS configuration
   - Network/proxy interference

## 📝 **Next Steps for AI Agent**

### **Priority 1: Storage Policies**
1. Verify storage policies exist in Supabase Dashboard
2. Create missing policies if needed
3. Test upload with policies in place

### **Priority 2: Alternative Upload Methods**
1. Try different Supabase upload approaches:
   - Direct file upload without blob conversion
   - Using FormData instead of blob
   - Different content-type handling

### **Priority 3: Client Configuration**
1. Check Supabase client version and configuration
2. Verify storage bucket permissions
3. Test with different file types and sizes

### **Priority 4: Environment Testing**
1. Test in different browsers
2. Check network requests in dev tools
3. Verify CORS configuration

## 🔍 **Debugging Commands**

### **Browser Console Tests:**
```javascript
// Test 1: Check file object
const file = document.querySelector('input[type="file"]').files[0];
console.log('File details:', {
  name: file.name,
  type: file.type,
  size: file.size
});

// Test 2: Check blob conversion
const blob = new Blob([file], { type: file.type });
console.log('Blob details:', {
  type: blob.type,
  size: blob.size
});

// Test 3: Direct Supabase test
const { data, error } = await supabase.storage
  .from('event-images')
  .upload('test-direct.png', blob);
console.log('Direct upload result:', { data, error });
```

### **SQL Verification:**
```sql
-- Check bucket
SELECT * FROM storage.buckets WHERE id = 'event-images';

-- Check policies  
SELECT * FROM storage.policies WHERE bucket_id = 'event-images';

-- Check if policies exist
SELECT 
  schemaname,
  tablename, 
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
AND policyname LIKE '%event%';
```

## 📋 **Dependencies**

### **Package.json Dependencies:**
```json
{
  "node-vibrant": "^3.x.x",  // For color extraction
  "@supabase/supabase-js": "^2.57.2",  // For storage
  "react": "^18.3.1",
  "typescript": "^5.8.3"
}
```

### **Environment:**
- Node.js version: 22.19.0
- Package manager: npm
- Build tool: Vite
- OS: Windows 10

## 🎯 **Success Criteria**

The upload should work when:
1. ✅ User selects valid image file
2. ✅ File validation passes
3. ✅ Blob conversion completes with correct MIME type
4. ✅ Upload to Supabase Storage succeeds
5. ✅ Public URL is returned for gradient generation

## 📞 **Additional Context**

- The gradient feature is fully implemented and working
- Only the image upload to Supabase Storage is failing
- All other Supabase operations (database queries) work fine
- The error is consistent across all file types and sizes
- Storage bucket exists and is configured as public

This error is blocking the complete implementation of the event gradient feature, which requires uploaded images to extract colors for gradient generation.



