import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { UserPlus, Search, Mail, CheckCircle, X } from 'lucide-react';

interface TeamInviteProps {
  isOpen: boolean;
  onClose: () => void;
  teamId: string;
  teamName: string;
  eventTitle: string;
  onInviteSent?: () => void;
}

interface StudentProfile {
  user_id: string;
  name: string;
  usn: string;
  branch: string;
}

interface TeamMember {
  id: string;
  profile_id: string;
  joined_at: string;
  profiles: {
    name: string;
    usn: string;
  };
}

const TeamInviteDialog = ({ 
  isOpen, 
  onClose, 
  teamId, 
  teamName, 
  eventTitle,
  onInviteSent 
}: TeamInviteProps) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<StudentProfile[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentProfile | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load team members
  const loadTeamData = async () => {
    if (!teamId) return;
    
    setIsLoading(true);
    try {
      // Get current team members
      const { data: members, error: membersError } = await supabase
        .from('team_members')
        .select(`
          id,
          profile_id,
          joined_at,
          profiles(name, usn)
        `)
        .eq('team_id', teamId);

      if (membersError) throw membersError;
      setTeamMembers(members || []);
    } catch (error) {
      console.error('Error loading team data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Search for students
  const searchStudents = async (term: string) => {
    if (!term.trim() || term.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, name, usn, branch')
        .or(`name.ilike.%${term}%,usn.ilike.%${term}%`)
        .limit(10);

      if (error) throw error;

      // Filter out current team members
      const memberIds = teamMembers.map(m => m.profile_id);
      const filteredResults = (data || []).filter(student => 
        !memberIds.includes(student.user_id) && student.user_id !== profile?.user_id
      );

      setSearchResults(filteredResults);
    } catch (error) {
      console.error('Error searching students:', error);
      toast({
        title: "Search Error",
        description: "Failed to search for students.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  // Send team invitation (simplified - just add to team directly)
  const sendInvitation = async () => {
    if (!selectedStudent || !profile) return;

    setIsInviting(true);
    try {
      // For now, directly add the student to the team
      // In a full implementation, this would send an invitation that they can accept/decline
      const { error } = await supabase
        .from('team_members')
        .insert({
          team_id: teamId,
          profile_id: selectedStudent.user_id,
        });

      if (error) throw error;

      toast({
        title: "Member Added",
        description: `${selectedStudent.name} has been added to the team.`,
      });
      
      // Reload team data
      await loadTeamData();
      setSelectedStudent(null);
      setSearchTerm('');
      setSearchResults([]);
      onInviteSent?.();
    } catch (error: any) {
      console.error('Error adding team member:', error);
      
      // Show manual contact method as fallback
      toast({
        title: "Manual Contact Required",
        description: `Please manually contact ${selectedStudent.name} (${selectedStudent.usn}) to join your team "${teamName}".`,
      });
    } finally {
      setIsInviting(false);
    }
  };

  useEffect(() => {
    if (isOpen && teamId) {
      loadTeamData();
    }
  }, [isOpen, teamId]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <UserPlus className="h-5 w-5 mr-2" />
            Invite Team Members
          </DialogTitle>
          <DialogDescription>
            Add students to your team "{teamName}" for {eventTitle}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Team Members */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Current Team Members</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-muted-foreground">Loading team members...</p>
              ) : teamMembers.length > 0 ? (
                <div className="space-y-2">
                  {teamMembers.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <p className="font-medium">{(member.profiles as any)?.name || 'Unknown'}</p>
                        <p className="text-sm text-muted-foreground">
                          USN: {(member.profiles as any)?.usn || 'Unknown'}
                        </p>
                      </div>
                      <Badge>Member</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No team members yet.</p>
              )}
            </CardContent>
          </Card>

          {/* Add New Member */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Add New Member</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="student-search">Search Student</Label>
                <Input
                  id="student-search"
                  placeholder="Enter student name or USN..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    searchStudents(e.target.value);
                  }}
                />
              </div>

              {isSearching && (
                <p className="text-sm text-muted-foreground">Searching...</p>
              )}

              {searchResults.length > 0 && (
                <div className="space-y-2">
                  <Label>Select Student</Label>
                  <Select 
                    value={selectedStudent?.user_id || ''} 
                    onValueChange={(value) => {
                      const student = searchResults.find(s => s.user_id === value);
                      setSelectedStudent(student || null);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a student..." />
                    </SelectTrigger>
                    <SelectContent>
                      {searchResults.map((student) => (
                        <SelectItem key={student.user_id} value={student.user_id}>
                          {student.name} ({student.usn}) - {student.branch}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {selectedStudent && (
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-semibold">Selected Student:</h4>
                  <p>{selectedStudent.name}</p>
                  <p className="text-sm text-muted-foreground">
                    USN: {selectedStudent.usn} • Branch: {selectedStudent.branch}
                  </p>
                </div>
              )}

              <Button 
                onClick={sendInvitation}
                disabled={!selectedStudent || isInviting}
                className="w-full"
              >
                <Mail className="h-4 w-4 mr-2" />
                {isInviting ? "Adding Member..." : "Add to Team"}
              </Button>
            </CardContent>
          </Card>

          {/* Instructions */}
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Note:</strong> Students will be added directly to your team. 
              In a production environment, this would typically send an invitation that they can accept or decline.
            </AlertDescription>
          </Alert>
        </div>

        <div className="flex gap-2 pt-4">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TeamInviteDialog;