-- =========================================================================
-- Campus Connect - Analytics and Reporting Views
-- =========================================================================
-- This migration creates views and functions for analytics and reporting

-- -------------------------------------------------------------------------
-- 1. ANALYTICAL VIEWS
-- -------------------------------------------------------------------------

-- Club statistics view
CREATE OR REPLACE VIEW public.club_stats AS
SELECT 
  c.id,
  c.name,
  c.description,
  c.approved,
  c.created_at,
  COUNT(DISTINCT cm.profile_id) as member_count,
  COUNT(DISTINCT CASE WHEN cm.role = 'admin' THEN cm.profile_id END) as admin_count,
  COUNT(DISTINCT e.id) as total_events,
  COUNT(DISTINCT CASE WHEN e.start_time > NOW() THEN e.id END) as upcoming_events,
  COUNT(DISTINCT r.profile_id) as total_registrations,
  COUNT(DISTINCT al.profile_id) as total_attendance,
  CASE 
    WHEN COUNT(DISTINCT r.profile_id) > 0 
    THEN ROUND((COUNT(DISTINCT al.profile_id)::DECIMAL / COUNT(DISTINCT r.profile_id)) * 100, 2)
    ELSE 0 
  END as attendance_rate
FROM public.clubs c
LEFT JOIN public.club_members cm ON c.id = cm.club_id
LEFT JOIN public.events e ON c.id = e.club_id
LEFT JOIN public.registrations r ON e.id = r.event_id
LEFT JOIN public.attendance_logs al ON e.id = al.event_id
WHERE c.approved = true
GROUP BY c.id, c.name, c.description, c.approved, c.created_at;

-- Event statistics view
CREATE OR REPLACE VIEW public.event_stats AS
SELECT 
  e.id,
  e.title,
  e.description,
  e.location,
  e.start_time,
  e.end_time,
  e.capacity,
  e.is_team_event,
  c.name as club_name,
  COUNT(DISTINCT r.profile_id) as registration_count,
  COUNT(DISTINCT al.profile_id) as attendance_count,
  COUNT(DISTINCT t.id) as team_count,
  COUNT(DISTINCT tm.profile_id) as team_member_count,
  ROUND((COUNT(DISTINCT r.profile_id)::DECIMAL / e.capacity) * 100, 2) as capacity_utilization,
  CASE 
    WHEN COUNT(DISTINCT r.profile_id) > 0 
    THEN ROUND((COUNT(DISTINCT al.profile_id)::DECIMAL / COUNT(DISTINCT r.profile_id)) * 100, 2)
    ELSE 0 
  END as attendance_rate,
  CASE
    WHEN e.start_time > NOW() THEN 'upcoming'
    WHEN e.end_time < NOW() THEN 'completed'
    ELSE 'ongoing'
  END as status
FROM public.events e
JOIN public.clubs c ON e.club_id = c.id
LEFT JOIN public.registrations r ON e.id = r.event_id
LEFT JOIN public.attendance_logs al ON e.id = al.event_id
LEFT JOIN public.teams t ON e.id = t.event_id
LEFT JOIN public.team_members tm ON t.id = tm.team_id
GROUP BY e.id, e.title, e.description, e.location, e.start_time, e.end_time, 
         e.capacity, e.is_team_event, c.name;

-- User activity view
CREATE OR REPLACE VIEW public.user_activity AS
SELECT 
  p.user_id,
  p.name,
  p.usn,
  p.branch,
  p.role,
  COUNT(DISTINCT cm.club_id) as clubs_joined,
  COUNT(DISTINCT CASE WHEN cm.role = 'admin' THEN cm.club_id END) as clubs_admin,
  COUNT(DISTINCT r.event_id) as events_registered,
  COUNT(DISTINCT al.event_id) as events_attended,
  COUNT(DISTINCT t.id) as teams_created,
  COUNT(DISTINCT tm.team_id) as teams_joined,
  CASE 
    WHEN COUNT(DISTINCT r.event_id) > 0 
    THEN ROUND((COUNT(DISTINCT al.event_id)::DECIMAL / COUNT(DISTINCT r.event_id)) * 100, 2)
    ELSE 0 
  END as attendance_rate,
  p.created_at as joined_date
FROM public.profiles p
LEFT JOIN public.club_members cm ON p.user_id = cm.profile_id
LEFT JOIN public.registrations r ON p.user_id = r.profile_id
LEFT JOIN public.attendance_logs al ON p.user_id = al.profile_id
LEFT JOIN public.teams t ON p.user_id = t.leader_id
LEFT JOIN public.team_members tm ON p.user_id = tm.profile_id
GROUP BY p.user_id, p.name, p.usn, p.branch, p.role, p.created_at;

-- Dashboard summary view
CREATE OR REPLACE VIEW public.dashboard_summary AS
SELECT 
  (SELECT COUNT(*) FROM public.profiles) as total_users,
  (SELECT COUNT(*) FROM public.profiles WHERE role = 'student') as total_students,
  (SELECT COUNT(*) FROM public.profiles WHERE role = 'club_admin') as total_club_admins,
  (SELECT COUNT(*) FROM public.profiles WHERE role = 'college_admin') as total_college_admins,
  (SELECT COUNT(*) FROM public.clubs WHERE approved = true) as total_clubs,
  (SELECT COUNT(*) FROM public.clubs WHERE approved = false) as pending_clubs,
  (SELECT COUNT(*) FROM public.events) as total_events,
  (SELECT COUNT(*) FROM public.events WHERE start_time > NOW()) as upcoming_events,
  (SELECT COUNT(*) FROM public.events WHERE start_time <= NOW() AND end_time >= NOW()) as ongoing_events,
  (SELECT COUNT(*) FROM public.events WHERE end_time < NOW()) as completed_events,
  (SELECT COUNT(*) FROM public.registrations) as total_registrations,
  (SELECT COUNT(*) FROM public.attendance_logs) as total_attendance,
  (SELECT COUNT(*) FROM public.teams) as total_teams,
  (SELECT COUNT(*) FROM public.join_requests WHERE status = 'pending') as pending_join_requests;

-- -------------------------------------------------------------------------
-- 2. REPORTING FUNCTIONS
-- -------------------------------------------------------------------------

-- Function to get club performance report
CREATE OR REPLACE FUNCTION public.get_club_performance_report(
  club_uuid UUID DEFAULT NULL,
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS TABLE(
  club_id UUID,
  club_name TEXT,
  events_count BIGINT,
  total_registrations BIGINT,
  total_attendance BIGINT,
  attendance_rate NUMERIC,
  avg_event_capacity_utilization NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    COUNT(DISTINCT e.id) as events_count,
    COUNT(DISTINCT r.profile_id) as total_registrations,
    COUNT(DISTINCT al.profile_id) as total_attendance,
    CASE 
      WHEN COUNT(DISTINCT r.profile_id) > 0 
      THEN ROUND((COUNT(DISTINCT al.profile_id)::DECIMAL / COUNT(DISTINCT r.profile_id)) * 100, 2)
      ELSE 0 
    END as attendance_rate,
    CASE 
      WHEN COUNT(DISTINCT e.id) > 0 
      THEN ROUND(AVG((COUNT(DISTINCT r.profile_id)::DECIMAL / e.capacity) * 100), 2)
      ELSE 0 
    END as avg_event_capacity_utilization
  FROM public.clubs c
  LEFT JOIN public.events e ON c.id = e.club_id
  LEFT JOIN public.registrations r ON e.id = r.event_id
  LEFT JOIN public.attendance_logs al ON e.id = al.event_id
  WHERE 
    c.approved = true
    AND (club_uuid IS NULL OR c.id = club_uuid)
    AND (start_date IS NULL OR e.start_time >= start_date)
    AND (end_date IS NULL OR e.start_time <= end_date)
  GROUP BY c.id, c.name, e.capacity;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to get event attendance report
CREATE OR REPLACE FUNCTION public.get_event_attendance_report(
  event_uuid UUID DEFAULT NULL,
  club_uuid UUID DEFAULT NULL
)
RETURNS TABLE(
  event_id UUID,
  event_title TEXT,
  club_name TEXT,
  event_date TIMESTAMP WITH TIME ZONE,
  capacity INTEGER,
  registered_count BIGINT,
  attended_count BIGINT,
  attendance_rate NUMERIC,
  capacity_utilization NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    e.title,
    c.name,
    e.start_time,
    e.capacity,
    COUNT(DISTINCT r.profile_id) as registered_count,
    COUNT(DISTINCT al.profile_id) as attended_count,
    CASE 
      WHEN COUNT(DISTINCT r.profile_id) > 0 
      THEN ROUND((COUNT(DISTINCT al.profile_id)::DECIMAL / COUNT(DISTINCT r.profile_id)) * 100, 2)
      ELSE 0 
    END as attendance_rate,
    ROUND((COUNT(DISTINCT r.profile_id)::DECIMAL / e.capacity) * 100, 2) as capacity_utilization
  FROM public.events e
  JOIN public.clubs c ON e.club_id = c.id
  LEFT JOIN public.registrations r ON e.id = r.event_id
  LEFT JOIN public.attendance_logs al ON e.id = al.event_id
  WHERE 
    c.approved = true
    AND (event_uuid IS NULL OR e.id = event_uuid)
    AND (club_uuid IS NULL OR c.id = club_uuid)
  GROUP BY e.id, e.title, c.name, e.start_time, e.capacity
  ORDER BY e.start_time DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to get user engagement report
CREATE OR REPLACE FUNCTION public.get_user_engagement_report(
  role_filter TEXT DEFAULT NULL,
  branch_filter TEXT DEFAULT NULL
)
RETURNS TABLE(
  user_id UUID,
  name TEXT,
  usn TEXT,
  branch TEXT,
  role TEXT,
  clubs_count BIGINT,
  events_registered BIGINT,
  events_attended BIGINT,
  engagement_score NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.user_id,
    p.name,
    p.usn,
    p.branch,
    p.role::TEXT,
    COUNT(DISTINCT cm.club_id) as clubs_count,
    COUNT(DISTINCT r.event_id) as events_registered,
    COUNT(DISTINCT al.event_id) as events_attended,
    -- Engagement score: weighted sum of activities
    ROUND(
      (COUNT(DISTINCT cm.club_id) * 2) + 
      (COUNT(DISTINCT r.event_id) * 1) + 
      (COUNT(DISTINCT al.event_id) * 3)
    , 2) as engagement_score
  FROM public.profiles p
  LEFT JOIN public.club_members cm ON p.user_id = cm.profile_id
  LEFT JOIN public.registrations r ON p.user_id = r.profile_id
  LEFT JOIN public.attendance_logs al ON p.user_id = al.profile_id
  WHERE 
    (role_filter IS NULL OR p.role::TEXT = role_filter)
    AND (branch_filter IS NULL OR p.branch = branch_filter)
  GROUP BY p.user_id, p.name, p.usn, p.branch, p.role
  ORDER BY engagement_score DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to get monthly activity summary
CREATE OR REPLACE FUNCTION public.get_monthly_activity_summary(
  year_param INTEGER DEFAULT EXTRACT(YEAR FROM NOW()),
  month_param INTEGER DEFAULT EXTRACT(MONTH FROM NOW())
)
RETURNS TABLE(
  metric_name TEXT,
  metric_value BIGINT
) AS $$
DECLARE
  start_date TIMESTAMP WITH TIME ZONE;
  end_date TIMESTAMP WITH TIME ZONE;
BEGIN
  start_date := DATE_TRUNC('month', MAKE_DATE(year_param, month_param, 1));
  end_date := start_date + INTERVAL '1 month';
  
  RETURN QUERY
  SELECT 'New Users'::TEXT, COUNT(*)::BIGINT FROM public.profiles 
    WHERE created_at >= start_date AND created_at < end_date
  UNION ALL
  SELECT 'New Clubs'::TEXT, COUNT(*)::BIGINT FROM public.clubs 
    WHERE created_at >= start_date AND created_at < end_date
  UNION ALL
  SELECT 'Events Created'::TEXT, COUNT(*)::BIGINT FROM public.events 
    WHERE created_at >= start_date AND created_at < end_date
  UNION ALL
  SELECT 'Events Held'::TEXT, COUNT(*)::BIGINT FROM public.events 
    WHERE start_time >= start_date AND start_time < end_date
  UNION ALL
  SELECT 'Total Registrations'::TEXT, COUNT(*)::BIGINT FROM public.registrations 
    WHERE registered_at >= start_date AND registered_at < end_date
  UNION ALL
  SELECT 'Total Attendance'::TEXT, COUNT(*)::BIGINT FROM public.attendance_logs 
    WHERE timestamp >= start_date AND timestamp < end_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- -------------------------------------------------------------------------
-- 3. GRANT PERMISSIONS ON VIEWS
-- -------------------------------------------------------------------------

-- Grant SELECT permissions on views to authenticated users
GRANT SELECT ON public.club_stats TO authenticated;
GRANT SELECT ON public.event_stats TO authenticated;
GRANT SELECT ON public.user_activity TO authenticated;
GRANT SELECT ON public.dashboard_summary TO authenticated;

-- Grant EXECUTE permissions on functions to authenticated users
GRANT EXECUTE ON FUNCTION public.get_club_performance_report TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_event_attendance_report TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_engagement_report TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_monthly_activity_summary TO authenticated;