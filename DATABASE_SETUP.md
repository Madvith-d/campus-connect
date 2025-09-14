# Campus Connect - Complete Supabase Database Setup

This guide provides all the SQL migrations needed to set up the Campus Connect project from scratch.

## 📋 Prerequisites

1. **Supabase Account**: Create an account at [supabase.com](https://supabase.com)
2. **Supabase CLI**: Install the Supabase CLI
   ```bash
   npm install -g supabase
   ```
3. **Project Setup**: Create a new Supabase project

## 🚀 Quick Setup (Recommended)

### Method 1: Using Supabase Dashboard (Easiest)

1. **Log into your Supabase Dashboard**
2. **Navigate to SQL Editor**
3. **Copy and paste the complete schema** from `supabase/migrations/00_complete_schema.sql`
4. **Run the migration**
5. **Optionally run additional features** from other migration files

### Method 2: Using Supabase CLI

1. **Initialize Supabase in your project**:
   ```bash
   cd campus-connect
   supabase init
   ```

2. **Link to your remote project**:
   ```bash
   supabase link --project-ref your-project-ref
   ```

3. **Apply all migrations**:
   ```bash
   supabase db push
   ```

## 📁 Migration Files Overview

### Core Schema Migration
- **File**: `00_complete_schema.sql`
- **Purpose**: Complete database schema with all tables, relationships, and security policies
- **Required**: ✅ Essential - Must be run first

### Storage Setup Migration  
- **File**: `01_storage_setup.sql`
- **Purpose**: Sets up Supabase Storage buckets for file uploads (avatars, logos, etc.)
- **Required**: 🔶 Optional - Only if you need file uploads

### Analytics Views Migration
- **File**: `02_analytics_views.sql`  
- **Purpose**: Creates analytical views and reporting functions
- **Required**: 🔶 Optional - Only if you need analytics/reporting

## 🗄️ Database Schema Details

### Core Tables

1. **`profiles`** - User profiles extending auth.users
2. **`clubs`** - College clubs/organizations
3. **`club_members`** - Club membership with roles
4. **`join_requests`** - Club join request management
5. **`events`** - Club events and activities
6. **`teams`** - Team formation for team events
7. **`team_members`** - Team membership
8. **`registrations`** - Event registrations
9. **`attendance_logs`** - Event attendance tracking
10. **`notifications`** - User notifications
11. **`system_settings`** - Application configuration

### User Roles

- **`student`** - Default role for regular users
- **`club_admin`** - Can manage specific clubs and create events
- **`college_admin`** - Full system access, can create clubs and assign admins

### Security Features

- **Row Level Security (RLS)** enabled on all tables
- **Role-based access control** with proper policies
- **Automatic profile creation** on user signup
- **Comprehensive permission system**

## 🔧 Manual Setup Steps

If you prefer to run migrations manually or want to understand each step:

### Step 1: Create the Main Schema

```sql
-- Run the complete schema migration
-- Copy contents from: supabase/migrations/00_complete_schema.sql
```

### Step 2: Setup Storage (Optional)

```sql
-- Run storage setup if you need file uploads
-- Copy contents from: supabase/migrations/01_storage_setup.sql  
```

### Step 3: Add Analytics (Optional)

```sql
-- Run analytics setup for reporting features
-- Copy contents from: supabase/migrations/02_analytics_views.sql
```

## 🔐 Environment Configuration

After setting up the database, configure your environment variables:

### 1. Get your Supabase credentials:
- Go to **Settings > API** in your Supabase dashboard
- Copy the Project URL and API Key

### 2. Update your `.env` file:
```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Predefined College Admin
VITE_COLLEGE_ADMIN_EMAIL=admin@college.edu
VITE_COLLEGE_ADMIN_PASSWORD=admin123!@#
VITE_COLLEGE_ADMIN_NAME=College Administrator
VITE_COLLEGE_ADMIN_USN=ADMIN001

# App Configuration
VITE_APP_NAME=Campus Connect
VITE_QR_SECRET_KEY=your-secret-key-for-qr-codes
```

## 🧪 Testing the Setup

### 1. Test Database Connection

```bash
# Start your development server
npm run dev

# The app should connect to Supabase without errors
```

### 2. Test User Registration

1. Navigate to `/auth` in your app
2. Register a new user with any email/password
3. Check if profile is created automatically in Supabase

### 3. Test College Admin Setup

1. Register a user with the predefined USN (`ADMIN001`)
2. The user should automatically be promoted to college admin
3. College admin should see additional UI elements (Create Club, Admin Panel, etc.)

## 📊 Verifying Data Structure

You can verify your database setup in the Supabase dashboard:

1. **Table Editor**: Check all tables are created properly
2. **Authentication**: Verify user signup works
3. **Storage**: Check buckets are created (if you ran storage migration)
4. **API Docs**: Review auto-generated API documentation

## 🐛 Troubleshooting

### Common Issues

1. **Migration Fails**:
   - Ensure you have proper permissions
   - Check for syntax errors in SQL
   - Run migrations in the correct order

2. **RLS Policies Not Working**:
   - Verify RLS is enabled on tables
   - Check policy conditions match your use case
   - Test with different user roles

3. **Storage Issues**:
   - Ensure storage buckets are created
   - Check storage policies for file uploads
   - Verify CORS settings if needed

4. **Authentication Issues**:
   - Confirm Supabase URL and keys are correct
   - Check if auto-profile creation trigger is working
   - Verify email confirmation settings

### Getting Help

- **Supabase Docs**: [docs.supabase.com](https://docs.supabase.com)
- **Project Issues**: Create an issue in the repository
- **Supabase Community**: [community.supabase.com](https://community.supabase.com)

## 🎯 Next Steps

After successful database setup:

1. **Configure Authentication**: Set up email templates, social logins if needed
2. **Upload Sample Data**: Add some test clubs and events
3. **Test All Features**: Register users, create clubs, events, etc.
4. **Setup Production**: Configure production environment variables
5. **Enable Analytics**: Set up analytics tracking if needed

## 📝 Migration History

- **00_complete_schema.sql**: Core database schema and security
- **01_storage_setup.sql**: File storage and upload capabilities  
- **02_analytics_views.sql**: Analytics views and reporting functions

The migrations are designed to be:
- ✅ **Idempotent** - Safe to run multiple times
- ✅ **Incremental** - Can be applied in order
- ✅ **Production-ready** - Include proper security and indexing
- ✅ **Well-documented** - Comprehensive comments and structure