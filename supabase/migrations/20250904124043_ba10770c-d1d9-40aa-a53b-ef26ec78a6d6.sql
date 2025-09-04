-- Remove the overly permissive RLS policies for guests table
DROP POLICY IF EXISTS "Public can read guests" ON public.guests;
DROP POLICY IF EXISTS "Public can insert guests" ON public.guests;
DROP POLICY IF EXISTS "Public can update guests" ON public.guests;
DROP POLICY IF EXISTS "Public can delete guests" ON public.guests;

-- Create more restrictive policies
-- For now, we'll allow authenticated users full access until proper authentication is implemented
-- In production, these should be further restricted to event organizers only

CREATE POLICY "Authenticated users can view guests" 
ON public.guests 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert guests" 
ON public.guests 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update guests" 
ON public.guests 
FOR UPDATE 
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete guests" 
ON public.guests 
FOR DELETE 
TO authenticated
USING (true);

-- Allow anonymous users to only submit RSVP data, not read guest lists
CREATE POLICY "Anonymous can insert RSVP submissions only"
ON public.rsvp_submissions
FOR INSERT
TO anon
WITH CHECK (true);

-- Ensure anonymous users cannot read existing RSVP submissions
DROP POLICY IF EXISTS "Public can read RSVP submissions" ON public.rsvp_submissions;

CREATE POLICY "Authenticated users can read RSVP submissions"
ON public.rsvp_submissions
FOR SELECT
TO authenticated
USING (true);