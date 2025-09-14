#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const envPath = path.join(process.cwd(), '.env');

console.log('🔧 Campus Connect - Environment Setup');
console.log('=====================================\n');

// Check if .env file exists
if (!fs.existsSync(envPath)) {
  console.log('❌ .env file not found. Creating one...\n');
  fs.writeFileSync(envPath, '');
}

// Read current .env content
let envContent = fs.readFileSync(envPath, 'utf8');

// Function to ask question
function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

// Function to update or add environment variable
function updateEnvVar(key, value) {
  const regex = new RegExp(`^${key}=.*$`, 'm');
  const newLine = `${key}=${value}`;
  
  if (regex.test(envContent)) {
    envContent = envContent.replace(regex, newLine);
  } else {
    envContent += (envContent.endsWith('\n') ? '' : '\n') + newLine + '\n';
  }
}

async function main() {
  console.log('This script will help you configure your Supabase environment variables.\n');
  
  console.log('Option 1: Use Local Supabase (Recommended for development)');
  console.log('Option 2: Use Remote Supabase Project\n');
  
  const choice = await askQuestion('Choose option (1 or 2): ');
  
  if (choice === '1') {
    console.log('\n📝 Setting up local Supabase configuration...');
    updateEnvVar('VITE_SUPABASE_URL', 'http://localhost:54321');
    updateEnvVar('VITE_SUPABASE_ANON_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvY2FsaG9zdCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjQxNzYyMzQzLCJleHAiOjE5NTcxMzgzNDN9.example_local_key');
    
    console.log('\n✅ Local configuration set!');
    console.log('\nNext steps:');
    console.log('1. Install Docker Desktop if not already installed');
    console.log('2. Run: npx supabase start');
    console.log('3. Run: npm run dev');
    
  } else if (choice === '2') {
    console.log('\n📝 Setting up remote Supabase configuration...');
    
    const url = await askQuestion('Enter your Supabase Project URL (e.g., https://your-project.supabase.co): ');
    const key = await askQuestion('Enter your Supabase Anon Key: ');
    
    if (url && key) {
      updateEnvVar('VITE_SUPABASE_URL', url);
      updateEnvVar('VITE_SUPABASE_ANON_KEY', key);
      
      console.log('\n✅ Remote configuration set!');
      console.log('\nNext steps:');
      console.log('1. Make sure your Supabase project is set up');
      console.log('2. Run database migrations if needed');
      console.log('3. Run: npm run dev');
    } else {
      console.log('\n❌ Invalid configuration provided.');
    }
  } else {
    console.log('\n❌ Invalid choice. Please run the script again.');
  }
  
  // Write updated .env content
  fs.writeFileSync(envPath, envContent);
  
  console.log('\n📄 .env file updated successfully!');
  console.log('\n🔍 Current configuration:');
  console.log('========================');
  console.log(envContent);
  
  rl.close();
}

main().catch(console.error);
