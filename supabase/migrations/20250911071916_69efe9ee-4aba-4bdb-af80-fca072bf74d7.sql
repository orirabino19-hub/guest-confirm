-- Drop the existing unique constraint on slug
ALTER TABLE public.links DROP CONSTRAINT links_slug_key;

-- Add a new composite unique constraint on (event_id, slug)
-- This allows multiple events to have the same slug, but each event can only have one link with each slug
ALTER TABLE public.links ADD CONSTRAINT links_event_slug_unique UNIQUE (event_id, slug);