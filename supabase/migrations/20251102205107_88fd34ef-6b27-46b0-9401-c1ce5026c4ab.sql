-- Add modern_style_enabled column to events table
ALTER TABLE public.events 
ADD COLUMN modern_style_enabled boolean DEFAULT false;

COMMENT ON COLUMN public.events.modern_style_enabled IS 'Enable modern design style with gradients, animations and glass-morphism effects';