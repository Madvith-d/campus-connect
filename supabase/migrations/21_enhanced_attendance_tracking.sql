-- Enhanced Attendance Tracking Schema Updates
-- Add new columns to attendance_logs table for enhanced security tracking

-- Add security validation metadata
ALTER TABLE attendance_logs ADD COLUMN IF NOT EXISTS scan_metadata JSONB DEFAULT '{}'::jsonb;
ALTER TABLE attendance_logs ADD COLUMN IF NOT EXISTS device_info TEXT;
ALTER TABLE attendance_logs ADD COLUMN IF NOT EXISTS ip_address INET;
ALTER TABLE attendance_logs ADD COLUMN IF NOT EXISTS user_agent TEXT;
ALTER TABLE attendance_logs ADD COLUMN IF NOT EXISTS location_data JSONB;
ALTER TABLE attendance_logs ADD COLUMN IF NOT EXISTS validation_details JSONB DEFAULT '{}'::jsonb;

-- Add QR validation logs table for security auditing
CREATE TABLE IF NOT EXISTS qr_validation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  qr_data_hash TEXT NOT NULL,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  scanner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  validation_result BOOLEAN NOT NULL,
  error_message TEXT,
  validation_details JSONB DEFAULT '{}'::jsonb,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  device_fingerprint TEXT
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_attendance_event_profile ON attendance_logs(event_id, profile_id);
CREATE INDEX IF NOT EXISTS idx_attendance_timestamp ON attendance_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_method ON attendance_logs(method);
CREATE INDEX IF NOT EXISTS idx_qr_validation_logs_timestamp ON qr_validation_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_qr_validation_logs_event ON qr_validation_logs(event_id);
CREATE INDEX IF NOT EXISTS idx_qr_validation_logs_scanner ON qr_validation_logs(scanner_id);

-- Add attendance session tracking table
CREATE TABLE IF NOT EXISTS attendance_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_start TIMESTAMPTZ DEFAULT NOW(),
  session_end TIMESTAMPTZ,
  total_scanned INTEGER DEFAULT 0,
  successful_scans INTEGER DEFAULT 0,
  failed_scans INTEGER DEFAULT 0,
  session_metadata JSONB DEFAULT '{}'::jsonb
);

-- Create attendance analytics view
CREATE OR REPLACE VIEW attendance_analytics AS
SELECT 
  e.id as event_id,
  e.title as event_title,
  e.start_time,
  e.end_time,
  c.name as club_name,
  COUNT(r.id) as total_registered,
  COUNT(a.id) as total_attended,
  CASE WHEN COUNT(r.id) > 0 
    THEN ROUND((COUNT(a.id)::numeric / COUNT(r.id)::numeric) * 100, 2)
    ELSE 0
  END as attendance_rate,
  COUNT(CASE WHEN a.method = 'self-scan' THEN 1 END) as self_scan_count,
  COUNT(CASE WHEN a.method = 'staff-scan' THEN 1 END) as staff_scan_count,
  COUNT(CASE WHEN a.method = 'manual' THEN 1 END) as manual_count
FROM events e
LEFT JOIN clubs c ON e.club_id = c.id
LEFT JOIN registrations r ON e.id = r.event_id
LEFT JOIN attendance_logs a ON e.id = a.event_id
GROUP BY e.id, e.title, e.start_time, e.end_time, c.name;

-- Create security audit view for QR validation
CREATE OR REPLACE VIEW qr_security_audit AS
SELECT 
  q.id,
  q.timestamp,
  e.title as event_title,
  p.name as scanner_name,
  p.usn as scanner_usn,
  q.validation_result,
  q.error_message,
  q.validation_details,
  q.ip_address,
  q.device_fingerprint
FROM qr_validation_logs q
LEFT JOIN events e ON q.event_id = e.id
LEFT JOIN profiles p ON q.scanner_id = p.user_id
ORDER BY q.timestamp DESC;

-- Enable RLS on new tables
ALTER TABLE qr_validation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_sessions ENABLE ROW LEVEL SECURITY;

-- RLS policies for qr_validation_logs
CREATE POLICY \"Users can view their own QR validation logs\" ON qr_validation_logs
  FOR SELECT USING (scanner_id = auth.uid());

CREATE POLICY \"Club admins can view QR logs for their events\" ON qr_validation_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM events e
      JOIN club_members cm ON e.club_id = cm.club_id
      WHERE e.id = qr_validation_logs.event_id
      AND cm.profile_id = auth.uid()
      AND cm.role = 'admin'
    )
  );

CREATE POLICY \"College admins can view all QR validation logs\" ON qr_validation_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid()
      AND role = 'college_admin'
    )
  );

CREATE POLICY \"Insert QR validation logs\" ON qr_validation_logs
  FOR INSERT WITH CHECK (scanner_id = auth.uid());

-- RLS policies for attendance_sessions
CREATE POLICY \"Club admins can manage their attendance sessions\" ON attendance_sessions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM events e
      JOIN club_members cm ON e.club_id = cm.club_id
      WHERE e.id = attendance_sessions.event_id
      AND cm.profile_id = auth.uid()
      AND cm.role = 'admin'
    )
  );

CREATE POLICY \"College admins can view all attendance sessions\" ON attendance_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid()
      AND role = 'college_admin'
    )
  );

-- Update existing attendance_logs table with better RLS
DROP POLICY IF EXISTS \"Club admins can view attendance for their events\" ON attendance_logs;
CREATE POLICY \"Club admins can view attendance for their events\" ON attendance_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM events e
      JOIN club_members cm ON e.club_id = cm.club_id
      WHERE e.id = attendance_logs.event_id
      AND cm.profile_id = auth.uid()
      AND cm.role = 'admin'
    )
  );

-- Add function to log QR validation attempts
CREATE OR REPLACE FUNCTION log_qr_validation(
  p_qr_data_hash TEXT,
  p_event_id UUID,
  p_validation_result BOOLEAN,
  p_error_message TEXT DEFAULT NULL,
  p_validation_details JSONB DEFAULT '{}'::jsonb,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_device_fingerprint TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO qr_validation_logs (
    qr_data_hash,
    event_id,
    scanner_id,
    validation_result,
    error_message,
    validation_details,
    ip_address,
    user_agent,
    device_fingerprint
  ) VALUES (
    p_qr_data_hash,
    p_event_id,
    auth.uid(),
    p_validation_result,
    p_error_message,
    p_validation_details,
    p_ip_address,
    p_user_agent,
    p_device_fingerprint
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$;

-- Add function to get attendance statistics with security details
CREATE OR REPLACE FUNCTION get_attendance_stats_enhanced(p_event_id UUID)
RETURNS TABLE (
  total_registered BIGINT,
  total_attended BIGINT,
  attendance_rate NUMERIC,
  self_scan_count BIGINT,
  staff_scan_count BIGINT,
  manual_count BIGINT,
  failed_scan_attempts BIGINT,
  security_issues BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE((SELECT COUNT(*) FROM registrations WHERE event_id = p_event_id), 0) as total_registered,
    COALESCE((SELECT COUNT(*) FROM attendance_logs WHERE event_id = p_event_id), 0) as total_attended,
    CASE 
      WHEN (SELECT COUNT(*) FROM registrations WHERE event_id = p_event_id) > 0
      THEN ROUND(
        (SELECT COUNT(*)::numeric FROM attendance_logs WHERE event_id = p_event_id) /
        (SELECT COUNT(*)::numeric FROM registrations WHERE event_id = p_event_id) * 100, 2
      )
      ELSE 0::numeric
    END as attendance_rate,
    COALESCE((SELECT COUNT(*) FROM attendance_logs WHERE event_id = p_event_id AND method = 'self-scan'), 0) as self_scan_count,
    COALESCE((SELECT COUNT(*) FROM attendance_logs WHERE event_id = p_event_id AND method = 'staff-scan'), 0) as staff_scan_count,
    COALESCE((SELECT COUNT(*) FROM attendance_logs WHERE event_id = p_event_id AND method = 'manual'), 0) as manual_count,
    COALESCE((SELECT COUNT(*) FROM qr_validation_logs WHERE event_id = p_event_id AND validation_result = false), 0) as failed_scan_attempts,
    COALESCE((SELECT COUNT(*) FROM qr_validation_logs WHERE event_id = p_event_id AND (validation_details->>'replayCheck')::boolean = false), 0) as security_issues;
END;
$$;

-- Add trigger to automatically update session statistics
CREATE OR REPLACE FUNCTION update_session_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update session statistics when QR validation occurs
  IF TG_TABLE_NAME = 'qr_validation_logs' THEN
    UPDATE attendance_sessions 
    SET 
      total_scanned = total_scanned + 1,
      successful_scans = CASE WHEN NEW.validation_result THEN successful_scans + 1 ELSE successful_scans END,
      failed_scans = CASE WHEN NOT NEW.validation_result THEN failed_scans + 1 ELSE failed_scans END
    WHERE event_id = NEW.event_id
    AND session_end IS NULL;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_session_stats_trigger
  AFTER INSERT ON qr_validation_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_session_stats();

-- Grant necessary permissions
GRANT SELECT ON attendance_analytics TO authenticated;
GRANT SELECT ON qr_security_audit TO authenticated;
GRANT EXECUTE ON FUNCTION log_qr_validation TO authenticated;
GRANT EXECUTE ON FUNCTION get_attendance_stats_enhanced TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE qr_validation_logs IS 'Logs all QR code validation attempts for security auditing';
COMMENT ON TABLE attendance_sessions IS 'Tracks attendance scanning sessions for events';
COMMENT ON COLUMN attendance_logs.scan_metadata IS 'JSON metadata about the QR scan (validation details, etc.)';
COMMENT ON COLUMN attendance_logs.device_info IS 'Device information from the scanner';
COMMENT ON COLUMN attendance_logs.validation_details IS 'Security validation results for the attendance log';
COMMENT ON VIEW attendance_analytics IS 'Comprehensive attendance statistics for events';
COMMENT ON VIEW qr_security_audit IS 'Security audit trail for QR code validations';