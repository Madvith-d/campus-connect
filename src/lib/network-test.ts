/**
 * Network connectivity and Supabase endpoint testing utilities
 */

/**
 * Test basic network connectivity
 */
export async function testNetworkConnectivity(): Promise<{
  success: boolean;
  message: string;
  responseTime?: number;
}> {
  const startTime = Date.now();
  
  try {
    // Test with a reliable endpoint
    const response = await fetch('https://www.google.com/favicon.ico', {
      method: 'HEAD',
      mode: 'no-cors'
    });
    
    const responseTime = Date.now() - startTime;
    
    return {
      success: true,
      message: 'Network connectivity is working',
      responseTime
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Network connectivity failed: ${error.message}`
    };
  }
}

/**
 * Test Supabase endpoint accessibility
 */
export async function testSupabaseEndpoint(url: string): Promise<{
  success: boolean;
  message: string;
  status?: number;
  responseTime?: number;
}> {
  const startTime = Date.now();
  
  try {
    // Test the Supabase health endpoint
    const healthUrl = `${url}/rest/v1/`;
    const response = await fetch(healthUrl, {
      method: 'HEAD',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    const responseTime = Date.now() - startTime;
    
    if (response.ok || response.status === 401) {
      // 401 is expected without auth key, but means endpoint is reachable
      return {
        success: true,
        message: 'Supabase endpoint is accessible',
        status: response.status,
        responseTime
      };
    } else {
      return {
        success: false,
        message: `Supabase endpoint returned status ${response.status}`,
        status: response.status,
        responseTime
      };
    }
  } catch (error: any) {
    return {
      success: false,
      message: `Supabase endpoint test failed: ${error.message}`
    };
  }
}

/**
 * Comprehensive network diagnostics
 */
export async function runNetworkDiagnostics(supabaseUrl: string): Promise<{
  networkOk: boolean;
  supabaseOk: boolean;
  details: any;
}> {
  console.log('Running network diagnostics...');
  
  const [networkTest, supabaseTest] = await Promise.all([
    testNetworkConnectivity(),
    testSupabaseEndpoint(supabaseUrl)
  ]);
  
  const results = {
    networkOk: networkTest.success,
    supabaseOk: supabaseTest.success,
    details: {
      network: networkTest,
      supabase: supabaseTest,
      timestamp: new Date().toISOString()
    }
  };
  
  console.log('Network diagnostics results:', results);
  return results;
}