import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, Users, Building, Calendar, Settings, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const Admin = () => {
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

  // Mock admin data - will be replaced with real Supabase queries
  const stats = {
    totalUsers: 1234,
    pendingUsers: 12,
    totalClubs: 28,
    pendingClubs: 3,
    activeEvents: 15,
    totalAttendance: 8945,
  };

  const recentActivities = [
    {
      id: '1',
      type: 'club_request',
      description: 'New club registration: Photography Club',
      timestamp: '2 hours ago',
      status: 'pending',
    },
    {
      id: '2',
      type: 'user_registration',
      description: '5 new student registrations',
      timestamp: '4 hours ago',
      status: 'completed',
    },
    {
      id: '3',
      type: 'event_creation',
      description: 'Tech Symposium 2024 created by Computer Science Club',
      timestamp: '1 day ago',
      status: 'completed',
    },
  ];

  const quickActions = [
    {
      title: 'Manage Users',
      description: 'View and manage all user accounts',
      icon: Users,
      href: '/admin/users',
      badge: stats.pendingUsers > 0 ? `${stats.pendingUsers} pending` : null,
    },
    {
      title: 'Manage Clubs',
      description: 'Approve and manage college clubs',
      icon: Building,
      href: '/admin/clubs',
      badge: stats.pendingClubs > 0 ? `${stats.pendingClubs} pending` : null,
    },
    {
      title: 'Event Oversight',
      description: 'Monitor all events and activities',
      icon: Calendar,
      href: '/admin/events',
      badge: `${stats.activeEvents} active`,
    },
    {
      title: 'System Settings',
      description: 'Configure system-wide settings',
      icon: Settings,
      href: '/admin/settings',
      badge: null,
    },
  ];

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
        </div>

        {/* Stats Overview */}
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

        {/* Quick Actions */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link key={action.title} to={action.href}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2">
                          <Icon className="h-6 w-6 text-primary" />
                          <CardTitle className="text-lg">{action.title}</CardTitle>
                        </div>
                        {action.badge && (
                          <Badge variant="secondary" className="text-xs">
                            {action.badge}
                          </Badge>
                        )}
                      </div>
                      <CardDescription>{action.description}</CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Recent Activities */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Recent Activities</h2>
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${
                        activity.status === 'pending' ? 'bg-orange-500' : 'bg-green-500'
                      }`} />
                      <div>
                        <p className="text-sm font-medium">{activity.description}</p>
                        <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
                      </div>
                    </div>
                    <Badge variant={activity.status === 'pending' ? 'secondary' : 'outline'}>
                      {activity.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Admin;