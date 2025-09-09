import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, Users, Building, Calendar, Settings, AlertCircle, Check, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import UserRoleDialog from '@/components/Admin/UserRoleDialog';

interface PendingClub {
  id: string;
  name: string;
  description: string;
  created_at: string;
  profiles: {
    name: string;
    usn: string;
  };
}

const Admin = () => {
  const { user, profile, loading } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingUsers: 0,
    totalClubs: 0,
    pendingClubs: 0,
    activeEvents: 0,
    totalAttendance: 0,
  });
  const [pendingClubs, setPendingClubs] = useState<PendingClub[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [approvalLoading, setApprovalLoading] = useState<string | null>(null);

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

  if (profile?.role !== 'college_admin') {
    return (
      <DashboardLayout>
        <Card className="text-center py-12">
          <CardContent>
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
            <p className="text-muted-foreground">
              You don't have permission to access the admin panel.
            </p>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      // Fetch user counts
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Fetch club counts
      const { count: totalClubs } = await supabase
        .from('clubs')
        .select('*', { count: 'exact', head: true })
        .eq('approved', true);

      const { count: pendingClubsCount } = await supabase
        .from('clubs')
        .select('*', { count: 'exact', head: true })
        .eq('approved', false);

      // Fetch active events
      const { count: activeEvents } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .gte('end_time', new Date().toISOString());

      // Fetch total attendance
      const { count: totalAttendance } = await supabase
        .from('attendance_logs')
        .select('*', { count: 'exact', head: true });

      // Fetch pending clubs details
      const { data: pendingClubsData } = await supabase
        .from('clubs')
        .select(`
          id,
          name,
          description,
          created_at,
          profiles!clubs_created_by_fkey (
            name,
            usn
          )
        `)
        .eq('approved', false)
        .order('created_at', { ascending: false });

      setStats({
        totalUsers: totalUsers || 0,
        pendingUsers: 0, // Not tracking pending users in this system
        totalClubs: totalClubs || 0,
        pendingClubs: pendingClubsCount || 0,
        activeEvents: activeEvents || 0,
        totalAttendance: totalAttendance || 0,
      });

      setPendingClubs(pendingClubsData || []);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    if (profile?.role === 'college_admin') {
      fetchStats();
    }
  }, [profile]);

  const handleClubApproval = async (clubId: string, approved: boolean) => {
    setApprovalLoading(clubId);
    try {
      const { error } = await supabase
        .from('clubs')
        .update({ approved })
        .eq('id', clubId);

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: approved ? "Club approved" : "Club rejected",
        description: approved 
          ? "The club has been approved and is now active."
          : "The club request has been rejected.",
      });

      fetchStats();
    } catch (error) {
      console.error('Error handling club approval:', error);
      toast({
        title: "Error",
        description: "Failed to process club request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setApprovalLoading(null);
    }
  };

        {/* Pending Club Approvals */}
        {!loadingStats && pendingClubs.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Building className="h-5 w-5 text-orange-500 mr-2" />
              Pending Club Approvals ({pendingClubs.length})
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pendingClubs.map((club) => (
                <Card key={club.id} className="border-orange-200 bg-orange-50/50">
                  <CardHeader>
                    <CardTitle className="text-lg">{club.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {club.description}
                    </CardDescription>
                    <p className="text-xs text-muted-foreground">
                      Created by: {club.profiles.name} ({club.profiles.usn})
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Requested: {new Date(club.created_at).toLocaleDateString()}
                    </p>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <Badge variant="outline" className="w-fit">
                      Pending Approval
                    </Badge>
                    
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleClubApproval(club.id, true)}
                        disabled={approvalLoading === club.id}
                      >
                        {approvalLoading === club.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                        ) : (
                          <>
                            <Check className="h-4 w-4 mr-2" />
                            Approve
                          </>
                        )}
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => handleClubApproval(club.id, false)}
                        disabled={approvalLoading === club.id}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center">
              <Shield className="h-8 w-8 mr-3 text-red-500" />
              Admin Panel
            </h1>
            <p className="text-muted-foreground">
              College administration and management
            </p>
          </div>
          
          <UserRoleDialog />
        </div>

        {/* Stats Overview */}
        {loadingStats ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="ml-2 text-muted-foreground">Loading statistics...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              {stats.pendingUsers > 0 && (
                <p className="text-xs text-orange-600">
                  {stats.pendingUsers} pending approval
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Clubs</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalClubs}</div>
              {stats.pendingClubs > 0 && (
                <p className="text-xs text-orange-600">
                  {stats.pendingClubs} pending approval
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Events</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeEvents}</div>
              <p className="text-xs text-green-600">
                {stats.totalAttendance} total attendance
              </p>
            </CardContent>
          </Card>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
};

export default Admin;