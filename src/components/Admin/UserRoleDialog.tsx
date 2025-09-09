import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { UserCog, Loader2 } from 'lucide-react';

interface User {
  user_id: string;
  name: string;
  usn: string;
  branch: string;
  role: 'student' | 'club_admin' | 'college_admin';
}

const UserRoleDialog = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, name, usn, branch, role')
        .order('name');

      if (error) {
        console.error('Error fetching users:', error);
        return;
      }

      setUsers(data || []);
    } catch (error) {
      console.error('Error in fetchUsers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchUsers();
    }
  }, [open]);

  const updateUserRole = async (userId: string, newRole: 'student' | 'club_admin' | 'college_admin') => {
    setUpdateLoading(userId);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('user_id', userId);

      if (error) {
        toast({
          title: "Error updating role",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Role updated",
        description: "User role has been successfully updated.",
      });

      fetchUsers();
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: "Error",
        description: "Failed to update user role. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUpdateLoading(null);
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'college_admin': return 'destructive';
      case 'club_admin': return 'secondary';
      default: return 'outline';
    }
  };

  // Only college admins can access this
  if (profile?.role !== 'college_admin') {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <UserCog className="h-4 w-4 mr-2" />
          Manage User Roles
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage User Roles</DialogTitle>
          <DialogDescription>
            Assign roles to users. College admins can manage all users and clubs.
          </DialogDescription>
        </DialogHeader>
        
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {users.map((user) => (
              <Card key={user.user_id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{user.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        USN: {user.usn} • {user.branch}
                      </p>
                    </div>
                    <Badge variant={getRoleBadgeVariant(user.role)}>
                      {user.role.replace('_', ' ')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center gap-4">
                    <Label htmlFor={`role-${user.user_id}`} className="text-sm font-medium">
                      Role:
                    </Label>
                    <Select
                      value={user.role}
                      onValueChange={(value: 'student' | 'club_admin' | 'college_admin') => updateUserRole(user.user_id, value)}
                      disabled={updateLoading === user.user_id}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="club_admin">Club Admin</SelectItem>
                        <SelectItem value="college_admin">College Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    {updateLoading === user.user_id && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default UserRoleDialog;