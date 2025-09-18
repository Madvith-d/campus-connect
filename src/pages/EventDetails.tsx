import { useEffect, useMemo, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MapPin, Users, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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

const EventDetails = () => {
  const { user, loading } = useAuth();
  const { eventId } = useParams();
  const { toast } = useToast();
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchEvent = async () => {
      if (!eventId) return;
      try {
        const { data, error } = await supabase
          .from('events')
          .select(`*, clubs(name), registrations(id, profile_id)`) 
          .eq('id', eventId)
          .single();
        if (error) throw error;
        setEvent(data as any);
      } catch (e: any) {
        toast({ title: 'Failed to load event', description: e.message, variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    };
    fetchEvent();
  }, [eventId]);

  const imageUrl = useMemo(() => event?.event_image_url || '', [event]);
  const hasImage = Boolean(imageUrl);

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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={() => history.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Back</span>
          </Button>
        </div>

        {isLoading ? (
          <div className="min-h-[40vh] flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Loading event...</p>
            </div>
          </div>
        ) : !event ? (
          <Card className="text-center py-12">
            <CardContent>
              <h3 className="text-lg font-semibold mb-2">Event not found</h3>
              <p className="text-muted-foreground">The event you are looking for does not exist.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <div className="relative w-full h-48 sm:h-64 md:h-96 rounded-lg overflow-hidden">
              {hasImage ? (
                <img src={imageUrl} alt={`${event.title} poster`} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-black flex items-center justify-center p-4">
                  <h2 className="text-white font-heading text-lg sm:text-2xl md:text-3xl tracking-tight text-center">{event.title}</h2>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 right-3 sm:right-4 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h1 className="text-white text-lg sm:text-2xl md:text-3xl font-semibold truncate">{event.title}</h1>
                  <p className="text-white/90 text-sm sm:text-base truncate">{event.clubs?.name}</p>
                </div>
                <Badge variant={event.is_team_event ? 'secondary' : 'outline'} className="bg-white/90 text-foreground border-foreground/20 w-fit">
                  {event.is_team_event ? 'Team' : 'Individual'}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="md:col-span-2">
                <CardContent className="pt-6 space-y-6">
                  {event.description && (
                    <p className="text-foreground/90 whitespace-pre-line">{event.description}</p>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center text-sm text-foreground/80">
                      <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="truncate">{new Date(event.start_time).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center text-sm text-foreground/80">
                      <Clock className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="truncate">{new Date(event.end_time).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center text-sm text-foreground/80 sm:col-span-2">
                      <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="truncate">{event.location}</span>
                    </div>
                    <div className="flex items-center text-sm text-foreground/80 sm:col-span-2">
                      <Users className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span>{event.registrations.length}/{event.capacity} registered</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-4">
                {/* Registration actions can be added here in the future */}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default EventDetails;


