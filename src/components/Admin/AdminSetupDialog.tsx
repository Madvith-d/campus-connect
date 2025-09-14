import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Settings, Shield, CheckCircle, AlertCircle } from 'lucide-react';
import { getCollegeAdminConfig, config } from '@/lib/config';

interface AdminSetupDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSetupComplete?: () => void;
}

interface SetupConfig {
  collegeName: string;
  collegeCode: string;
  adminEmail: string;
  enableTeamEvents: boolean;
  enableNotifications: boolean;
  enableAnalytics: boolean;
}

const AdminSetupDialog = ({ isOpen, onClose, onSetupComplete }: AdminSetupDialogProps) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  
  const [setupConfig, setSetupConfig] = useState<SetupConfig>({
    collegeName: config.collegeName,
    collegeCode: config.collegeCode,
    adminEmail: config.collegeAdminEmail,
    enableTeamEvents: config.enableTeamEvents,
    enableNotifications: config.enableNotifications,
    enableAnalytics: config.enableAnalytics,
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [hasCollegeAdmin, setHasCollegeAdmin] = useState(false);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);

  // Check if college admin already exists
  const checkCollegeAdmin = async () => {
    setIsCheckingAdmin(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('role', 'college_admin')
        .limit(1);

      if (error) {
        console.error('Error checking college admin:', error);
        return;
      }

      setHasCollegeAdmin((data?.length || 0) > 0);
    } catch (error) {
      console.error('Error checking college admin:', error);
    } finally {
      setIsCheckingAdmin(false);
    }
  };

  // Promote current user to college admin
  const promoteToCollegeAdmin = async () => {
    if (!profile) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: 'college_admin' })
        .eq('user_id', profile.user_id);

      if (error) {
        throw error;
      }

      toast({
        title: "Admin Setup Complete",
        description: "You have been promoted to College Admin. Please refresh the page.",
      });

      setHasCollegeAdmin(true);
      onSetupComplete?.();
    } catch (error: any) {
      console.error('Error promoting to admin:', error);
      toast({
        title: "Setup Failed",
        description: error.message || "Failed to setup college admin.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Setup college admin by email
  const setupAdminByEmail = async () => {
    if (!setupConfig.adminEmail.trim()) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid admin email address.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Find user by email and promote to admin
      const { data: users, error: userError } = await supabase
        .from('profiles')
        .select('user_id, name')
        .ilike('usn', `%${setupConfig.adminEmail}%`);

      if (userError) {
        throw userError;
      }

      if (!users || users.length === 0) {
        toast({
          title: "User Not Found",
          description: "No user found with that email. Please ensure the user has registered first.",
          variant: "destructive",
        });
        return;
      }

      const userToPromote = users[0];
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ role: 'college_admin' })
        .eq('user_id', userToPromote.user_id);

      if (updateError) {
        throw updateError;
      }

      toast({
        title: "Admin Setup Complete",
        description: `${userToPromote.name} has been promoted to College Admin.`,
      });

      setHasCollegeAdmin(true);
      onSetupComplete?.();
    } catch (error: any) {
      console.error('Error setting up admin:', error);
      toast({
        title: "Setup Failed",
        description: error.message || "Failed to setup college admin.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      checkCollegeAdmin();
    }
  }, [isOpen]);

  // Only allow access if user is not a student or if no college admin exists
  const canAccessSetup = profile?.role !== 'student' || !hasCollegeAdmin;

  if (!canAccessSetup) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2 text-red-500" />
              Access Denied
            </DialogTitle>
          </DialogHeader>
          <Alert variant="destructive">
            <AlertDescription>
              You don't have permission to access admin setup. This feature is only available during initial setup or for existing administrators.
            </AlertDescription>
          </Alert>
          <div className="flex justify-end pt-4">
            <Button onClick={onClose}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Settings className="h-5 w-5 mr-2" />
            College Admin Setup
          </DialogTitle>
          <DialogDescription>
            Configure your college administration settings
          </DialogDescription>
        </DialogHeader>

        {isCheckingAdmin ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-2"></div>
            <p>Checking admin status...</p>
          </div>
        ) : hasCollegeAdmin ? (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              College admin is already configured. Use the Admin Panel to manage settings.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-6">
            {/* College Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">College Information</CardTitle>
                <CardDescription>
                  Basic information about your college (configured via environment variables)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>College Name</Label>
                    <Input value={setupConfig.collegeName} disabled />
                  </div>
                  <div>
                    <Label>College Code</Label>
                    <Input value={setupConfig.collegeCode} disabled />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Admin Setup */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Administrator Setup</CardTitle>
                <CardDescription>
                  Choose how to setup the first college administrator
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {profile && (
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-2">Option 1: Promote Current User</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Make yourself ({profile.name}) the college administrator
                    </p>
                    <Button onClick={promoteToCollegeAdmin} disabled={isLoading} className="w-full">
                      <Shield className="h-4 w-4 mr-2" />
                      Become College Admin
                    </Button>
                  </div>
                )}

                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Option 2: Setup by Email</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Enter the email/USN of an existing user to promote
                  </p>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="admin-email">Admin Email/USN</Label>
                      <Input
                        id="admin-email"
                        placeholder="Enter email or USN"
                        value={setupConfig.adminEmail}
                        onChange={(e) => setSetupConfig(prev => ({ ...prev, adminEmail: e.target.value }))}
                      />
                    </div>
                    <Button onClick={setupAdminByEmail} disabled={isLoading} className="w-full">
                      Setup Admin
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Feature Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Feature Configuration</CardTitle>
                <CardDescription>
                  Current feature settings (configured via environment variables)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Team Events</Label>
                    <p className="text-sm text-muted-foreground">Enable team-based event participation</p>
                  </div>
                  <Switch checked={setupConfig.enableTeamEvents} disabled />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Notifications</Label>
                    <p className="text-sm text-muted-foreground">Enable email and push notifications</p>
                  </div>
                  <Switch checked={setupConfig.enableNotifications} disabled />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Analytics</Label>
                    <p className="text-sm text-muted-foreground">Enable attendance analytics and reporting</p>
                  </div>
                  <Switch checked={setupConfig.enableAnalytics} disabled />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="flex gap-2 pt-4">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AdminSetupDialog;