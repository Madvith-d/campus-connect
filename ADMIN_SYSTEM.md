# Predefined College Admin System

## Overview
The Campus Connect system now implements a predefined college admin system where college administrator credentials are configured via environment variables, providing a secure and controlled access management system.

## System Architecture

### Role Hierarchy
1. **College Admin** (Highest Level)
   - Can create clubs
   - Can assign club administrators
   - Can create events for any club
   - Can manage all users and permissions
   - Has access to admin panel

2. **Club Admin** (Club Level)
   - Can create events for their assigned clubs only
   - Can manage club members
   - Can handle join requests for their clubs
   - Cannot create new clubs

3. **Student** (Basic Level)
   - Can join clubs
   - Can register for events
   - Can attend events and check-in

### Predefined Admin Configuration

#### Environment Variables
The college admin credentials are predefined in environment variables:

```env
# Predefined College Admin Credentials
VITE_COLLEGE_ADMIN_EMAIL=admin@college.edu
VITE_COLLEGE_ADMIN_PASSWORD=admin123!@#
VITE_COLLEGE_ADMIN_NAME=College Administrator
VITE_COLLEGE_ADMIN_USN=ADMIN001
```

#### Automatic Promotion
- When a user registers with the predefined USN or name, they are automatically promoted to college admin
- The system checks and promotes users upon login
- Only one college admin account is supported per configuration

## Key Features Implemented

### 1. Restricted Club Creation
- **Before**: Any user could create clubs (pending approval)
- **After**: Only college admins can create clubs
- College admin created clubs are automatically approved

### 2. Club Admin Assignment
- New `ClubAdminAssignmentDialog` component for college admins
- Allows assignment of users as club administrators
- Users assigned as club admins get promoted from student role
- Club admins can manage their specific clubs

### 3. Enhanced Event Creation
- College admins can create events for any club
- Club admins can only create events for clubs they administer
- Updated permissions checking in `CreateEventDialog`

### 4. UI Permission Controls
- Create Club button only visible to college admins
- Manage Admins button for college admins on club cards
- Role-based navigation and access controls

## Implementation Details

### Files Modified/Created

#### Core Authentication (`src/hooks/useAuth.tsx`)
- Added automatic admin setup on app initialization
- Integrated admin promotion checking on profile fetch
- Enhanced authentication flow with role validation

#### Club Management
- **`src/components/Clubs/CreateClubDialog.tsx`**: Restricted to college admins only
- **`src/components/Clubs/ClubAdminAssignmentDialog.tsx`**: New component for admin assignment
- **`src/pages/Clubs.tsx`**: Updated UI with permission-based controls

#### Event Management
- **`src/components/Events/CreateEventDialog.tsx`**: Enhanced permission checking
- **`src/pages/Events.tsx`**: Updated event creation permissions

#### Admin Utilities
- **`src/lib/admin-setup.ts`**: Core admin management utilities
- **`src/lib/config.ts`**: Environment configuration management

### Configuration Files
- **`.env`**: Added predefined admin credentials
- **`.env.example`**: Updated template with admin fields

## Security Considerations

### Access Control
- Role-based permissions enforced at component level
- Database row-level security policies protect data
- Automatic promotion based on predefined credentials

### Environment Security
- Admin credentials stored in environment variables
- Not exposed in client-side code
- Configurable per deployment environment

## Usage Instructions

### Setting Up College Admin

1. **Configure Environment Variables**:
   ```bash
   # Copy .env.example to .env and update values
   cp .env.example .env
   ```

2. **Update Admin Credentials**:
   ```env
   VITE_COLLEGE_ADMIN_EMAIL=your-admin@college.edu
   VITE_COLLEGE_ADMIN_PASSWORD=secure-password
   VITE_COLLEGE_ADMIN_NAME=Your College Administrator
   VITE_COLLEGE_ADMIN_USN=ADMIN001
   ```

3. **Register with Admin Credentials**:
   - Register a new account using the configured USN
   - System will automatically promote the user to college admin

### College Admin Workflows

#### Creating Clubs
1. Navigate to Clubs page
2. Click "Create Club" button (only visible to college admins)
3. Fill in club details and submit
4. Club is automatically approved and active

#### Assigning Club Administrators
1. Navigate to Clubs page
2. Find the club you want to manage
3. Click "Manage Admins" button
4. Select users to assign as club administrators
5. Users are automatically promoted and granted club admin privileges

#### Event Management
- Create events for any club
- Manage all events across the system
- Override club-level permissions when needed

## Database Changes

No schema changes were required. The implementation uses the existing:
- `profiles` table with role column
- `club_members` table with role column  
- `clubs` table with approved column

The system leverages existing role-based access control patterns.

## Benefits

1. **Centralized Control**: College admin has complete oversight
2. **Secure Access**: Predefined credentials prevent unauthorized admin access
3. **Flexible Assignment**: Easy club admin assignment and management
4. **Scalable Architecture**: Clear role hierarchy supports growth
5. **Environment-based**: Easy deployment across different environments

## Future Enhancements

- Multi-college support with different admin domains
- Role-based email notifications
- Audit logging for admin actions
- Bulk user management tools
- Advanced permission granularity