-- Create join_requests table for handling club membership requests
CREATE TABLE public.join_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id UUID NOT NULL,
  profile_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID,
  message TEXT,
  UNIQUE(club_id, profile_id)
);

-- Enable RLS
ALTER TABLE public.join_requests ENABLE ROW LEVEL SECURITY;

-- RLS policies for join_requests
CREATE POLICY "Users can create their own join requests" 
ON public.join_requests 
FOR INSERT 
WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can view their own join requests" 
ON public.join_requests 
FOR SELECT 
USING (profile_id = auth.uid());

CREATE POLICY "Club admins can view and manage join requests for their clubs" 
ON public.join_requests 
FOR ALL
USING (EXISTS (
  SELECT 1 FROM club_members cm 
  WHERE cm.club_id = join_requests.club_id 
  AND cm.profile_id = auth.uid() 
  AND cm.role = 'admin'
));

-- Add trigger for updated_at on clubs and events
CREATE TRIGGER update_clubs_updated_at
BEFORE UPDATE ON public.clubs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_events_updated_at
BEFORE UPDATE ON public.events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();