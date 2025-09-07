-- Generate short codes for existing events and guests
UPDATE public.events 
SET short_code = public.generate_event_code()
WHERE short_code IS NULL;

-- For each event, update guests with sequential codes
DO $$
DECLARE
    event_record RECORD;
BEGIN
    FOR event_record IN SELECT id FROM public.events LOOP
        UPDATE public.guests 
        SET short_code = public.generate_guest_code(event_record.id)
        WHERE event_id = event_record.id AND short_code IS NULL;
    END LOOP;
END $$;