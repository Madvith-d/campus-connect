import { supabase } from '@/integrations/supabase/client';

/**
 * Test Supabase connection and configuration
 */
export async function testSupabaseConnection(): Promise<{
  success: boolean;
  message: string;
  details?: any;
}> {
  try {
    console.log('Testing Supabase connection...');
    
    // Test basic connection
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('Supabase connection error:', error);
      return {
        success: false,
        message: `Connection failed: ${error.message}`,
        details: error
      };
    }
    
    console.log('Supabase connection successful');
    return {
      success: true,
      message: 'Supabase connection is working properly'
    };
    
  } catch (error: any) {
    console.error('Supabase test error:', error);
    return {
      success: false,
      message: `Connection test failed: ${error.message}`,
      details: error
    };
  }
}

/**
 * Test authentication service specifically
 */
export async function testAuthService(): Promise<{
  success: boolean;
  message: string;
  details?: any;
}> {
  try {
    console.log('Testing auth service...');
    
    // Test auth session retrieval
    const { data: session, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Auth service error:', error);
      return {
        success: false,
        message: `Auth service failed: ${error.message}`,
        details: error
      };
    }
    
    console.log('Auth service test successful');
    return {
      success: true,
      message: 'Auth service is working properly',
      details: { hasSession: !!session.session }
    };
    
  } catch (error: any) {
    console.error('Auth service test error:', error);
    return {
      success: false,
      message: `Auth service test failed: ${error.message}`,
      details: error
    };
  }
}

/**
 * Get current Supabase configuration for debugging
 */
export function getSupabaseConfig() {
  return {
    url: import.meta.env.VITE_SUPABASE_URL,
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY?.substring(0, 20) + '...', // Partial key for security
    hasUrl: !!import.meta.env.VITE_SUPABASE_URL,
    hasKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY
  };
}