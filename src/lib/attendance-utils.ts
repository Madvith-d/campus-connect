import { supabase } from '@/integrations/supabase/client';
import { validateEventQRCode, QRCodeValidationResult } from './qr-utils';
import { showNotification } from './notifications';

export type AttendanceMethod = 'self-scan' | 'staff-scan' | 'manual';

export interface AttendanceLogEntry {
  id: string;
  event_id: string;
  profile_id: string;
  method: AttendanceMethod;
  timestamp: string;
}

export interface AttendanceStats {
  totalRegistered: number;
  totalAttended: number;
  attendanceRate: number;
  recentAttendees: Array<{
    id: string;
    name: string;
    usn: string;
    timestamp: string;
    method: AttendanceMethod;
  }>;
}

/**
 * Log attendance for an event
 */
export async function logAttendance(
  eventId: string,
  profileId: string,
  method: AttendanceMethod
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if user is already logged for this event
    const { data: existingLog, error: checkError } = await supabase
      .from('attendance_logs')
      .select('id')
      .eq('event_id', eventId)
      .eq('profile_id', profileId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = not found
      throw checkError;
    }

    if (existingLog) {
      return {
        success: false,
        error: 'Attendance already logged for this event',
      };
    }

    // Insert attendance log
    const { error: insertError } = await supabase
      .from('attendance_logs')
      .insert({
        event_id: eventId,
        profile_id: profileId,
        method,
      });

    if (insertError) {
      throw insertError;
    }

    // Show success notification
    showNotification('attendance_logged', {
      eventTitle: 'Event', // We'd need to fetch this if we want the actual title
    });

    return { success: true };
  } catch (error: any) {
    console.error('Error logging attendance:', error);
    return {
      success: false,
      error: error.message || 'Failed to log attendance',
    };
  }
}

/**
 * Process QR code scan for attendance
 */
export async function processQRAttendance(
  qrString: string,
  scannerId: string,
  scannerRole: 'student' | 'club_admin' | 'college_admin'
): Promise<{ success: boolean; error?: string; eventTitle?: string }> {
  try {
    // First, parse the QR code
    const qrValidation = validateEventQRCode(qrString, '', ''); // We'll validate time after getting event data
    
    if (!qrValidation.isValid) {
      return {
        success: false,
        error: qrValidation.error || 'Invalid QR code',
      };
    }

    const eventId = qrValidation.eventId!;

    // Get event details for time validation
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('title, start_time, end_time, clubs(name)')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      return {
        success: false,
        error: 'Event not found',
      };
    }

    // Validate time window
    const timeValidation = validateEventQRCode(qrString, event.start_time, event.end_time);
    if (!timeValidation.isValid) {
      return {
        success: false,
        error: timeValidation.error || 'QR code is outside valid time window',
      };
    }

    // Determine attendance method based on scanner
    let method: AttendanceMethod;
    if (scannerRole === 'student') {
      method = 'self-scan';
    } else {
      method = 'staff-scan';
    }

    // Log attendance
    const logResult = await logAttendance(eventId, scannerId, method);
    
    return {
      ...logResult,
      eventTitle: event.title,
    };
  } catch (error: any) {
    console.error('Error processing QR attendance:', error);
    return {
      success: false,
      error: error.message || 'Failed to process attendance',
    };
  }
}

/**
 * Manually log attendance (for admins)
 */
export async function manualAttendanceLog(
  eventId: string,
  profileId: string,
  adminId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Verify admin has permission to manage this event without nested joins (avoid RLS recursion)
    const { data: eventRow, error: eventError } = await supabase
      .from('events')
      .select('id, club_id')
      .eq('id', eventId)
      .single();

    if (eventError || !eventRow) {
      return {
        success: false,
        error: 'Event not found',
      };
    }

    const { data: adminMembership, error: membershipError } = await supabase
      .from('club_members')
      .select('id')
      .eq('club_id', eventRow.club_id)
      .eq('profile_id', adminId)
      .eq('role', 'admin')
      .limit(1);

    if (membershipError || !adminMembership || adminMembership.length === 0) {
      return {
        success: false,
        error: 'You do not have permission to manage attendance for this event',
      };
    }

    // Log attendance manually
    return await logAttendance(eventId, profileId, 'manual');
  } catch (error: any) {
    console.error('Error with manual attendance log:', error);
    return {
      success: false,
      error: error.message || 'Failed to log attendance manually',
    };
  }
}

/**
 * Get attendance statistics for an event
 */
export async function getAttendanceStats(eventId: string): Promise<AttendanceStats | null> {
  try {
    // Get total registrations
    const { count: totalRegistered, error: regError } = await supabase
      .from('registrations')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId);

    if (regError) throw regError;

    // Get attendance logs without nested profile join (avoid RLS recursion)
    const { data: attendanceLogs, error: attError } = await supabase
      .from('attendance_logs')
      .select('id, profile_id, method, timestamp')
      .eq('event_id', eventId)
      .order('timestamp', { ascending: false });

    if (attError) throw attError;

    const totalAttended = attendanceLogs?.length || 0;
    const attendanceRate = totalRegistered ? (totalAttended / totalRegistered) * 100 : 0;

    // Fetch profiles separately to avoid nested joins in RLS-protected tables
    const profileIds = Array.from(new Set((attendanceLogs || []).map((l: any) => l.profile_id)));
    let profileMap: Record<string, { name: string; usn: string }> = {};
    if (profileIds.length > 0) {
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, name, usn')
        .in('user_id', profileIds);
      if (profilesError) throw profilesError;
      for (const p of profilesData || []) {
        profileMap[p.user_id] = { name: p.name, usn: p.usn };
      }
    }

    const recentAttendees = (attendanceLogs || []).slice(0, 10).map((log: any) => {
      const info = profileMap[log.profile_id] || { name: 'Unknown', usn: 'Unknown' };
      return {
        id: log.id,
        name: info.name,
        usn: info.usn,
        timestamp: log.timestamp,
        method: log.method as AttendanceMethod,
      };
    });

    return {
      totalRegistered: totalRegistered || 0,
      totalAttended,
      attendanceRate: Math.round(attendanceRate * 100) / 100,
      recentAttendees,
    };
  } catch (error: any) {
    console.error('Error getting attendance stats:', error);
    return null;
  }
}

/**
 * Check if user has already logged attendance for an event
 */
export async function hasUserAttended(eventId: string, profileId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('attendance_logs')
      .select('id')
      .eq('event_id', eventId)
      .eq('profile_id', profileId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return !!data;
  } catch (error) {
    console.error('Error checking attendance:', error);
    return false;
  }
}

/**
 * Get all attendance logs for an event (for admins)
 */
export async function getEventAttendanceLogs(
  eventId: string,
  adminId: string
): Promise<AttendanceLogEntry[] | null> {
  try {
    // Verify admin permission without nested join
    const { data: eventRow, error: eventError } = await supabase
      .from('events')
      .select('id, club_id')
      .eq('id', eventId)
      .single();

    if (eventError || !eventRow) {
      throw new Error('Event not found');
    }

    const { data: adminMembership, error: membershipError } = await supabase
      .from('club_members')
      .select('id')
      .eq('club_id', eventRow.club_id)
      .eq('profile_id', adminId)
      .eq('role', 'admin')
      .limit(1);

    if (membershipError || !adminMembership || adminMembership.length === 0) {
      throw new Error('Permission denied');
    }

    // Get attendance logs
    const { data: logs, error: logsError } = await supabase
      .from('attendance_logs')
      .select('*')
      .eq('event_id', eventId)
      .order('timestamp', { ascending: false });

    if (logsError) throw logsError;

    return logs || [];
  } catch (error: any) {
    console.error('Error getting attendance logs:', error);
    return null;
  }
}