// Environment configuration utility

export const config = {
  // Supabase
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  
  // Predefined College Admin
  collegeAdminEmail: import.meta.env.VITE_COLLEGE_ADMIN_EMAIL || 'admin@college.edu',
  collegeAdminPassword: import.meta.env.VITE_COLLEGE_ADMIN_PASSWORD || 'admin123!@#',
  collegeAdminName: import.meta.env.VITE_COLLEGE_ADMIN_NAME || 'College Administrator',
  collegeAdminUSN: import.meta.env.VITE_COLLEGE_ADMIN_USN || 'ADMIN001',
  collegeName: import.meta.env.VITE_COLLEGE_NAME || 'Campus Connect College',
  collegeCode: import.meta.env.VITE_COLLEGE_CODE || 'CC001',
  
  // QR Code Security
  qrSecretKey: import.meta.env.VITE_QR_SECRET_KEY || 'campus-connect-qr-secret-2024',
  
  // Feature Flags
  enableTeamEvents: import.meta.env.VITE_ENABLE_TEAM_EVENTS === 'true',
  enableNotifications: import.meta.env.VITE_ENABLE_NOTIFICATIONS === 'true',
  enableAnalytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
  
  // App Configuration
  appName: import.meta.env.VITE_APP_NAME || 'Campus Connect',
  appVersion: import.meta.env.VITE_APP_VERSION || '1.0.0',
  supportEmail: import.meta.env.VITE_SUPPORT_EMAIL || 'support@college.edu',
};

// Validation function to check if required config is present
export function validateConfig(): { isValid: boolean; missingKeys: string[] } {
  const requiredKeys = [
    'supabaseUrl',
    'supabaseAnonKey',
  ];
  
  const missingKeys = requiredKeys.filter(key => !config[key as keyof typeof config]);
  
  return {
    isValid: missingKeys.length === 0,
    missingKeys,
  };
}

// Get predefined college admin configuration
export function getCollegeAdminConfig() {
  return {
    email: config.collegeAdminEmail,
    password: config.collegeAdminPassword,
    name: config.collegeAdminName,
    usn: config.collegeAdminUSN,
    collegeName: config.collegeName,
    code: config.collegeCode,
  };
}

// Check if a feature is enabled
export function isFeatureEnabled(feature: 'teamEvents' | 'notifications' | 'analytics'): boolean {
  switch (feature) {
    case 'teamEvents':
      return config.enableTeamEvents;
    case 'notifications':
      return config.enableNotifications;
    case 'analytics':
      return config.enableAnalytics;
    default:
      return false;
  }
}

// Get app metadata
export function getAppMetadata() {
  return {
    name: config.appName,
    version: config.appVersion,
    supportEmail: config.supportEmail,
  };
}