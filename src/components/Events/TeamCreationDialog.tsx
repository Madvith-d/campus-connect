import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Users, UserPlus } from "lucide-react";
import TeamInviteDialog from "@/components/Teams/TeamInviteDialog";

interface TeamCreationDialogProps {
  eventId: string;
  eventTitle?: string;
  isOpen: boolean;
  onClose: () => void;
  onTeamCreated: (teamId: string) => void;
}

const TeamCreationDialog = ({ eventId, eventTitle = '', isOpen, onClose, onTeamCreated }: TeamCreationDialogProps) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [teamName, setTeamName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createdTeamId, setCreatedTeamId] = useState<string | null>(null);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);

  const handleCreateTeam = async () => {
    if (!profile || !teamName.trim()) return;

    setIsCreating(true);
    try {
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .insert({
          name: teamName.trim(),
          event_id: eventId,
          leader_id: profile.user_id,
        })
        .select('id')
        .single();

      if (teamError) throw teamError;

      // Add leader as team member
      const { error: memberError } = await supabase
        .from('team_members')
        .insert({
          team_id: team.id,
          profile_id: profile.user_id,
        });

      if (memberError) throw memberError;

      toast({
        title: "Team created successfully!",
        description: `Team "${teamName}" has been created. You can now invite members.`,
      });

      setCreatedTeamId(team.id);
      onTeamCreated(team.id);
      setTeamName('');
      
      // Don't close dialog immediately, allow user to invite members
      toast({
        title: "Next Step",
        description: "Would you like to invite team members now?",
      });
    } catch (error: any) {
      toast({
        title: "Failed to create team",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    setCreatedTeamId(null);
    setTeamName('');
    onClose();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              {createdTeamId ? 'Team Created Successfully' : 'Create Team'}
            </DialogTitle>
            <DialogDescription>
              {createdTeamId 
                ? `Your team "${teamName || 'Team'}" is ready. You can now invite members or register for the event.`
                : 'Create a team to participate in this team event. You will be the team leader.'
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {!createdTeamId ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="teamName">Team Name</Label>
                  <Input
                    id="teamName"
                    placeholder="Enter team name"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    disabled={isCreating}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button 
                    onClick={handleCreateTeam} 
                    disabled={!teamName.trim() || isCreating}
                    className="flex-1"
                  >
                    {isCreating ? "Creating..." : "Create Team"}
                  </Button>
                  <Button variant="outline" onClick={handleClose}>
                    Cancel
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="flex gap-2 pt-4">
                  <Button 
                    onClick={() => setIsInviteDialogOpen(true)}
                    className="flex-1"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Invite Members
                  </Button>
                  <Button variant="outline" onClick={handleClose}>
                    Done
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {createdTeamId && (
        <TeamInviteDialog
          isOpen={isInviteDialogOpen}
          onClose={() => setIsInviteDialogOpen(false)}
          teamId={createdTeamId}
          teamName={teamName}
          eventTitle={eventTitle}
          onInviteSent={() => {
            setIsInviteDialogOpen(false);
          }}
        />
      )}
    </>
  );
};

export default TeamCreationDialog;