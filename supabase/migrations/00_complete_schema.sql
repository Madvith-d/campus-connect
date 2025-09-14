-- =========================================================================
-- Campus Connect Database Schema - Complete Setup
-- =========================================================================
-- This migration sets up the complete database schema for Campus Connect
-- including tables, types, functions, triggers, and security policies.

-- -------------------------------------------------------------------------
-- 1. CUSTOM TYPES
-- -------------------------------------------------------------------------

-- User roles in the system
CREATE TYPE public.user_role AS ENUM ('student', 'club_admin', 'college_admin');

-- Club member roles
CREATE TYPE public.club_member_role AS ENUM ('member', 'admin');

-- Attendance tracking methods
CREATE TYPE public.attendance_method AS ENUM ('self-scan', 'staff-scan', 'manual');

-- Join request status
CREATE TYPE public.join_request_status AS ENUM ('pending', 'approved', 'rejected');

-- -------------------------------------------------------------------------
-- 2. CORE TABLES
-- -------------------------------------------------------------------------

-- User profiles table (extends auth.users)
CREATE TABLE public.profiles (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  usn TEXT UNIQUE NOT NULL,
  branch TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'student',
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Clubs table
CREATE TABLE public.clubs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  logo_url TEXT,
  approved BOOLEAN NOT NULL DEFAULT false,
  created_by UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Club membership table
CREATE TABLE public.club_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  role club_member_role NOT NULL DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(club_id, profile_id)
);

-- Club join requests table
CREATE TABLE public.join_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  status join_request_status NOT NULL DEFAULT 'pending',
  message TEXT,
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES public.profiles(user_id),
  UNIQUE(club_id, profile_id)
);

-- Events table
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  capacity INTEGER NOT NULL CHECK (capacity > 0),
  is_team_event BOOLEAN NOT NULL DEFAULT false,
  registration_deadline TIMESTAMP WITH TIME ZONE,
  event_image_url TEXT,
  qr_code TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
  qr_secret TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  created_by UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Teams table (for team events)
CREATE TABLE public.teams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  max_members INTEGER NOT NULL DEFAULT 10,
  leader_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(event_id, name)
);

-- Team members table
CREATE TABLE public.team_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(team_id, profile_id)
);

-- Event registrations table
CREATE TABLE public.registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  registered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  checked_in BOOLEAN NOT NULL DEFAULT false,
  check_in_time TIMESTAMP WITH TIME ZONE,
  UNIQUE(event_id, profile_id)
);

-- Attendance logs table
CREATE TABLE public.attendance_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  registration_id UUID REFERENCES public.registrations(id) ON DELETE CASCADE,
  method attendance_method NOT NULL,
  location TEXT,
  notes TEXT,
  logged_by UUID REFERENCES public.profiles(user_id),
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(event_id, profile_id)
);

-- Notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  read BOOLEAN NOT NULL DEFAULT false,
  action_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- System settings table
CREATE TABLE public.system_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES public.profiles(user_id),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- -------------------------------------------------------------------------
-- 3. INDEXES FOR PERFORMANCE
-- -------------------------------------------------------------------------

-- Profiles indexes
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_usn ON public.profiles(usn);
CREATE INDEX idx_profiles_created_at ON public.profiles(created_at);

-- Clubs indexes
CREATE INDEX idx_clubs_approved ON public.clubs(approved);
CREATE INDEX idx_clubs_created_by ON public.clubs(created_by);
CREATE INDEX idx_clubs_created_at ON public.clubs(created_at);

-- Club members indexes
CREATE INDEX idx_club_members_club_id ON public.club_members(club_id);
CREATE INDEX idx_club_members_profile_id ON public.club_members(profile_id);
CREATE INDEX idx_club_members_role ON public.club_members(role);

-- Join requests indexes
CREATE INDEX idx_join_requests_club_id ON public.join_requests(club_id);
CREATE INDEX idx_join_requests_profile_id ON public.join_requests(profile_id);
CREATE INDEX idx_join_requests_status ON public.join_requests(status);

-- Events indexes
CREATE INDEX idx_events_club_id ON public.events(club_id);
CREATE INDEX idx_events_start_time ON public.events(start_time);
CREATE INDEX idx_events_is_team_event ON public.events(is_team_event);
CREATE INDEX idx_events_qr_code ON public.events(qr_code);

-- Teams indexes
CREATE INDEX idx_teams_event_id ON public.teams(event_id);
CREATE INDEX idx_teams_leader_id ON public.teams(leader_id);

-- Registrations indexes
CREATE INDEX idx_registrations_event_id ON public.registrations(event_id);
CREATE INDEX idx_registrations_profile_id ON public.registrations(profile_id);
CREATE INDEX idx_registrations_checked_in ON public.registrations(checked_in);

-- Attendance logs indexes
CREATE INDEX idx_attendance_logs_event_id ON public.attendance_logs(event_id);
CREATE INDEX idx_attendance_logs_profile_id ON public.attendance_logs(profile_id);
CREATE INDEX idx_attendance_logs_timestamp ON public.attendance_logs(timestamp);

-- Notifications indexes
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at);

-- -------------------------------------------------------------------------
-- 4. UTILITY FUNCTIONS
-- -------------------------------------------------------------------------

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Function to automatically create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, usn, branch)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', 'Unknown User'),
    COALESCE(NEW.raw_user_meta_data ->> 'usn', 'USN' || EXTRACT(EPOCH FROM NOW())::TEXT),
    COALESCE(NEW.raw_user_meta_data ->> 'branch', 'Unknown')
  );
  RETURN NEW;
END;
$$;

-- Function to check if user is college admin
CREATE OR REPLACE FUNCTION public.is_college_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = user_uuid AND role = 'college_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to check if user is club admin for a specific club
CREATE OR REPLACE FUNCTION public.is_club_admin(user_uuid UUID, club_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.club_members 
    WHERE profile_id = user_uuid AND club_id = club_uuid AND role = 'admin'
  ) OR public.is_college_admin(user_uuid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to get user's clubs where they are admin
CREATE OR REPLACE FUNCTION public.get_user_admin_clubs(user_uuid UUID)
RETURNS TABLE(club_id UUID, club_name TEXT) AS $$
BEGIN
  IF public.is_college_admin(user_uuid) THEN
    -- College admins can access all approved clubs
    RETURN QUERY
    SELECT c.id, c.name
    FROM public.clubs c
    WHERE c.approved = true
    ORDER BY c.name;
  ELSE
    -- Regular users only get clubs they admin
    RETURN QUERY
    SELECT c.id, c.name
    FROM public.clubs c
    JOIN public.club_members cm ON c.id = cm.club_id
    WHERE cm.profile_id = user_uuid AND cm.role = 'admin'
    ORDER BY c.name;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to create notification
CREATE OR REPLACE FUNCTION public.create_notification(
  target_user_id UUID,
  notification_title TEXT,
  notification_message TEXT,
  notification_type TEXT DEFAULT 'info',
  notification_action_url TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO public.notifications (user_id, title, message, type, action_url)
  VALUES (target_user_id, notification_title, notification_message, notification_type, notification_action_url)
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- -------------------------------------------------------------------------
-- 5. TRIGGERS
-- -------------------------------------------------------------------------

-- Trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Triggers for updating timestamps
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_clubs_updated_at
  BEFORE UPDATE ON public.clubs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- -------------------------------------------------------------------------
-- 6. ROW LEVEL SECURITY (RLS)
-- -------------------------------------------------------------------------

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.join_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- -------------------------------------------------------------------------
-- RLS POLICIES FOR PROFILES
-- -------------------------------------------------------------------------

CREATE POLICY "profiles_select_all" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "profiles_update_admin" ON public.profiles
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'college_admin')
  );

-- -------------------------------------------------------------------------
-- RLS POLICIES FOR CLUBS
-- -------------------------------------------------------------------------

CREATE POLICY "clubs_select_approved" ON public.clubs
  FOR SELECT USING (
    approved = true OR 
    created_by = auth.uid() OR
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'college_admin')
  );

CREATE POLICY "clubs_insert_college_admin" ON public.clubs
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'college_admin')
  );

CREATE POLICY "clubs_update_admin_or_creator" ON public.clubs
  FOR UPDATE USING (
    created_by = auth.uid() OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'college_admin') OR
    EXISTS (SELECT 1 FROM public.club_members WHERE club_id = clubs.id AND profile_id = auth.uid() AND role = 'admin')
  );

-- -------------------------------------------------------------------------
-- RLS POLICIES FOR CLUB_MEMBERS
-- -------------------------------------------------------------------------

CREATE POLICY "club_members_select_visible" ON public.club_members
  FOR SELECT USING (
    profile_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.club_members cm WHERE cm.club_id = club_members.club_id AND cm.profile_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'college_admin')
  );

CREATE POLICY "club_members_insert_admin" ON public.club_members
  FOR INSERT WITH CHECK (
    profile_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.club_members cm WHERE cm.club_id = club_members.club_id AND cm.profile_id = auth.uid() AND cm.role = 'admin') OR
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'college_admin')
  );

CREATE POLICY "club_members_update_admin" ON public.club_members
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.club_members cm WHERE cm.club_id = club_members.club_id AND cm.profile_id = auth.uid() AND cm.role = 'admin') OR
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'college_admin')
  );

CREATE POLICY "club_members_delete_admin" ON public.club_members
  FOR DELETE USING (
    profile_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.club_members cm WHERE cm.club_id = club_members.club_id AND cm.profile_id = auth.uid() AND cm.role = 'admin') OR
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'college_admin')
  );

-- -------------------------------------------------------------------------
-- RLS POLICIES FOR JOIN_REQUESTS
-- -------------------------------------------------------------------------

CREATE POLICY "join_requests_select_own_or_admin" ON public.join_requests
  FOR SELECT USING (
    profile_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.club_members cm WHERE cm.club_id = join_requests.club_id AND cm.profile_id = auth.uid() AND cm.role = 'admin') OR
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'college_admin')
  );

CREATE POLICY "join_requests_insert_own" ON public.join_requests
  FOR INSERT WITH CHECK (profile_id = auth.uid());

CREATE POLICY "join_requests_update_admin" ON public.join_requests
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.club_members cm WHERE cm.club_id = join_requests.club_id AND cm.profile_id = auth.uid() AND cm.role = 'admin') OR
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'college_admin')
  );

-- -------------------------------------------------------------------------
-- RLS POLICIES FOR EVENTS
-- -------------------------------------------------------------------------

CREATE POLICY "events_select_approved_clubs" ON public.events
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.clubs WHERE id = events.club_id AND approved = true)
  );

CREATE POLICY "events_insert_club_admin" ON public.events
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.club_members cm WHERE cm.club_id = events.club_id AND cm.profile_id = auth.uid() AND cm.role = 'admin') OR
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'college_admin')
  );

CREATE POLICY "events_update_club_admin" ON public.events
  FOR UPDATE USING (
    created_by = auth.uid() OR
    EXISTS (SELECT 1 FROM public.club_members cm WHERE cm.club_id = events.club_id AND cm.profile_id = auth.uid() AND cm.role = 'admin') OR
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'college_admin')
  );

CREATE POLICY "events_delete_club_admin" ON public.events
  FOR DELETE USING (
    created_by = auth.uid() OR
    EXISTS (SELECT 1 FROM public.club_members cm WHERE cm.club_id = events.club_id AND cm.profile_id = auth.uid() AND cm.role = 'admin') OR
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'college_admin')
  );

-- -------------------------------------------------------------------------
-- RLS POLICIES FOR TEAMS
-- -------------------------------------------------------------------------

CREATE POLICY "teams_select_event_visible" ON public.teams
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.events e JOIN public.clubs c ON e.club_id = c.id WHERE e.id = teams.event_id AND c.approved = true)
  );

CREATE POLICY "teams_insert_leader" ON public.teams
  FOR INSERT WITH CHECK (leader_id = auth.uid());

CREATE POLICY "teams_update_leader_or_admin" ON public.teams
  FOR UPDATE USING (
    leader_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.events e 
      JOIN public.club_members cm ON e.club_id = cm.club_id 
      WHERE e.id = teams.event_id AND cm.profile_id = auth.uid() AND cm.role = 'admin'
    ) OR
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'college_admin')
  );

CREATE POLICY "teams_delete_leader_or_admin" ON public.teams
  FOR DELETE USING (
    leader_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.events e 
      JOIN public.club_members cm ON e.club_id = cm.club_id 
      WHERE e.id = teams.event_id AND cm.profile_id = auth.uid() AND cm.role = 'admin'
    ) OR
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'college_admin')
  );

-- -------------------------------------------------------------------------
-- RLS POLICIES FOR TEAM_MEMBERS
-- -------------------------------------------------------------------------

CREATE POLICY "team_members_select_visible" ON public.team_members
  FOR SELECT USING (
    profile_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.teams WHERE id = team_members.team_id AND leader_id = auth.uid()) OR
    EXISTS (
      SELECT 1 FROM public.teams t
      JOIN public.events e ON t.event_id = e.id
      JOIN public.club_members cm ON e.club_id = cm.club_id
      WHERE t.id = team_members.team_id AND cm.profile_id = auth.uid() AND cm.role = 'admin'
    ) OR
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'college_admin')
  );

CREATE POLICY "team_members_insert_self_or_leader" ON public.team_members
  FOR INSERT WITH CHECK (
    profile_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.teams WHERE id = team_members.team_id AND leader_id = auth.uid())
  );

CREATE POLICY "team_members_delete_self_or_leader" ON public.team_members
  FOR DELETE USING (
    profile_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.teams WHERE id = team_members.team_id AND leader_id = auth.uid()) OR
    EXISTS (
      SELECT 1 FROM public.teams t
      JOIN public.events e ON t.event_id = e.id
      JOIN public.club_members cm ON e.club_id = cm.club_id
      WHERE t.id = team_members.team_id AND cm.profile_id = auth.uid() AND cm.role = 'admin'
    ) OR
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'college_admin')
  );

-- -------------------------------------------------------------------------
-- RLS POLICIES FOR REGISTRATIONS
-- -------------------------------------------------------------------------

CREATE POLICY "registrations_select_own_or_admin" ON public.registrations
  FOR SELECT USING (
    profile_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.events e 
      JOIN public.club_members cm ON e.club_id = cm.club_id 
      WHERE e.id = registrations.event_id AND cm.profile_id = auth.uid() AND cm.role = 'admin'
    ) OR
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'college_admin')
  );

CREATE POLICY "registrations_insert_own" ON public.registrations
  FOR INSERT WITH CHECK (profile_id = auth.uid());

CREATE POLICY "registrations_update_own_or_admin" ON public.registrations
  FOR UPDATE USING (
    profile_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.events e 
      JOIN public.club_members cm ON e.club_id = cm.club_id 
      WHERE e.id = registrations.event_id AND cm.profile_id = auth.uid() AND cm.role = 'admin'
    ) OR
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'college_admin')
  );

-- -------------------------------------------------------------------------
-- RLS POLICIES FOR ATTENDANCE_LOGS
-- -------------------------------------------------------------------------

CREATE POLICY "attendance_logs_select_own_or_admin" ON public.attendance_logs
  FOR SELECT USING (
    profile_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.events e 
      JOIN public.club_members cm ON e.club_id = cm.club_id 
      WHERE e.id = attendance_logs.event_id AND cm.profile_id = auth.uid() AND cm.role = 'admin'
    ) OR
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'college_admin')
  );

CREATE POLICY "attendance_logs_insert_self_or_admin" ON public.attendance_logs
  FOR INSERT WITH CHECK (
    profile_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.events e 
      JOIN public.club_members cm ON e.club_id = cm.club_id 
      WHERE e.id = attendance_logs.event_id AND cm.profile_id = auth.uid() AND cm.role = 'admin'
    ) OR
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'college_admin')
  );

-- -------------------------------------------------------------------------
-- RLS POLICIES FOR NOTIFICATIONS
-- -------------------------------------------------------------------------

CREATE POLICY "notifications_select_own" ON public.notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "notifications_insert_admin" ON public.notifications
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role IN ('club_admin', 'college_admin'))
  );

CREATE POLICY "notifications_update_own" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid());

-- -------------------------------------------------------------------------
-- RLS POLICIES FOR SYSTEM_SETTINGS
-- -------------------------------------------------------------------------

CREATE POLICY "system_settings_select_admin" ON public.system_settings
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'college_admin')
  );

CREATE POLICY "system_settings_insert_admin" ON public.system_settings
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'college_admin')
  );

CREATE POLICY "system_settings_update_admin" ON public.system_settings
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'college_admin')
  );

-- -------------------------------------------------------------------------
-- 7. INITIAL DATA
-- -------------------------------------------------------------------------

-- Insert default system settings
INSERT INTO public.system_settings (key, value, description) VALUES
  ('app_name', '"Campus Connect"', 'Application name'),
  ('max_team_size', '10', 'Maximum team size for team events'),
  ('registration_cutoff_hours', '2', 'Hours before event when registration closes'),
  ('qr_code_expiry_minutes', '15', 'QR code validity duration in minutes'),
  ('notification_settings', '{"email": true, "push": true, "sms": false}', 'Default notification preferences');

-- =========================================================================
-- END OF MIGRATION
-- =========================================================================