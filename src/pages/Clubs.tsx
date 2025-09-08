import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building, Users, Calendar, Plus, CheckCircle, Clock } from 'lucide-react';

const Clubs = () => {
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

  // Mock clubs data - will be replaced with real Supabase queries
  const clubs = [
    {
      id: '1',
      name: 'Computer Science Club',
      description: 'Promoting coding culture and technical innovation among students',
      approved: true,
      memberCount: 45,
      eventCount: 8,
      isAdmin: profile?.role === 'club_admin',
      isMember: true,
    },
    {
      id: '2',
      name: 'Cultural Committee',
      description: 'Organizing cultural events and celebrating diversity',
      approved: true,
      memberCount: 67,
      eventCount: 12,
      isAdmin: false,
      isMember: false,
    },
    {
      id: '3',
      name: 'Robotics Club',
      description: 'Building robots and exploring automation technologies',
      approved: true,
      memberCount: 32,
      eventCount: 6,
      isAdmin: false,
      isMember: true,
    },
    {
      id: '4',
      name: 'Photography Club',
      description: 'Capturing moments and developing photography skills',
      approved: false,
      memberCount: 0,
      eventCount: 0,
      isAdmin: false,
      isMember: false,
    },
  ];

  const approvedClubs = clubs.filter(club => club.approved);
  const pendingClubs = clubs.filter(club => !club.approved);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Clubs</h1>
            <p className="text-muted-foreground">
              Join clubs and participate in activities
            </p>
          </div>
          
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Club
          </Button>
        </div>

        {/* Approved Clubs */}
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
            Active Clubs
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {approvedClubs.map((club) => (
              <Card key={club.id} className="hover:shadow-lg transition-shadow">
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
                    {club.isAdmin && (
                      <Badge variant="secondary">Admin</Badge>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center text-muted-foreground">
                      <Users className="h-4 w-4 mr-2" />
                      {club.memberCount} members
                    </div>
                    <div className="flex items-center text-muted-foreground">
                      <Calendar className="h-4 w-4 mr-2" />
                      {club.eventCount} events
                    </div>
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    {club.isMember ? (
                      <>
                        <Button variant="outline" size="sm" className="flex-1">
                          View Details
                        </Button>
                        <Button variant="destructive" size="sm">
                          Leave
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button className="flex-1" size="sm">
                          Join Club
                        </Button>
                        <Button variant="outline" size="sm">
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

        {/* Pending Clubs (visible to college admins) */}
        {profile?.role === 'college_admin' && pendingClubs.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Clock className="h-5 w-5 text-orange-500 mr-2" />
              Pending Approval ({pendingClubs.length})
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
        {approvedClubs.length === 0 && (
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
      </div>
    </DashboardLayout>
  );
};

export default Clubs;