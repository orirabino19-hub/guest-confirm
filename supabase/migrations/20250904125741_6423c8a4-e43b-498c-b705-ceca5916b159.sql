-- Allow anonymous users to also read guests (for admin interface without auth)
-- This is temporary until proper authentication is implemented
CREATE POLICY "Anonymous can read guests"
ON public.guests
FOR SELECT
TO anon
USING (true);