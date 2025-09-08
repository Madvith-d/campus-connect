-- Create enum types
CREATE TYPE public.user_role AS ENUM ('student', 'club_admin', 'college_admin');
CREATE TYPE public.club_member_role AS ENUM ('member', 'admin');
CREATE TYPE public.attendance_method AS ENUM ('self-scan', 'staff-scan', 'manual');

-- Create profiles table
CREATE TABLE public.profiles (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  usn TEXT UNIQUE NOT NULL,
  branch TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'student',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create clubs table
CREATE TABLE public.clubs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  approved BOOLEAN NOT NULL DEFAULT false,
  created_by UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create club_members table
CREATE TABLE public.club_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  role club_member_role NOT NULL DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(club_id, profile_id)
);

-- Create events table
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
  qr_code TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create teams table
CREATE TABLE public.teams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  leader_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(event_id, name)
);

-- Create team_members table
CREATE TABLE public.team_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(team_id, profile_id)
);

-- Create registrations table
CREATE TABLE public.registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  registered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(event_id, profile_id)
);

-- Create attendance_logs table
CREATE TABLE public.attendance_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  method attendance_method NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(event_id, profile_id)
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can create their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "College admins can update any profile" ON public.profiles FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'college_admin')
);

-- RLS Policies for clubs
CREATE POLICY "Users can view approved clubs" ON public.clubs FOR SELECT USING (approved = true OR created_by = auth.uid());
CREATE POLICY "College admins can view all clubs" ON public.clubs FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'college_admin')
);
CREATE POLICY "Users can create clubs" ON public.clubs FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Club creators and college admins can update clubs" ON public.clubs FOR UPDATE USING (
  created_by = auth.uid() OR 
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'college_admin')
);

-- RLS Policies for club_members
CREATE POLICY "Users can view club members of their clubs" ON public.club_members FOR SELECT USING (
  profile_id = auth.uid() OR 
  EXISTS (SELECT 1 FROM public.club_members cm WHERE cm.club_id = club_members.club_id AND cm.profile_id = auth.uid() AND cm.role = 'admin')
);
CREATE POLICY "Club admins can manage members" ON public.club_members FOR ALL USING (
  EXISTS (SELECT 1 FROM public.club_members cm WHERE cm.club_id = club_members.club_id AND cm.profile_id = auth.uid() AND cm.role = 'admin')
);
CREATE POLICY "Users can join clubs" ON public.club_members FOR INSERT WITH CHECK (profile_id = auth.uid());

-- RLS Policies for events
CREATE POLICY "Users can view events of approved clubs" ON public.events FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.clubs WHERE id = events.club_id AND approved = true)
);
CREATE POLICY "Club admins can manage events" ON public.events FOR ALL USING (
  EXISTS (SELECT 1 FROM public.club_members cm WHERE cm.club_id = events.club_id AND cm.profile_id = auth.uid() AND cm.role = 'admin')
);

-- RLS Policies for teams
CREATE POLICY "Users can view teams for events they can see" ON public.teams FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.events e JOIN public.clubs c ON e.club_id = c.id WHERE e.id = teams.event_id AND c.approved = true)
);
CREATE POLICY "Team leaders can manage their teams" ON public.teams FOR ALL USING (leader_id = auth.uid());

-- RLS Policies for team_members
CREATE POLICY "Users can view team members" ON public.team_members FOR SELECT USING (
  profile_id = auth.uid() OR 
  EXISTS (SELECT 1 FROM public.teams WHERE id = team_members.team_id AND leader_id = auth.uid())
);
CREATE POLICY "Team leaders can manage members" ON public.team_members FOR ALL USING (
  EXISTS (SELECT 1 FROM public.teams WHERE id = team_members.team_id AND leader_id = auth.uid())
);
CREATE POLICY "Users can join teams" ON public.team_members FOR INSERT WITH CHECK (profile_id = auth.uid());

-- RLS Policies for registrations
CREATE POLICY "Users can view their registrations" ON public.registrations FOR SELECT USING (profile_id = auth.uid());
CREATE POLICY "Users can register for events" ON public.registrations FOR INSERT WITH CHECK (profile_id = auth.uid());
CREATE POLICY "Club admins can view event registrations" ON public.registrations FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.events e 
    JOIN public.club_members cm ON e.club_id = cm.club_id 
    WHERE e.id = registrations.event_id AND cm.profile_id = auth.uid() AND cm.role = 'admin'
  )
);

-- RLS Policies for attendance_logs
CREATE POLICY "Users can view their attendance" ON public.attendance_logs FOR SELECT USING (profile_id = auth.uid());
CREATE POLICY "Staff can log attendance" ON public.attendance_logs FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.events e 
    JOIN public.club_members cm ON e.club_id = cm.club_id 
    WHERE e.id = attendance_logs.event_id AND cm.profile_id = auth.uid() AND cm.role = 'admin'
  ) OR profile_id = auth.uid()
);
CREATE POLICY "Club admins can view event attendance" ON public.attendance_logs FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.events e 
    JOIN public.club_members cm ON e.club_id = cm.club_id 
    WHERE e.id = attendance_logs.event_id AND cm.profile_id = auth.uid() AND cm.role = 'admin'
  )
);

-- Create function to automatically create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, usn, branch)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', 'Unknown'),
    COALESCE(NEW.raw_user_meta_data ->> 'usn', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'branch', 'Unknown')
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for timestamp updates
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