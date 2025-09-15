import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Users, Clock, Plus, BarChart3, QrCode, UserCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import CreateEventDialog from '@/components/Events/CreateEventDialog';
import EventDetailsDialog from '@/components/Events/EventDetailsDialog';
import TeamCreationDialog from '@/components/Events/TeamCreationDialog';
import AttendanceDashboard from '@/components/Events/AttendanceDashboard';
import AttendanceCheckIn from '@/components/Events/AttendanceCheckIn';

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
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isTeamDialogOpen, setIsTeamDialogOpen] = useState(false);
  const [isAttendanceDashboardOpen, setIsAttendanceDashboardOpen] = useState(false);
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
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
        .order('start_time', { ascending: true });

      if (error) throw error;
      setEvents(data || []);
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
    // Check if user is club admin for this event's club
    // This would require additional club member data which we'd fetch separately
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
              onClick={() => setIsCheckInOpen(true)}
            >
              <QrCode className="h-4 w-4 mr-2" />
              Quick Check-in
            </Button>
            
            {(profile?.role === 'club_admin' || profile?.role === 'college_admin') && (
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Event
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {events.map((event) => (
            <Card key={event.id} className="hover:shadow-lg transition-shadow elevate-card">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{event.title}</CardTitle>
                    <CardDescription className="mt-1">
                      {event.clubs.name}
                    </CardDescription>
                  </div>
                  <Badge variant={event.is_team_event ? 'secondary' : 'outline'}>
                    {event.is_team_event ? 'Team' : 'Individual'}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {event.description}
                </p>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center text-muted-foreground">
                    <Calendar className="h-4 w-4 mr-2" />
                    {formatDate(event.start_time)}
                  </div>
                  
                  <div className="flex items-center text-muted-foreground">
                    <Clock className="h-4 w-4 mr-2" />
                    {formatTime(event.start_time)} - {formatTime(event.end_time)}
                  </div>
                  
                  <div className="flex items-center text-muted-foreground">
                    <MapPin className="h-4 w-4 mr-2" />
                    {event.location}
                  </div>
                  
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className={getAvailabilityColor(event.registrations.length, event.capacity)}>
                      {event.registrations.length}/{event.capacity} registered
                    </span>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2 pt-2">
                  {isRegistered(event) ? (
                    <Button className="flex-1" size="sm" disabled>
                      Registered
                    </Button>
                  ) : (
                    <Button 
                      className="flex-1" 
                      size="sm"
                      onClick={() => handleRegisterClick(event)}
                    >
                      Register
                    </Button>
                  )}
                            
                  {/* Attendance Check-in Button */}
                  {isEventActive(event) && isRegistered(event) && (
                    <Button 
                      size="sm"
                      onClick={() => {
                        setSelectedEvent(event);
                        setIsCheckInOpen(true);
                      }}
                    >
                      <UserCheck className="h-4 w-4 mr-1" />
                      Check-in
                    </Button>
                  )}
                            
                  {/* Management Buttons for Admins */}
                  {canManageEvent(event) && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setSelectedEvent(event);
                        setIsAttendanceDashboardOpen(true);
                      }}
                    >
                      <BarChart3 className="h-4 w-4 mr-1" />
                      Dashboard
                    </Button>
                  )}
                            
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setSelectedEvent(event);
                      setIsDetailsDialogOpen(true);
                    }}
                  >
                    Details
                  </Button>
                </div>
              </CardContent>
            </Card>
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

        <EventDetailsDialog
          event={selectedEvent}
          isOpen={isDetailsDialogOpen}
          onClose={() => setIsDetailsDialogOpen(false)}
          onRegister={handleRegister}
        />

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
      </div>
    </DashboardLayout>
  );
};

export default Events;