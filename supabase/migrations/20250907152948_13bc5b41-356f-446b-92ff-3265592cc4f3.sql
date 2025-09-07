-- Add short codes to events and guests tables
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS short_code TEXT;
ALTER TABLE public.guests ADD COLUMN IF NOT EXISTS short_code TEXT;

-- Create unique indexes for short codes
CREATE UNIQUE INDEX IF NOT EXISTS events_short_code_idx ON public.events(short_code) WHERE short_code IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS guests_event_short_code_idx ON public.guests(event_id, short_code) WHERE short_code IS NOT NULL;

-- Function to generate next event code
CREATE OR REPLACE FUNCTION public.generate_event_code()
RETURNS TEXT AS $$
DECLARE
  next_code INTEGER;
  code_text TEXT;
BEGIN
  -- Get the next sequential number
  SELECT COALESCE(MAX(CAST(short_code AS INTEGER)), 0) + 1 
  INTO next_code
  FROM public.events 
  WHERE short_code ~ '^[0-9]+$';
  
  code_text := next_code::TEXT;
  
  RETURN code_text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate next guest code for an event
CREATE OR REPLACE FUNCTION public.generate_guest_code(p_event_id UUID)
RETURNS TEXT AS $$
DECLARE
  next_code INTEGER;
  code_text TEXT;
BEGIN
  -- Get the next sequential number for this event
  SELECT COALESCE(MAX(CAST(short_code AS INTEGER)), 0) + 1 
  INTO next_code
  FROM public.guests 
  WHERE event_id = p_event_id AND short_code ~ '^[0-9]+$';
  
  code_text := next_code::TEXT;
  
  RETURN code_text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;