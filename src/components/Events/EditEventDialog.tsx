import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface EventForEdit {
  id: string;
  title: string;
  description: string | null;
  location: string;
  start_time: string;
  end_time: string;
  capacity: number;
  is_team_event: boolean;
  club_id: string;
}

interface EditEventDialogProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventForEdit | null;
  onEventUpdated: () => void;
  onEventDeleted?: () => void;
}

const toLocalInputValue = (isoString: string) => {
  if (!isoString) return '';
  const d = new Date(isoString);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const fromLocalInputValue = (local: string) => {
  return local ? new Date(local).toISOString() : '';
};

const EditEventDialog = ({ isOpen, onClose, event, onEventUpdated, onEventDeleted }: EditEventDialogProps) => {
  const { toast } = useToast();

  const initial = useMemo(() => ({
    title: event?.title || '',
    description: event?.description || '',
    location: event?.location || '',
    start_time: toLocalInputValue(event?.start_time || ''),
    end_time: toLocalInputValue(event?.end_time || ''),
    capacity: event?.capacity ?? 0,
    is_team_event: event?.is_team_event ?? false,
  }), [event]);

  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    setForm(initial);
  }, [initial]);

  if (!event) return null;

  const onSubmit = async () => {
    if (!event?.id) return;
    if (!form.title.trim()) {
      toast({ title: 'Title is required', variant: 'destructive' });
      return;
    }
    if (!form.location.trim()) {
      toast({ title: 'Location is required', variant: 'destructive' });
      return;
    }
    if (!form.start_time || !form.end_time) {
      toast({ title: 'Start and end time are required', variant: 'destructive' });
      return;
    }
    const startIso = fromLocalInputValue(form.start_time);
    const endIso = fromLocalInputValue(form.end_time);
    if (new Date(startIso) > new Date(endIso)) {
      toast({ title: 'Start time must be before end time', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('events')
        .update({
          title: form.title.trim(),
          description: form.description.trim(),
          location: form.location.trim(),
          start_time: startIso,
          end_time: endIso,
          capacity: Number(form.capacity) || 0,
          is_team_event: !!form.is_team_event,
        })
        .eq('id', event.id);

      if (error) throw error;

      toast({ title: 'Event updated' });
      onEventUpdated();
    } catch (e: any) {
      toast({ title: 'Failed to update event', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    if (!event?.id) return;

    setDeleting(true);
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', event.id);

      if (error) throw error;

      toast({ title: 'Event deleted successfully' });
      onEventDeleted?.();
      onClose();
    } catch (e: any) {
      toast({ title: 'Failed to delete event', description: e.message, variant: 'destructive' });
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Event</DialogTitle>
          <DialogDescription>Update event details and save changes.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input id="location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_time">Start Time</Label>
              <Input id="start_time" type="datetime-local" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_time">End Time</Label>
              <Input id="end_time" type="datetime-local" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <div className="space-y-2">
              <Label htmlFor="capacity">Capacity</Label>
              <Input id="capacity" type="number" min={0} value={form.capacity} onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })} />
            </div>
            <div className="flex items-center gap-2 pt-6 md:pt-0">
              <Checkbox id="is_team_event" checked={form.is_team_event} onCheckedChange={(c) => setForm({ ...form, is_team_event: !!c })} />
              <Label htmlFor="is_team_event">Team event</Label>
            </div>
          </div>

          <div className="flex justify-between pt-2">
            <div>
              <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={saving || deleting}>
                    Delete Event
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the event "{event?.title}" and remove all associated data including registrations and attendance records.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={onDelete} 
                      disabled={deleting}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      {deleting ? 'Deleting...' : 'Delete Event'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose} disabled={saving || deleting}>Cancel</Button>
              <Button onClick={onSubmit} disabled={saving || deleting}>{saving ? 'Saving...' : 'Save changes'}</Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditEventDialog;


