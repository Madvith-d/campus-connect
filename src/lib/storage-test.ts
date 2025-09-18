import { supabase } from '@/integrations/supabase/client';

/**
 * Simple and direct storage test with better error handling
 */
export async function testStorageBucket() {
  try {
    console.log('Testing storage bucket access...');
    
    // Test bucket access by listing files
    const { data: files, error: listError } = await supabase.storage
      .from('event-images')
      .list('', { limit: 1 });
    
    if (listError) {
      console.error('Bucket access failed:', listError);
      return false;
    }
    
    console.log('Bucket accessible, files found:', files?.length || 0);
    
    // Test simple upload with a text file to verify permissions
    const testContent = `Test upload at ${new Date().toISOString()}`;
    const testFileName = `test/storage-test-${Date.now()}.txt`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('event-images')
      .upload(testFileName, testContent, {
        contentType: 'text/plain'
      });
    
    if (uploadError) {
      console.error('Test upload failed:', uploadError);
      console.error('Error details:', {
        message: uploadError.message,
        details: uploadError.details,
        hint: uploadError.hint
      });
      return false;
    }
    
    console.log('Test upload successful:', uploadData.path);
    
    // Clean up test file
    try {
      await supabase.storage
        .from('event-images')
        .remove([uploadData.path]);
      console.log('Test file cleaned up');
    } catch (cleanupError) {
      console.warn('Failed to clean up test file:', cleanupError);
    }
    
    return true;
    
  } catch (error) {
    console.error('Storage test error:', error);
    return false;
  }
}

/**
 * Check bucket configuration details
 */
export async function checkBucketConfig() {
  try {
    console.log('=== BUCKET CONFIGURATION CHECK ===');
    
    // Check bucket via SQL
    const { data: bucketData, error: bucketError } = await supabase
      .from('storage.buckets')
      .select('*')
      .eq('id', 'event-images');
    
    if (bucketError) {
      console.error('Error checking bucket via SQL:', bucketError);
    } else {
      console.log('Bucket SQL check:', bucketData);
    }
    
    // Check policies
    const { data: policiesData, error: policiesError } = await supabase
      .from('storage.policies')
      .select('*')
      .eq('bucket_id', 'event-images');
    
    if (policiesError) {
      console.error('Error checking policies:', policiesError);
    } else {
      console.log('Storage policies:', policiesData);
    }
    
    // Check current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) {
      console.error('Error getting user:', userError);
    } else {
      console.log('Current user:', user?.id, user?.email);
    }
    
    console.log('=== END BUCKET CONFIGURATION CHECK ===');
    
    return {
      bucketExists: bucketData && bucketData.length > 0,
      policiesExist: policiesData && policiesData.length > 0,
      userAuthenticated: !!user
    };
    
  } catch (error) {
    console.error('Bucket config check error:', error);
    return null;
  }
}

/**
 * Test image upload with actual File object
 */
export async function testImageUpload() {
  try {
    console.log('Testing image upload with File object...');
    
    // Create a proper PNG image using canvas
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // Create a simple gradient
      const gradient = ctx.createLinearGradient(0, 0, 100, 100);
      gradient.addColorStop(0, '#FF0000');
      gradient.addColorStop(1, '#0000FF');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 100, 100);
    }
    
    return new Promise<boolean>((resolve) => {
      canvas.toBlob(async (blob) => {
        if (!blob) {
          console.error('Failed to create image blob');
          resolve(false);
          return;
        }
        
        console.log('Image blob created:', {
          type: blob.type,
          size: blob.size
        });
        
        const testFile = new File([blob], `test-image-${Date.now()}.png`, { 
          type: 'image/png',
          lastModified: Date.now()
        });
        
        console.log('Test file created:', {
          name: testFile.name,
          type: testFile.type,
          size: testFile.size
        });
        
        const filePath = `test/${testFile.name}`;
        
        // Upload the File object directly (no blob conversion)
        const { data, error } = await supabase.storage
          .from('event-images')
          .upload(filePath, testFile);
        
        if (error) {
          console.error('Image upload test failed:', error);
          console.error('Error details:', {
            message: error.message,
            details: error.details,
            hint: error.hint
          });
          resolve(false);
        } else {
          console.log('Image upload test successful:', data.path);
          
          // Clean up
          try {
            await supabase.storage
              .from('event-images')
              .remove([data.path]);
            console.log('Test image cleaned up');
          } catch (cleanupError) {
            console.warn('Failed to clean up test image:', cleanupError);
          }
          
          resolve(true);
        }
      }, 'image/png');
    });
    
  } catch (error) {
    console.error('Image upload test error:', error);
    return false;
  }
}

/**
 * Test with a real image URL (alternative approach)
 */
export async function testWithRealImage() {
  try {
    console.log('Testing with real image URL...');
    
    // Use a small test image from a public URL
    const imageUrl = 'https://via.placeholder.com/1x1.png';
    
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }
    
    const blob = await response.blob();
    console.log('Fetched image blob:', {
      type: blob.type,
      size: blob.size
    });
    
    const { data, error } = await supabase.storage
      .from('event-images')
      .upload(`test/real-image-${Date.now()}.png`, blob, {
        contentType: 'image/png'
      });
    
    if (error) {
      console.error('Real image upload test failed:', error);
      return false;
    }
    
    console.log('Real image upload test successful:', data);
    return true;
    
  } catch (error) {
    console.error('Real image upload test error:', error);
    return false;
  }
}

/**
 * Simple text file upload test (fallback)
 */
export async function testSimpleUpload() {
  try {
    console.log('Testing simple file upload...');
    
    // Create a simple text file
    const content = 'This is a test file for storage';
    const testFile = new File([content], 'test.txt', { 
      type: 'text/plain',
      lastModified: Date.now()
    });
    
    console.log('Test file created:', {
      name: testFile.name,
      type: testFile.type,
      size: testFile.size
    });
    
    const { data, error } = await supabase.storage
      .from('event-images')
      .upload(`test/simple-${Date.now()}.txt`, testFile, {
        contentType: 'text/plain'
      });
    
    if (error) {
      console.error('Simple upload test failed:', error);
      return false;
    }
    
    console.log('Simple upload test successful:', data);
    return true;
    
  } catch (error) {
    console.error('Simple upload test error:', error);
    return false;
  }
}
