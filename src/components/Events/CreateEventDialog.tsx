import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface CreateEventDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onEventCreated?: () => void;
}

const CreateEventDialog = ({ isOpen, onClose, onEventCreated }: CreateEventDialogProps) => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [userClubs, setUserClubs] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedClubId, setSelectedClubId] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    start_time: '',
    end_time: '',
    capacity: 50,
    is_team_event: false,
  });

  // Fetch clubs where user is admin
  useEffect(() => {
    const fetchUserClubs = async () => {
      if (!profile) return;

      try {
        let clubs = [];
        
        if (profile.role === 'college_admin') {
          // College admins can create events for any club
          const { data, error } = await supabase
            .from('clubs')
            .select('id, name')
            .eq('approved', true)
            .order('name');
            
          if (error) throw error;
          clubs = data || [];
        } else if (profile.role === 'club_admin') {
          // Club admins can only create events for clubs they admin
          const { data, error } = await supabase
            .from('club_members')
            .select(`
              clubs (id, name)
            `)
            .eq('profile_id', profile.user_id)
            .eq('role', 'admin');

          if (error) throw error;
          clubs = data?.map(item => item.clubs).filter(Boolean) || [];
        }
        
        setUserClubs(clubs);
        if (clubs.length > 0) {
          setSelectedClubId(clubs[0].id);
        }
      } catch (error) {
        console.error('Error fetching user clubs:', error);
      }
    };

    if (isOpen) {
      fetchUserClubs();
    }
  }, [isOpen, profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedClubId) return;

    // Validate dates
    const startDate = new Date(formData.start_time);
    const endDate = new Date(formData.end_time);
    
    if (startDate >= endDate) {
      toast({
        title: "Invalid dates",
        description: "End time must be after start time.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('events')
        .insert({
          title: formData.title,
          description: formData.description,
          location: formData.location,
          start_time: formData.start_time,
          end_time: formData.end_time,
          capacity: formData.capacity,
          is_team_event: formData.is_team_event,
          club_id: selectedClubId,
        });

      if (error) {
        toast({
          title: "Error creating event",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Event created successfully",
        description: "Your event has been created and is now available for registration.",
      });

      setFormData({
        title: '',
        description: '',
        location: '',
        start_time: '',
        end_time: '',
        capacity: 50,
        is_team_event: false,
      });
      onClose();
      onEventCreated?.();
    } catch (error) {
      console.error('Error creating event:', error);
      toast({
        title: "Error",
        description: "Failed to create event. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Event</DialogTitle>
          <DialogDescription>
            Create an event for your club members and students.
          </DialogDescription>
        </DialogHeader>
        
        {userClubs.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              {profile?.role === 'college_admin' 
                ? 'No approved clubs available.'
                : 'You need to be a club admin to create events.'
              }
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="club">Select Club</Label>
              <select
                id="club"
                className="w-full p-2 border rounded-md"
                value={selectedClubId}
                onChange={(e) => setSelectedClubId(e.target.value)}
                required
              >
                {userClubs.map(club => (
                  <option key={club.id} value={club.id}>
                    {club.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="title">Event Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter event title"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe your event"
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Event location"
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_time">Start Time</Label>
                <Input
                  id="start_time"
                  type="datetime-local"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_time">End Time</Label>
                <Input
                  id="end_time"
                  type="datetime-local"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="capacity">Capacity</Label>
              <Input
                id="capacity"
                type="number"
                min="1"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
                required
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="is_team_event"
                checked={formData.is_team_event}
                onCheckedChange={(checked) => setFormData({ ...formData, is_team_event: checked })}
              />
              <Label htmlFor="is_team_event">Team Event (requires team registration)</Label>
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create Event
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CreateEventDialog;