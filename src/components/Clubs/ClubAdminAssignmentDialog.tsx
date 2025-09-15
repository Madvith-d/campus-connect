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
import { UserCog, Loader2, Users } from 'lucide-react';

interface User {
  user_id: string;
  name: string;
  usn: string;
  branch: string;
  role: 'student' | 'club_admin' | 'college_admin';
  club_role?: 'member' | 'admin';
}

interface ClubAdminAssignmentDialogProps {
  clubId: string;
  clubName: string;
  onAssignmentComplete?: () => void;
}

const ClubAdminAssignmentDialog = ({ clubId, clubName, onAssignmentComplete }: ClubAdminAssignmentDialogProps) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [clubMembers, setClubMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [assignLoading, setAssignLoading] = useState<string | null>(null);

  // Only college admins can access this
  if (profile?.role !== 'college_admin') {
    return null;
  }

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // 1) Get all users (profiles)
      const { data: allUsers, error: usersError } = await supabase
        .from('profiles')
        .select('user_id, name, usn, branch, role')
        .order('name');

      if (usersError) throw usersError;

      // 2) Get current club members without nested profile join to avoid RLS recursion
      let membershipRows: any[] | null = null;
      try {
        const { data, error } = await supabase
          .from('club_members')
          .select('profile_id, role')
          .eq('club_id', clubId);
        if (error) throw error;
        membershipRows = data || [];
      } catch (err: any) {
        // Handle recursive RLS error by falling back to no preloaded members
        if (err?.code === '42P17') {
          membershipRows = [];
        } else {
          throw err;
        }
      }

      const profileIdToUser = new Map((allUsers || []).map(u => [u.user_id, u]));
      const members = (membershipRows || []).map(m => ({
        ...(profileIdToUser.get(m.profile_id) || { user_id: m.profile_id, name: 'Unknown', usn: '', branch: '', role: 'student' as const }),
        club_role: m.role
      }));

      const memberIds = new Set(members.map(m => m.user_id));
      const nonMembers = (allUsers || []).filter(user => !memberIds.has(user.user_id));

      setAvailableUsers(nonMembers);
      setClubMembers(members);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to load users. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const assignAsClubAdmin = async (userId: string, userName: string) => {
    setAssignLoading(userId);
    try {
      // First, add user to club as admin if not already a member
      const { error: memberError } = await supabase
        .from('club_members')
        .upsert({
          club_id: clubId,
          profile_id: userId,
          role: 'admin'
        });

      if (memberError) throw memberError;

      // Then, update user's global role to club_admin if they're still a student
      const { error: roleError } = await supabase
        .from('profiles')
        .update({ role: 'club_admin' })
        .eq('user_id', userId)
        .eq('role', 'student'); // Only promote students, don't downgrade college admins

      if (roleError) throw roleError;

      toast({
        title: "Club admin assigned",
        description: `${userName} has been assigned as a club administrator for ${clubName}.`,
      });

      fetchUsers();
      onAssignmentComplete?.();
    } catch (error) {
      console.error('Error assigning club admin:', error);
      toast({
        title: "Error",
        description: "Failed to assign club admin. Please try again.",
        variant: "destructive",
      });
    } finally {
      setAssignLoading(null);
    }
  };

  const updateMemberRole = async (userId: string, newRole: 'member' | 'admin', userName: string) => {
    setAssignLoading(userId);
    try {
      const { error } = await supabase
        .from('club_members')
        .update({ role: newRole })
        .eq('club_id', clubId)
        .eq('profile_id', userId);

      if (error) throw error;

      toast({
        title: "Role updated",
        description: `${userName} is now a club ${newRole}.`,
      });

      fetchUsers();
      onAssignmentComplete?.();
    } catch (error) {
      console.error('Error updating member role:', error);
      toast({
        title: "Error",
        description: "Failed to update member role. Please try again.",
        variant: "destructive",
      });
    } finally {
      setAssignLoading(null);
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'college_admin': return 'destructive';
      case 'club_admin': return 'secondary';
      default: return 'outline';
    }
  };

  useEffect(() => {
    if (open) {
      fetchUsers();
    }
  }, [open, clubId]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <UserCog className="h-4 w-4 mr-2" />
          Manage Admins
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Club Administrators - {clubName}</DialogTitle>
          <DialogDescription>
            Assign users as club administrators. Club admins can create events and manage club members.
          </DialogDescription>
        </DialogHeader>
        
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Current Club Members */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Current Club Members
              </h3>
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {clubMembers.map((member) => (
                  <Card key={member.user_id}>
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex items-center space-x-3">
                        <div>
                          <p className="font-medium">{member.name}</p>
                          <p className="text-sm text-muted-foreground">{member.usn} • {member.branch}</p>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant={getRoleBadgeVariant(member.role)}>
                            {member.role === 'college_admin' ? 'College Admin' : 
                             member.role === 'club_admin' ? 'Club Admin' : 'Student'}
                          </Badge>
                          <Badge variant={member.club_role === 'admin' ? 'secondary' : 'outline'}>
                            Club {member.club_role}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Select
                          value={member.club_role}
                          onValueChange={(value) => updateMemberRole(member.user_id, value as 'member' | 'admin', member.name)}
                          disabled={assignLoading === member.user_id}
                        >
                          <SelectTrigger className="w-[120px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="member">Member</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                        {assignLoading === member.user_id && (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Available Users to Assign */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Assign New Club Admin</h3>
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {availableUsers.map((user) => (
                  <Card key={user.user_id}>
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex items-center space-x-3">
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-muted-foreground">{user.usn} • {user.branch}</p>
                        </div>
                        <Badge variant={getRoleBadgeVariant(user.role)}>
                          {user.role === 'college_admin' ? 'College Admin' : 
                           user.role === 'club_admin' ? 'Club Admin' : 'Student'}
                        </Badge>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => assignAsClubAdmin(user.user_id, user.name)}
                        disabled={assignLoading === user.user_id}
                      >
                        {assignLoading === user.user_id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          'Assign as Admin'
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
                {availableUsers.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">
                    All users are already members of this club.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ClubAdminAssignmentDialog;