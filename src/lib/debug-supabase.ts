import { supabase } from '@/integrations/supabase/client';
import { testSupabaseConnection, testAuthService, getSupabaseConfig } from './supabase-test';
import { runNetworkDiagnostics } from './network-test';

/**
 * Comprehensive debugging utility for Supabase connection issues
 */
export async function debugSupabaseConnection(): Promise<void> {
  console.log('🔍 Starting Supabase connection debugging...');
  
  // 1. Check environment configuration
  console.log('\n📋 Environment Configuration:');
  const config = getSupabaseConfig();
  console.log('Config:', config);
  
  if (!config.hasUrl || !config.hasKey) {
    console.error('❌ Missing environment variables!');
    console.log('Please check your .env file contains:');
    console.log('- VITE_SUPABASE_URL');
    console.log('- VITE_SUPABASE_ANON_KEY');
    return;
  }
  
  // 2. Test network connectivity
  console.log('\n🌐 Testing Network Connectivity:');
  const networkResults = await runNetworkDiagnostics(config.url);
  
  if (!networkResults.networkOk) {
    console.error('❌ Network connectivity failed');
    console.log('Network test results:', networkResults.details.network);
    return;
  }
  
  if (!networkResults.supabaseOk) {
    console.error('❌ Supabase endpoint not accessible');
    console.log('Supabase test results:', networkResults.details.supabase);
    return;
  }
  
  console.log('✅ Network and Supabase endpoint accessible');
  
  // 3. Test Supabase client connection
  console.log('\n🔌 Testing Supabase Client:');
  const connectionTest = await testSupabaseConnection();
  
  if (!connectionTest.success) {
    console.error('❌ Supabase client connection failed');
    console.log('Connection error:', connectionTest);
    return;
  }
  
  console.log('✅ Supabase client connection successful');
  
  // 4. Test auth service
  console.log('\n🔐 Testing Auth Service:');
  const authTest = await testAuthService();
  
  if (!authTest.success) {
    console.error('❌ Auth service test failed');
    console.log('Auth error:', authTest);
    return;
  }
  
  console.log('✅ Auth service working properly');
  console.log('Session status:', authTest.details);
  
  // 5. Additional debugging info
  console.log('\n🔧 Additional Debug Info:');
  console.log('User Agent:', navigator.userAgent);
  console.log('Online Status:', navigator.onLine);
  console.log('Service Worker Status:', 'serviceWorker' in navigator ? 'Available' : 'Not Available');
  
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      console.log('Service Worker Registration:', registration ? 'Active' : 'None');
    } catch (error) {
      console.log('Service Worker Check Error:', error);
    }
  }
  
  console.log('\n✅ Debugging complete. If you\'re still experiencing issues, check the browser\'s Network tab for detailed request information.');
}

/**
 * Quick connection test that can be called from browser console
 */
export async function quickConnectionTest(): Promise<boolean> {
  try {
    console.log('🔍 Quick connection test...');
    
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('❌ Connection failed:', error.message);
      return false;
    }
    
    console.log('✅ Connection successful');
    console.log('Session:', data.session ? 'Active' : 'None');
    return true;
  } catch (error: any) {
    console.error('❌ Connection test failed:', error.message);
    return false;
  }
}

/**
 * Test authentication with timeout and retry logic
 */
export async function testAuthWithRetry(email: string, password: string): Promise<{
  success: boolean;
  error?: any;
  retries: number;
}> {
  const maxRetries = 3;
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      console.log(`🔐 Auth attempt ${retries + 1}/${maxRetries}...`);
      
      // Create timeout promise
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout after 30 seconds')), 30000)
      );
      
      // Create auth promise
      const authPromise = supabase.auth.signInWithPassword({ email, password });
      
      // Race between auth and timeout
      const result = await Promise.race([authPromise, timeoutPromise]) as any;
      
      if (result.error) {
        throw result.error;
      }
      
      console.log('✅ Authentication successful');
      return { success: true, retries: retries + 1 };
      
    } catch (error: any) {
      retries++;
      console.error(`❌ Auth attempt ${retries} failed:`, error.message);
      
      if (retries < maxRetries) {
        console.log(`⏳ Retrying in 2 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }
  
  return { success: false, error: 'Max retries exceeded', retries };
}

// Make functions available in global scope for browser console debugging
if (typeof window !== 'undefined') {
  (window as any).debugSupabase = debugSupabaseConnection;
  (window as any).quickConnectionTest = quickConnectionTest;
  (window as any).testAuthWithRetry = testAuthWithRetry;
}