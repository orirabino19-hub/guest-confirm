-- Allow anonymous users to insert guests (to support current admin without auth)
-- Note: SELECT remains restricted to authenticated users for privacy
CREATE POLICY IF NOT EXISTS "Anonymous can insert guests"
ON public.guests
FOR INSERT
TO anon
WITH CHECK (true);