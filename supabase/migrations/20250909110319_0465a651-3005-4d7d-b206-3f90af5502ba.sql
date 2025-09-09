-- Allow admin to update and delete RSVP submissions
CREATE POLICY "Public can update RSVP submissions" 
ON public.rsvp_submissions 
FOR UPDATE 
USING (true);

CREATE POLICY "Public can delete RSVP submissions" 
ON public.rsvp_submissions 
FOR DELETE 
USING (true);