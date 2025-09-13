import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, MapPin, Users, Clock, User, UserPlus } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

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

interface EventDetailsDialogProps {
  event: Event | null;
  isOpen: boolean;
  onClose: () => void;
  onRegister: () => void;
}

const EventDetailsDialog = ({ event, isOpen, onClose, onRegister }: EventDetailsDialogProps) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [isRegistering, setIsRegistering] = useState(false);

  if (!event) return null;

  const isRegistered = event.registrations.some(reg => reg.profile_id === profile?.user_id);
  const isFull = event.registrations.length >= event.capacity;

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleRegister = async () => {
    if (!profile) return;

    setIsRegistering(true);
    try {
      const { error } = await supabase
        .from('registrations')
        .insert({
          event_id: event.id,
          profile_id: profile.user_id,
        });

      if (error) throw error;

      toast({
        title: "Registration successful!",
        description: `You've successfully registered for ${event.title}`,
      });

      onRegister();
      onClose();
    } catch (error: any) {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            {event.title}
            <Badge variant={event.is_team_event ? 'secondary' : 'outline'}>
              {event.is_team_event ? 'Team Event' : 'Individual Event'}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            {event.clubs.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {event.description && (
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">{event.description}</p>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="flex items-center text-sm">
                <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                <div>
                  <p className="font-medium">Start Time</p>
                  <p className="text-muted-foreground">{formatDateTime(event.start_time)}</p>
                </div>
              </div>

              <div className="flex items-center text-sm">
                <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                <div>
                  <p className="font-medium">End Time</p>
                  <p className="text-muted-foreground">{formatDateTime(event.end_time)}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center text-sm">
                <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                <div>
                  <p className="font-medium">Location</p>
                  <p className="text-muted-foreground">{event.location}</p>
                </div>
              </div>

              <div className="flex items-center text-sm">
                <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                <div>
                  <p className="font-medium">Capacity</p>
                  <p className="text-muted-foreground">
                    {event.registrations.length} / {event.capacity} registered
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            {isRegistered ? (
              <Button disabled className="flex-1">
                <User className="h-4 w-4 mr-2" />
                Already Registered
              </Button>
            ) : isFull ? (
              <Button disabled variant="destructive" className="flex-1">
                Event Full
              </Button>
            ) : (
              <Button 
                onClick={handleRegister} 
                disabled={isRegistering}
                className="flex-1"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                {isRegistering ? "Registering..." : "Register Now"}
              </Button>
            )}
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EventDetailsDialog;