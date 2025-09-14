// Supabase configuration with fallback and validation
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

// Default configuration for development
const DEFAULT_CONFIG = {
  url: 'http://localhost:54321',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvY2FsaG9zdCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjQxNzYyMzQzLCJleHAiOjE5NTcxMzgzNDN9.example_local_key'
};

// Get environment variables with fallbacks
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || DEFAULT_CONFIG.url;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_CONFIG.anonKey;

// Validate configuration
function validateConfig() {
  const issues: string[] = [];
  
  if (!SUPABASE_URL) {
    issues.push('VITE_SUPABASE_URL is not defined');
  }
  
  if (!SUPABASE_ANON_KEY) {
    issues.push('VITE_SUPABASE_ANON_KEY is not defined');
  }
  
  if (SUPABASE_URL && !SUPABASE_URL.startsWith('http')) {
    issues.push('VITE_SUPABASE_URL must be a valid HTTP/HTTPS URL');
  }
  
  if (issues.length > 0) {
    console.error('Supabase configuration issues:', issues);
    return false;
  }
  
  return true;
}

// Create Supabase client with enhanced error handling
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  global: {
    headers: {
      'Content-Type': 'application/json',
    },
  },
  db: {
    schema: 'public'
  }
});

// Test connection function
export async function testSupabaseConnection(): Promise<{ success: boolean; error?: string }> {
  try {
    // Test basic connectivity
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('Supabase connection test failed:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (error: any) {
    console.error('Supabase connection test error:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to connect to Supabase' 
    };
  }
}

// Configuration validation
export const configValidation = {
  isValid: validateConfig(),
  url: SUPABASE_URL,
  hasAnonKey: !!SUPABASE_ANON_KEY,
  isLocal: SUPABASE_URL.includes('localhost') || SUPABASE_URL.includes('127.0.0.1')
};

// Export configuration for debugging
export const supabaseConfig = {
  url: SUPABASE_URL,
  hasAnonKey: !!SUPABASE_ANON_KEY,
  isLocal: configValidation.isLocal
};
