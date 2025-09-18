import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, BarChart3, QrCode, UserCheck, Calendar } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import CreateEventDialog from '@/components/Events/CreateEventDialog';
import EditEventDialog from '@/components/Events/EditEventDialog';
// Event details now opens as a dedicated page; dialog import removed
import TeamCreationDialog from '@/components/Events/TeamCreationDialog';
import AttendanceDashboard from '@/components/Events/AttendanceDashboard';
import AttendanceCheckIn from '@/components/Events/AttendanceCheckIn';
import EventCard from '@/components/Events/EventCard';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

interface Event {
  id: string;
  title: string;
  description: string | null;
  location: string;
  start_time: string;
  end_time: string;
  capacity: number;
  is_team_event: boolean;
  club_id: string;
  event_image_url?: string | null;
  gradient_colors?: any;
  gradient_css?: string | null;
  clubs: {
    name: string;
  };
  registrations: Array<{
    id: string;
    profile_id: string;
  }>;
}

const Events = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  // Details dialog no longer used; navigation is used instead
  const [isTeamDialogOpen, setIsTeamDialogOpen] = useState(false);
  const [isAttendanceDashboardOpen, setIsAttendanceDashboardOpen] = useState(false);
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [adminClubIds, setAdminClubIds] = useState<Set<string>>(new Set());
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

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          clubs(name),
          registrations(id, profile_id)
        `)
        // Fetch all events; we'll sort client-side to place upcoming first and completed last
        ;

      if (error) throw error;
      const now = Date.now();
      const sorted = (data || []).slice().sort((a: any, b: any) => {
        const aStart = new Date(a.start_time).getTime();
        const bStart = new Date(b.start_time).getTime();
        const aEnd = new Date(a.end_time).getTime();
        const bEnd = new Date(b.end_time).getTime();

        const aIsCompleted = aEnd < now;
        const bIsCompleted = bEnd < now;

        // Upcoming (or ongoing) first, completed last
        if (aIsCompleted !== bIsCompleted) return aIsCompleted ? 1 : -1;

        // If both upcoming/ongoing: sort by start time ascending (closest first)
        if (!aIsCompleted && !bIsCompleted) return aStart - bStart;

        // If both completed: sort by end time descending (most recently completed first)
        return bEnd - aEnd;
      });

      setEvents(sorted as any);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchEvents();
    }
  }, [user]);

  // Load club admin memberships to enable management controls for club admins
  useEffect(() => {
    const loadAdminClubs = async () => {
      if (!profile?.user_id) return;
      try {
        const { data, error } = await supabase
          .from('club_members')
          .select('club_id')
          .eq('profile_id', profile.user_id)
          .eq('role', 'admin');
        if (error) throw error;
        setAdminClubIds(new Set((data || []).map((row: any) => row.club_id)));
      } catch (e) {
        console.error('Failed to load admin clubs', e);
      }
    };
    loadAdminClubs();
  }, [profile?.user_id]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getAvailabilityColor = (registered: number, capacity: number) => {
    const percentage = (registered / capacity) * 100;
    if (percentage >= 90) return 'text-red-500';
    if (percentage >= 70) return 'text-orange-500';
    return 'text-green-500';
  };

  // Check if event is happening now (for attendance)
  const isEventActive = (event: Event) => {
    const now = new Date();
    const start = new Date(event.start_time);
    const end = new Date(event.end_time);
    return now >= start && now <= end;
  };

  // Check if user can manage this event
  const canManageEvent = (event: Event) => {
    if (profile?.role === 'college_admin') return true;
    if (profile?.role === 'club_admin' && adminClubIds.has(event.club_id)) return true;
    return false;
  };

  const handleEventCreated = () => {
    fetchEvents();
  };

  const handleRegister = () => {
    fetchEvents();
  };

  const isRegistered = (event: Event) => {
    return event.registrations.some(reg => reg.profile_id === profile?.user_id);
  };

  const handleRegisterClick = (event: Event) => {
    if (event.is_team_event) {
      setSelectedEvent(event);
      setIsTeamDialogOpen(true);
    } else {
      setSelectedEvent(event);
      setIsDetailsDialogOpen(true);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading events...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h1>Events</h1>
            <p className="text-muted-foreground">
              Discover and register for college events
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {/* Quick Check-in Button */}
            <Button 
              variant="outline"
              size="sm"
              onClick={() => setIsCheckInOpen(true)}
            >
              <QrCode className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Quick Check-in</span>
              <span className="sm:hidden">Check-in</span>
            </Button>
            
            {(profile?.role === 'club_admin' || profile?.role === 'college_admin') && (
              <Button size="sm" onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Create Event</span>
                <span className="sm:hidden">Create</span>
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              posterUrl={event.event_image_url}
              onViewDetails={(event) => {
                navigate(`/events/${event.id}`);
              }}
              onEdit={(event) => {
                setSelectedEvent(event);
                setIsEditDialogOpen(true);
              }}
              onViewAnalytics={(event) => {
                navigate(`/events/${event.id}/analytics`);
              }}
              onCheckIn={(event) => {
                setSelectedEvent(event);
                setIsCheckInOpen(true);
              }}
              canEdit={canManageEvent(event)}
              canViewAnalytics={canManageEvent(event)}
              canCheckIn={isEventActive(event) && isRegistered(event)}
            />
          ))}
        </div>

        {events.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Events Found</h3>
              <p className="text-muted-foreground">
                There are no upcoming events at the moment. Check back later!
              </p>
            </CardContent>
          </Card>
        )}

        <CreateEventDialog 
          isOpen={isCreateDialogOpen}
          onClose={() => setIsCreateDialogOpen(false)}
          onEventCreated={handleEventCreated}
        />

        {/* Details dialog removed in favor of route-based page */}

        <TeamCreationDialog
          eventId={selectedEvent?.id || ''}
          isOpen={isTeamDialogOpen}
          onClose={() => setIsTeamDialogOpen(false)}
          onTeamCreated={(teamId) => {
            // Handle team creation and then register for event
            fetchEvents();
            setIsTeamDialogOpen(false);
          }}
        />

        <AttendanceDashboard
          isOpen={isAttendanceDashboardOpen}
          onClose={() => setIsAttendanceDashboardOpen(false)}
          eventId={selectedEvent?.id || ''}
          eventTitle={selectedEvent?.title || ''}
          clubName={selectedEvent?.clubs?.name || ''}
          location={selectedEvent?.location || ''}
          startTime={selectedEvent?.start_time || ''}
          endTime={selectedEvent?.end_time || ''}
        />

        <AttendanceCheckIn
          isOpen={isCheckInOpen}
          onClose={() => setIsCheckInOpen(false)}
          eventId={selectedEvent?.id || ''}
          eventTitle={selectedEvent?.title || ''}
          onAttendanceLogged={fetchEvents}
        />

        <EditEventDialog
          isOpen={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          event={selectedEvent}
          onEventUpdated={() => {
            setIsEditDialogOpen(false);
            fetchEvents();
          }}
          onEventDeleted={() => {
            setIsEditDialogOpen(false);
            fetchEvents();
          }}
        />
      </div>
    </DashboardLayout>
  );
};

export default Events;