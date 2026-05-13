ALTER TABLE public.guests ADD COLUMN IF NOT EXISTS children_count integer NOT NULL DEFAULT 0;
ALTER TABLE public.rsvp_submissions ADD COLUMN IF NOT EXISTS children_count integer NOT NULL DEFAULT 0;