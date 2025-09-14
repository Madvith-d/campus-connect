import { ReactNode, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { LogOut, Users, Calendar, Shield, Building, Home, Settings } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { config } from '@/lib/config';
import AdminSetupDialog from '@/components/Admin/AdminSetupDialog';

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { user, profile, signOut } = useAuth();
  const location = useLocation();
  const [isAdminSetupOpen, setIsAdminSetupOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Events', href: '/events', icon: Calendar },
    { name: 'Clubs', href: '/clubs', icon: Building },
    ...(profile?.role === 'college_admin' ? [
      { name: 'Admin Panel', href: '/admin', icon: Shield },
      { name: 'Users', href: '/admin/users', icon: Users },
    ] : []),
  ];

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'college_admin':
        return 'destructive';
      case 'club_admin':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'college_admin':
        return 'College Admin';
      case 'club_admin':
        return 'Club Admin';
      default:
        return 'Student';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-primary">{config.appName}</h1>
            {profile && (
              <Badge variant={getRoleBadgeVariant(profile.role)}>
                {getRoleLabel(profile.role)}
              </Badge>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            {profile && (
              <div className="text-right">
                <p className="font-medium">{profile.name}</p>
                <p className="text-sm text-muted-foreground">{profile.usn}</p>
              </div>
            )}
            
            {/* Admin Setup Button (if no college admin exists) */}
            {profile?.role !== 'student' && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsAdminSetupOpen(true)}
              >
                <Settings className="h-4 w-4 mr-2" />
                Setup
              </Button>
            )}
            
            <Button variant="outline" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-card border-r min-h-[calc(100vh-73px)]">
          <nav className="p-4 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              
              return (
                <Link key={item.name} to={item.href}>
                  <Button 
                    variant={isActive ? 'default' : 'ghost'} 
                    className="w-full justify-start"
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {item.name}
                  </Button>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {profile && (
            <div className="mb-6">
              <Card>
                <CardHeader>
                  <CardTitle>Welcome back, {profile.name}!</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">USN</p>
                      <p className="font-medium">{profile.usn}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Branch</p>
                      <p className="font-medium">{profile.branch}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Role</p>
                      <Badge variant={getRoleBadgeVariant(profile.role)}>
                        {getRoleLabel(profile.role)}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          
          {children}
        </main>
      </div>
      
      <AdminSetupDialog
        isOpen={isAdminSetupOpen}
        onClose={() => setIsAdminSetupOpen(false)}
        onSetupComplete={() => {
          setIsAdminSetupOpen(false);
          // Optionally refresh the page to update user role
          window.location.reload();
        }}
      />
    </div>
  );
};

export default DashboardLayout;