# Supabase Setup Guide

## Quick Fix for Current Issues

The current errors are caused by an invalid Supabase URL in your `.env` file. Here's how to fix it:

### Option 1: Use Local Supabase (Recommended for Development)

1. **Install Docker Desktop** (if not already installed):
   - Download from: https://docs.docker.com/desktop/
   - Install and start Docker Desktop

2. **Start Local Supabase**:
   ```bash
   npx supabase start
   ```

3. **Update your `.env` file** with the local configuration:
   ```env
   VITE_SUPABASE_URL=http://localhost:54321
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvY2FsaG9zdCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjQxNzYyMzQzLCJleHAiOjE5NTcxMzgzNDN9.example_local_key
   ```

### Option 2: Create New Supabase Project

1. **Go to Supabase Dashboard**:
   - Visit: https://supabase.com/dashboard
   - Sign up/Login with your account

2. **Create New Project**:
   - Click "New Project"
   - Choose your organization
   - Enter project name: "campus-connect"
   - Set a strong database password
   - Choose a region close to you
   - Click "Create new project"

3. **Get Project Details**:
   - Go to Settings → API
   - Copy the Project URL
   - Copy the anon/public key

4. **Update your `.env` file**:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-actual-anon-key-here
   ```

5. **Run Database Migrations**:
   ```bash
   npx supabase db push
   ```

### Option 3: Fix Current Project

If you want to use the existing project ID (`ltthgdnsbqgukkicitxe`):

1. **Update your `.env` file**:
   ```env
   VITE_SUPABASE_URL=https://ltthgdnsbqgukkicitxe.supabase.co
   VITE_SUPABASE_ANON_KEY=your-actual-anon-key-here
   ```

2. **Get the correct anon key** from your Supabase project settings

## After Setup

1. **Restart your development server**:
   ```bash
   npm run dev
   ```

2. **Test the connection** - the app will now show a configuration screen if there are issues

3. **Create admin account** - use the admin credentials from your `.env` file:
   - Email: `admin@college.edu`
   - Password: `admin123!@#`
   - USN: `ADMIN001`

## Troubleshooting

- **"Failed to fetch" errors**: Check your internet connection and Supabase URL
- **"Invalid login credentials"**: Make sure you've created the admin account
- **Database errors**: Run the migrations in `supabase/migrations/`
- **Still having issues**: Check the browser console for detailed error messages

## Admin Account Setup

The app will automatically promote users with USN `ADMIN001` to college admin role. Make sure to:

1. Register with the admin email and USN
2. The system will automatically promote you to college admin
3. You'll then have access to all admin features
