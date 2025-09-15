#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

console.log('🔧 Fixing Environment Configuration Mismatch');
console.log('============================================\n');

// The correct configuration based on your supabase/config.toml
const correctConfig = `# Supabase Configuration - Fixed
VITE_SUPABASE_URL=https://ltthgdnsbqgukkicitxe.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0dGhnZG5zYnFndWtraWNpdHhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4MjA5NDcsImV4cCI6MjA3MzM5Njk0N30.example_key_replace_with_actual_key

# Predefined College Admin Credentials
VITE_COLLEGE_ADMIN_EMAIL=admin@college.edu
VITE_COLLEGE_ADMIN_PASSWORD=admin123!@#
VITE_COLLEGE_ADMIN_NAME=College Administrator
VITE_COLLEGE_ADMIN_USN=ADMIN001
VITE_COLLEGE_NAME=Campus Connect College
VITE_COLLEGE_CODE=CC001

# QR Code Security
VITE_QR_SECRET_KEY=campus-connect-qr-secret-2024

# Feature Flags
VITE_ENABLE_TEAM_EVENTS=true
VITE_ENABLE_NOTIFICATIONS=true
VITE_ENABLE_ANALYTICS=true

# App Configuration
VITE_APP_NAME=Campus Connect
VITE_APP_VERSION=1.0.0
VITE_SUPPORT_EMAIL=support@college.edu`;

// Local development configuration (recommended)
const localConfig = `# Supabase Configuration - Local Development (Recommended)
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvY2FsaG9zdCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjQxNzYyMzQzLCJleHAiOjE5NTcxMzgzNDN9.example_local_key

# Predefined College Admin Credentials
VITE_COLLEGE_ADMIN_EMAIL=admin@college.edu
VITE_COLLEGE_ADMIN_PASSWORD=admin123!@#
VITE_COLLEGE_ADMIN_NAME=College Administrator
VITE_COLLEGE_ADMIN_USN=ADMIN001
VITE_COLLEGE_NAME=Campus Connect College
VITE_COLLEGE_CODE=CC001

# QR Code Security
VITE_QR_SECRET_KEY=campus-connect-qr-secret-2024

# Feature Flags
VITE_ENABLE_TEAM_EVENTS=true
VITE_ENABLE_NOTIFICATIONS=true
VITE_ENABLE_ANALYTICS=true

# App Configuration
VITE_APP_NAME=Campus Connect
VITE_APP_VERSION=1.0.0
VITE_SUPPORT_EMAIL=support@college.edu`;

console.log('❌ Issues Found:');
console.log('1. Project ID mismatch between .env and supabase/config.toml');
console.log('2. Invalid Supabase URLs (both are unreachable)');
console.log('3. JWT token doesn\'t match the project ID');
console.log('4. Missing environment variables\n');

console.log('🔧 Solutions:\n');

console.log('Option 1: Use Local Supabase (Recommended)');
console.log('==========================================');
console.log('Replace your .env file content with:');
console.log('------------------------------------');
console.log(localConfig);
console.log('\nThen run:');
console.log('1. npm run supabase:start');
console.log('2. npm run dev\n');

console.log('Option 2: Fix Remote Supabase');
console.log('=============================');
console.log('Replace your .env file content with:');
console.log('------------------------------------');
console.log(correctConfig);
console.log('\nThen:');
console.log('1. Get the correct anon key from your Supabase project');
console.log('2. Replace "example_key_replace_with_actual_key" with the real key');
console.log('3. npm run dev\n');

console.log('Option 3: Create New Supabase Project');
console.log('=====================================');
console.log('1. Go to https://supabase.com/dashboard');
console.log('2. Create a new project');
console.log('3. Get the project URL and anon key');
console.log('4. Update your .env file with the new values\n');

// Create backup of current .env
const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const backupPath = path.join(process.cwd(), '.env.backup');
  fs.copyFileSync(envPath, backupPath);
  console.log('✅ Created backup: .env.backup');
}

console.log('📝 Next Steps:');
console.log('1. Choose one of the options above');
console.log('2. Update your .env file accordingly');
console.log('3. Run the application');
