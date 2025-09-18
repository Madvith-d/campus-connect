import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Building, Users, Calendar, Plus, CheckCircle, Clock, Loader2 } from 'lucide-react';
import CreateClubDialog from '@/components/Clubs/CreateClubDialog';
import JoinRequestsDialog from '@/components/Clubs/JoinRequestsDialog';
import ClubAdminAssignmentDialog from '@/components/Clubs/ClubAdminAssignmentDialog';
import CreateEventDialog from '@/components/Events/CreateEventDialog';

interface Club {
  id: string;
  name: string;
  description: string;
  approved: boolean;
  member_count?: number;
  event_count?: number;
  user_membership?: any;
  pending_requests?: number;
  pending_request?: boolean;
}

const Clubs = () => {
  const { user, profile, loading } = useAuth();
  const { toast } = useToast();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loadingClubs, setLoadingClubs] = useState(true);
  const [joinRequestLoading, setJoinRequestLoading] = useState<string | null>(null);
  const [isCreateEventDialogOpen, setIsCreateEventDialogOpen] = useState(false);

  // Ensure hooks are called before any early returns
  useEffect(() => {
    if (user && profile) {
      fetchClubs();
    }
  }, [user, profile]);

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

  const fetchClubs = async () => {
    setLoadingClubs(true);
    try {
      // 1) Fetch clubs only (avoid nested aggregates to prevent RLS recursion)
      let query = supabase
        .from('clubs')
        .select(`
          id,
          name,
          description,
          approved,
          created_by
        `);

      // College admins see all clubs, others see only approved ones
      if (profile?.role !== 'college_admin') {
        query = query.eq('approved', true);
      }

      const { data: clubsData, error } = await query;

      if (error) {
        console.error('Error fetching clubs:', error);
        return;
      }

      // 2) Get user's membership status for each club
      const { data: memberships } = await supabase
        .from('club_members')
        .select('club_id, role')
        .eq('profile_id', user.id);

      // Build quick lookup for user's role per club
      const membershipMap = new Map(memberships?.map(m => [m.club_id, m]) || []);

      const clubIds = (clubsData || []).map((c: any) => c.id);

      // 3) Fetch events for these clubs and count client-side
      let eventsCountMap = new Map<string, number>();
      if (clubIds.length > 0) {
        const { data: eventsRows } = await supabase
          .from('events')
          .select('club_id')
          .in('club_id', clubIds);
        for (const row of eventsRows || []) {
          eventsCountMap.set(row.club_id, (eventsCountMap.get(row.club_id) || 0) + 1);
        }
      }

      // 4) Fetch visible club_members rows and count client-side
      let memberCountMap = new Map<string, number>();
      if (clubIds.length > 0) {
        const { data: memberRows } = await supabase
          .from('club_members')
          .select('club_id')
          .in('club_id', clubIds);
        for (const row of memberRows || []) {
          memberCountMap.set(row.club_id, (memberCountMap.get(row.club_id) || 0) + 1);
        }
      }

      // 5) Fetch user's pending join requests for these clubs
      let pendingRequestMap = new Map<string, boolean>();
      if (clubIds.length > 0) {
        const { data: pendingRows } = await supabase
          .from('join_requests')
          .select('club_id, status')
          .eq('profile_id', user.id)
          .in('club_id', clubIds)
          .eq('status', 'pending');
        for (const row of pendingRows || []) {
          pendingRequestMap.set((row as any).club_id, true);
        }
      }

      const enrichedClubs = await Promise.all(clubsData?.map(async (club: any) => {
        const membership = membershipMap.get(club.id);
        let pendingRequests = 0;

        // Get pending requests count for club admins only
        if (membership?.role === 'admin') {
          const { count } = await supabase
            .from('join_requests')
            .select('*', { count: 'exact', head: true })
            .eq('club_id', club.id)
            .eq('status', 'pending');
          pendingRequests = count || 0;
        }

        return {
          id: club.id,
          name: club.name,
          description: club.description,
          approved: club.approved,
          member_count: memberCountMap.get(club.id) || 0,
          event_count: eventsCountMap.get(club.id) || 0,
          user_membership: membership,
          pending_requests: pendingRequests,
          pending_request: pendingRequestMap.get(club.id) || false,
        };
      }) || []);

      setClubs(enrichedClubs);
    } catch (error) {
      console.error('Error in fetchClubs:', error);
    } finally {
      setLoadingClubs(false);
    }
  };

  

  const handleJoinRequest = async (clubId: string) => {
    setJoinRequestLoading(clubId);
    try {
      const { error } = await supabase
        .from('join_requests')
        .insert({
          club_id: clubId,
          profile_id: user.id,
        });

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          toast({
            title: "Request already sent",
            description: "You have already sent a join request for this club.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error sending request",
            description: error.message,
            variant: "destructive",
          });
        }
        return;
      }

      toast({
        title: "Join request sent",
        description: "Your request has been sent to the club administrators.",
      });

      fetchClubs();
    } catch (error) {
      console.error('Error sending join request:', error);
      toast({
        title: "Error",
        description: "Failed to send join request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setJoinRequestLoading(null);
    }
  };

  const approvedClubs = clubs.filter(club => club.approved);
  const pendingClubs = clubs.filter(club => !club.approved);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h1>Clubs</h1>
            <p className="text-muted-foreground">
              {profile?.role === 'college_admin' 
                ? 'Manage clubs and assign administrators'
                : 'Join clubs and participate in activities'
              }
            </p>
          </div>

          {profile?.role === 'college_admin' && (
            <CreateClubDialog onClubCreated={fetchClubs} />
          )}
        </div>

        {/* Loading State */}
        {loadingClubs && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="ml-2 text-muted-foreground">Loading clubs...</p>
          </div>
        )}

        {/* Approved Clubs */}
        {!loadingClubs && (
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              Active Clubs
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
              {approvedClubs.map((club) => (
              <Card key={club.id} className="hover:shadow-lg transition-shadow elevate-card">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center">
                        <Building className="h-5 w-5 mr-2" />
                        {club.name}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {club.description}
                      </CardDescription>
                    </div>
                    {club.user_membership?.role === 'admin' && (
                      <Badge variant="secondary">Admin</Badge>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center text-muted-foreground">
                      <Users className="h-4 w-4 mr-2" />
                      {club.member_count} members
                    </div>
                    <div className="flex items-center text-muted-foreground">
                      <Calendar className="h-4 w-4 mr-2" />
                      {club.event_count} events
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 pt-2">
                    {profile?.role === 'college_admin' ? (
                      <>
                        <ClubAdminAssignmentDialog 
                          clubId={club.id}
                          clubName={club.name}
                          onAssignmentComplete={fetchClubs}
                        />
                        <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
                          View Details
                        </Button>
                      </>
                    ) : club.user_membership?.role === 'admin' ? (
                      <>
                        <Button 
                          size="sm" 
                          onClick={() => setIsCreateEventDialogOpen(true)}
                          className="flex-1 sm:flex-none"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          <span className="hidden sm:inline">Create Event</span>
                          <span className="sm:hidden">Create</span>
                        </Button>
                        <JoinRequestsDialog 
                          clubId={club.id}
                          clubName={club.name}
                          pendingCount={club.pending_requests || 0}
                          onRequestHandled={fetchClubs}
                        />
                      </>
                    ) : club.user_membership ? (
                      <>
                        <Button variant="outline" size="sm" className="flex-1">
                          View Details
                        </Button>
                        <Button variant="destructive" size="sm" className="flex-1">
                          Leave Club
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button 
                          className="flex-1" 
                          size="sm"
                          onClick={() => handleJoinRequest(club.id)}
                          disabled={joinRequestLoading === club.id || club.pending_request}
                        >
                          {joinRequestLoading === club.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : club.pending_request ? (
                            'Requested'
                          ) : (
                            'Request to Join'
                          )}
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1">
                          Details
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
              ))}
            </div>
          </div>
        )}

        {/* Pending Clubs (visible to college admins) */}
        {profile?.role === 'college_admin' && pendingClubs.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Clock className="h-5 w-5 text-orange-500 mr-2" />
              Pending Approval ({pendingClubs.length})
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {pendingClubs.map((club) => (
                <Card key={club.id} className="border-orange-200 bg-orange-50/50">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <Building className="h-5 w-5 mr-2" />
                      {club.name}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {club.description}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <Badge variant="outline" className="w-fit">
                      Pending Approval
                    </Badge>
                    
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1">
                        Approve
                      </Button>
                      <Button variant="destructive" size="sm">
                        Reject
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loadingClubs && approvedClubs.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Clubs Found</h3>
              <p className="text-muted-foreground">
                There are no active clubs at the moment. Be the first to create one!
              </p>
            </CardContent>
          </Card>
        )}

        <CreateEventDialog
          isOpen={isCreateEventDialogOpen}
          onClose={() => setIsCreateEventDialogOpen(false)}
          onEventCreated={fetchClubs}
        />
      </div>
    </DashboardLayout>
  );
};

export default Clubs;