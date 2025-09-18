import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Users, Building, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import EventsTimeline from '@/components/Events/EventsTimeline';

interface DashboardStats {
  totalEvents: number;
  totalStudents: number;
  totalClubs: number;
  attendanceRate: number;
}

interface RecentEvent {
  id: string;
  title: string;
  start_time: string;
  clubs: {
    name: string;
  };
}

const Index = () => {
  const { user, profile, loading } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalEvents: 0,
    totalStudents: 0,
    totalClubs: 0,
    attendanceRate: 0,
  });
  const [recentEvents, setRecentEvents] = useState<RecentEvent[]>([]);
  const [userRegistrations, setUserRegistrations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const fetchDashboardData = async () => {
    try {
      // Fetch statistics
      const [eventsRes, profilesRes, clubsRes] = await Promise.all([
        supabase.from('events').select('id', { count: 'exact' }),
        supabase.from('profiles').select('user_id', { count: 'exact' }),
        supabase.from('clubs').select('id', { count: 'exact' }).eq('approved', true),
      ]);

      // Fetch recent events
      const { data: events } = await supabase
        .from('events')
        .select('id, title, start_time, clubs(name)')
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true })
        .limit(3);

      // Fetch user registrations for the authenticated user (any role)
      let registrations = [];
      const { data: registrationsData } = await supabase
        .from('registrations')
        .select(`
          id,
          registered_at,
          events(
            title,
            start_time,
            is_team_event
          ),
          teams(name)
        `)
        .eq('profile_id', user.id)
        .order('registered_at', { ascending: false })
        .limit(3);

      registrations = registrationsData || [];

      setStats({
        totalEvents: eventsRes.count || 0,
        totalStudents: profilesRes.count || 0,
        totalClubs: clubsRes.count || 0,
        attendanceRate: 85, // This would need attendance logs calculation
      });

      setRecentEvents(events || []);
      setUserRegistrations(registrations);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user && profile) {
      fetchDashboardData();
    }
  }, [user, profile]);

  const formatEventTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays <= 7) return `In ${diffDays} days`;
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
          <div>
            <h1>Dashboard</h1>
            <p className="text-muted-foreground">
            Welcome to your college event management dashboard
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Events</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalEvents}</div>
              <p className="text-xs text-muted-foreground">
                Upcoming and ongoing events
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Registered Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalStudents}</div>
              <p className="text-xs text-muted-foreground">
                Total registered students
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Clubs</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalClubs}</div>
              <p className="text-xs text-muted-foreground">
                Approved active clubs
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.attendanceRate}%</div>
              <p className="text-xs text-muted-foreground">
                Average event attendance
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Timeline + Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <EventsTimeline />

          <Card>
            <CardHeader>
              <CardTitle>Recent Events</CardTitle>
              <CardDescription>
                Latest events in your college
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentEvents.length > 0 ? (
                  recentEvents.map((event, index) => (
                    <div key={event.id} className="flex items-center">
                      <div className={`w-2 h-2 rounded-full mr-3 ${
                        index === 0 ? 'bg-primary' : 
                        index === 1 ? 'bg-secondary' : 'bg-accent'
                      }`}></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{event.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {event.clubs.name} • {formatEventTime(event.start_time)}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No upcoming events</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>My Registrations</CardTitle>
              <CardDescription>
                Events you've registered for
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {userRegistrations.length > 0 ? (
                  userRegistrations.map((registration: any) => (
                    <div key={registration.id} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{registration.events?.title || 'Event unavailable'}</p>
                        <p className="text-xs text-muted-foreground">
                          {registration.events?.is_team_event ? 
                            `Team: ${registration.teams?.name || 'No team'}` : 
                            'Individual'
                          }
                        </p>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {registration.events?.start_time ? formatEventTime(registration.events.start_time) : ''}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No event registrations yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Index;
