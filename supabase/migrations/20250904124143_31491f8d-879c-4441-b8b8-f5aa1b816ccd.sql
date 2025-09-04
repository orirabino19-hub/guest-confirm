-- Add slug column to events table
ALTER TABLE public.events ADD COLUMN slug text;

-- Create a unique index for slugs to ensure no duplicates
CREATE UNIQUE INDEX events_slug_key ON public.events(slug) WHERE slug IS NOT NULL;

-- Update existing events to have a default slug
UPDATE public.events SET slug = 'event' WHERE slug IS NULL;

-- Make slug not null after setting default values
ALTER TABLE public.events ALTER COLUMN slug SET NOT NULL;

-- Add default value for future inserts
ALTER TABLE public.events ALTER COLUMN slug SET DEFAULT 'event';