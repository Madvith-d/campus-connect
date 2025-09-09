import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Users, Check, X, Clock } from 'lucide-react';

interface JoinRequest {
  id: string;
  profile_id: string;
  requested_at: string;
  message: string | null;
  status: string;
  profiles: {
    name: string;
    usn: string;
    branch: string;
  } | null;
}

interface JoinRequestsDialogProps {
  clubId: string;
  clubName: string;
  pendingCount: number;
  onRequestHandled?: () => void;
}

const JoinRequestsDialog = ({ clubId, clubName, pendingCount, onRequestHandled }: JoinRequestsDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRequests = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('join_requests')
        .select(`
          id,
          profile_id,
          requested_at,
          message,
          status
        `)
        .eq('club_id', clubId)
        .eq('status', 'pending')
        .order('requested_at', { ascending: false });

      if (error) {
        console.error('Error fetching join requests:', error);
        return;
      }

      // Get profile data separately
      const profileIds = data?.map(r => r.profile_id) || [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, name, usn, branch')
        .in('user_id', profileIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      const enrichedRequests = data?.map(request => ({
        ...request,
        profiles: profileMap.get(request.profile_id) || null,
      })) || [];

      setRequests(enrichedRequests);
    } catch (error) {
      console.error('Error in fetchRequests:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchRequests();
    }
  }, [open]);

  const handleRequest = async (requestId: string, action: 'approved' | 'rejected') => {
    if (!user) return;

    try {
      const { error: updateError } = await supabase
        .from('join_requests')
        .update({
          status: action,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id,
        })
        .eq('id', requestId);

      if (updateError) {
        toast({
          title: "Error",
          description: updateError.message,
          variant: "destructive",
        });
        return;
      }

      // If approved, add to club_members
      if (action === 'approved') {
        const request = requests.find(r => r.id === requestId);
        if (request) {
          const { error: memberError } = await supabase
            .from('club_members')
            .insert({
              club_id: clubId,
              profile_id: request.profile_id,
              role: 'member',
            });

          if (memberError) {
            toast({
              title: "Error adding member",
              description: memberError.message,
              variant: "destructive",
            });
            return;
          }
        }
      }

      toast({
        title: `Request ${action}`,
        description: `Join request has been ${action}.`,
      });

      fetchRequests();
      onRequestHandled?.();
    } catch (error) {
      console.error('Error handling request:', error);
      toast({
        title: "Error",
        description: "Failed to handle request. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Users className="h-4 w-4 mr-2" />
          Join Requests
          {pendingCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {pendingCount}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Join Requests - {clubName}</DialogTitle>
          <DialogDescription>
            Review and manage pending membership requests for your club.
          </DialogDescription>
        </DialogHeader>
        
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No pending join requests.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <Card key={request.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{request.profiles?.name || 'Unknown'}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        USN: {request.profiles?.usn || 'N/A'} • {request.profiles?.branch || 'N/A'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Requested: {new Date(request.requested_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {request.message && (
                    <p className="text-sm mt-2 p-2 bg-muted rounded">{request.message}</p>
                  )}
                </CardHeader>
                <CardContent className="flex gap-2 pt-0">
                  <Button
                    size="sm"
                    onClick={() => handleRequest(request.id, 'approved')}
                    className="flex-1"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleRequest(request.id, 'rejected')}
                    className="flex-1"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default JoinRequestsDialog;