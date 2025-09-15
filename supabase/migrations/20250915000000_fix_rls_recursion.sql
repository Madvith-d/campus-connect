-- Fix RLS recursion by replacing self-referential policy subqueries
-- with calls to helper functions public.is_club_admin() and public.is_college_admin()

-- CLUB MEMBERS -----------------------------------------------------------------

DROP POLICY IF EXISTS "club_members_select_visible" ON public.club_members;
DROP POLICY IF EXISTS "club_members_insert_admin" ON public.club_members;
DROP POLICY IF EXISTS "club_members_update_admin" ON public.club_members;
DROP POLICY IF EXISTS "club_members_delete_admin" ON public.club_members;

CREATE POLICY "club_members_select_visible" ON public.club_members
  FOR SELECT USING (
    profile_id = auth.uid()
    OR public.is_club_admin(auth.uid(), club_members.club_id)
    OR public.is_college_admin(auth.uid())
  );

CREATE POLICY "club_members_insert_admin" ON public.club_members
  FOR INSERT WITH CHECK (
    profile_id = auth.uid()
    OR public.is_club_admin(auth.uid(), club_members.club_id)
    OR public.is_college_admin(auth.uid())
  );

CREATE POLICY "club_members_update_admin" ON public.club_members
  FOR UPDATE USING (
    public.is_club_admin(auth.uid(), club_members.club_id)
    OR public.is_college_admin(auth.uid())
  );

CREATE POLICY "club_members_delete_admin" ON public.club_members
  FOR DELETE USING (
    profile_id = auth.uid()
    OR public.is_club_admin(auth.uid(), club_members.club_id)
    OR public.is_college_admin(auth.uid())
  );

-- JOIN REQUESTS ----------------------------------------------------------------

DROP POLICY IF EXISTS "join_requests_select_own_or_admin" ON public.join_requests;
DROP POLICY IF EXISTS "join_requests_insert_own" ON public.join_requests;
DROP POLICY IF EXISTS "join_requests_update_admin" ON public.join_requests;

CREATE POLICY "join_requests_select_own_or_admin" ON public.join_requests
  FOR SELECT USING (
    profile_id = auth.uid()
    OR public.is_club_admin(auth.uid(), join_requests.club_id)
    OR public.is_college_admin(auth.uid())
  );

CREATE POLICY "join_requests_insert_own" ON public.join_requests
  FOR INSERT WITH CHECK (
    profile_id = auth.uid()
  );

CREATE POLICY "join_requests_update_admin" ON public.join_requests
  FOR UPDATE USING (
    public.is_club_admin(auth.uid(), join_requests.club_id)
    OR public.is_college_admin(auth.uid())
  );

-- EVENTS -----------------------------------------------------------------------

DROP POLICY IF EXISTS "events_insert_club_admin" ON public.events;
DROP POLICY IF EXISTS "events_update_club_admin" ON public.events;

CREATE POLICY "events_insert_club_admin" ON public.events
  FOR INSERT WITH CHECK (
    public.is_club_admin(auth.uid(), events.club_id)
    OR public.is_college_admin(auth.uid())
  );

CREATE POLICY "events_update_club_admin" ON public.events
  FOR UPDATE USING (
    created_by = auth.uid()
    OR public.is_club_admin(auth.uid(), events.club_id)
    OR public.is_college_admin(auth.uid())
  );

-- CLUBS ------------------------------------------------------------------------

DROP POLICY IF EXISTS "clubs_update_admin_or_creator" ON public.clubs;

CREATE POLICY "clubs_update_admin_or_creator" ON public.clubs
  FOR UPDATE USING (
    created_by = auth.uid()
    OR public.is_club_admin(auth.uid(), clubs.id)
    OR public.is_college_admin(auth.uid())
  );


