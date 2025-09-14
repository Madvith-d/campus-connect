import { supabase } from '@/integrations/supabase/client';
import { getCollegeAdminConfig } from './config';

/**
 * Automatically create predefined college admin if it doesn't exist
 */
export async function ensureCollegeAdminExists(): Promise<{ success: boolean; message: string }> {
  try {
    const adminConfig = getCollegeAdminConfig();
    
    // Check if college admin already exists
    const { data: existingAdmin, error: checkError } = await supabase
      .from('profiles')
      .select('user_id, role')
      .eq('role', 'college_admin')
      .limit(1);

    if (checkError) {
      console.error('Error checking for existing admin:', checkError);
      return { success: false, message: 'Failed to check for existing admin' };
    }

    if (existingAdmin && existingAdmin.length > 0) {
      return { success: true, message: 'College admin already exists' };
    }

    // Check if user with admin email already exists
    const { data: existingUser, error: userError } = await supabase
      .from('profiles')
      .select('user_id, role, name, usn')
      .eq('usn', adminConfig.usn)
      .single();

    if (userError && userError.code !== 'PGRST116') { // PGRST116 = not found
      console.error('Error checking for existing user:', userError);
      return { success: false, message: 'Failed to check for existing user' };
    }

    if (existingUser) {
      // User exists, promote to college admin
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ role: 'college_admin' })
        .eq('user_id', existingUser.user_id);

      if (updateError) {
        console.error('Error promoting user to admin:', updateError);
        return { success: false, message: 'Failed to promote user to admin' };
      }

      return { success: true, message: `User ${existingUser.name} promoted to college admin` };
    }

    // No admin exists, need to create account
    return { 
      success: false, 
      message: `No college admin found. Please register with USN: ${adminConfig.usn} and email: ${adminConfig.email}` 
    };

  } catch (error: any) {
    console.error('Error in ensureCollegeAdminExists:', error);
    return { success: false, message: error.message || 'Unknown error occurred' };
  }
}

/**
 * Check if current user should be promoted to college admin
 */
export async function checkAndPromoteToAdmin(userProfile: any): Promise<{ promoted: boolean; message: string }> {
  try {
    const adminConfig = getCollegeAdminConfig();
    
    // Check if this user matches the predefined admin credentials
    if (userProfile.usn === adminConfig.usn || userProfile.name === adminConfig.name) {
      // Check if already college admin
      if (userProfile.role === 'college_admin') {
        return { promoted: false, message: 'User is already college admin' };
      }

      // Promote to college admin
      const { error } = await supabase
        .from('profiles')
        .update({ role: 'college_admin' })
        .eq('user_id', userProfile.user_id);

      if (error) {
        console.error('Error promoting to admin:', error);
        return { promoted: false, message: 'Failed to promote to admin' };
      }

      return { promoted: true, message: 'Successfully promoted to college admin' };
    }

    return { promoted: false, message: 'User does not match admin credentials' };
  } catch (error: any) {
    console.error('Error in checkAndPromoteToAdmin:', error);
    return { promoted: false, message: error.message || 'Unknown error occurred' };
  }
}

/**
 * Validate if a user can access college admin features
 */
export function isCollegeAdmin(userProfile: any): boolean {
  return userProfile?.role === 'college_admin';
}

/**
 * Validate if a user can access club admin features for a specific club
 */
export async function isClubAdmin(userId: string, clubId?: string): Promise<boolean> {
  try {
    // College admins can access all club admin features
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', userId)
      .single();

    if (profile?.role === 'college_admin') {
      return true;
    }

    // Check if user is admin of the specific club
    if (clubId) {
      const { data: clubMember } = await supabase
        .from('club_members')
        .select('role')
        .eq('club_id', clubId)
        .eq('profile_id', userId)
        .eq('role', 'admin')
        .single();

      return !!clubMember;
    }

    // Check if user is admin of any club
    const { data: clubMember } = await supabase
      .from('club_members')
      .select('id')
      .eq('profile_id', userId)
      .eq('role', 'admin')
      .limit(1);

    return (clubMember?.length || 0) > 0;
  } catch (error) {
    console.error('Error checking club admin status:', error);
    return false;
  }
}