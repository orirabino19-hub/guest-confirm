-- Allow anonymous users to read RSVP submissions for admin panel
DROP POLICY IF EXISTS "Public can read RSVP submissions" ON public.rsvp_submissions;

CREATE POLICY "Public can read RSVP submissions" 
ON public.rsvp_submissions 
FOR SELECT 
USING (true);