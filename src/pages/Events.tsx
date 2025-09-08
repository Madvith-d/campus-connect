import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Users, Clock, Plus } from 'lucide-react';

const Events = () => {
  const { user, profile, loading } = useAuth();

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

  // Mock events data - will be replaced with real Supabase queries
  const events = [
    {
      id: '1',
      title: 'Tech Symposium 2024',
      description: 'Annual technical symposium featuring latest tech trends',
      location: 'Main Auditorium',
      start_time: '2024-09-15T09:00:00Z',
      end_time: '2024-09-15T17:00:00Z',
      capacity: 200,
      is_team_event: false,
      club_name: 'Computer Science Club',
      registered: 150,
    },
    {
      id: '2',
      title: 'Hackathon 2024',
      description: '24-hour coding marathon to solve real-world problems',
      location: 'Computer Lab',
      start_time: '2024-09-20T18:00:00Z',
      end_time: '2024-09-21T18:00:00Z',
      capacity: 100,
      is_team_event: true,
      club_name: 'Coding Club',
      registered: 80,
    },
    {
      id: '3',
      title: 'Cultural Night',
      description: 'Celebrate diversity through music, dance, and performances',
      location: 'Open Ground',
      start_time: '2024-09-25T19:00:00Z',
      end_time: '2024-09-25T22:00:00Z',
      capacity: 500,
      is_team_event: false,
      club_name: 'Cultural Committee',
      registered: 320,
    },
  ];

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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Events</h1>
            <p className="text-muted-foreground">
              Discover and register for college events
            </p>
          </div>
          
          {profile?.role !== 'student' && (
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Event
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <Card key={event.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{event.title}</CardTitle>
                    <CardDescription className="mt-1">
                      {event.club_name}
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
                    <span className={getAvailabilityColor(event.registered, event.capacity)}>
                      {event.registered}/{event.capacity} registered
                    </span>
                  </div>
                </div>
                
                <div className="flex gap-2 pt-2">
                  <Button className="flex-1" size="sm">
                    Register
                  </Button>
                  <Button variant="outline" size="sm">
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
      </div>
    </DashboardLayout>
  );
};

export default Events;